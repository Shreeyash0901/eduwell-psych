import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { requireTenant } from "./middleware/tenant";
import { globalAuditMiddleware } from "./middleware/audit";
import { Prisma } from "../generated/prisma/client";
import { sanitizeAssessmentForRole, getTeacherAccess, checkTeacherStudentAccess } from "./services/reportAccess";
import { NotificationService } from "./services/notificationService";
import { NotificationType, NotificationPriority } from "../generated/prisma/client";

export const assessmentsRouter = Router();

// Protect all assessment endpoints with JWT authentication and school-scope verification
assessmentsRouter.use(requireAuth);
assessmentsRouter.use(requireTenant);
assessmentsRouter.use(globalAuditMiddleware);

/**
 * GET /api/assessments/templates
 * Fetch available assessment templates for the authenticated school.
 * Supports ?status=all | PUBLISHED | DRAFT | ARCHIVED for staff.
 */
assessmentsRouter.get("/templates", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const isStaff = ["ADMIN", "PSYCHOLOGIST"].includes(req.user!.role.toUpperCase());
    const requestedStatus = req.query.status as string;

    const statusFilter = isStaff && requestedStatus === "all"
      ? undefined
      : isStaff && requestedStatus
      ? requestedStatus.toUpperCase()
      : "PUBLISHED";

    const templates = await prisma.assessmentTemplate.findMany({
      where: {
        schoolId,
        ...(statusFilter ? { status: statusFilter } : {}),
      },
      include: {
        domains: {
          orderBy: { displayOrder: "asc" },
        },
        questions: {
          orderBy: { displayOrder: "asc" },
          include: {
            options: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
        scoringRules: {
          orderBy: { minScore: "asc" },
        },
      },
      orderBy: { id: "asc" },
    });

    return res.json({ success: true, templates });
  } catch (error) {
    console.error("[ASSESSMENTS_API] GET /templates error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch assessment templates." });
  }
});

/**
 * GET /api/assessments/templates/:id/full
 * Deep query returning domains, questions, options, and scoring rules for builder preview.
 */
assessmentsRouter.get("/templates/:id/full", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const templateId = parseInt(req.params.id, 10);

    if (isNaN(templateId)) {
      return res.status(400).json({ success: false, error: "Invalid template ID" });
    }

    const template = await prisma.assessmentTemplate.findFirst({
      where: { id: templateId, schoolId },
      include: {
        domains: {
          orderBy: { displayOrder: "asc" },
        },
        questions: {
          orderBy: { displayOrder: "asc" },
          include: {
            options: {
              orderBy: { displayOrder: "asc" },
            },
          },
        },
        scoringRules: {
          orderBy: { minScore: "asc" },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: "Assessment template not found." });
    }

    return res.json({ success: true, template });
  } catch (error) {
    console.error("[ASSESSMENTS_API] GET /templates/:id/full error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch template detail." });
  }
});

/**
 * POST /api/assessments/templates
 * Create a new assessment template with domains, questions, options, and scoring rules in a single $transaction.
 */
