// src/server/observations.ts
// Protected Observation Management API routes for EduWell Psych

import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { requireRole } from "./middleware/role";
import { respondNotFound, requireTenant } from "./middleware/tenant";
import { globalAuditMiddleware } from "./middleware/audit";
import { NotificationService } from "./services/notificationService";
import { NotificationType, NotificationPriority } from "../generated/prisma/client";

export const observationsRouter = Router();

// Protect all observation endpoints with JWT authentication and school-scope verification
observationsRouter.use(requireAuth);
observationsRouter.use(requireTenant);
observationsRouter.use(globalAuditMiddleware);

// Canonical DB status values
const OBSERVATION_STATUSES = ["NEW", "PENDING_REVIEW", "REVIEWED", "ASSESSED"] as const;
const OBSERVATION_SOURCES = ["TEACHER", "PARENT", "COUNSELOR", "PSYCHOLOGIST"] as const;

const STATUS_TO_LABEL: Record<string, string> = {
  NEW: "New",
  PENDING: "New",
  PENDING_REVIEW: "Pending Review",
  REVIEWED: "Reviewed",
  ASSESSED: "Assessed",
};

const LABEL_TO_STATUS: Record<string, string> = {
  New: "NEW",
  "Pending Review": "PENDING_REVIEW",
  Reviewed: "REVIEWED",
  Assessed: "ASSESSED",
};

function toStatusLabel(status: string): string {
  return STATUS_TO_LABEL[status] || status;
}

function normalizeStatus(value: string): string {
  const trimmed = (value || "").trim().toUpperCase().replace(/\s+/g, "_");
  if (OBSERVATION_STATUSES.includes(trimmed as any)) return trimmed;
  const fromLabel = LABEL_TO_STATUS[value];
  if (fromLabel) return fromLabel;
  return trimmed;
}

function toSourceLabel(source: string): string {
  const lower = (source || "").toLowerCase();
  return lower.charAt(0).toUpperCase() + lower.slice(1);
}

function normalizeSource(value: string): string {
  return (value || "").trim().toUpperCase();
}

function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

function recordNumberFor(obs: { id: number; recordNumber: string | null }): string {
  return obs.recordNumber || `OBS-${String(obs.id).padStart(4, "0")}`;
}

// Build a where fragment restricting access to the authenticated teacher's
// assigned classes / sections (mirrors src/server/students.ts scoping).
async function teacherStudentScope(req: AuthenticatedRequest): Promise<{
  classIds: number[];
  sectionIds: number[];
  OR: any[] | null;
}> {
  const [classAccesses, sectionAccesses] = await Promise.all([
    prisma.teacherClassAccess.findMany({
      where: { userId: req.user!.id },
      select: { classId: true },
    }),
    prisma.teacherSectionAccess.findMany({
      where: { userId: req.user!.id },
      select: { sectionId: true },
    }),
  ]);

  const classIds = classAccesses.map((a) => a.classId);
  const sectionIds = sectionAccesses.map((a) => a.sectionId);

  if (classIds.length === 0 && sectionIds.length === 0) {
    return { classIds, sectionIds, OR: null };
  }

  const orConditions: any[] = [];
  if (classIds.length > 0) orConditions.push({ classId: { in: classIds } });
  if (sectionIds.length > 0) orConditions.push({ sectionId: { in: sectionIds } });

  return { classIds, sectionIds, OR: orConditions };
}

function isTeacherUser(req: AuthenticatedRequest): boolean {
  return (req.user!.role || "").toUpperCase() === "TEACHER";
}

