// src/server/middleware/tenant.ts
// Tenant-isolation helpers for EduWell Psych.
//
// Every database operation in a tenant-scoped endpoint MUST derive the school
// from the verified session (req.user.schoolId) — never from request params or
// body. These helpers standardize that discipline:
//
//   const where = { ...schoolScopedWhere(schoolId), ...filters };
//   const record = await prisma.student.findFirst({ where });
//   if (respondNotFound(res, record, schoolId)) return;
//
// respondNotFound answers 404 when the resource is missing OR belongs to a
// different school, so a cross-tenant identifier never leaks existence.
//
// SECURITY: schoolScopedWhere throws ForbiddenError if schoolId is null.
// This is the fail-closed guard that prevents SUPER_ADMIN from obtaining
// global access through ordinary tenant endpoints. SUPER_ADMIN must only
// use /api/super-admin/* routes which have their own dedicated handlers.

import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";

export interface SchoolScopedRecord {
  schoolId?: number | null;
}

export class ForbiddenError extends Error {
  readonly statusCode = 403;
  constructor(message = "Forbidden: tenant scope required.") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Middleware that strictly enforces that the authenticated user belongs to a school.
 * Rejects SUPER_ADMIN or any user with a null schoolId with 403 Forbidden.
 */
export function requireTenant(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
) {
  if (!req.user || req.user.schoolId === null || req.user.schoolId === undefined) {
    return res.status(403).json({
      success: false,
      error: "Forbidden: This endpoint requires a school-scoped account. Use /api/super-admin/* for platform-level access.",
    });
  }
  return next();
}

/**
 * Base Prisma where fragment that pins a query to the authenticated school.
 * Throws ForbiddenError if schoolId is null — prevents SUPER_ADMIN global bypass.
 */
export function schoolScopedWhere(schoolId: number | null): { schoolId: number } {
  if (schoolId === null || schoolId === undefined) {
    throw new ForbiddenError(
      "Forbidden: This endpoint requires a school-scoped account. Use /api/super-admin/* for platform-level access."
    );
  }
  return { schoolId };
}

/**
 * True when the record exists and belongs to the given school.
 */
export function isSchoolResource<T extends SchoolScopedRecord | null | undefined>(
  resource: T,
  schoolId: number
): resource is Exclude<T, null | undefined> & SchoolScopedRecord {
  return resource !== null && resource !== undefined && resource.schoolId === schoolId;
}

/**
 * Writes a 404 response and returns true when the record is missing or belongs
 * to another school. Returns false (and writes nothing) when the record is a
 * valid resource of the school, allowing the caller to proceed.
 */
export function respondNotFound(
  res: Response,
  resource: SchoolScopedRecord | null | undefined,
  schoolId: number,
  message = "Resource not found or access unauthorized."
): boolean {
  if (!isSchoolResource(resource, schoolId)) {
    res.status(404).json({ success: false, error: message });
    return true;
  }
  return false;
}