// src/server/services/reportService.ts
// Secure Report Data Aggregation Engine & Typed Student Report Snapshot V1

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

// ────────────────────────────────────────────────────────────
// Structured Contract: StudentReportSnapshotV1
// ────────────────────────────────────────────────────────────

export interface StudentReportAssessmentDomainResultV1 {
  domainId: number;
  name: string;
  score: number;
  maxScore: number;
  resultLabel: string | null;
  attentionLevel: string | null;
}

export interface StudentReportAssessmentItemV1 {
  id: number;
  templateName: string;
  category: string;
  status: string;
  assignedDate: string; // ISO date string of creation
  startedDate: string | null; // ISO date string
  completedDate: string | null; // ISO date string
  overallScore: number | null;
  attentionLevel: string | null;
  professionalInterpretation?: string; // Only present for PSYCHOLOGIST
  recommendations?: string; // Only present for PSYCHOLOGIST
  domains: StudentReportAssessmentDomainResultV1[];
}

export interface StudentReportObservationItemV1 {
  id: number;
  recordNumber: string | null;
  observedAt: string; // ISO date string
  source: string;
  category: string;
  setting: string | null;
  status: string;
  observation: string;
  triggers: string | null;
  interventions: string | null;
  psychologistNotes?: string; // Only present for PSYCHOLOGIST
  aiAnalysis?: string; // Only present for PSYCHOLOGIST
}

export interface StudentReportObservationSummaryV1 {
  totalCount: number;
  byCategory: Record<string, number>;
  bySource: Record<string, number>;
  byStatus: Record<string, number>;
  latestObservedAt: string | null;
  items: StudentReportObservationItemV1[];
}

export interface StudentReportInterventionItemV1 {
  observationId: number;
  observedAt: string;
  category: string;
  setting: string | null;
  intervention: string;
}

export interface StudentReportSnapshotV1 {
  schemaVersion: 1;
  reportType: "STUDENT";
  report: {
    reportId?: number;
    title: string;
    generatedAt: string;
    academicSessionId: number;
    reportingPeriod: {
      startDate: string;
      endDate: string;
    };
  };
  student: {
    id: number;
    studentCode: string;
    firstName: string | null;
    lastName: string | null;
    class: string | null;
    section: string | null;
  };
  academicSession: {
    id: number;
    name: string;
    startDate: string;
    endDate: string;
  };
  generatedBy: {
    id: number;
    displayName: string;
    role: string;
  };
  summary: {
    currentWellnessStatus: string | null;
    assessmentStatusCounts: {
      COMPLETED: number;
      IN_PROGRESS: number;
      DRAFT: number;
      REVIEWED: number;
    };
    observationCount: number;
    interventionCount: number;
    followUpCount: number;
  };
  assessments: StudentReportAssessmentItemV1[];
  observations: StudentReportObservationSummaryV1;
  interventions: StudentReportInterventionItemV1[];
  followUps: unknown[];
}