const observationInclude = {
  student: {
    select: {
      id: true,
      studentId: true,
      fullName: true,
      firstName: true,
      lastName: true,
      class: { select: { id: true, name: true } },
      section: { select: { id: true, name: true } },
      studentAssessments: {
        select: {
          id: true,
          status: true,
          createdAt: true,
          startedAt: true,
          completedAt: true,
          assessmentTemplate: { select: { name: true } },
          creator: { select: { name: true, role: true } },
        },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  },
  submitter: { select: { id: true, name: true } },
  studentAssessments: {
    select: {
      id: true,
      status: true,
      createdAt: true,
      startedAt: true,
      completedAt: true,
      assessmentTemplate: { select: { name: true } },
      creator: { select: { name: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 1,
  },
} as const;

// Map a DB observation row into the safe UI shape. Psychologist notes and AI
// insights are only exposed to authorized psychologists within the same school.
function toSafeObservation(obs: any, role: string): any {
  const isPsychologist = (role || "").toUpperCase() === "PSYCHOLOGIST";
  const studentName =
    obs.student?.fullName ||
    [obs.student?.firstName, obs.student?.lastName].filter(Boolean).join(" ") ||
    obs.student?.studentId ||
    "";

  const narrative = obs.observation;
  const fullNarrative = obs.additionalComments
    ? `${narrative}\n\nAdditional Notes: ${obs.additionalComments}`
    : narrative;

  // Check if an assessment is linked to this observation directly, or for this student
  const linkedAssessment =
    (obs.studentAssessments && obs.studentAssessments.length > 0 && obs.studentAssessments[0]) ||
    (obs.student?.studentAssessments && obs.student?.studentAssessments.length > 0 && obs.student?.studentAssessments[0]) ||
    null;

  const hasAssessmentStarted =
    Boolean(linkedAssessment) ||
    obs.status === "Assessed" ||
    obs.status === "ASSESSED";

  const assessmentProtocolTitle = linkedAssessment?.assessmentTemplate?.name || null;
  const assessmentStartedBy = linkedAssessment?.creator?.name || "Lead Psychologist";
  const assessmentStatus = linkedAssessment?.status || (hasAssessmentStarted ? "IN_PROGRESS" : null);
  const assessmentDate = linkedAssessment?.startedAt || linkedAssessment?.createdAt || null;

  return {
    id: String(obs.id),
    recordNumber: recordNumberFor(obs),
    studentId: obs.student?.studentId || "",
    numericStudentId: obs.student?.id,
    studentName,
    classGroup: obs.student?.section?.name || obs.student?.class?.name || "",
    grade: obs.student?.class?.name || "",
    source: toSourceLabel(obs.source),
    concernCategory: obs.category,
    date: formatDate(obs.observedAt),
    incidentTime: obs.incidentTime || "",
    setting: obs.setting || "",
    status: hasAssessmentStarted ? "Assessed" : toStatusLabel(obs.status),
    submitter: obs.submitterName || obs.submitter?.name || "",
    narrative: fullNarrative,
    triggers: obs.triggers || "",
    interventions: obs.interventions || "",
    hasAssessmentStarted,
    assessmentProtocolTitle,
    assessmentStartedBy,
    assessmentStatus,
    assessmentDate: assessmentDate ? formatDate(assessmentDate) : null,
    psychologistNotes: isPsychologist ? obs.psychologistNotes || "" : "",
    aiAnalysis: isPsychologist ? obs.aiAnalysis || undefined : undefined,
  };
}

/**
 * GET /api/observations
 * Paginated, filtered list of observations for the authenticated school.
 * Query Parameters:
 *   - source: string (Teacher | Parent | Counselor | Psychologist)
 *   - category: string
 *   - status: string (New | Pending Review | Reviewed | Assessed)
 *   - studentId: number | string
 *   - search: string (matches student name or student id)
 *   - dateFrom / dateTo: YYYY-MM-DD (observedAt range)
 *   - page: number (default 1)
 *   - limit: number (default 10, max 100)
 */
observationsRouter.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";

    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const sourceParam = typeof req.query.source === "string" ? req.query.source.trim() : "";
    const categoryParam = typeof req.query.category === "string" ? req.query.category.trim() : "";
    const statusParam = typeof req.query.status === "string" ? req.query.status.trim() : "";
    const studentIdParam = typeof req.query.studentId === "string" ? req.query.studentId.trim() : "";
    const dateFromParam = typeof req.query.dateFrom === "string" ? req.query.dateFrom.trim() : "";
    const dateToParam = typeof req.query.dateTo === "string" ? req.query.dateTo.trim() : "";
    const pageParam = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limitParam = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 10;
    const skip = (page - 1) * limit;

    const where: any = { schoolId };

    if (isTeacher) {
      const scope = await teacherStudentScope(req);
      where.student = scope.OR ? { OR: scope.OR } : { id: -1 };
      where.submittedBy = req.user!.id;
    }

    if (sourceParam) {
      const source = normalizeSource(sourceParam);
      if (OBSERVATION_SOURCES.includes(source as any)) {
        where.source = source;
      }
    }

    if (categoryParam) {
      where.category = { equals: categoryParam, mode: "insensitive" };
    }

    if (statusParam) {
      where.status = normalizeStatus(statusParam);
    }

    if (studentIdParam) {
      const numericId = parseInt(studentIdParam, 10);
      if (!isNaN(numericId) && String(numericId) === studentIdParam) {
        where.studentId = numericId;
      } else {
        where.student = { ...(where.student || {}), studentId: studentIdParam };
      }
    }

    if (search) {
      const searchFilter: any[] = [
        { student: { fullName: { contains: search, mode: "insensitive" } } },
        { student: { studentId: { contains: search, mode: "insensitive" } } },
      ];
      where.OR = searchFilter;
    }

    const gradeParam = typeof req.query.grade === "string" ? req.query.grade.trim() : "";
    if (gradeParam && gradeParam !== "All Grades") {
      where.student = {
        ...(where.student || {}),
        OR: [
          { class: { name: { contains: gradeParam, mode: "insensitive" } } },
          { section: { name: { contains: gradeParam, mode: "insensitive" } } },
        ],
      };
    }

    if (dateFromParam) {
      where.observedAt = { ...(where.observedAt || {}), gte: new Date(dateFromParam) };
    }
    if (dateToParam) {
      where.observedAt = { ...(where.observedAt || {}), lte: new Date(dateToParam) };
    }

    const [total, observations] = await Promise.all([
      prisma.studentObservation.count({ where }),
      prisma.studentObservation.findMany({
        where,
        include: observationInclude,
        orderBy: [{ observedAt: "desc" }, { id: "desc" }],
        skip,
        take: limit,
      }),
    ]);

    const safeObservations = observations.map((o) => toSafeObservation(o, req.user!.role));
    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      success: true,
      observations: safeObservations,
      pagination: { total, page, limit, totalPages },
    });
  } catch (error) {
    console.error("[OBSERVATIONS_API] GET /api/observations error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch observations.",
    });
  }
});