assessmentsRouter.post("/templates", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role.toUpperCase();

    if (!["ADMIN", "PSYCHOLOGIST"].includes(userRole)) {
      return res.status(403).json({ success: false, error: "Forbidden: Only Psychologists and Admins can build assessment templates." });
    }

    const { name, code, description, category, estimatedMinutes, version, status, domains, questions, scoringRules } = req.body;

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return res.status(400).json({ success: false, error: "Template name is required." });
    }

    const templateCategory = category ? String(category).trim() : "BEHAVIORAL";

    const result = await prisma.$transaction(async (tx) => {
      // 1. Create template
      const newTemplate = await tx.assessmentTemplate.create({
        data: {
          schoolId,
          name: name.trim(),
          category: templateCategory,
          description: description?.trim() || null,
          estimatedMinutes: estimatedMinutes ? Number(estimatedMinutes) : 15,
          version: version?.trim() || "1.0",
          status: status === "PUBLISHED" ? "PUBLISHED" : "DRAFT",
          createdBy: req.user!.id,
        },
      });

      // 2. Create domains and track map: domainTempIndex / name -> created domain id
      const domainMap = new Map<string | number, number>();
      if (Array.isArray(domains) && domains.length > 0) {
        for (let i = 0; i < domains.length; i++) {
          const d = domains[i];
          const createdDomain = await tx.assessmentDomain.create({
            data: {
              assessmentTemplateId: newTemplate.id,
              name: d.name?.trim() || `Domain ${i + 1}`,
              description: d.description?.trim() || null,
              displayOrder: d.displayOrder ?? i,
            },
          });
          if (d.tempId !== undefined) domainMap.set(d.tempId, createdDomain.id);
          domainMap.set(createdDomain.name, createdDomain.id);
          domainMap.set(i, createdDomain.id);
        }
      } else {
        // Default general domain if none provided
        const defaultDomain = await tx.assessmentDomain.create({
          data: {
            assessmentTemplateId: newTemplate.id,
            name: "General",
            description: "General screening criteria",
            displayOrder: 0,
          },
        });
        domainMap.set("General", defaultDomain.id);
        domainMap.set(0, defaultDomain.id);
      }

      // 3. Create questions and options
      if (Array.isArray(questions) && questions.length > 0) {
        for (let qIdx = 0; qIdx < questions.length; qIdx++) {
          const q = questions[qIdx];
          const domainId =
            (q.domainId && domainMap.get(q.domainId)) ||
            (q.domainName && domainMap.get(q.domainName)) ||
            (q.domainTempId !== undefined && domainMap.get(q.domainTempId)) ||
            domainMap.get(0) ||
            Array.from(domainMap.values())[0];

          const createdQuestion = await tx.assessmentQuestion.create({
            data: {
              assessmentTemplateId: newTemplate.id,
              domainId,
              questionText: q.questionText?.trim() || `Question ${qIdx + 1}`,
              questionType: q.questionType || "LIKERT",
              isRequired: q.isRequired ?? true,
              displayOrder: q.displayOrder ?? qIdx,
            },
          });

          // Options
          const opts = Array.isArray(q.options) && q.options.length > 0
            ? q.options
            : [
                { label: "Never / Rarely", value: "rarely", score: 1 },
                { label: "Sometimes", value: "sometimes", score: 2 },
                { label: "Often", value: "often", score: 3 },
                { label: "Almost Always", value: "always", score: 4 },
              ];

          for (let optIdx = 0; optIdx < opts.length; optIdx++) {
            const opt = opts[optIdx];
            await tx.assessmentOption.create({
              data: {
                questionId: createdQuestion.id,
                label: opt.label?.trim() || opt.text?.trim() || `Option ${optIdx + 1}`,
                value: opt.value?.trim() || `opt_${optIdx + 1}`,
                score: new Prisma.Decimal(Number(opt.score ?? optIdx)),
                displayOrder: opt.displayOrder ?? optIdx,
              },
            });
          }
        }
      }

      // 4. Create scoring rules
      if (Array.isArray(scoringRules) && scoringRules.length > 0) {
        for (const rule of scoringRules) {
          const targetDomainId = rule.domainId
            ? domainMap.get(rule.domainId) || null
            : null;

          await tx.assessmentScoringRule.create({
            data: {
              assessmentTemplateId: newTemplate.id,
              scope: rule.scope || (targetDomainId ? "DOMAIN" : "OVERALL"),
              domainId: targetDomainId,
              minScore: new Prisma.Decimal(Number(rule.minScore ?? 0)),
              maxScore: new Prisma.Decimal(Number(rule.maxScore ?? 100)),
              resultLabel: rule.resultLabel?.trim() || "Standard Interpretation",
              attentionLevel: rule.attentionLevel || "OPTIMAL",
            },
          });
        }
      }

      return newTemplate;
    });

    // Re-fetch complete created template
    const fullTemplate = await prisma.assessmentTemplate.findUnique({
      where: { id: result.id },
      include: {
        domains: { orderBy: { displayOrder: "asc" } },
        questions: {
          orderBy: { displayOrder: "asc" },
          include: { options: { orderBy: { displayOrder: "asc" } } },
        },
        scoringRules: { orderBy: { minScore: "asc" } },
      },
    });

    return res.status(201).json({ success: true, template: fullTemplate });
  } catch (error) {
    console.error("[ASSESSMENTS_API] POST /templates error:", error);
    return res.status(500).json({ success: false, error: "Failed to create assessment template." });
  }
});

