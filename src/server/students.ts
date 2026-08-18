// src/server/students.ts
// Protected Student Management API routes for EduWell Psych

import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";

export const studentsRouter = Router();

// Protect all student endpoints with JWT authentication
studentsRouter.use(requireAuth);

/**
 * GET /api/students
 * Paginated, filtered list of students for the authenticated school.
 * Query Parameters:
 *   - search: string (matches fullName, studentId, admissionNo, registrationNo, email, firstName, lastName)
 *   - classId: number
 *   - sectionId: number
 *   - academicSessionId: number
 *   - isActive: string ("true" | "false" | "all")
 *   - page: number (default 1)
 *   - limit: number (default 10, max 100)
 */
studentsRouter.get("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId; // Derived strictly from verified auth token!

    // Parse and validate query parameters
    const search = typeof req.query.search === "string" ? req.query.search.trim() : "";
    const classIdParam = req.query.classId ? parseInt(String(req.query.classId), 10) : undefined;
    const sectionIdParam = req.query.sectionId ? parseInt(String(req.query.sectionId), 10) : undefined;
    const isActiveParam = req.query.isActive;
    const pageParam = req.query.page ? parseInt(String(req.query.page), 10) : 1;
    const limitParam = req.query.limit ? parseInt(String(req.query.limit), 10) : 10;

    const page = Number.isInteger(pageParam) && pageParam > 0 ? pageParam : 1;
    const limit = Number.isInteger(limitParam) && limitParam > 0 && limitParam <= 100 ? limitParam : 10;
    const skip = (page - 1) * limit;

    // Strict multi-tenant isolation by schoolId
    const where: any = {
      schoolId,
    };

    if (classIdParam && !isNaN(classIdParam) && classIdParam > 0) {
      where.classId = classIdParam;
    }

    if (sectionIdParam && !isNaN(sectionIdParam) && sectionIdParam > 0) {
      where.sectionId = sectionIdParam;
    }

    if (isActiveParam !== undefined && isActiveParam !== "all" && isActiveParam !== "") {
      where.isActive = isActiveParam === "true";
    }

    if (search) {
      where.OR = [
        { fullName: { contains: search, mode: "insensitive" } },
        { studentId: { contains: search, mode: "insensitive" } },
        { firstName: { contains: search, mode: "insensitive" } },
        { lastName: { contains: search, mode: "insensitive" } },
        { admissionNo: { contains: search, mode: "insensitive" } },
        { registrationNo: { contains: search, mode: "insensitive" } },
        { email: { contains: search, mode: "insensitive" } },
      ];
    }

    // Retrieve current academic session for display context
    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true, name: true },
    });

    // Execute paginated queries
    const [total, students] = await Promise.all([
      prisma.student.count({ where }),
      prisma.student.findMany({
        where,
        include: {
          class: { select: { id: true, name: true } },
          section: { select: { id: true, name: true } },
        },
        orderBy: { id: "asc" },
        skip,
        take: limit,
      }),
    ]);

    // Map safe fields only (never expose internal or private observation notes)
    const safeStudents = students.map((s) => {
      const computedFullName =
        s.fullName ||
        [s.firstName, s.middleName, s.lastName].filter(Boolean).join(" ") ||
        s.studentId;

      return {
        id: s.id,
        studentId: s.studentId,
        externalStudentId: s.externalStudentId,
        admissionNo: s.admissionNo,
        registrationNo: s.registrationNo,
        firstName: s.firstName,
        middleName: s.middleName,
        lastName: s.lastName,
        fullName: computedFullName,
        name: computedFullName,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        dateOfBirth: s.dateOfBirth ? s.dateOfBirth.toISOString().split("T")[0] : null,
        classId: s.classId,
        className: s.class?.name || null,
        sectionId: s.sectionId,
        sectionName: s.section?.name || null,
        academicSessionId: currentSession?.id || null,
        academicSessionName: currentSession?.name || null,
        photoUrl: s.photoUrl,
        source: s.source,
        isActive: s.isActive,
        lastSyncedAt: s.lastSyncedAt ? s.lastSyncedAt.toISOString() : null,
      };
    });

    const totalPages = Math.ceil(total / limit) || 1;

    return res.json({
      success: true,
      students: safeStudents,
      pagination: {
        total,
        page,
        limit,
        totalPages,
      },
    });
  } catch (error) {
    console.error("[STUDENTS_API] GET /api/students error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch student roster.",
    });
  }
});

/**
 * GET /api/students/:id
 * Retrieve safe profile details for a single student belonging to the authenticated school.
 */
studentsRouter.get("/:id", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { id } = req.params;

    const idNum = parseInt(id, 10);
    const isNumericId = !isNaN(idNum) && String(idNum) === id;

    const student = await prisma.student.findFirst({
      where: {
        schoolId, // Strict school isolation
        OR: isNumericId
          ? [{ id: idNum }, { studentId: id }]
          : [{ studentId: id }, { externalStudentId: id }],
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    if (!student) {
      return res.status(404).json({
        success: false,
        error: "Student record not found or access unauthorized.",
      });
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true, name: true },
    });

    const computedFullName =
      student.fullName ||
      [student.firstName, student.middleName, student.lastName].filter(Boolean).join(" ") ||
      student.studentId;

    const safeStudent = {
      id: student.id,
      studentId: student.studentId,
      externalStudentId: student.externalStudentId,
      admissionNo: student.admissionNo,
      registrationNo: student.registrationNo,
      firstName: student.firstName,
      middleName: student.middleName,
      lastName: student.lastName,
      fullName: computedFullName,
      name: computedFullName,
      email: student.email,
      phone: student.phone,
      gender: student.gender,
      dateOfBirth: student.dateOfBirth ? student.dateOfBirth.toISOString().split("T")[0] : null,
      classId: student.classId,
      className: student.class?.name || null,
      sectionId: student.sectionId,
      sectionName: student.section?.name || null,
      academicSessionId: currentSession?.id || null,
      academicSessionName: currentSession?.name || null,
      photoUrl: student.photoUrl,
      source: student.source,
      isActive: student.isActive,
      lastSyncedAt: student.lastSyncedAt ? student.lastSyncedAt.toISOString() : null,
    };

    return res.json({
      success: true,
      student: safeStudent,
    });
  } catch (error) {
    console.error("[STUDENTS_API] GET /api/students/:id error:", error);
    return res.status(500).json({
      success: false,
      error: "Failed to fetch student details.",
    });
  }
});