/**
 * GET /api/observations/:id
 * Retrieve a single observation belonging to the authenticated school.
 */
observationsRouter.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";
    const idNum = parseInt(req.params.id, 10);

    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ success: false, error: "Invalid observation id." });
    }

    const where: any = { schoolId, id: idNum };

    if (isTeacher) {
      const scope = await teacherStudentScope(req);
      where.student = scope.OR ? { OR: scope.OR } : { id: -1 };
      where.submittedBy = req.user!.id;
    }

    const observation = await prisma.studentObservation.findFirst({
      where,
      include: observationInclude,
    });

    if (respondNotFound(res, observation, schoolId, "Observation record not found or access unauthorized.")) {
      return;
    }

    return res.json({ success: true, observation: toSafeObservation(observation, req.user!.role) });
  } catch (error) {
    console.error("[OBSERVATIONS_API] GET /api/observations/:id error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch observation details.",
    });
  }
});

/**
 * POST /api/observations
 * Create a new observation for a student in the authenticated school.
 * Role requirement: any authenticated staff member.
 */
observationsRouter.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";

    const {
      studentId: rawStudentId,
      source: rawSource,
      category: rawCategory,
      observation: rawObservation,
      additionalComments: rawAdditionalComments,
      observedAt: rawObservedAt,
      setting: rawSetting,
      incidentTime: rawIncidentTime,
      triggers: rawTriggers,
      interventions: rawInterventions,
      submitterName: rawSubmitterName,
    } = req.body;

    // 1. Validate student (numeric id or student id string) within school + teacher scope
    if (rawStudentId === undefined || rawStudentId === null || rawStudentId === "") {
      return res.status(400).json({ success: false, error: "A student is required." });
    }

    const idNum = parseInt(String(rawStudentId), 10);
    const studentWhere: any = {
      schoolId,
      OR: !isNaN(idNum) && String(idNum) === String(rawStudentId)
        ? [{ id: idNum }]
        : [{ studentId: String(rawStudentId) }],
    };

    // Locate the student within the authenticated school (existence + tenant check)
    const student = await prisma.student.findFirst({
      where: studentWhere,
      select: { id: true, classId: true, sectionId: true },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student record not found or access unauthorized.",
      });
    }

    // Teacher scope: creation is restricted to assigned classes/sections
    if (isTeacher) {
      const scope = await teacherStudentScope(req);
      const hasAccess =
        (student.classId !== null && scope.classIds.includes(student.classId)) ||
        (student.sectionId !== null && scope.sectionIds.includes(student.sectionId));
      if (!hasAccess) {
        return res.status(403).json({
          success: false,
          error: "Forbidden: You can only log observations for students in your assigned classes.",
        });
      }
    }

    // 2. Validate source
    const source = normalizeSource(typeof rawSource === "string" ? rawSource : "");
    if (!OBSERVATION_SOURCES.includes(source as any)) {
      return res.status(400).json({
        success: false,
        error: "Invalid source. Allowed: Teacher, Parent, Counselor, Psychologist.",
      });
    }

    // 3. Validate category
    const category = typeof rawCategory === "string" ? rawCategory.trim() : "";
    if (!category || category.length > 100) {
      return res.status(400).json({ success: false, error: "A category (max 100 chars) is required." });
    }

    // 4. Validate observation narrative
    const observation = typeof rawObservation === "string" ? rawObservation.trim() : "";
    if (!observation || observation.length > 5000) {
      return res.status(400).json({
        success: false,
        error: "An observation narrative (max 5000 chars) is required.",
      });
    }

    const additionalComments =
      typeof rawAdditionalComments === "string" && rawAdditionalComments.trim()
        ? rawAdditionalComments.trim()
        : null;
    const setting = typeof rawSetting === "string" && rawSetting.trim() ? rawSetting.trim() : null;
    const incidentTime =
      typeof rawIncidentTime === "string" && rawIncidentTime.trim() ? rawIncidentTime.trim() : null;
    const triggers = typeof rawTriggers === "string" && rawTriggers.trim() ? rawTriggers.trim() : null;
    const interventions =
      typeof rawInterventions === "string" && rawInterventions.trim() ? rawInterventions.trim() : null;
    const submitterName =
      typeof rawSubmitterName === "string" && rawSubmitterName.trim() ? rawSubmitterName.trim() : null;

    let observedAt = new Date();
    if (rawObservedAt) {
      const parsed = new Date(rawObservedAt);
      if (isNaN(parsed.getTime())) {
        return res.status(400).json({ success: false, error: "Invalid observedAt date format." });
      }
      observedAt = parsed;
    }

    // 5. Create the observation record
    const created = await prisma.studentObservation.create({
      data: {
        schoolId,
        studentId: student.id,
        submittedBy: req.user!.id,
        source,
        category,
        observation,
        additionalComments,
        setting,
        incidentTime,
        triggers,
        interventions,
        submitterName: submitterName || req.user!.name,
        status: "NEW",
        observedAt,
      },
      include: observationInclude,
    });

    // 6. Assign a stable per-school unique record number
    const recordNumber = `OBS-${String(created.id).padStart(4, "0")}`;
    await prisma.studentObservation.update({
      where: { id: created.id },
      data: { recordNumber },
    });

    // 7. Notify Psychologists and Admins
    try {
      const notificationService = new NotificationService(prisma as any);
      const targetUsers = await prisma.user.findMany({
        where: { schoolId, role: { in: ["ADMIN", "PSYCHOLOGIST"] } }
      });
      
      const studentName = created.student?.fullName || 
        [created.student?.firstName, created.student?.lastName].filter(Boolean).join(" ") || 
        created.student?.studentId || "a student";
        
      const safeCategory = category.length > 50 ? category.substring(0, 47) + "..." : category;

      for (const target of targetUsers) {
        // Prevent notifying the person who submitted it (if they are an admin/psychologist)
        if (target.id === req.user!.id) continue;
        
        await notificationService.createNotification({
          schoolId,
          userId: target.id,
          type: "URGENT",
          priority: "HIGH",
          title: "New Observation Submitted",
          message: `Observation ${recordNumber} submitted for ${studentName} regarding ${safeCategory}.`,
          entityType: "OBSERVATION",
          entityId: created.id,
          dedupeKey: `obs-creation-${created.id}-${target.id}`
        });
      }
    } catch (notifyErr) {
      console.error("Failed to notify users of new observation:", notifyErr);
    }

    return res.status(201).json({
      success: true,
      message: "Observation submitted successfully.",
      observation: toSafeObservation({ ...created, recordNumber }, req.user!.role),
    });
  } catch (error) {
    console.error("[OBSERVATIONS_API] POST /api/observations error:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while submitting the observation. Please try again.",
    });
  }
});

