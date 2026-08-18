// src/server/lookups.ts
// Lookup endpoints for filter options (Classes, Sections, Academic Sessions)

import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";

export const lookupsRouter = Router();

lookupsRouter.use(requireAuth);

/**
 * GET /api/lookups/student-filters
 * Retrieve active classes, sections, and academic sessions for the authenticated school.
 */
lookupsRouter.get("/student-filters", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId; // Derived from verified JWT session

    const [classes, sections, academicSessions] = await Promise.all([
      prisma.class.findMany({
        where: { schoolId, isActive: true },
        orderBy: { displayOrder: "asc" },
        select: { id: true, name: true },
      }),
      prisma.section.findMany({
        where: { class: { schoolId }, isActive: true },
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
