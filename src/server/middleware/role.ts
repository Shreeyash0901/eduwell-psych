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
//
// IMPORTANT: SUPER_ADMIN is explicitly NOT included in tenant roles.
// To guard Super Admin routes, use requireRole("SUPER_ADMIN") only in
// dedicated /api/super-admin/* routes. SUPER_ADMIN must NEVER automatically
// pass ADMIN, PSYCHOLOGIST, or TEACHER checks.

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

export const ROLES = {
  ADMIN: "ADMIN",
  PSYCHOLOGIST: "PSYCHOLOGIST",
  TEACHER: "TEACHER",
  SUPER_ADMIN: "SUPER_ADMIN",
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