// src/server/auth.ts
// Authentication routes and middleware for EduWell Psych

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { OAuth2Client } from "google-auth-library";
import { prisma } from "../lib/db";
import { serverConfig } from "./env";

export const authRouter = Router();

export const googleClient = new OAuth2Client();

// Rate limiter for authentication endpoints: max 15 requests per 15 minutes per IP
export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many authentication requests from this IP. Please try again in 15 minutes.",
  },
});

// Helper to normalize roles for frontend consistency (e.g. "PSYCHOLOGIST" -> "psychologist")
function normalizeRole(role: string): string {
  return role.toLowerCase();
}

// Helper to sanitize and map safe user representation
function toSafeUser(user: {
  id: number;
  schoolId: number | null;
  name: string;
  email: string;
  role: string;
  school?: { name: string } | null;
}) {
  return {
    id: user.id,
    schoolId: user.schoolId,
    name: user.name,
    email: user.email,
    role: normalizeRole(user.role),
    schoolName: user.school?.name || (user.role === 'SUPER_ADMIN' ? 'Platform' : 'Westside Academy'),
  };
}

// Cookie options helper
function getCookieOptions() {
  return {
    httpOnly: true,
    secure: serverConfig.isProduction,
    sameSite: "lax" as const,
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
    path: "/",
  };
}

// ────────────────────────────────────────────────────────────
// POST /api/auth/login
// ────────────────────────────────────────────────────────────
authRouter.post("/login", authLimiter, async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Input format validation
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        error: "Please provide both email address and password.",
      });
    }

    const normalizedEmail = email.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return res.status(400).json({
        success: false,
        error: "Please enter a valid email address format.",
      });
    }

    // 2. Locate user in Prisma database
    const user = await prisma.user.findFirst({
      where: {
        email: {
          equals: normalizedEmail,
          mode: "insensitive",
        },
      },
      include: {
        school: {
          select: { name: true },
        },
      },
    });

    // 3. User existence and active status verification
    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    // 4. Verify password with bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        error: "Invalid email or password.",
      });
    }

    // 5. Generate signed JWT token
    const tokenPayload = {
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, serverConfig.jwtSecret, {
      expiresIn: "7d",
    });

    // 6. Set HttpOnly cookie
    res.cookie(serverConfig.cookieName, token, getCookieOptions());

    // 7. Return safe user representation (no password hash)
    return res.json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error("[AUTH] Login error occurred:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred during login. Please try again.",
    });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/auth/google
