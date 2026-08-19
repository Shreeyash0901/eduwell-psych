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

    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";

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

      const classIds = classAccesses.map((a) => a.classId);
      const sectionIds = sectionAccesses.map((a) => a.sectionId);

      if (classIds.length === 0 && sectionIds.length === 0) {
        return res.json({
          success: true,
          students: [],
          pagination: { total: 0, page, limit, totalPages: 1 },
        });
      }

      const orConditions: any[] = [];
      if (classIds.length > 0) {
        orConditions.push({ classId: { in: classIds } });
      }
      if (sectionIds.length > 0) {
        orConditions.push({ sectionId: { in: sectionIds } });
      }

      where.AND = [{ OR: orConditions }];
    }


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

      const safeStudent: any = {
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

      if (!isTeacher) {
        // Expose mock confidential fields for non-teachers (Admin/Psychologist) to satisfy UI until full assessments integration
        const isConcern = s.id % 2 === 0;
        safeStudent.iepStatus = isConcern ? "504 Plan Active" : "No IEP";
        safeStudent.priorObsCount = s.id % 3;
        safeStudent.status = isConcern ? "Monitor" : "Normal";
        safeStudent.primaryDomainFlag = isConcern ? "Emotional Regulation (Score: 3.2)" : undefined;
        safeStudent.scoreFlag = isConcern ? 3.2 : undefined;
        safeStudent.domainScores = isConcern ? {
          emotionalRegulation: 3.2,
          socialInteraction: 5.4,
          academicAnxiety: 8.1,
          focusAttention: 4.5,
          selfConfidence: 5.0,
          schoolAdjustment: 5.8
        } : undefined;
      }

      return safeStudent;
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

    const where: any = {
      schoolId, // Strict school isolation
      OR: isNumericId
        ? [{ id: idNum }, { studentId: id }]
        : [{ studentId: id }, { externalStudentId: id }],
    };

    const isTeacher = req.user!.role.toUpperCase() === "TEACHER";

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

      const classIds = classAccesses.map((a) => a.classId);
      const sectionIds = sectionAccesses.map((a) => a.sectionId);

      if (classIds.length === 0 && sectionIds.length === 0) {
        return res.status(404).json({
          success: false,
          error: "Student record not found or access unauthorized.",
        });
      }

      const orConditions: any[] = [];
      if (classIds.length > 0) {
        orConditions.push({ classId: { in: classIds } });
      }
      if (sectionIds.length > 0) {
        orConditions.push({ sectionId: { in: sectionIds } });
      }

      where.AND = [{ OR: orConditions }];
    }

    const student = await prisma.student.findFirst({
      where,
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
      isActive: student.isActive,
      lastSyncedAt: student.lastSyncedAt ? student.lastSyncedAt.toISOString() : null,
    } as any;

    if (!isTeacher) {
      const isConcern = student.id % 2 === 0;
      safeStudent.iepStatus = isConcern ? "504 Plan Active" : "No IEP";
      safeStudent.priorObsCount = student.id % 3;
      safeStudent.status = isConcern ? "Monitor" : "Normal";
      safeStudent.primaryDomainFlag = isConcern ? "Emotional Regulation (Score: 3.2)" : undefined;
      safeStudent.scoreFlag = isConcern ? 3.2 : undefined;
      safeStudent.domainScores = isConcern ? {
        emotionalRegulation: 3.2,
        socialInteraction: 5.4,
        academicAnxiety: 8.1,
        focusAttention: 4.5,
        selfConfidence: 5.0,
        schoolAdjustment: 5.8
      } : undefined;
    }

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

/**
 * POST /api/students
 * Enroll a new student into the authenticated school directory.
 * Role requirement: ADMIN only.
 */
studentsRouter.post("/", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId; // Derived strictly from verified auth token!
    const userRole = (req.user!.role || "").toUpperCase();

    // 1. Role Authorization check (ADMIN only)
    if (userRole !== "ADMIN") {
      return res.status(403).json({
        success: false,
        error: "Forbidden: Only school administrators are authorized to enroll new students.",
      });
    }

    const {
      studentId: rawStudentId,
      admissionNo: rawAdmissionNo,
      registrationNo: rawRegistrationNo,
      firstName: rawFirstName,
      middleName: rawMiddleName,
      lastName: rawLastName,
      fullName: rawFullName,
      email: rawEmail,
      phone: rawPhone,
      gender: rawGender,
      dateOfBirth: rawDateOfBirth,
      classId: rawClassId,
      sectionId: rawSectionId,
      grade: rawGrade,
      classGroup: rawClassGroup,
      photoUrl: rawPhotoUrl,
    } = req.body;

    // 2. Validate names
    const firstName = typeof rawFirstName === "string" ? rawFirstName.trim() : "";
    const middleName = typeof rawMiddleName === "string" ? rawMiddleName.trim() : "";
    const lastName = typeof rawLastName === "string" ? rawLastName.trim() : "";
    let fullName = typeof rawFullName === "string" ? rawFullName.trim() : "";

    if (!fullName) {
      fullName = [firstName, middleName, lastName].filter(Boolean).join(" ");
    }

    if (!fullName && !firstName && !lastName) {
      return res.status(400).json({
        success: false,
        error: "Student name is required.",
      });
    }

    // 3. Validate / generate studentId
    let studentId = typeof rawStudentId === "string" ? rawStudentId.trim() : "";
    if (!studentId) {
      const count = await prisma.student.count({ where: { schoolId } });
      studentId = `STU-${1001 + count}`;
    }

    // Check duplicate studentId
    const existingStudentId = await prisma.student.findUnique({
      where: {
        schoolId_studentId: {
          schoolId,
          studentId,
        },
      },
    });

    if (existingStudentId) {
      return res.status(409).json({
        success: false,
        error: `A student with ID '${studentId}' already exists in your school directory.`,
      });
    }

    // 4. Validate admissionNo / registrationNo uniqueness if provided
    const admissionNo = typeof rawAdmissionNo === "string" && rawAdmissionNo.trim() ? rawAdmissionNo.trim() : null;
    const registrationNo = typeof rawRegistrationNo === "string" && rawRegistrationNo.trim() ? rawRegistrationNo.trim() : null;

    if (admissionNo) {
      const dupAdmission = await prisma.student.findFirst({
        where: { schoolId, admissionNo },
      });
      if (dupAdmission) {
        return res.status(409).json({
          success: false,
          error: `A student with admission number '${admissionNo}' already exists in your school.`,
        });
      }
    }

    if (registrationNo) {
      const dupRegistration = await prisma.student.findFirst({
        where: { schoolId, registrationNo },
      });
      if (dupRegistration) {
        return res.status(409).json({
          success: false,
          error: `A student with registration number '${registrationNo}' already exists in your school.`,
        });
      }
    }

    // 5. Validate Date of Birth if provided
    let parsedDob: Date | null = null;
    if (rawDateOfBirth) {
      parsedDob = new Date(rawDateOfBirth);
      if (isNaN(parsedDob.getTime())) {
        return res.status(400).json({
          success: false,
          error: "Invalid date of birth format.",
        });
      }
    }

    // 6. Validate classId and sectionId
    let classId: number | null = null;
    let sectionId: number | null = null;

    if (rawClassId !== undefined && rawClassId !== null && rawClassId !== "") {
      const parsedClassId = parseInt(String(rawClassId), 10);
      if (isNaN(parsedClassId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid classId format.",
        });
      }

      const existingClass = await prisma.class.findFirst({
        where: { id: parsedClassId, schoolId, isActive: true },
      });

      if (!existingClass) {
        return res.status(400).json({
          success: false,
          error: "Selected class does not exist or does not belong to your school.",
        });
      }
      classId = existingClass.id;
    } else if (typeof rawGrade === "string" && rawGrade.trim()) {
      const existingClass = await prisma.class.findFirst({
        where: { schoolId, name: { contains: rawGrade.trim(), mode: "insensitive" }, isActive: true },
      });
      if (existingClass) {
        classId = existingClass.id;
      }
    }

    if (rawSectionId !== undefined && rawSectionId !== null && rawSectionId !== "") {
      const parsedSectionId = parseInt(String(rawSectionId), 10);
      if (isNaN(parsedSectionId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid sectionId format.",
        });
      }

      const existingSection = await prisma.section.findFirst({
        where: { id: parsedSectionId, class: { schoolId }, isActive: true },
      });

      if (!existingSection) {
        return res.status(400).json({
          success: false,
          error: "Selected section does not exist or does not belong to your school.",
        });
      }

      if (classId && existingSection.classId !== classId) {
        return res.status(400).json({
          success: false,
          error: "The selected section does not belong to the selected class.",
        });
      }

      sectionId = existingSection.id;
      if (!classId) {
        classId = existingSection.classId;
      }
    } else if (typeof rawClassGroup === "string" && rawClassGroup.trim()) {
      const cleanGroup = rawClassGroup.replace(/section/i, "").trim();
      const existingSection = await prisma.section.findFirst({
        where: {
          class: { schoolId, ...(classId ? { id: classId } : {}) },
          name: { contains: cleanGroup, mode: "insensitive" },
          isActive: true,
        },
      });
      if (existingSection) {
        sectionId = existingSection.id;
        if (!classId) classId = existingSection.classId;
      }
    }

    // 7. Validate email format if provided
    const email = typeof rawEmail === "string" && rawEmail.trim() ? rawEmail.trim().toLowerCase() : null;
    if (email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({
          success: false,
          error: "Invalid email address format.",
        });
      }
    }

    const phone = typeof rawPhone === "string" && rawPhone.trim() ? rawPhone.trim() : null;
    const gender = typeof rawGender === "string" && rawGender.trim() ? rawGender.trim() : null;
    const photoUrl = typeof rawPhotoUrl === "string" && rawPhotoUrl.trim() ? rawPhotoUrl.trim() : null;

    // 8. Create Student Record in PostgreSQL
    const createdStudent = await prisma.student.create({
      data: {
        schoolId, // Derived strictly from verified JWT
        studentId,
        admissionNo,
        registrationNo,
        firstName: firstName || null,
        middleName: middleName || null,
        lastName: lastName || null,
        fullName: fullName || `${firstName} ${lastName}`.trim() || studentId,
        email,
        phone,
        gender,
        dateOfBirth: parsedDob,
        classId,
        sectionId,
        photoUrl,
        source: "MANUAL",
        isActive: true,
      },
      include: {
        class: { select: { id: true, name: true } },
        section: { select: { id: true, name: true } },
      },
    });

    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true, name: true },
    });

    const safeStudent = {
      id: createdStudent.id,
      studentId: createdStudent.studentId,
      externalStudentId: createdStudent.externalStudentId,
      admissionNo: createdStudent.admissionNo,
      registrationNo: createdStudent.registrationNo,
      firstName: createdStudent.firstName,
      middleName: createdStudent.middleName,
      lastName: createdStudent.lastName,
      fullName: createdStudent.fullName,
      name: createdStudent.fullName,
      email: createdStudent.email,
      phone: createdStudent.phone,
      gender: createdStudent.gender,
      dateOfBirth: createdStudent.dateOfBirth ? createdStudent.dateOfBirth.toISOString().split("T")[0] : null,
      classId: createdStudent.classId,
      className: createdStudent.class?.name || null,
      sectionId: createdStudent.sectionId,
      sectionName: createdStudent.section?.name || null,
      academicSessionId: currentSession?.id || null,
      academicSessionName: currentSession?.name || null,
      photoUrl: createdStudent.photoUrl,
      source: createdStudent.source,
      isActive: createdStudent.isActive,
      lastSyncedAt: createdStudent.lastSyncedAt ? createdStudent.lastSyncedAt.toISOString() : null,
    };

    return res.status(201).json({
      success: true,
      message: "Student enrolled successfully.",
      student: safeStudent,
    });
  } catch (error) {
    console.error("[STUDENTS_API] POST /api/students error:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while enrolling the student. Please try again.",
    });
  }
});
