// src/server/auth.ts
// Authentication routes and middleware for EduWell Psych

import { Router, Request, Response } from "express";
import rateLimit from "express-rate-limit";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/db";
import { serverConfig } from "./env";

export const authRouter = Router();

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
  schoolId: number;
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
    schoolName: user.school?.name || "Westside Academy",
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

    // Lookup fresh user from database to ensure status is still ACTIVE
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
