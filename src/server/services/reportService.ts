// src/server/services/reportService.ts
// Secure Report Data Aggregation Engine

import { prisma } from "../../lib/db";
import {
  ActorContext,
  TargetScopeInput,
  authorizeReportTarget,
  sanitizeAssessmentForRole,
  sanitizeObservationForRole,
  ReportAccessError,
} from "./reportAccess";

export type ReportType = "STUDENT" | "CLASS" | "GRADE";

export interface GenerateReportOptions {
  actor: ActorContext;
  reportType: ReportType;
  title: string;
  studentId?: number;
  classId?: number;
  sectionId?: number;
  academicSessionId?: number;
}

export interface ReportStudentSummary {
  id: number;
  studentId: string;
  firstName: string | null;
  lastName: string | null;
  classId: number | null;
  sectionId: number | null;
}

export interface ReportDataPayload {
  reportType: ReportType;
  title: string;
  academicSessionId?: number;
  students: ReportStudentSummary[];
  assessments: Record<string, unknown>[];
  observations: Record<string, unknown>[];
  summary: {
    totalStudents: number;
    totalAssessments: number;
    totalObservations: number;
  };
}

export const generateReportData = async (
  options: GenerateReportOptions
): Promise<ReportDataPayload> => {
  const { actor, reportType, title, studentId, classId, sectionId, academicSessionId } = options;

  // 1. Authorize Target & Scope (enforces tenant, role, and teacher assignment boundaries)
  const targetInput: TargetScopeInput = {
    reportType,
    studentId,
    classId,
    sectionId,
    academicSessionId,
  };

  await authorizeReportTarget(actor, targetInput);

  // 2. Build explicit student query
  const studentWhere: Record<string, unknown> = {
    schoolId: actor.schoolId,
    isActive: true,
  };

  if (studentId) {
    studentWhere.id = studentId;
  }
  if (classId) {
    studentWhere.classId = classId;
  }
  if (sectionId) {
    studentWhere.sectionId = sectionId;
  }

  // If teacher, additionally ensure query stays strictly within teacher assigned scope
  const isTeacher = actor.role.toUpperCase() === "TEACHER";
  if (isTeacher) {
    const [classAccesses, sectionAccesses] = await Promise.all([
      prisma.teacherClassAccess.findMany({
        where: { userId: actor.id },
        select: { classId: true },
      }),
      prisma.teacherSectionAccess.findMany({
        where: { userId: actor.id },
        select: { sectionId: true },
      }),
    ]);

    const allowedClassIds = classAccesses.map((a) => a.classId);
    const allowedSectionIds = sectionAccesses.map((a) => a.sectionId);

    const orConditions: Record<string, unknown>[] = [];
    if (allowedClassIds.length > 0) {
      orConditions.push({ classId: { in: allowedClassIds } });
    }
    if (allowedSectionIds.length > 0) {
      orConditions.push({ sectionId: { in: allowedSectionIds } });
    }

    if (orConditions.length === 0) {
      throw new ReportAccessError(
        403,
        "Forbidden: You do not have any active class or section assignments."
      );
    }

    studentWhere.AND = [{ OR: orConditions }];
  }

  // 3. Fetch authorized students
  const students = await prisma.student.findMany({
    where: studentWhere,
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      classId: true,
      sectionId: true,
    },
    orderBy: { id: "asc" },
  });

  if (students.length === 0) {
    throw new ReportAccessError(
      404,
      "No students found matching the authorized report criteria."
    );
  }

  const studentIds = students.map((s) => s.id);
  const isPsychologist = actor.role.toUpperCase() === "PSYCHOLOGIST";

  // 4. Fetch assessments with role-aware projection
  const rawAssessments = await prisma.studentAssessment.findMany({
    where: {
      studentId: { in: studentIds },
      schoolId: actor.schoolId,
      status: "COMPLETED",
    },
    select: {
      id: true,
      studentId: true,
      overallScore: true,
      attentionLevel: true,
      startedAt: true,
      completedAt: true,
      status: true,
      // Clinical fields: only retrieved if psychologist or redacted defensively
      professionalInterpretation: isPsychologist,
      recommendations: isPsychologist,
      assessmentTemplate: {
        select: {
          name: true,
          category: true,
        },
      },
      domainResults: {
        select: {
          score: true,
          maxScore: true,
          resultLabel: true,
          attentionLevel: true,
          domain: {
            select: {
              name: true,
            },
          },
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const sanitizedAssessments = rawAssessments.map((asmt) =>
    sanitizeAssessmentForRole(asmt as unknown as Record<string, unknown>, actor.role)
  );

  // 5. Fetch observations with role-aware projection
  const rawObservations = await prisma.studentObservation.findMany({
    where: {
      studentId: { in: studentIds },
      schoolId: actor.schoolId,
    },
    select: {
      id: true,
      studentId: true,
      recordNumber: true,
      source: true,
      category: true,
      observation: true,
      additionalComments: true,
      setting: true,
      incidentTime: true,
      triggers: true,
      interventions: true,
      submitterName: true,
      status: true,
      observedAt: true,
      // Clinical fields: only retrieved if psychologist or redacted defensively
      psychologistNotes: isPsychologist,
      aiAnalysis: isPsychologist,
    },
    orderBy: {
      observedAt: "desc",
    },
  });

  const sanitizedObservations = rawObservations.map((obs) =>
    sanitizeObservationForRole(obs as unknown as Record<string, unknown>, actor.role)
  );

  return {
    reportType,
    title,
    academicSessionId,
    students,
    assessments: sanitizedAssessments,
    observations: sanitizedObservations,
    summary: {
      totalStudents: students.length,
      totalAssessments: sanitizedAssessments.length,
      totalObservations: sanitizedObservations.length,
    },
  };
};
