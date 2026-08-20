// src/server/services/reportAccess.ts
// Centralized Access, Authorization, and Safe Projections for Reports & Clinical Data

import { prisma } from "../../lib/db";

/**
 * Custom typed error for report access and authorization failures.
 */
export class ReportAccessError extends Error {
  public readonly statusCode: number;

  constructor(statusCode: number, message: string) {
    super(message);
    this.name = "ReportAccessError";
    this.statusCode = statusCode;
    Object.setPrototypeOf(this, ReportAccessError.prototype);
  }
}

export interface ActorContext {
  id: number;
  schoolId: number;
  role: string;
  name?: string;
  email?: string;
}

export interface TeacherAccessScope {
  classIds: number[];
  sectionIds: number[];
}

export interface TargetScopeInput {
  reportType: "STUDENT" | "CLASS" | "GRADE" | string;
  studentId?: number;
  classId?: number;
  sectionId?: number;
  academicSessionId?: number;
}

export interface ValidatedTargetScope {
  student?: {
    id: number;
    studentId: string;
    firstName: string | null;
    lastName: string | null;
    classId: number | null;
    sectionId: number | null;
    class?: { name: string } | null;
    section?: { name: string } | null;
  };
  class?: {
    id: number;
    name: string;
  };
  section?: {
    id: number;
    classId: number;
    name: string;
  };
  academicSession?: {
    id: number;
    name: string;
    startDate: Date;
    endDate: Date;
  };
}

/**
 * Fetch current teacher class and section access assignments from the database.
 */
export async function getTeacherAccess(userId: number): Promise<TeacherAccessScope> {
  const [classAccesses, sectionAccesses] = await Promise.all([
    prisma.teacherClassAccess.findMany({
      where: { userId },
      select: { classId: true },
    }),
    prisma.teacherSectionAccess.findMany({
      where: { userId },
      select: { sectionId: true },
    }),
  ]);

  return {
    classIds: classAccesses.map((a) => a.classId),
    sectionIds: sectionAccesses.map((a) => a.sectionId),
  };
}

/**
 * Check if a teacher has active access to a student.
 * Authorized if teacher has class access for the student's class OR section access for the student's section.
 */
export function checkTeacherStudentAccess(
  teacherAccess: TeacherAccessScope,
  student: { classId: number | null; sectionId: number | null }
): boolean {
  if (student.classId !== null && teacherAccess.classIds.includes(student.classId)) {
    return true;
  }
  if (student.sectionId !== null && teacherAccess.sectionIds.includes(student.sectionId)) {
    return true;
  }
  return false;
}

/**
 * Check if a teacher has active access to a class-wide report.
 * Requires TeacherClassAccess for that exact class.
 */
export function checkTeacherClassAccess(
  teacherAccess: TeacherAccessScope,
  classId: number
): boolean {
  return teacherAccess.classIds.includes(classId);
}

/**
 * Check if a teacher has active access to a section report.
 * Authorized if teacher has TeacherClassAccess for the parent class OR TeacherSectionAccess for that section.
 */
export function checkTeacherSectionAccess(
  teacherAccess: TeacherAccessScope,
  classId: number | null,
  sectionId: number
): boolean {
  if (classId !== null && teacherAccess.classIds.includes(classId)) {
    return true;
  }
  return teacherAccess.sectionIds.includes(sectionId);
}

/**
 * Validate and authorize a report target scope before generation.
 * Enforces tenant isolation (404), target consistency (400), and teacher role boundaries (403).
 */