/**
 * PATCH /api/assessments/templates/:id/status
 * Toggle template status between DRAFT, PUBLISHED, ARCHIVED.
 */
assessmentsRouter.patch("/templates/:id/status", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role.toUpperCase();

    if (!["ADMIN", "PSYCHOLOGIST"].includes(userRole)) {
      return res.status(403).json({ success: false, error: "Forbidden: Only Psychologists and Admins can publish or archive templates." });
    }

    const templateId = parseInt(req.params.id, 10);
    const { status } = req.body;

    if (!["DRAFT", "PUBLISHED", "ARCHIVED"].includes(status)) {
      return res.status(400).json({ success: false, error: "Invalid status. Must be DRAFT, PUBLISHED, or ARCHIVED." });
    }

    const template = await prisma.assessmentTemplate.findFirst({
      where: { id: templateId, schoolId },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: "Assessment template not found." });
    }

    const updated = await prisma.assessmentTemplate.update({
      where: { id: templateId },
      data: { status },
    });

    return res.json({ success: true, template: updated });
  } catch (error) {
    console.error("[ASSESSMENTS_API] PATCH /templates/:id/status error:", error);
    return res.status(500).json({ success: false, error: "Failed to update template status." });
  }
});

/**
 * DELETE /api/assessments/templates/:id
 * Delete a draft template or archive if assessments exist.
 */
assessmentsRouter.delete("/templates/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const userRole = req.user!.role.toUpperCase();

    if (!["ADMIN", "PSYCHOLOGIST"].includes(userRole)) {
      return res.status(403).json({ success: false, error: "Forbidden: Only Psychologists and Admins can delete templates." });
    }

    const templateId = parseInt(req.params.id, 10);

    const template = await prisma.assessmentTemplate.findFirst({
      where: { id: templateId, schoolId },
      include: {
        _count: {
          select: { studentAssessments: true },
        },
      },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: "Assessment template not found." });
    }

    // If active assessments have used this template, archive rather than hard delete
    if (template._count.studentAssessments > 0) {
      const archived = await prisma.assessmentTemplate.update({
        where: { id: templateId },
        data: { status: "ARCHIVED" },
      });
      return res.json({ success: true, message: "Template is linked to student assessments and has been archived.", template: archived });
    }

    await prisma.assessmentTemplate.delete({
      where: { id: templateId },
    });

    return res.json({ success: true, message: "Template deleted successfully." });
  } catch (error) {
    console.error("[ASSESSMENTS_API] DELETE /templates/:id error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete template." });
  }
});

/**
 * POST /api/assessments/start
 * Initialize a new StudentAssessment (status IN_PROGRESS).
 */
