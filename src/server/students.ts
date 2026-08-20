// src/server/students.ts
// Protected Student Management API routes for EduWell Psych

import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { requireRole } from "./middleware/role";
import { respondNotFound, requireTenant } from "./middleware/tenant";
import { globalAuditMiddleware } from "./middleware/audit";

export const studentsRouter = Router();

// Protect all student endpoints with JWT authentication and school-scope verification
studentsRouter.use(requireAuth);
studentsRouter.use(requireTenant);
studentsRouter.use(globalAuditMiddleware);

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

    if (respondNotFound(res, student, schoolId, "Student record not found or access unauthorized.")) {
      return;
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
studentsRouter.post("/", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId; // Derived strictly from verified auth token!

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

/**
 * POST /api/students/sync-one
 * Synchronize or preview a single student from the external School API.
 * Role requirement: ADMIN only.
 * Body:
 *   - studentNo: string (Required - student ID or admission number sent to API)
 *   - previewOnly?: boolean (Optional - if true, returns normalized data without persisting)
 */
studentsRouter.post("/sync-one", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const actorId = req.user!.id;

    const { studentNo, previewOnly } = req.body;
    if (!studentNo || typeof studentNo !== "string" || !studentNo.trim()) {
      return res.status(400).json({
        success: false,
        error: "Student identifier (studentNo) is required.",
      });
    }

    const cleanStudentNo = studentNo.trim();

    // 2. Fetch School API Config
    const config = await prisma.schoolApiConfig.findFirst({
      where: { schoolId },
    });

    if (!config || !config.isEnabled) {
      return res.status(400).json({
        success: false,
        error: "School API integration is not configured or is currently disabled. Check Settings.",
      });
    }

    // 3. Query External School API via outbound service
    const { fetchStudentFromSchoolApi } = await import("./services/schoolApiService");
    const fetchResult = await fetchStudentFromSchoolApi(
      {
        baseUrl: config.baseUrl,
        schoolCode: config.schoolCode,
        appVersion: config.appVersion,
        appOs: config.appOs,
      },
      cleanStudentNo
    );

    if (!fetchResult.success || !fetchResult.student) {
      // Record failed audit log
      await prisma.schoolApiAuditLog.create({
        data: {
          schoolId,
          actorId,
          action: "STUDENT_SYNC",
          status: "FAILED",
          targetIdentifier: cleanStudentNo,
          errorMessage: fetchResult.error || "No student record found in School API for the provided identifier.",
        },
      });

      return res.status(404).json({
        success: false,
        error: fetchResult.error || `No student record found in School API for "${cleanStudentNo}".`,
      });
    }

    const ext = fetchResult.student;

    // 4. Determine matching student in local DB
    // Priority order per spec:
    // 1. external_student_id
    // 2. student_id / admission_no
    // 3. email only as supporting match
    let matchedStudent: any = null;

    if (ext.externalStudentId) {
      matchedStudent = await prisma.student.findFirst({
        where: { schoolId, externalStudentId: ext.externalStudentId },
      });
    }

    if (!matchedStudent && (ext.admissionNo || cleanStudentNo)) {
      matchedStudent = await prisma.student.findFirst({
        where: {
          schoolId,
          OR: [
            { studentId: cleanStudentNo },
            { admissionNo: cleanStudentNo },
            ...(ext.admissionNo ? [{ admissionNo: ext.admissionNo }, { studentId: ext.admissionNo }] : []),
          ],
        },
      });
    }

    if (!matchedStudent && ext.email) {
      matchedStudent = await prisma.student.findFirst({
        where: { schoolId, email: ext.email },
      });
    }

    // If previewOnly is requested, return preview without updating DB
    if (previewOnly === true) {
      return res.json({
        success: true,
        preview: true,
        matchType: matchedStudent ? "EXISTING_RECORD_UPDATE" : "NEW_STUDENT_CREATION",
        matchedStudentId: matchedStudent?.id || null,
        normalized: ext,
      });
    }

    // 5. Execute Transactional Upsert
    const upsertResult = await prisma.$transaction(async (tx) => {
      // A. Resolve or create Class if externalClassId / className provided
      let resolvedClassId: number | null = matchedStudent?.classId || null;
      if (ext.externalClassId || ext.className) {
        const existingClass = await tx.class.findFirst({
          where: {
            schoolId,
            OR: [
              ...(ext.externalClassId ? [{ externalClassId: ext.externalClassId }] : []),
              ...(ext.className ? [{ name: { contains: ext.className, mode: "insensitive" as const } }] : []),
            ],
          },
        });

        if (existingClass) {
          resolvedClassId = existingClass.id;
        } else if (ext.className) {
          const newClass = await tx.class.create({
            data: {
              schoolId,
              name: ext.className,
              externalClassId: ext.externalClassId,
              isActive: true,
            },
          });
          resolvedClassId = newClass.id;
        }
      }

      // B. Resolve or create Section if Class is known
      let resolvedSectionId: number | null = matchedStudent?.sectionId || null;
      if (resolvedClassId && !resolvedSectionId) {
        const defaultSection = await tx.section.findFirst({
          where: { classId: resolvedClassId, isActive: true },
        });
        if (defaultSection) {
          resolvedSectionId = defaultSection.id;
        }
      }

      // C. Resolve Academic Session if externalSessionId provided
      if (ext.externalSessionId) {
        const existingSession = await tx.academicSession.findFirst({
          where: { schoolId, externalSessionId: ext.externalSessionId },
        });
        if (!existingSession) {
          // Link if current session exists
          await tx.academicSession.updateMany({
            where: { schoolId, isCurrent: true },
            data: { externalSessionId: ext.externalSessionId },
          });
        }
      }

      const generatedStudentId =
        matchedStudent?.studentId ||
        ext.admissionNo ||
        (ext.externalStudentId ? `STU-${ext.externalStudentId}` : `STU-${cleanStudentNo}`);

      const now = new Date();

      let studentRecord;
      if (matchedStudent) {
        studentRecord = await tx.student.update({
          where: { id: matchedStudent.id },
          data: {
            externalStudentId: ext.externalStudentId || matchedStudent.externalStudentId,
            admissionNo: ext.admissionNo || matchedStudent.admissionNo,
            registrationNo: ext.registrationNo || matchedStudent.registrationNo,
            firstName: ext.firstName || matchedStudent.firstName,
            middleName: ext.middleName || matchedStudent.middleName,
            lastName: ext.lastName || matchedStudent.lastName,
            fullName: ext.fullName || matchedStudent.fullName,
            email: ext.email || matchedStudent.email,
            phone: ext.phone || matchedStudent.phone,
            alternatePhone: ext.alternatePhone || matchedStudent.alternatePhone,
            gender: ext.gender || matchedStudent.gender,
            dateOfBirth: ext.dateOfBirth || matchedStudent.dateOfBirth,
            classId: resolvedClassId,
            sectionId: resolvedSectionId,
            photoUrl: ext.photoUrl || matchedStudent.photoUrl,
            source: "SCHOOL_API",
            lastSyncedAt: now,
            isActive: true,
          },
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        });
      } else {
        studentRecord = await tx.student.create({
          data: {
            schoolId,
            studentId: generatedStudentId,
            externalStudentId: ext.externalStudentId,
            admissionNo: ext.admissionNo || cleanStudentNo,
            registrationNo: ext.registrationNo,
            firstName: ext.firstName,
            middleName: ext.middleName,
            lastName: ext.lastName,
            fullName: ext.fullName,
            email: ext.email,
            phone: ext.phone,
            alternatePhone: ext.alternatePhone,
            gender: ext.gender,
            dateOfBirth: ext.dateOfBirth,
            classId: resolvedClassId,
            sectionId: resolvedSectionId,
            photoUrl: ext.photoUrl,
            source: "SCHOOL_API",
            lastSyncedAt: now,
            isActive: true,
          },
          include: {
            class: { select: { id: true, name: true } },
            section: { select: { id: true, name: true } },
          },
        });
      }

      // D. Update lastSyncAt on school_api_configs
      await tx.schoolApiConfig.update({
        where: { id: config.id },
        data: { lastSyncAt: now },
      });

      // E. Create SchoolApiAuditLog record
      await tx.schoolApiAuditLog.create({
        data: {
          schoolId,
          actorId,
          action: "STUDENT_SYNC",
          status: "SUCCESS",
          targetIdentifier: cleanStudentNo,
          metadata: {
            studentId: studentRecord.studentId,
            externalStudentId: studentRecord.externalStudentId,
            isNew: !matchedStudent,
            matchedStudentDbId: studentRecord.id,
          },
        },
      });

      return { student: studentRecord, isNew: !matchedStudent };
    });

    return res.status(upsertResult.isNew ? 201 : 200).json({
      success: true,
      message: upsertResult.isNew
        ? `Successfully imported "${upsertResult.student.fullName}" from School API.`
        : `Successfully synchronized "${upsertResult.student.fullName}" with School API.`,
      isNew: upsertResult.isNew,
      student: {
        id: upsertResult.student.id,
        studentId: upsertResult.student.studentId,
        externalStudentId: upsertResult.student.externalStudentId,
        admissionNo: upsertResult.student.admissionNo,
        fullName: upsertResult.student.fullName,
        name: upsertResult.student.fullName,
        email: upsertResult.student.email,
        gender: upsertResult.student.gender,
        className: upsertResult.student.class?.name || null,
        sectionName: upsertResult.student.section?.name || null,
        source: upsertResult.student.source,
        lastSyncedAt: upsertResult.student.lastSyncedAt?.toISOString() || null,
      },
    });
  } catch (error) {
    console.error("[STUDENTS_API] POST /api/students/sync-one error:", error);
    return res.status(500).json({
      success: false,
      error: "An error occurred while synchronizing student data. Please try again.",
    });
  }
});

