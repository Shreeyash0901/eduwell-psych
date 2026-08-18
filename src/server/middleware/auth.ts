// src/server/middleware/auth.ts
// Protected route middleware deriving identity strictly from verified JWT HttpOnly cookie

import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { prisma } from "../../lib/db";
import { serverConfig } from "../env";

export interface AuthenticatedUser {
  id: number;
  schoolId: number;
  role: string;
  email: string;
  name: string;
}

export interface AuthenticatedRequest extends Request {
  user?: AuthenticatedUser;
}

export async function requireAuth(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  try {
    const token = req.cookies?.[serverConfig.cookieName];

    if (!token) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Active authentication session required.",
      });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, serverConfig.jwtSecret);
    } catch {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Session has expired or is invalid.",
      });
    }

    if (!decoded || typeof decoded.id !== "number") {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Invalid token payload.",
      });
    }

    // Verify active status in PostgreSQL database
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      select: {
        id: true,
        schoolId: true,
        role: true,
        status: true,
        email: true,
        name: true,
      },
    });

    if (!user || user.status !== "ACTIVE") {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Account not found or is no longer active.",
      });
    }

    // Attach validated identity to request
    req.user = {
      id: user.id,
      schoolId: user.schoolId,
      role: user.role,
      email: user.email,
      name: user.name,
    };

    return next();
  } catch (error) {
    console.error("[AUTH_MIDDLEWARE] Verification failure:", error);
    return res.status(500).json({
      success: false,
      error: "Internal server error during authentication verification.",
    });
  }
}
