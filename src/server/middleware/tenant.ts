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

import { Response } from "express";

export interface SchoolScopedRecord {
  schoolId?: number | null;
}

/**
 * Base Prisma where fragment that pins a query to the authenticated school.
 */
export function schoolScopedWhere(schoolId: number): { schoolId: number } {
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