/**
 * PATCH /api/observations/:id
 * Update status or psychologist notes on an observation.
 * Role requirement: PSYCHOLOGIST or ADMIN only.
 */
observationsRouter.patch("/:id", requireRole("PSYCHOLOGIST", "ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const isTeacher = isTeacherUser(req);

    const idNum = parseInt(req.params.id, 10);
    if (isNaN(idNum) || idNum <= 0) {
      return res.status(400).json({ success: false, error: "Invalid observation id." });
    }

    // 2. Validate payload
    const { status: rawStatus, psychologistNotes: rawNotes } = req.body;

    if (rawStatus === undefined && rawNotes === undefined) {
      return res.status(400).json({
        success: false,
        error: "Provide a status or psychologist notes to update.",
      });
    }

    const data: any = {};
    if (rawStatus !== undefined) {
      const status = normalizeStatus(String(rawStatus));
      if (!OBSERVATION_STATUSES.includes(status as any)) {
        return res.status(400).json({
          success: false,
          error: "Invalid status. Allowed: New, Pending Review, Reviewed, Assessed.",
        });
      }
      data.status = status;
    }

    if (rawNotes !== undefined) {
      data.psychologistNotes = typeof rawNotes === "string" ? rawNotes.trim() : "";
    }

    // 3. Locate observation within the authenticated school
    const observation = await prisma.studentObservation.findFirst({
      where: { schoolId, id: idNum },
    });

    if (respondNotFound(res, observation, schoolId, "Observation record not found or access unauthorized.")) {
      return;
    }

    // 4. Apply update
    const updated = await prisma.studentObservation.update({
      where: { id: observation.id },
      data,
      include: observationInclude,
    });

    return res.json({
      success: true,
      message: "Observation updated successfully.",
      observation: toSafeObservation(updated, req.user!.role),
    });
  } catch (error) {
    console.error("[OBSERVATIONS_API] PATCH /api/observations/:id error:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while updating the observation. Please try again.",
    });
  }
});