assessmentsRouter.post("/start", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { studentId: rawStudentId, assessmentTemplateId } = req.body;

    if (!rawStudentId || !assessmentTemplateId) {
      return res.status(400).json({ success: false, error: "Missing studentId or assessmentTemplateId." });
    }

    const idNum = parseInt(String(rawStudentId), 10);
    const studentWhere: any = {
      schoolId,
      OR: !isNaN(idNum) && String(idNum) === String(rawStudentId)
        ? [{ id: idNum }]
        : [{ studentId: String(rawStudentId) }],
    };

    const student = await prisma.student.findFirst({
      where: studentWhere,
      select: { id: true, classId: true, sectionId: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found or access unauthorized." });
    }

    // Check teacher scope
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";
    if (isTeacher) {
      const teacherAccess = await getTeacherAccess(req.user!.id);
      const hasAccess = checkTeacherStudentAccess(teacherAccess, student);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: "Forbidden: Student not in your assigned classes." });
      }
    }

    // Find template
    const template = await prisma.assessmentTemplate.findFirst({
      where: { schoolId, id: Number(assessmentTemplateId), status: "PUBLISHED" },
    });

    if (!template) {
       return res.status(404).json({ success: false, error: "Assessment template not found." });
    }

    let assessment = await prisma.studentAssessment.findFirst({
      where: {
        schoolId,
        studentId: student.id,
        assessmentTemplateId: template.id,
        status: "IN_PROGRESS",
      },
      include: {
        responses: true,
      }
    });

    if (!assessment) {
      assessment = await prisma.studentAssessment.create({
        data: {
          schoolId,
          studentId: student.id,
          assessmentTemplateId: template.id,
          startedAt: new Date(),
          status: "IN_PROGRESS",
          createdBy: req.user!.id,
        },
        include: {
          responses: true,
        }
      });
    }

    const safeAssessment = sanitizeAssessmentForRole(assessment as any, req.user!.role);
    return res.status(201).json({ success: true, assessment: safeAssessment });
  } catch (error) {
    console.error("[ASSESSMENTS_API] POST /start error:", error);
    return res.status(500).json({ success: false, error: "Failed to start assessment." });
  }
});

/**
 * POST /api/assessments/assign
 * Psychologist assigns an assessment to a Teacher, Student, or Parent.
 * Supports custom instructions, due date, respondent type, and custom questions.
 */
assessmentsRouter.post("/assign", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const {
      studentId: rawStudentId,
      assessmentTemplateId,
      respondentType = "TEACHER",
      dueDate,
      instructions,
      observationId,
      customQuestions,
    } = req.body;

    if (!rawStudentId || !assessmentTemplateId) {
      return res.status(400).json({ success: false, error: "Missing studentId or assessmentTemplateId." });
    }

    const idNum = parseInt(String(rawStudentId), 10);
    const studentWhere: any = {
      schoolId,
      OR: !isNaN(idNum) && String(idNum) === String(rawStudentId)
        ? [{ id: idNum }]
        : [{ studentId: String(rawStudentId) }],
    };

    const student = await prisma.student.findFirst({
      where: studentWhere,
      include: {
        class: true,
        section: true,
      },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found." });
    }

    // Find template
    const template = await prisma.assessmentTemplate.findFirst({
      where: { schoolId, id: Number(assessmentTemplateId) },
      include: { domains: true },
    });

    if (!template) {
      return res.status(404).json({ success: false, error: "Assessment template not found." });
    }

    const parsedDueDate = dueDate ? new Date(dueDate) : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    const createdAssessment = await prisma.studentAssessment.create({
      data: {
        schoolId,
        studentId: student.id,
        assessmentTemplateId: template.id,
        status: "ASSIGNED",
        respondentType: String(respondentType).toUpperCase(),
        dueDate: parsedDueDate,
        instructions: instructions ? String(instructions) : null,
        observationId: observationId ? Number(observationId) : null,
        createdBy: req.user!.id,
      },
      include: {
        student: {
          select: { id: true, studentId: true, fullName: true, firstName: true, lastName: true },
        },
        assessmentTemplate: {
          select: { id: true, name: true, category: true, estimatedMinutes: true },
        },
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
    });

    // Notify Teachers if assigned to TEACHER
    try {
      const notificationService = new NotificationService(prisma as any);
      const studentDisplayName = student.fullName || `${student.firstName || ""} ${student.lastName || ""}`.trim() || student.studentId;

      // Find teachers assigned to this student's class/section
      let targetTeachers: { id: number }[] = [];
      if (student.classId) {
        const classTeachers = await prisma.teacherClassAccess.findMany({
          where: { classId: student.classId },
          select: { userId: true },
        });
        targetTeachers.push(...classTeachers.map((t) => ({ id: t.userId })));
      }

      // If no specific class teachers, notify all active teachers in school
      if (targetTeachers.length === 0) {
        const allTeachers = await prisma.user.findMany({
          where: { schoolId, role: "TEACHER", status: "ACTIVE" },
          select: { id: true },
        });
        targetTeachers = allTeachers.map((t) => ({ id: t.id }));
      }

      for (const teacher of targetTeachers) {
        await notificationService.createNotification({
          schoolId,
          userId: teacher.id,
          type: "ASSESSMENT",
          priority: "HIGH",
          title: "New Assessment Assigned",
          message: `${req.user!.name} assigned "${template.name}" for ${studentDisplayName}. Due by ${parsedDueDate.toLocaleDateString()}.`,
          entityType: "ASSESSMENT",
          entityId: createdAssessment.id,
          dedupeKey: `assessment-assign-${createdAssessment.id}-${teacher.id}`,
        });
      }
    } catch (notifyErr) {
      console.error("[ASSESSMENTS_API] Notification dispatch error:", notifyErr);
    }

    return res.status(201).json({
      success: true,
      message: `Assessment successfully assigned to ${respondentType.toLowerCase()}.`,
      assessment: createdAssessment,
    });
  } catch (error) {
    console.error("[ASSESSMENTS_API] POST /assign error:", error);
    return res.status(500).json({ success: false, error: "Failed to assign assessment." });
  }
});