export async function authorizeReportTarget(
  actor: ActorContext,
  target: TargetScopeInput
): Promise<ValidatedTargetScope> {
  const result: ValidatedTargetScope = {};
  const isTeacher = actor.role.toUpperCase() === "TEACHER";
  let teacherAccess: TeacherAccessScope | null = null;

  if (isTeacher) {
    teacherAccess = await getTeacherAccess(actor.id);
  }

  // 1. Student validation
  if (target.reportType === "STUDENT" && (target.studentId === undefined || target.studentId === null)) {
    throw new ReportAccessError(400, "studentId is required for student reports.");
  }

  if (target.studentId !== undefined && target.studentId !== null) {
    const student = await prisma.student.findFirst({
      where: {
        id: target.studentId,
        schoolId: actor.schoolId,
      },
      select: {
        id: true,
        studentId: true,
        firstName: true,
        lastName: true,
        classId: true,
        sectionId: true,
        class: { select: { name: true } },
        section: { select: { name: true } },
      },
    });

    if (!student) {
      throw new ReportAccessError(404, "Student not found in this school.");
    }

    if (isTeacher && teacherAccess) {
      const authorized = checkTeacherStudentAccess(teacherAccess, student);
      if (!authorized) {
        throw new ReportAccessError(
          403,
          "Forbidden: You do not have active access to this student's class or section."
        );
      }
    }

    result.student = student;
  }

  // 2. Class validation
  if (target.classId !== undefined && target.classId !== null) {
    const cls = await prisma.class.findFirst({
      where: {
        id: target.classId,
        schoolId: actor.schoolId,
      },
      select: {
        id: true,
        name: true,
      },
    });

    if (!cls) {
      throw new ReportAccessError(404, "Class not found in this school.");
    }

    if (isTeacher && teacherAccess) {
      if (target.reportType === "CLASS" && (target.sectionId === undefined || target.sectionId === null)) {
        const authorized = checkTeacherClassAccess(teacherAccess, cls.id);
        if (!authorized) {
          throw new ReportAccessError(
            403,
            "Forbidden: Class-wide reports require class-level access permissions."
          );
        }
      }
    }

    result.class = cls;
  }

  // 3. Section validation
  if (target.sectionId !== undefined && target.sectionId !== null) {
    const section = await prisma.section.findFirst({
      where: {
        id: target.sectionId,
        class: { schoolId: actor.schoolId },
      },
      select: {
        id: true,
        classId: true,
        name: true,
      },
    });

    if (!section) {
      throw new ReportAccessError(404, "Section not found in this school.");
    }

    if (target.classId !== undefined && target.classId !== null && section.classId !== target.classId) {
      throw new ReportAccessError(400, "Section does not belong to the specified class.");
    }

    if (isTeacher && teacherAccess) {
      const authorized = checkTeacherSectionAccess(teacherAccess, section.classId, section.id);
      if (!authorized) {
        throw new ReportAccessError(
          403,
          "Forbidden: You do not have active access to this section."
        );
      }
    }

    result.section = section;
  }

  // 4. Academic Session resolution
  if (target.academicSessionId !== undefined && target.academicSessionId !== null) {
    const session = await prisma.academicSession.findFirst({
      where: {
        id: target.academicSessionId,
        schoolId: actor.schoolId,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    });

    if (!session) {
      throw new ReportAccessError(404, "Academic session not found in this school.");
    }

    result.academicSession = session;
  } else {
    // Resolve school's current/active session
    const currentSessions = await prisma.academicSession.findMany({
      where: {
        schoolId: actor.schoolId,
        isCurrent: true,
      },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
      },
    });

    if (currentSessions.length === 0) {
      throw new ReportAccessError(400, "No active academic session found for this school.");
    }

    if (currentSessions.length > 1) {
      throw new ReportAccessError(
        400,
        "Multiple active academic sessions configured for this school. Please specify an academicSessionId."
      );
    }

    result.academicSession = currentSessions[0];
  }

  return result;
}

/**
 * Authorize viewing or exporting an existing report record.
 * Re-checks active teacher access at time of request.
 */
export async function authorizeReportAccess(
  actor: ActorContext,
  report: {
    id: number;
    schoolId: number;
    reportType: string;
    studentId?: number | null;
    classId?: number | null;
    sectionId?: number | null;
  }
): Promise<void> {
  // Cross-tenant: must always answer 404
  if (report.schoolId !== actor.schoolId) {
    throw new ReportAccessError(404, "Report not found.");
  }

  const role = actor.role.toUpperCase();

  // Psychologists and Admins have operational report access within their school
  if (role === "PSYCHOLOGIST" || role === "ADMIN") {
    return;
  }

  // Teacher scope check
  if (role === "TEACHER") {
    const teacherAccess = await getTeacherAccess(actor.id);

    // 1. Student report
    if (report.studentId) {
      const student = await prisma.student.findFirst({
        where: { id: report.studentId, schoolId: actor.schoolId },
        select: { classId: true, sectionId: true },
      });

      if (!student) {
        throw new ReportAccessError(404, "Target student not found.");
      }

      const hasStudentAccess = checkTeacherStudentAccess(teacherAccess, student);
      if (!hasStudentAccess) {
        throw new ReportAccessError(
          403,
          "Forbidden: You no longer have active access to this student's class or section."
        );
      }
      return;
    }

    // 2. Class-wide report
    if (report.reportType === "CLASS" && report.classId && !report.sectionId) {
      const hasClassAccess = checkTeacherClassAccess(teacherAccess, report.classId);
      if (!hasClassAccess) {
        throw new ReportAccessError(
          403,
          "Forbidden: You no longer have active class-level access to this class report."
        );
      }
      return;
    }

    // 3. Section report
    if (report.sectionId) {
      const hasSectionAccess = checkTeacherSectionAccess(
        teacherAccess,
        report.classId ?? null,
        report.sectionId
      );
      if (!hasSectionAccess) {
        throw new ReportAccessError(
          403,
          "Forbidden: You no longer have active access to this section report."
        );
      }
      return;
    }

    // Fallback: If report is un-targeted or outside known scopes
    throw new ReportAccessError(
      403,
      "Forbidden: You do not have active authorization to view this report."
    );
  }

  throw new ReportAccessError(403, "Forbidden: Role not authorized for reports.");
}