// ────────────────────────────────────────────────────────────
authRouter.post("/google", authLimiter, async (req: Request, res: Response) => {
  try {
    const { credential, idToken, token: clientToken } = req.body;
    const rawToken = credential || idToken || clientToken;

    if (!rawToken || typeof rawToken !== "string") {
      return res.status(400).json({
        success: false,
        error: "Google credential token is required.",
      });
    }

    const expectedClientId = serverConfig.googleClientId;

    let googlePayload: any;
    try {
      const ticket = await googleClient.verifyIdToken({
        idToken: rawToken,
        audience: expectedClientId || undefined,
      });
      googlePayload = ticket.getPayload();
    } catch (verifyError: any) {
      console.error("[AUTH_GOOGLE] Token verification failed:", verifyError?.message || verifyError);
      return res.status(401).json({
        success: false,
        error: "Invalid or expired Google authentication credential.",
      });
    }

    if (!googlePayload || !googlePayload.email || !googlePayload.sub) {
      return res.status(400).json({
        success: false,
        error: "Invalid Google token payload: email or sub missing.",
      });
    }

    // Verify Google token issuer
    const validIssuers = ["accounts.google.com", "https://accounts.google.com"];
    if (!googlePayload.iss || !validIssuers.includes(googlePayload.iss)) {
      return res.status(401).json({
        success: false,
        error: "Invalid Google token issuer.",
      });
    }

    // Require verified email from Google
    if (googlePayload.email_verified !== true && String(googlePayload.email_verified) !== "true") {
      return res.status(403).json({
        success: false,
        error: "Your Google email address must be verified to sign in.",
      });
    }

    const googleSub = googlePayload.sub;
    const googleEmail = googlePayload.email.trim().toLowerCase();

    // 1. Look up user by stored Google sub/googleId
    let user = await prisma.user.findFirst({
      where: {
        googleId: googleSub,
      },
      include: {
        school: {
          select: { name: true },
        },
      },
    });

    // 2. If not found by googleId, link to existing authorized user by verified normalized email
    if (!user) {
      const existingUserByEmail = await prisma.user.findFirst({
        where: {
          email: {
            equals: googleEmail,
            mode: "insensitive",
          },
        },
        include: {
          school: {
            select: { name: true },
          },
        },
      });

      if (existingUserByEmail && existingUserByEmail.status === "ACTIVE") {
        user = await prisma.user.update({
          where: { id: existingUserByEmail.id },
          data: { googleId: googleSub },
          include: {
            school: {
              select: { name: true },
            },
          },
        });
      }
    }

    // 3. Strict rejection if no authorized database user exists
    if (!user || user.status !== "ACTIVE") {
      return res.status(403).json({
        success: false,
        error: "Your account is not authorized. Contact your administrator.",
      });
    }

    // 4. Issue standard EduWell JWT token using database user ID and database role
    const tokenPayload = {
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
      email: user.email,
    };

    const token = jwt.sign(tokenPayload, serverConfig.jwtSecret, {
      expiresIn: "7d",
    });

    // 5. Set HttpOnly cookie
    res.cookie(serverConfig.cookieName, token, getCookieOptions());

    // 6. Return safe user representation (no password hash)
    return res.json({
      success: true,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error("[AUTH_GOOGLE] Google login processing error:", error);
    return res.status(500).json({
      success: false,
      error: "An unexpected error occurred during Google Sign-In. Please try again.",
    });
  }
});

// ────────────────────────────────────────────────────────────
// GET /api/auth/me
// ────────────────────────────────────────────────────────────
authRouter.get("/me", async (req: Request, res: Response) => {
  try {
    const token = req.cookies?.[serverConfig.cookieName];

    if (!token) {
      return res.status(401).json({
        authenticated: false,
        error: "No active session found.",
      });
    }

    // Verify JWT
    let decoded: any;
    try {
      decoded = jwt.verify(token, serverConfig.jwtSecret);
    } catch {
      // Token expired or invalid signature
      res.clearCookie(serverConfig.cookieName, getCookieOptions());
      return res.status(401).json({
        authenticated: false,
        error: "Session has expired or is invalid.",
      });
    }

    if (!decoded || typeof decoded.id !== "number") {
      res.clearCookie(serverConfig.cookieName, getCookieOptions());
      return res.status(401).json({
        authenticated: false,
        error: "Invalid token payload.",
      });
    }

    // Lookup fresh user from database for every request
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: {
        school: {
          select: { name: true },
        },
      },
    });

    if (!user || user.status !== "ACTIVE") {
      res.clearCookie(serverConfig.cookieName, getCookieOptions());
      return res.status(401).json({
        authenticated: false,
        error: "Account not found or is no longer active.",
      });
    }

    return res.json({
      authenticated: true,
      user: toSafeUser(user),
    });
  } catch (error) {
    console.error("[AUTH] /me error occurred:", error);
    return res.status(500).json({
      authenticated: false,
      error: "Unable to verify session.",
    });
  }
});

// ────────────────────────────────────────────────────────────
// POST /api/auth/logout
// ────────────────────────────────────────────────────────────
authRouter.post("/logout", (_req: Request, res: Response) => {
  res.clearCookie(serverConfig.cookieName, {
    httpOnly: true,
    secure: serverConfig.isProduction,
    sameSite: "lax",
    path: "/",
  });

  return res.json({
    success: true,
    message: "Logged out successfully.",
  });
});

/**
 * GET /api/auth/invitation/verify?token=...
 * Validates an invite token and returns school & role details
 */