/**
 * GET /api/assessments/assigned
 * Retrieve active assigned assessments for the school or current user's classes.
 */
assessmentsRouter.get("/assigned", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";

    let whereCondition: any = {
      schoolId,
      status: { in: ["ASSIGNED", "IN_PROGRESS"] },
    };

    if (isTeacher) {
      const teacherAccess = await getTeacherAccess(req.user!.id);
      const orConditions: any[] = [];
      if (teacherAccess.classIds.length > 0) {
        orConditions.push({ student: { classId: { in: teacherAccess.classIds } } });
      }
      if (teacherAccess.sectionIds.length > 0) {
        orConditions.push({ student: { sectionId: { in: teacherAccess.sectionIds } } });
      }
      if (orConditions.length > 0) {
        whereCondition.OR = orConditions;
      }
    }

    const assignedList = await prisma.studentAssessment.findMany({
      where: whereCondition,
      include: {
        student: {
          select: {
            id: true,
            studentId: true,
            fullName: true,
            firstName: true,
            lastName: true,
            class: { select: { name: true } },
            section: { select: { name: true } },
          },
        },
        assessmentTemplate: {
          include: {
            domains: { orderBy: { displayOrder: "asc" } },
            questions: {
              orderBy: { displayOrder: "asc" },
              include: { options: { orderBy: { displayOrder: "asc" } } },
            },
          },
        },
        creator: {
          select: { id: true, name: true, role: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const formatted = assignedList.map((a) => ({
      id: a.id,
      studentId: a.student.studentId,
      studentName:
        a.student.fullName ||
        [a.student.firstName, a.student.lastName].filter(Boolean).join(" ") ||
        a.student.studentId,
      grade: a.student.class?.name || "Grade",
      section: a.student.section?.name || "",
      protocolId: String(a.assessmentTemplate.id),
      protocolTitle: a.assessmentTemplate.name,
      domains: a.assessmentTemplate.domains.map((d) => d.name),
      questionCount: a.assessmentTemplate.questions.length,
      estTime: `${a.assessmentTemplate.estimatedMinutes || 10} mins`,
      questions: a.assessmentTemplate.questions.map((q) => ({
        id: q.id,
        text: q.questionText,
        domain: a.assessmentTemplate.domains.find((d) => d.id === q.domainId)?.name || "General",
        options: q.options.map((o) => ({ label: o.label, score: Number(o.score) })),
      })),
      respondentType: a.respondentType || "TEACHER",
      status: a.status,
      dueDate: a.dueDate ? a.dueDate.toISOString().split("T")[0] : null,
      instructions: a.instructions || "",
      assignedBy: a.creator.name,
      createdAt: a.createdAt.toISOString(),
    }));

    return res.json({ success: true, assessments: formatted });
  } catch (error) {
    console.error("[ASSESSMENTS_API] GET /assigned error:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve assigned assessments." });
  }
});

/**
 * PUT /api/assessments/:id/responses
 * Save or update responses for an in-progress assessment.
 */
assessmentsRouter.put("/:id/responses", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const assessmentId = parseInt(req.params.id, 10);
    const { responses } = req.body; // Array of { questionId, selectedOptionId, textResponse }

    if (!Array.isArray(responses)) {
      return res.status(400).json({ success: false, error: "Responses must be an array." });
    }

    const assessment = await prisma.studentAssessment.findFirst({
      where: { id: assessmentId, schoolId },
    });

    if (!assessment) {
      return res.status(404).json({ success: false, error: "Assessment not found." });
    }

    if (assessment.status === "COMPLETED" || assessment.status === "REVIEWED") {
       return res.status(400).json({ success: false, error: "Assessment already completed." });
    }

    const results = [];
    for (const resp of responses) {
       const questionId = Number(resp.questionId);
       const selectedOptionId = resp.selectedOptionId ? Number(resp.selectedOptionId) : null;
       
       let score: Prisma.Decimal | null = null;
       if (selectedOptionId) {
          const option = await prisma.assessmentOption.findUnique({ where: { id: selectedOptionId } });
          if (option) {
             score = option.score;
          }
       }

       const responseRec = await prisma.assessmentResponse.upsert({
         where: {
           studentAssessmentId_questionId: {
             studentAssessmentId: assessment.id,
             questionId,
           }
         },
         update: {
           selectedOptionId,
           textResponse: resp.textResponse,
           score,
         },
         create: {
           studentAssessmentId: assessment.id,
           questionId,
           selectedOptionId,
           textResponse: resp.textResponse,
           score,
         }
       });
       results.push(responseRec);
    }

    return res.json({ success: true, responses: results });
  } catch (error) {
    console.error("[ASSESSMENTS_API] PUT /:id/responses error:", error);
    return res.status(500).json({ success: false, error: "Failed to save responses." });
  }
});

