// src/server/reports.ts
// Protected Reports Management & Export API

import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { requireTenant } from "./middleware/tenant";
import { globalAuditMiddleware } from "./middleware/audit";
import {
  ActorContext,
  authorizeReportAccess,
  getTeacherAccess,
  sanitizeSnapshotJson,
  ReportAccessError,
} from "./services/reportAccess";
import { generateReportData, ReportType } from "./services/reportService";
import { generatePdfStream, generateCsvString } from "./services/exportService";
import { NotificationService } from "./services/notificationService";
import { NotificationType, NotificationPriority } from "../generated/prisma/client";

export const reportsRouter = Router();

// Protect all report endpoints with JWT authentication and school-scope verification
reportsRouter.use(requireAuth);
reportsRouter.use(requireTenant);
reportsRouter.use(globalAuditMiddleware);

function getActor(req: AuthenticatedRequest): ActorContext {
  return {
    id: req.user!.id,
    schoolId: req.user!.schoolId,
    role: req.user!.role,
    name: req.user!.name,
    email: req.user!.email,
  };
}

/**
 * GET /api/reports
 * Paginated, filtered list of reports for the authenticated school.
 * Enforces active role-based scoping (teachers only see reports for currently assigned targets).
 */
reportsRouter.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = getActor(req);
    const isTeacher = actor.role.toUpperCase() === "TEACHER";

    const where: any = { schoolId: actor.schoolId };

    if (isTeacher) {
      const teacherAccess = await getTeacherAccess(actor.id);
      const { classIds, sectionIds } = teacherAccess;

      if (classIds.length === 0 && sectionIds.length === 0) {
        return res.json({ success: true, reports: [] });
      }

      // Teacher is allowed to see reports where:
      // 1. Target student belongs to assigned class or section
      // 2. Target class is assigned to teacher
      // 3. Target section is assigned to teacher (or parent class is assigned)
      const orConditions: any[] = [];

      if (classIds.length > 0) {
        orConditions.push({ classId: { in: classIds } });
        orConditions.push({ student: { classId: { in: classIds } } });
        orConditions.push({ section: { classId: { in: classIds } } });
      }

      if (sectionIds.length > 0) {
        orConditions.push({ sectionId: { in: sectionIds } });
        orConditions.push({ student: { sectionId: { in: sectionIds } } });
      }

      where.AND = [{ OR: orConditions }];
    }

    const reports = await prisma.report.findMany({
      where,
      orderBy: { generatedAt: "desc" },
      include: {
        generator: { select: { name: true, role: true } },
        student: { select: { id: true, studentId: true, fullName: true, classId: true, sectionId: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    return res.json({ success: true, reports });
  } catch (error) {
    console.error("[REPORTS_API] GET / error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch reports." });
  }
});

/**
 * POST /api/reports/generate
 * Trigger report generation for a specific target (STUDENT, CLASS, GRADE).
 */
reportsRouter.post("/generate", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = getActor(req);
    const { reportType, title, studentId, classId, sectionId, academicSessionId } = req.body;

    if (!reportType || !title) {
      return res.status(400).json({ success: false, error: "Missing reportType or title." });
    }

    const parsedStudentId = studentId ? Number(studentId) : undefined;
    const parsedClassId = classId ? Number(classId) : undefined;
    const parsedSectionId = sectionId ? Number(sectionId) : undefined;
    const parsedSessionId = academicSessionId ? Number(academicSessionId) : undefined;

    // Generate the raw data (enforces tenant, role, and teacher target assignment)
    const reportData = await generateReportData({
      actor,
      reportType: reportType as ReportType,
      title: String(title).trim(),
      studentId: parsedStudentId,
      classId: parsedClassId,
      sectionId: parsedSectionId,
      academicSessionId: parsedSessionId,
    });

    const resolvedSessionId =
      (reportData as any).academicSession?.id ??
      (reportData as any).academicSessionId ??
      parsedSessionId;

    // Create Report Header
    const report = await prisma.report.create({
      data: {
        schoolId: actor.schoolId,
        reportType,
        title: String(title).trim(),
        studentId: parsedStudentId,
        classId: parsedClassId,
        sectionId: parsedSectionId,
        academicSessionId: resolvedSessionId,
        generatedBy: actor.id,
        status: "COMPLETED",
      },
      include: {
        generator: { select: { name: true, role: true } },
      },
    });

    if ((reportData as any).schemaVersion === 1 && (reportData as any).report) {
      (reportData as any).report.reportId = report.id;
    }

    // Create Immutable JSON Snapshot
    await prisma.reportSnapshot.create({
      data: {
        reportId: report.id,
        contentJson: reportData as any,
      },
    });

    // Notify Psychologists and Admins
    try {
      const notificationService = new NotificationService(prisma as any);
      const targetUsers = await prisma.user.findMany({
        where: { schoolId: actor.schoolId, role: { in: ["ADMIN", "PSYCHOLOGIST"] } }
      });

      let reportTarget = "School";
      if (parsedStudentId) {
        const s = await prisma.student.findUnique({ where: { id: parsedStudentId }, select: { fullName: true, studentId: true } });
        reportTarget = s?.fullName || s?.studentId || "Student";
      } else if (parsedClassId) {
        reportTarget = "Class";
      }

      for (const target of targetUsers) {
        if (target.id === actor.id) continue;
        
        await notificationService.createNotification({
          schoolId: actor.schoolId,
          userId: target.id,
          type: "SYSTEM",
          priority: "NORMAL",
          title: "New Report Generated",
          message: `${reportType} report '${report.title}' was generated for ${reportTarget}.`,
          entityType: "REPORT",
          entityId: report.id,
          dedupeKey: `report-gen-${report.id}-${target.id}`
        });
      }
    } catch (notifyErr) {
      console.error("Failed to notify users of report generation:", notifyErr);
    }

    return res.status(201).json({ success: true, report, snapshot: reportData });
  } catch (error: any) {
    if (error instanceof ReportAccessError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error("[REPORTS_API] POST /generate error:", error);
    return res.status(500).json({
      success: false,
      error: error.message || "Failed to generate report.",
    });
  }
});