authRouter.get("/invitation/verify", async (req: Request, res: Response) => {
  try {
    const token = String(req.query.token || "");
    if (!token) {
      return res.status(400).json({ success: false, error: "Invitation token is required." });
    }

    const invitation = await prisma.staffInvitation.findUnique({
      where: { token },
      include: {
        school: { select: { id: true, name: true, code: true, logoUrl: true } },
        inviter: { select: { name: true, role: true } },
      },
    });

    if (!invitation) {
      return res.status(404).json({ success: false, error: "Invalid or expired invitation link." });
    }

    if (invitation.status === "EXPIRED" || invitation.expiresAt < new Date()) {
      return res.status(410).json({ success: false, error: "This invitation link has expired. Please contact your principal for a new link." });
    }

    if (invitation.status === "REVOKED") {
      return res.status(403).json({ success: false, error: "This invitation link was revoked." });
    }

    // Check if user already activated
    const existingUser = await prisma.user.findFirst({
      where: { schoolId: invitation.schoolId, email: invitation.email },
      select: { id: true, name: true, email: true },
    });

    return res.json({
      success: true,
      invitation: {
        token: invitation.token,
        email: invitation.email,
        role: invitation.role,
        schoolName: invitation.school.name,
        schoolCode: invitation.school.code,
        invitedBy: invitation.inviter.name,
        expiresAt: invitation.expiresAt.toISOString(),
        isExistingUser: Boolean(existingUser),
        defaultName: existingUser?.name || "",
      },
    });
  } catch (error) {
    console.error("[AUTH] /invitation/verify error:", error);
    return res.status(500).json({ success: false, error: "Failed to verify invitation." });
  }
});

/**
 * POST /api/auth/invitation/accept
 * Staff member completes details and sets password to activate account
 */
authRouter.post("/invitation/accept", async (req: Request, res: Response) => {
  try {
    const { token, fullName, password } = req.body;

    if (!token || !fullName || !password) {
      return res.status(400).json({ success: false, error: "Token, full name, and password are required." });
    }

    if (String(password).length < 6) {
      return res.status(400).json({ success: false, error: "Password must be at least 6 characters long." });
    }

    const invitation = await prisma.staffInvitation.findUnique({
      where: { token },
      include: { school: true },
    });

    if (!invitation || invitation.status !== "PENDING" || invitation.expiresAt < new Date()) {
      return res.status(400).json({ success: false, error: "Invalid, expired, or already used invitation token." });
    }

    const passwordHash = await bcrypt.hash(String(password), 10);
    const trimmedName = String(fullName).trim().slice(0, 100);

    // Upsert or update User
    const user = await prisma.user.upsert({
      where: { email: invitation.email },
      update: {
        name: trimmedName,
        passwordHash,
        status: "ACTIVE",
        role: invitation.role as any,
        schoolId: invitation.schoolId,
      },
      create: {
        schoolId: invitation.schoolId,
        name: trimmedName,
        email: invitation.email,
        passwordHash,
        role: invitation.role as any,
        status: "ACTIVE",
      },
      include: {
        school: { select: { name: true } },
      },
    });

    // Mark invitation as accepted
    await prisma.staffInvitation.update({
      where: { id: invitation.id },
      data: {
        status: "ACCEPTED",
        acceptedAt: new Date(),
      },
    });

    // Generate login token and set cookie immediately
    const jwtToken = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
        schoolId: user.schoolId,
      },
      serverConfig.jwtSecret,
      { expiresIn: "7d" }
    );

    res.cookie(serverConfig.cookieName, jwtToken, getCookieOptions());

    return res.status(200).json({
      success: true,
      message: `Welcome to EduWell Psych, ${user.name}! Your account is now active.`,
      user: toSafeUser(user),
    });
  } catch (error: any) {
    console.error("[AUTH] /invitation/accept error:", error);
    return res.status(500).json({ success: false, error: error?.message || "Failed to accept invitation." });
  }
});