/**
 * POST /api/assessments/:id/complete
 * Calculate scores, apply rules, and mark as completed.
 */
assessmentsRouter.post("/:id/complete", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const assessmentId = parseInt(req.params.id, 10);

    const assessment = await prisma.studentAssessment.findFirst({
      where: { id: assessmentId, schoolId },
      include: {
        assessmentTemplate: {
          include: {
            questions: true,
            scoringRules: true,
            domains: true,
          }
        },
        responses: true,
      }
    });

    if (!assessment) {
      return res.status(404).json({ success: false, error: "Assessment not found." });
    }

    if (assessment.status === "COMPLETED" || assessment.status === "REVIEWED") {
      return res.status(400).json({ success: false, error: "Assessment already completed." });
    }

    // 1. Validation: Check if all required questions have responses
    const requiredQuestions = assessment.assessmentTemplate.questions.filter(q => q.isRequired);
    const answeredQuestionIds = new Set(assessment.responses.map(r => r.questionId));
    
    for (const q of requiredQuestions) {
       if (!answeredQuestionIds.has(q.id)) {
           return res.status(400).json({ success: false, error: `Missing response for required question ID: ${q.id}` });
       }
    }

    // 2. Score Calculation
    // We will sum the scores for each domain.
    const domainScores: Record<number, { score: number, maxScore: number }> = {};
    
    assessment.assessmentTemplate.domains.forEach(d => {
        domainScores[d.id] = { score: 0, maxScore: 0 };
    });

    // We also need to calculate max score. The max possible score for a domain
    // is the sum of the max scores of its questions.
    // Exclude optional questions if they were not answered.
    const allOptions = await prisma.assessmentOption.findMany({
        where: { questionId: { in: assessment.assessmentTemplate.questions.map(q => q.id) } }
    });

    for (const q of assessment.assessmentTemplate.questions) {
        if (q.domainId) {
            const isAnswered = answeredQuestionIds.has(q.id);
            if (q.isRequired || isAnswered) {
                const qOptions = allOptions.filter(o => o.questionId === q.id);
                let maxOptScore = 0;
                qOptions.forEach(opt => {
                    if (Number(opt.score) > maxOptScore) maxOptScore = Number(opt.score);
                });
                if (domainScores[q.domainId]) {
                    domainScores[q.domainId].maxScore += maxOptScore;
                }
            }
        }
    }

    for (const response of assessment.responses) {
        const question = assessment.assessmentTemplate.questions.find(q => q.id === response.questionId);
        if (question && question.domainId && response.score !== null) {
            domainScores[question.domainId].score += Number(response.score);
        }
    }

    // Calculate overall score (sum of domain scores)
    let overallScore = 0;
    Object.values(domainScores).forEach(d => {
        overallScore += d.score;
    });

    // 3. Apply Scoring Rules
    let overallAttentionLevel = "NORMAL";
    const overallRules = assessment.assessmentTemplate.scoringRules.filter(r => r.scope === "OVERALL");
    
    for (const rule of overallRules) {
        if (overallScore >= Number(rule.minScore) && overallScore <= Number(rule.maxScore)) {
            overallAttentionLevel = rule.attentionLevel;
            break;
        }
    }

    // 4. Save Domain Results and Complete Assessment via Transaction
    const txOperations: any[] = [];

    for (const domainIdStr of Object.keys(domainScores)) {
        const domainId = Number(domainIdStr);
        const ds = domainScores[domainId];
        
        // Find domain rule
        let dResultLabel = null;
        let dAttentionLevel = "NORMAL";
        const dRules = assessment.assessmentTemplate.scoringRules.filter(r => r.scope === "DOMAIN" && r.domainId === domainId);
        for (const rule of dRules) {
            if (ds.score >= Number(rule.minScore) && ds.score <= Number(rule.maxScore)) {
                dResultLabel = rule.resultLabel;
                dAttentionLevel = rule.attentionLevel;
                break;
            }
        }

        txOperations.push(prisma.assessmentDomainResult.upsert({
            where: {
                studentAssessmentId_domainId: { studentAssessmentId: assessment.id, domainId }
            },
            update: {
                score: new Prisma.Decimal(ds.score),
                maxScore: new Prisma.Decimal(ds.maxScore),
                resultLabel: dResultLabel,
                attentionLevel: dAttentionLevel,
            },
            create: {
                studentAssessmentId: assessment.id,
                domainId,
                score: new Prisma.Decimal(ds.score),
                maxScore: new Prisma.Decimal(ds.maxScore),
                resultLabel: dResultLabel,
                attentionLevel: dAttentionLevel,
            }
        }));
    }

    // 5. Complete Assessment
    txOperations.push(prisma.studentAssessment.update({
        where: { id: assessment.id },
        data: {
            status: "COMPLETED",
            completedAt: new Date(),
            overallScore: new Prisma.Decimal(overallScore),
            attentionLevel: overallAttentionLevel,
        },
        include: {
            domainResults: {
                include: { domain: true }
            },
            assessmentTemplate: true,
        }
    }));

    const txResults = await prisma.$transaction(txOperations);
    const updatedAssessment = txResults[txResults.length - 1];

    // Notify Psychologists and Admins
    try {
      const student = await prisma.student.findUnique({
        where: { id: assessment.studentId },
        select: { fullName: true, firstName: true, lastName: true, studentId: true }
      });
      const studentName = student?.fullName || 
        [student?.firstName, student?.lastName].filter(Boolean).join(" ") || 
        student?.studentId || "a student";

      const notificationService = new NotificationService(prisma as any);
      const targetUsers = await prisma.user.findMany({
        where: { schoolId, role: { in: ["ADMIN", "PSYCHOLOGIST"] } }
      });

      for (const target of targetUsers) {
        if (target.id === req.user!.id) continue;

        await notificationService.createNotification({
          schoolId,
          userId: target.id,
          type: "ASSESSMENT",
          priority: "NORMAL",
          title: "Assessment Completed",
          message: `${assessment.assessmentTemplate.name} completed for ${studentName}. Score: ${overallScore}, Level: ${overallAttentionLevel}.`,
          entityType: "ASSESSMENT",
          entityId: updatedAssessment.id,
          dedupeKey: `assessment-complete-${updatedAssessment.id}-${target.id}`
        });
      }
    } catch (notifyErr) {
      console.error("Failed to notify users of assessment completion:", notifyErr);
    }

    const safeAssessment = sanitizeAssessmentForRole(updatedAssessment as any, req.user!.role);
    return res.json({ success: true, assessment: safeAssessment });
  } catch (error) {
    console.error("[ASSESSMENTS_API] POST /:id/complete error:", error);
    return res.status(500).json({ success: false, error: "Failed to complete assessment." });
  }
});

