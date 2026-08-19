import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { generateReportData, ReportType, ReportAggregationOptions } from "./services/reportService";
import { generatePdfStream, generateCsvString } from "./services/exportService";

export const reportsRouter = Router();

// Protect all report endpoints with JWT authentication
reportsRouter.use(requireAuth);

/**
 * GET /api/reports
 * Paginated, filtered list of reports for the authenticated school.
 */
reportsRouter.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    
    // Admin, Psychologists see all. Teachers only see ones they generated (for now, simpler RBAC on reports).
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";
    
    const where: any = { schoolId };
    if (isTeacher) {
      where.generatedBy = req.user!.id;
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { generatedAt: 'desc' },
      include: {
        generator: { select: { name: true, role: true } }
      }
    });

    res.json({ success: true, reports });
  } catch (error) {
    console.error("[REPORTS_API] GET / error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch reports." });
  }
});

/**
 * POST /api/reports/generate
 * Trigger report generation for a specific target (STUDENT, CLASS, GRADE).
 */
reportsRouter.post("/generate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { reportType, title, studentId, classId, sectionId, academicSessionId } = req.body;

    if (!reportType || !title) {
      return res.status(400).json({ success: false, error: "Missing reportType or title." });
    }

    const options: ReportAggregationOptions = {
      schoolId,
      reportType,
      title,
      generatedBy: req.user!.id,
      studentId: studentId ? Number(studentId) : undefined,
      classId: classId ? Number(classId) : undefined,
      sectionId: sectionId ? Number(sectionId) : undefined,
      academicSessionId: academicSessionId ? Number(academicSessionId) : undefined,
    };

    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";
    if (isTeacher) {
      const [classAccesses, sectionAccesses] = await Promise.all([
        prisma.teacherClassAccess.findMany({ where: { userId: req.user!.id }, select: { classId: true } }),
        prisma.teacherSectionAccess.findMany({ where: { userId: req.user!.id }, select: { sectionId: true } }),
      ]);
      options.allowedClassIds = classAccesses.map((a) => a.classId);
      options.allowedSectionIds = sectionAccesses.map((a) => a.sectionId);
    }

    // Generate the raw data
    const reportData = await generateReportData(options);

    // Create Report Header
    const report = await prisma.report.create({
      data: {
        schoolId,
        reportType,
        title,
        studentId: options.studentId,
        classId: options.classId,
        sectionId: options.sectionId,
        academicSessionId: options.academicSessionId,
        generatedBy: options.generatedBy,
        status: "COMPLETED",
      }
    });

    // Create JSON Snapshot
    await prisma.reportSnapshot.create({
      data: {
        reportId: report.id,
        contentJson: reportData as any,
      }
    });

    res.status(201).json({ success: true, report });
  } catch (error: any) {
    console.error("[REPORTS_API] POST /generate error:", error);
    res.status(error.message.includes("permission") ? 403 : 500).json({ success: false, error: error.message || "Failed to generate report." });
  }
});

/**
 * GET /api/reports/:id
 * Fetch report metadata and JSON data for frontend visualization.
 */
reportsRouter.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const reportId = Number(req.params.id);

    const report = await prisma.report.findFirst({
      where: { schoolId, id: reportId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        generator: { select: { name: true, role: true } }
      }
    });

    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found." });
    }

    // RBAC: Teachers can only view reports they generated
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";
    if (isTeacher && report.generatedBy !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cannot view this report." });
    }

    res.json({ success: true, report });
  } catch (error) {
    console.error("[REPORTS_API] GET /:id error:", error);
    res.status(500).json({ success: false, error: "Failed to fetch report." });
  }
});

/**
 * GET /api/reports/:id/export?format=pdf|csv
 * Download the report in the specified format.
 */
reportsRouter.get("/:id/export", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const reportId = Number(req.params.id);
    const format = req.query.format === 'csv' ? 'csv' : 'pdf';

    const report = await prisma.report.findFirst({
      where: { schoolId, id: reportId },
      include: {
        snapshots: {
          orderBy: { createdAt: 'desc' },
          take: 1
        }
      }
    });

    if (!report || report.snapshots.length === 0) {
      return res.status(404).json({ success: false, error: "Report not found." });
    }

    // RBAC
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";
    if (isTeacher && report.generatedBy !== req.user!.id) {
      return res.status(403).json({ success: false, error: "Forbidden: Cannot export this report." });
    }

    const reportData = report.snapshots[0].contentJson;

    if (format === 'csv') {
      const csvString = generateCsvString(reportData);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="report_${reportId}.csv"`);
      return res.send(csvString);
    } else {
      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename="report_${reportId}.pdf"`);
      // Pipe PDF directly to response
      generatePdfStream(reportData, res);
    }
  } catch (error) {
    console.error("[REPORTS_API] GET /:id/export error:", error);
    res.status(500).json({ success: false, error: "Failed to export report." });
  }
});
