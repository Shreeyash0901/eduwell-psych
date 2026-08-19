// src/server/middleware/role.ts
// Reusable role-based authorization middleware for EduWell Psych.
//
// Usage (must be mounted AFTER requireAuth so req.user is populated):
//   router.use(requireAuth);
//   router.post("/", requireRole("ADMIN"), handler);
//   router.patch("/:id", requireRole("PSYCHOLOGIST", "ADMIN"), handler);
//
// HTTP semantics:
//   401 — authentication missing or invalid (no verified req.user)
//   403 — authenticated but the user's role is not in the allowed set

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

export const ROLES = {
  ADMIN: "ADMIN",
  PSYCHOLOGIST: "PSYCHOLOGIST",
  TEACHER: "TEACHER",
} as const;

export type Role = keyof typeof ROLES;

export function requireRole(...allowedRoles: Role[]) {
  const allowed = new Set(allowedRoles.map((role) => role.toUpperCase()));

  return function roleGuard(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: Active authentication session required.",
      });
    }

    const role = (req.user.role || "").toUpperCase();
    if (!allowed.has(role)) {
      return res.status(403).json({
        success: false,
        error: "Forbidden: You do not have permission to perform this action.",
      });
    }

    return next();
  };
}