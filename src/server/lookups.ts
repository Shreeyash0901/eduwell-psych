// src/server/lookups.ts
// Lookup endpoints for filter options (Classes, Sections, Academic Sessions)

import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { requireTenant } from "./middleware/tenant";

export const lookupsRouter = Router();

lookupsRouter.use(requireAuth);
lookupsRouter.use(requireTenant);

/**
 * GET /api/lookups/student-filters
 * Retrieve active classes, sections, and academic sessions for the authenticated school.
 */
lookupsRouter.get("/student-filters", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId; // Derived from verified JWT session
    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";
    
    const classWhere: any = { schoolId, isActive: true };
    const sectionWhere: any = { class: { schoolId }, isActive: true };

    if (isTeacher) {
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

      const directClassIds = classAccesses.map((a) => a.classId);
      const directSectionIds = sectionAccesses.map((a) => a.sectionId);

      if (directClassIds.length === 0 && directSectionIds.length === 0) {
        classWhere.id = { in: [] };
        sectionWhere.id = { in: [] };
      } else {
        const classConditions: any[] = [];
        if (directClassIds.length > 0) {
          classConditions.push({ id: { in: directClassIds } });
        }
        if (directSectionIds.length > 0) {
          classConditions.push({ sections: { some: { id: { in: directSectionIds } } } });
        }
        classWhere.OR = classConditions;

        const sectionConditions: any[] = [];
        if (directSectionIds.length > 0) {
          sectionConditions.push({ id: { in: directSectionIds } });
        }
        if (directClassIds.length > 0) {
          sectionConditions.push({ classId: { in: directClassIds } });
        }
        sectionWhere.OR = sectionConditions;
      }
    }

    const [classes, sections, academicSessions] = await Promise.all([
      prisma.class.findMany({
        where: classWhere,
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.section.findMany({
        where: sectionWhere,
        orderBy: { name: "asc" },
        select: { id: true, name: true, classId: true },
      }),
      prisma.academicSession.findMany({
        where: { schoolId },
        orderBy: { startDate: "desc" },
        select: { id: true, name: true, isCurrent: true },
      }),
    ]);

    return res.json({
      success: true,
      classes,
      sections,
      academicSessions,
    });
  } catch (error) {
    console.error("[LOOKUPS_API] GET /api/lookups/student-filters error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to load student filter lookups.",
    });
  }
});