// GET /api/assessments/student/:studentId - Get assessment history for a student
assessmentsRouter.get("/student/:studentId", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const studentIdParam = req.params.studentId;

    const idNum = parseInt(studentIdParam, 10);
    const studentWhere: any = {
      schoolId,
      OR: !isNaN(idNum) && String(idNum) === studentIdParam
        ? [{ id: idNum }, { studentId: studentIdParam }]
        : [{ studentId: studentIdParam }],
    };

    const student = await prisma.student.findFirst({
      where: studentWhere,
      select: { id: true, classId: true, sectionId: true },
    });

    if (!student) {
      return res.status(404).json({ success: false, error: "Student not found." });
    }

    // Teacher RBAC scoping check
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";
    if (isTeacher) {
      const teacherAccess = await getTeacherAccess(req.user!.id);
      const hasAccess = checkTeacherStudentAccess(teacherAccess, student);
      if (!hasAccess) {
        return res.status(403).json({ success: false, error: "Forbidden: Student not in your assigned classes." });
      }
    }

    const isPsychologist = req.user!.role.toUpperCase() === "PSYCHOLOGIST";

    const rawAssessments = await prisma.studentAssessment.findMany({
      where: {
        schoolId,
        studentId: student.id,
      },
      select: {
        id: true,
        studentId: true,
        assessmentTemplateId: true,
        startedAt: true,
        completedAt: true,
        status: true,
        overallScore: true,
        attentionLevel: true,
        createdAt: true,
        updatedAt: true,
        professionalInterpretation: isPsychologist,
        recommendations: isPsychologist,
        assessmentTemplate: {
          select: {
            name: true,
            description: true,
            version: true,
          }
        },
        domainResults: {
          include: {
            domain: true,
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    const safeAssessments = rawAssessments.map(a => sanitizeAssessmentForRole(a as any, req.user!.role));

    return res.json({ success: true, assessments: safeAssessments });
  } catch (error) {
    console.error("[ASSESSMENTS_API] GET /student/:studentId error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch student assessment history." });
  }
});