/**
 * GET /api/reports/:id
 * Fetch report metadata and sanitized JSON data for frontend visualization.
 */
reportsRouter.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = getActor(req);
    const reportId = parseInt(req.params.id, 10);

    if (isNaN(reportId) || reportId <= 0) {
      return res.status(400).json({ success: false, error: "Invalid report ID." });
    }

    const report = await prisma.report.findFirst({
      where: { schoolId: actor.schoolId, id: reportId },
      include: {
        snapshots: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
        generator: { select: { name: true, role: true } },
        student: { select: { id: true, studentId: true, fullName: true, classId: true, sectionId: true } },
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    if (!report) {
      return res.status(404).json({ success: false, error: "Report not found." });
    }

    // Authorize access against current permissions
    await authorizeReportAccess(actor, report);

    // Apply role-aware defensive sanitization to historical/stored snapshot content
    const rawSnapshot = report.snapshots[0];
    const sanitizedJson = rawSnapshot
      ? sanitizeSnapshotJson(rawSnapshot.contentJson, actor.role)
      : null;

    const sanitizedReport = {
      ...report,
      snapshots: rawSnapshot
        ? [{ ...rawSnapshot, contentJson: sanitizedJson }]
        : [],
    };

    return res.json({ success: true, report: sanitizedReport });
  } catch (error: any) {
    if (error instanceof ReportAccessError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error("[REPORTS_API] GET /:id error:", error);
    return res.status(500).json({ success: false, error: "Failed to fetch report." });
  }
});

/**
 * GET /api/reports/:id/export?format=pdf|csv
 * Download the report in the specified format with complete security headers and safe projections.
 */
reportsRouter.get("/:id/export", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const actor = getActor(req);
    const reportId = parseInt(req.params.id, 10);
    const format = req.query.format === "csv" ? "csv" : "pdf";

    if (isNaN(reportId) || reportId <= 0) {
      return res.status(400).json({ success: false, error: "Invalid report ID." });
    }

    const report = await prisma.report.findFirst({
      where: { schoolId: actor.schoolId, id: reportId },
      include: {
        snapshots: {
          orderBy: { createdAt: "desc" },
          take: 1,
        },
      },
    });

    if (!report || report.snapshots.length === 0) {
      return res.status(404).json({ success: false, error: "Report not found." });
    }

    // Authorize access against current permissions
    await authorizeReportAccess(actor, report);

    // Apply role-aware defensive sanitization before exporting
    const reportData = sanitizeSnapshotJson(report.snapshots[0].contentJson, actor.role);

    // Apply mandatory security headers
    res.setHeader("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    res.setHeader("Pragma", "no-cache");
    res.setHeader("Expires", "0");
    res.setHeader("X-Content-Type-Options", "nosniff");

    const safeFilename = `report_${reportId}`;

    if (format === "csv") {
      const csvString = generateCsvString(reportData);
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.csv"`);
      return res.send(csvString);
    } else {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${safeFilename}.pdf"`);
      generatePdfStream(reportData, res);
    }
  } catch (error: any) {
    if (error instanceof ReportAccessError) {
      return res.status(error.statusCode).json({ success: false, error: error.message });
    }
    console.error("[REPORTS_API] GET /:id/export error:", error);
    return res.status(500).json({ success: false, error: "Failed to export report." });
  }
});
