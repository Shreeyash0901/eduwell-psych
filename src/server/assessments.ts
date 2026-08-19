import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { Prisma } from "../generated/prisma/client";
import { sanitizeAssessmentForRole, getTeacherAccess, checkTeacherStudentAccess } from "./services/reportAccess";

export const assessmentsRouter = Router();

// Protect all assessment endpoints with JWT authentication
assessmentsRouter.use(requireAuth);

/**
 * GET /api/assessments/templates
 * Fetch available assessment templates for the authenticated school.
 */
assessmentsRouter.get("/templates", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;

    const templates = await prisma.assessmentTemplate.findMany({
      where: { schoolId, status: "PUBLISHED" },
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
      },
    });

    return res.json({ success: true, templates });
  } catch (error) {
    console.error("[ASSESSMENTS_API] GET /templates error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch assessment templates." });
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