/**
 * Redact clinical fields from an assessment record based on actor role.
 */
export function sanitizeAssessmentForRole<T extends Record<string, unknown>>(
  assessment: T,
  role: string
): T {
  const isPsychologist = role.toUpperCase() === "PSYCHOLOGIST";

  if (isPsychologist) {
    return assessment;
  }

  // Redact confidential clinical narrative fields for Admin and Teacher
  const sanitized = { ...assessment };
  delete (sanitized as Record<string, unknown>).professionalInterpretation;
  delete (sanitized as Record<string, unknown>).recommendations;
  delete (sanitized as Record<string, unknown>).psychologistNotes;
  delete (sanitized as Record<string, unknown>).aiAnalysis;

  return sanitized;
}

/**
 * Redact clinical fields from an observation record based on actor role.
 */
export function sanitizeObservationForRole<T extends Record<string, unknown>>(
  observation: T,
  role: string
): T {
  const isPsychologist = role.toUpperCase() === "PSYCHOLOGIST";

  if (isPsychologist) {
    return observation;
  }

  // Redact confidential notes and AI analysis for Admin and Teacher
  const sanitized = { ...observation };
  delete (sanitized as Record<string, unknown>).psychologistNotes;
  delete (sanitized as Record<string, unknown>).aiAnalysis;

  return sanitized;
}

const FORBIDDEN_CLINICAL_KEYS = new Set([
  "clinicalNotes",
  "clinical_notes",
  "psychologistNotes",
  "psychologist_notes",
  "professionalInterpretation",
  "professional_interpretation",
  "aiAnalysis",
  "ai_analysis",
  "recommendations",
  "confidentialRecommendations",
  "confidential_recommendations",
  "privateNotes",
  "private_notes",
  "confidentialNotes",
  "confidential_notes",
]);

function recursivelyRedact(node: unknown): unknown {
  if (node === null || node === undefined) {
    return node;
  }
  if (Array.isArray(node)) {
    return node.map((item) => recursivelyRedact(item));
  }
  if (typeof node === "object") {
    const output: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(node as Record<string, unknown>)) {
      if (FORBIDDEN_CLINICAL_KEYS.has(key)) {
        continue; // Strip key completely
      }
      output[key] = recursivelyRedact(value);
    }
    return output;
  }
  return node;
}

/**
 * Defensive sanitizer for JSON report snapshots (stored or generated).
 * Ensures no historical or incoming confidential clinical narrative is leaked to non-psychologists.
 * Recursively removes all clinical narrative fields at any nesting level.
 */
export function sanitizeSnapshotJson(
  snapshotJson: unknown,
  role: string
): Record<string, unknown> {
  if (!snapshotJson || typeof snapshotJson !== "object") {
    return {};
  }

  const isPsychologist = role.toUpperCase() === "PSYCHOLOGIST";

  // Deep clone to prevent any mutation of in-memory representations
  const cloned = JSON.parse(JSON.stringify(snapshotJson)) as Record<string, unknown>;

  if (isPsychologist) {
    return cloned;
  }

  // Recursively redact all forbidden clinical keys across all objects and arrays
  return recursivelyRedact(cloned) as Record<string, unknown>;
}

/**
 * Neutralize CSV formula injection characters (=, +, -, @, \t, \r).
 */
export function sanitizeCsvValue(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }
  const str = String(value);
  const trimmed = str.trimStart();
  if (
    trimmed.startsWith("=") ||
    trimmed.startsWith("+") ||
    trimmed.startsWith("-") ||
    trimmed.startsWith("@") ||
    trimmed.startsWith("\t") ||
    trimmed.startsWith("\r")
  ) {
    return `'${str}`;
  }
  return str;
}