export type ReportDataPayload = StudentReportSnapshotV1 | Record<string, unknown>;

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

  const validatedScope = await authorizeReportTarget(actor, targetInput);
  const isPsychologist = actor.role.toUpperCase() === "PSYCHOLOGIST";

  // ────────────────────────────────────────────────────────────
  // STUDENT Report Generation (StudentReportSnapshotV1)
  // ────────────────────────────────────────────────────────────
  if (reportType === "STUDENT") {
    const student = validatedScope.student;
    if (!student) {
      throw new ReportAccessError(400, "Target student not resolved.");
    }

    const session = validatedScope.academicSession;
    if (!session) {
      throw new ReportAccessError(400, "Academic session not resolved.");
    }

    const sessionStartDate = new Date(session.startDate);
    const sessionEndDate = new Date(session.endDate);
    // Ensure end date covers full day
    const sessionEndDateInclusive = new Date(sessionEndDate);
    sessionEndDateInclusive.setHours(23, 59, 59, 999);

    // 1. Scored Assessments in the Reporting Period (completed within session dates)
    const rawAssessments = await prisma.studentAssessment.findMany({
      where: {
        studentId: student.id,
        schoolId: actor.schoolId,
        status: "COMPLETED",
        completedAt: {
          gte: sessionStartDate,
          lte: sessionEndDateInclusive,
        },
      },
      select: {
        id: true,
        status: true,
        overallScore: true,
        attentionLevel: true,
        createdAt: true,
        startedAt: true,
        completedAt: true,
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
                id: true,
                name: true,
              },
            },
          },
        },
      },
      orderBy: [
        { completedAt: "desc" },
        { id: "desc" },
      ],
    });

    const assessments: StudentReportAssessmentItemV1[] = rawAssessments.map((asmt) => {
      const sanitized = sanitizeAssessmentForRole(asmt as unknown as Record<string, unknown>, actor.role) as any;
      const domains: StudentReportAssessmentDomainResultV1[] = Array.isArray(asmt.domainResults)
        ? asmt.domainResults.map((dr) => ({
            domainId: dr.domain.id,
            name: dr.domain.name,
            score: Number(dr.score),
            maxScore: Number(dr.maxScore),
            resultLabel: dr.resultLabel ?? null,
            attentionLevel: dr.attentionLevel ?? null,
          }))
        : [];

      const item: StudentReportAssessmentItemV1 = {
        id: asmt.id,
        templateName: asmt.assessmentTemplate.name,
        category: asmt.assessmentTemplate.category,
        status: asmt.status,
        assignedDate: asmt.createdAt.toISOString(),
        startedDate: asmt.startedAt ? asmt.startedAt.toISOString() : null,
        completedDate: asmt.completedAt ? asmt.completedAt.toISOString() : null,
        overallScore: asmt.overallScore !== null ? Number(asmt.overallScore) : null,
        attentionLevel: asmt.attentionLevel ?? null,
        domains,
      };

      if (isPsychologist) {
        if (sanitized.professionalInterpretation !== undefined) {
          item.professionalInterpretation = sanitized.professionalInterpretation;
        }
        if (sanitized.recommendations !== undefined) {
          item.recommendations = sanitized.recommendations;
        }
      }

      return item;
    });

    // 2. Assessment Status Counts in Reporting Period
    const allSessionAssessments = await prisma.studentAssessment.findMany({
      where: {
        studentId: student.id,
        schoolId: actor.schoolId,
        OR: [
          { completedAt: { gte: sessionStartDate, lte: sessionEndDateInclusive } },
          { startedAt: { gte: sessionStartDate, lte: sessionEndDateInclusive } },
          { createdAt: { gte: sessionStartDate, lte: sessionEndDateInclusive } },
        ],
      },
      select: { status: true },
    });

    const statusCounts = {
      COMPLETED: 0,
      IN_PROGRESS: 0,
      DRAFT: 0,
      REVIEWED: 0,
    };

    allSessionAssessments.forEach((a) => {
      const st = a.status as keyof typeof statusCounts;
      if (statusCounts[st] !== undefined) {
        statusCounts[st]++;
      }
    });

    // 3. Observations in Reporting Period (filtered by observedAt)
    const rawObservations = await prisma.studentObservation.findMany({
      where: {
        studentId: student.id,
        schoolId: actor.schoolId,
        observedAt: {
          gte: sessionStartDate,
          lte: sessionEndDateInclusive,
        },
      },
      select: {
        id: true,
        recordNumber: true,
        observedAt: true,
        source: true,
        category: true,
        setting: true,
        status: true,
        observation: true,
        triggers: true,
        interventions: true,
        psychologistNotes: isPsychologist,
        aiAnalysis: isPsychologist,
      },
      orderBy: [
        { observedAt: "desc" },
        { id: "desc" },
      ],
    });

    const byCategory: Record<string, number> = {};
    const bySource: Record<string, number> = {};
    const byStatus: Record<string, number> = {};
    const interventionsList: StudentReportInterventionItemV1[] = [];

    const observationItems: StudentReportObservationItemV1[] = rawObservations.map((obs) => {
      const sanitized = sanitizeObservationForRole(obs as unknown as Record<string, unknown>, actor.role) as any;
      const obsDateStr = obs.observedAt.toISOString().split("T")[0];

      // Aggregations
      byCategory[obs.category] = (byCategory[obs.category] || 0) + 1;
      bySource[obs.source] = (bySource[obs.source] || 0) + 1;
      byStatus[obs.status] = (byStatus[obs.status] || 0) + 1;

      // Extract interventions if present
      if (obs.interventions && typeof obs.interventions === "string" && obs.interventions.trim().length > 0) {
        interventionsList.push({
          observationId: obs.id,
          observedAt: obsDateStr,
          category: obs.category,
          setting: obs.setting ?? null,
          intervention: obs.interventions.trim(),
        });
      }

      const item: StudentReportObservationItemV1 = {
        id: obs.id,
        recordNumber: obs.recordNumber ?? null,
        observedAt: obsDateStr,
        source: obs.source,
        category: obs.category,
        setting: obs.setting ?? null,
        status: obs.status,
        observation: obs.observation,
        triggers: obs.triggers ?? null,
        interventions: obs.interventions ?? null,
      };

      if (isPsychologist) {
        if (sanitized.psychologistNotes !== undefined) {
          item.psychologistNotes = sanitized.psychologistNotes;
        }
        if (sanitized.aiAnalysis !== undefined) {
          item.aiAnalysis = sanitized.aiAnalysis;
        }
      }

      return item;
    });

    // 4. Current Wellness Status (derived from the most recent completed assessment attentionLevel in period)
    const currentWellnessStatus = assessments.length > 0 ? assessments[0].attentionLevel : null;

    const snapshot: StudentReportSnapshotV1 = {
      schemaVersion: 1,
      reportType: "STUDENT",
      report: {
        title,
        generatedAt: new Date().toISOString(),
        academicSessionId: session.id,
        reportingPeriod: {
          startDate: session.startDate.toISOString().split("T")[0],
          endDate: session.endDate.toISOString().split("T")[0],
        },
      },
      student: {
        id: student.id,
        studentCode: student.studentId,
        firstName: student.firstName ?? null,
        lastName: student.lastName ?? null,
        class: student.class?.name ?? null,
        section: student.section?.name ?? null,
      },
      academicSession: {
        id: session.id,
        name: session.name,
        startDate: session.startDate.toISOString().split("T")[0],
        endDate: session.endDate.toISOString().split("T")[0],
      },
      generatedBy: {
        id: actor.id,
        displayName: actor.name || "Staff Member",
        role: actor.role,
      },
      summary: {
        currentWellnessStatus,
        assessmentStatusCounts: statusCounts,
        observationCount: rawObservations.length,
        interventionCount: interventionsList.length,
        followUpCount: 0, // No follow-up model exists in database schema
      },
      assessments,
      observations: {
        totalCount: rawObservations.length,
        byCategory,
        bySource,
        byStatus,
        latestObservedAt: rawObservations.length > 0 ? rawObservations[0].observedAt.toISOString().split("T")[0] : null,
        items: observationItems,
      },
      interventions: interventionsList,
      followUps: [],
    };

    return snapshot;
  }

  // ────────────────────────────────────────────────────────────
  // CLASS / Other Report Types (Preserved structure)
  // ────────────────────────────────────────────────────────────
  const studentWhere: Record<string, unknown> = {
    schoolId: actor.schoolId,
    isActive: true,
  };

  if (classId) studentWhere.classId = classId;
  if (sectionId) studentWhere.sectionId = sectionId;

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

  const studentIds = students.map((s) => s.id);

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
          domain: { select: { name: true } },
        },
      },
    },
    orderBy: { completedAt: "desc" },
  });

  const sanitizedAssessments = rawAssessments.map((asmt) =>
    sanitizeAssessmentForRole(asmt as unknown as Record<string, unknown>, actor.role)
  );

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
      psychologistNotes: isPsychologist,
      aiAnalysis: isPsychologist,
    },
    orderBy: { observedAt: "desc" },
  });

  const sanitizedObservations = rawObservations.map((obs) =>
    sanitizeObservationForRole(obs as unknown as Record<string, unknown>, actor.role)
  );

  return {
    reportType,
    title,
    academicSessionId: validatedScope.academicSession?.id,
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
