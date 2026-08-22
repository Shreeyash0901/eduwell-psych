// src/server/settings.ts
// Protected School Settings router for EduWell Psych.
//
// Covers:
//   - School Profile (schools + school_settings) read/update
//   - Real user list for Users & Roles / Teacher Access (ADMIN only)
//
// RBAC:
//   - GET  /api/settings/school-profile  — any authenticated user of the school
//   - PUT  /api/settings/school-profile  — ADMIN only
//   - GET  /api/settings/users           — ADMIN only
//
// Tenant isolation:
//   - schoolId is ALWAYS derived from req.user.schoolId (verified JWT).
//   - schoolId / code / status are never accepted from the request body.

import { Router, Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "node:crypto";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { requireRole } from "./middleware/role";
import { requireTenant } from "./middleware/tenant";
import { globalAuditMiddleware } from "./middleware/audit";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);
settingsRouter.use(requireTenant);
settingsRouter.use(globalAuditMiddleware);

// Allow-list of updatable School profile fields.
const SCHOOL_PROFILE_FIELDS = [
  "name",
  "addressLine1",
  "addressLine2",
  "city",
  "state",
  "postalCode",
  "country",
  "phone",
  "website",
  "logoUrl",
] as const;

// Allow-list of updatable SchoolSettings fields.
const SCHOOL_SETTINGS_FIELDS = [
  "defaultGradingSystem",
  "anonymizeExports",
  "require2FA",
  "timezone",
  "locale",
] as const;

function safeString(value: unknown, maxLength: number): string | null {
  if (value === undefined || value === null) return null;
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  return trimmed.slice(0, maxLength);
}

function safeSchoolSettings(settings: {
  defaultGradingSystem: string | null;
  anonymizeExports: boolean;
  require2FA: boolean;
  timezone: string;
  locale: string;
}) {
  return {
    defaultGradingSystem: settings.defaultGradingSystem,
    anonymizeExports: settings.anonymizeExports,
    require2FA: settings.require2FA,
    timezone: settings.timezone,
    locale: settings.locale,
  };
}

/**
 * GET /api/settings/school-profile
 * Returns the authenticated school's profile, general settings, and the current
 * academic session. Any authenticated user of the school may read these values.
 */
settingsRouter.get("/school-profile", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;

    const school = await prisma.school.findUnique({ where: { id: schoolId } });
    if (!school) {
      return res.status(404).json({ success: false, error: "School profile not found." });
    }

    // Auto-create default settings row if absent (mirrors schoolApi config behavior).
    let settings = await prisma.schoolSettings.findUnique({ where: { schoolId } });
    if (!settings) {
      settings = await prisma.schoolSettings.create({ data: { schoolId } });
    }

    const currentSession = await prisma.academicSession.findFirst({
      where: { schoolId, isCurrent: true },
      select: { id: true, name: true },
      orderBy: { startDate: "desc" },
    });

    return res.json({
      success: true,
      school: {
        id: school.id,
        name: school.name,
        code: school.code,
        status: school.status,
        addressLine1: school.addressLine1,
        addressLine2: school.addressLine2,
        city: school.city,
        state: school.state,
        postalCode: school.postalCode,
        country: school.country,
        phone: school.phone,
        website: school.website,
        logoUrl: school.logoUrl,
      },
      settings: safeSchoolSettings(settings),
      currentAcademicSession: currentSession ? { id: currentSession.id, name: currentSession.name } : null,
    });
  } catch (error) {
    console.error("[SETTINGS] GET /school-profile error:", error);
    return res.status(500).json({ success: false, error: "Failed to load school profile." });
  }
});

/**
 * PUT /api/settings/school-profile
 * Updates the authenticated school's profile and general settings (ADMIN only).
 * Only allow-listed fields are accepted; tenant identity always comes from the JWT.
 */
settingsRouter.put("/school-profile", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;

    const body = req.body ?? {};
    const schoolData: Record<string, unknown> = {};
    const settingsData: Record<string, unknown> = {};

    // School profile fields
    if (body.name !== undefined) {
      const name = safeString(body.name, 255);
      if (!name) {
        return res.status(400).json({ success: false, error: "School name is required and must be non-empty." });
      }
      schoolData.name = name;
    }
    for (const field of SCHOOL_PROFILE_FIELDS) {
      if (field === "name") continue;
      if (body[field] !== undefined) {
        schoolData[field] = safeString(body[field], 500);
      }
    }

    // School settings fields
    if (body.defaultGradingSystem !== undefined) {
      settingsData.defaultGradingSystem = safeString(body.defaultGradingSystem, 50);
    }
    if (body.anonymizeExports !== undefined) {
      settingsData.anonymizeExports = Boolean(body.anonymizeExports);
    }
    if (body.require2FA !== undefined) {
      settingsData.require2FA = Boolean(body.require2FA);
    }
    if (body.timezone !== undefined) {
      const tz = safeString(body.timezone, 50);
      if (!tz) {
        return res.status(400).json({ success: false, error: "Timezone must be a non-empty IANA timezone name." });
      }
      settingsData.timezone = tz;
    }
    if (body.locale !== undefined) {
      const locale = safeString(body.locale, 10);
      if (!locale) {
        return res.status(400).json({ success: false, error: "Locale must be a non-empty BCP-47 locale tag." });
      }
      settingsData.locale = locale;
    }

    // Reject attempts to change tenant identity or protected columns.
    for (const forbidden of ["schoolId", "code", "status", "id", "createdAt", "updatedAt"]) {
      if (body[forbidden] !== undefined) {
        return res.status(400).json({ success: false, error: `Field "${forbidden}" cannot be modified.` });
      }
    }

    const updatedSchool = await prisma.school.update({
      where: { id: schoolId },
      data: schoolData,
    });

    const updatedSettings = await prisma.schoolSettings.upsert({
      where: { schoolId },
      update: settingsData,
      create: { schoolId, ...settingsData },
    });

    return res.json({
      success: true,
      message: "School profile updated successfully.",
      school: {
        id: updatedSchool.id,
        name: updatedSchool.name,
        code: updatedSchool.code,
        status: updatedSchool.status,
        addressLine1: updatedSchool.addressLine1,
        addressLine2: updatedSchool.addressLine2,
        city: updatedSchool.city,
        state: updatedSchool.state,
        postalCode: updatedSchool.postalCode,
        country: updatedSchool.country,
        phone: updatedSchool.phone,
        website: updatedSchool.website,
        logoUrl: updatedSchool.logoUrl,
      },
      settings: safeSchoolSettings(updatedSettings),
    });
  } catch (error) {
    console.error("[SETTINGS] PUT /school-profile error:", error);
    return res.status(500).json({ success: false, error: "Failed to update school profile." });
  }
});

/**
 * GET /api/settings/users
 * Lists real user records for the authenticated school (ADMIN only).
 * Never returns passwordHash, googleId, or any student-sensitive information.
 * Includes teacher class/section access scopes for the Users & Roles / Teacher Access UI.
 */
settingsRouter.get("/users", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;

    const users = await prisma.user.findMany({
      where: { schoolId },
      orderBy: [{ role: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        status: true,
        createdAt: true,
        teacherClassAccesses: {
          select: { class: { select: { id: true, name: true } } },
        },
        teacherSectionAccesses: {
          select: { section: { select: { id: true, name: true, classId: true, class: { select: { name: true } } } } },
        },
      },
    });

    return res.json({
      success: true,
      users: users.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        status: u.status,
        createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
        classIds: u.teacherClassAccesses.map((a) => a.class.id),
        classAccess: u.teacherClassAccesses.map((a) => a.class.name),
        sectionIds: u.teacherSectionAccesses.map((a) => a.section.id),
        sectionAccess: u.teacherSectionAccesses.map((a) => ({
          id: a.section.id,
          classId: a.section.classId,
          className: a.section.class.name,
          sectionName: a.section.name,
        })),
      })),
    });
  } catch (error) {
    console.error("[SETTINGS] GET /users error:", error);
    return res.status(500).json({ success: false, error: "Failed to load users." });
  }
});

/**
 * PUT /api/settings/users/:userId/class-access
 * Principal assigns specific classes and sections to a Teacher.
 */
settingsRouter.put("/users/:userId/class-access", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const targetUserId = parseInt(req.params.userId, 10);
    const { classIds = [], sectionIds = [] } = req.body;

    if (isNaN(targetUserId)) {
      return res.status(400).json({ success: false, error: "Invalid user ID." });
    }

    // Verify user belongs to same school and is a TEACHER
    const targetUser = await prisma.user.findFirst({
      where: { id: targetUserId, schoolId },
    });

    if (!targetUser) {
      return res.status(404).json({ success: false, error: "Teacher not found in your school." });
    }

    if (targetUser.role.toUpperCase() !== "TEACHER") {
      return res.status(400).json({ success: false, error: "Class access can only be assigned to Teachers." });
    }

    // Validate classIds belong to the same school
    const parsedClassIds = Array.isArray(classIds)
      ? classIds.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id))
      : [];

    const validClasses = await prisma.class.findMany({
      where: { id: { in: parsedClassIds }, schoolId },
      select: { id: true },
    });
    const validClassIds = validClasses.map((c) => c.id);

    // Validate sectionIds belong to classes of the same school
    const parsedSectionIds = Array.isArray(sectionIds)
      ? sectionIds.map((id: any) => parseInt(id, 10)).filter((id: number) => !isNaN(id))
      : [];

    const validSections = await prisma.section.findMany({
      where: { id: { in: parsedSectionIds }, class: { schoolId } },
      select: { id: true },
    });
    const validSectionIds = validSections.map((s) => s.id);

    // Execute atomic update of teacher class and section access
    await prisma.$transaction([
      prisma.teacherClassAccess.deleteMany({ where: { userId: targetUserId } }),
      prisma.teacherSectionAccess.deleteMany({ where: { userId: targetUserId } }),
      ...(validClassIds.length > 0
        ? [
            prisma.teacherClassAccess.createMany({
              data: validClassIds.map((classId) => ({
                userId: targetUserId,
                classId,
              })),
            }),
          ]
        : []),
      ...(validSectionIds.length > 0
        ? [
            prisma.teacherSectionAccess.createMany({
              data: validSectionIds.map((sectionId) => ({
                userId: targetUserId,
                sectionId,
              })),
            }),
          ]
        : []),
    ]);

    // Audit log
    try {
      await prisma.systemAuditLog.create({
        data: {
          targetSchoolId: schoolId,
          actorUserId: req.user!.id,
          action: "UPDATE_TEACHER_CLASS_ACCESS",
          targetType: "USER",
          targetId: targetUserId,
          outcome: "SUCCESS",
          metadata: {
            assignedClassesCount: validClassIds.length,
            assignedSectionsCount: validSectionIds.length,
            targetUserName: targetUser.name,
          },
        },
      });
    } catch (_) {}

    return res.json({
      success: true,
      message: `Updated classroom access for ${targetUser.name}.`,
    });
  } catch (error) {
    console.error("[SETTINGS] PUT /users/:userId/class-access error:", error);
    return res.status(500).json({ success: false, error: "Failed to update classroom assignment." });
  }
});

/**
 * POST /api/settings/users/invite
 * Invites / creates a new user for the authenticated school (ADMIN only).
 */
settingsRouter.post("/users/invite", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    if (!schoolId) {
      return res.status(400).json({ success: false, error: "School context missing." });
    }

    const { name, email, role = "TEACHER", tempPassword } = req.body;

    const trimmedName = safeString(name, 100);
    const trimmedEmail = safeString(email, 150)?.toLowerCase();
    const validRoles = ["ADMIN", "PSYCHOLOGIST", "TEACHER"];
    const formattedRole = String(role).toUpperCase();

    if (!trimmedName || !trimmedEmail) {
      return res.status(400).json({ success: false, error: "Name and Email are required." });
    }

    if (!validRoles.includes(formattedRole)) {
      return res.status(400).json({ success: false, error: "Invalid role specified." });
    }

    // Check if email already exists globally in the system
    const existing = await prisma.user.findFirst({
      where: {
        email: {
          equals: trimmedEmail,
          mode: "insensitive",
        },
      },
    });

    if (existing) {
      return res.status(409).json({
        success: false,
        error: `User with email "${trimmedEmail}" already exists in the system.`,
      });
    }

    // Check if an active invitation already exists for this email
    const existingPendingInvite = await prisma.staffInvitation.findFirst({
      where: {
        email: trimmedEmail,
        schoolId,
        status: "PENDING",
        expiresAt: { gt: new Date() },
      },
    });

    let inviteToken: string;
    let expiresAt: Date;

    if (existingPendingInvite) {
      inviteToken = existingPendingInvite.token;
      expiresAt = existingPendingInvite.expiresAt;
    } else {
      // Generate secure invitation token valid for 7 days
      inviteToken = "inv_" + crypto.randomBytes(24).toString("hex");
      expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await prisma.staffInvitation.create({
        data: {
          token: inviteToken,
          schoolId,
          email: trimmedEmail,
          role: formattedRole as any,
          invitedBy: req.user!.id,
          expiresAt,
          status: "PENDING",
        },
      });
    }

    // Record in audit log
    try {
      await prisma.systemAuditLog.create({
        data: {
          targetSchoolId: schoolId,
          actorUserId: req.user!.id,
          action: "USER_INVITE",
          targetType: "STAFF_INVITATION",
          targetId: 0,
          outcome: "SUCCESS",
          metadata: {
            invitedName: trimmedName,
            invitedEmail: trimmedEmail,
            invitedRole: formattedRole,
            token: inviteToken,
          },
        },
      });
    } catch (_) {}

    let schoolName = "EduWell School";
    try {
      const schoolRecord = await prisma.school.findUnique({
        where: { id: schoolId },
        select: { name: true },
      });
      if (schoolRecord?.name) {
        schoolName = schoolRecord.name;
      }
    } catch (_) {}

    return res.status(201).json({
      success: true,
      message: `Invitation generated for ${trimmedName} (${formattedRole})!`,
      inviteLink: `/join?token=${inviteToken}`,
      inviteToken,
      schoolName,
      user: {
        id: 0,
        name: trimmedName,
        email: trimmedEmail,
        role: formattedRole,
        status: "PENDING_INVITE",
        createdAt: new Date().toISOString(),
        classAccess: [],
        sectionAccess: [],
      },
    });
  } catch (error: any) {
    console.error("[SETTINGS] POST /users/invite error:", error);
    return res.status(500).json({ success: false, error: error?.message || "Failed to invite user." });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// Classes & Sections management — ADMIN (Principal) only
// ─────────────────────────────────────────────────────────────────────────────

/**
 * GET /api/settings/classes
 * List all classes and their sections for the school.
 */
settingsRouter.get("/classes", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const classes = await prisma.class.findMany({
      where: { schoolId },
      orderBy: { displayOrder: "asc" },
      include: {
        sections: { orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } },
      },
    });
    return res.json({ success: true, classes });
  } catch (error) {
    console.error("[SETTINGS] GET /classes error:", error);
    return res.status(500).json({ success: false, error: "Failed to load classes." });
  }
});

/**
 * POST /api/settings/classes
 * Create a new grade/class for the school.
 */
settingsRouter.post("/classes", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const name = safeString(req.body.name, 100);
    if (!name) return res.status(400).json({ success: false, error: "Class name is required." });

    const existing = await prisma.class.findFirst({ where: { schoolId, name } });
    if (existing) return res.status(409).json({ success: false, error: `A class named "${name}" already exists.` });

    const count = await prisma.class.count({ where: { schoolId } });
    const newClass = await prisma.class.create({
      data: { schoolId, name, displayOrder: count },
      include: { sections: true },
    });
    return res.status(201).json({ success: true, class: newClass });
  } catch (error) {
    console.error("[SETTINGS] POST /classes error:", error);
    return res.status(500).json({ success: false, error: "Failed to create class." });
  }
});

/**
 * PATCH /api/settings/classes/:classId
 * Rename a class or toggle its active status.
 */
settingsRouter.patch("/classes/:classId", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const classId = parseInt(req.params.classId);
    if (isNaN(classId)) return res.status(400).json({ success: false, error: "Invalid class ID." });

    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) return res.status(404).json({ success: false, error: "Class not found." });

    const updates: Record<string, unknown> = {};
    if (req.body.name !== undefined) {
      const name = safeString(req.body.name, 100);
      if (!name) return res.status(400).json({ success: false, error: "Class name cannot be empty." });
      updates.name = name;
    }
    if (req.body.isActive !== undefined) updates.isActive = Boolean(req.body.isActive);

    const updated = await prisma.class.update({
      where: { id: classId },
      data: updates,
      include: { sections: { orderBy: { name: "asc" }, select: { id: true, name: true, isActive: true } } },
    });
    return res.json({ success: true, class: updated });
  } catch (error) {
    console.error("[SETTINGS] PATCH /classes/:classId error:", error);
    return res.status(500).json({ success: false, error: "Failed to update class." });
  }
});

/**
 * DELETE /api/settings/classes/:classId
 * Delete a class (only if it has no enrolled students).
 */
settingsRouter.delete("/classes/:classId", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const classId = parseInt(req.params.classId);
    if (isNaN(classId)) return res.status(400).json({ success: false, error: "Invalid class ID." });

    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) return res.status(404).json({ success: false, error: "Class not found." });

    const studentCount = await prisma.student.count({ where: { classId } });
    if (studentCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot delete "${cls.name}" — it has ${studentCount} enrolled student(s). Re-assign or remove them first.`,
      });
    }

    await prisma.class.delete({ where: { id: classId } });
    return res.json({ success: true, message: `Class "${cls.name}" deleted.` });
  } catch (error) {
    console.error("[SETTINGS] DELETE /classes/:classId error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete class." });
  }
});

/**
 * POST /api/settings/classes/:classId/sections
 * Add a section to a class.
 */
settingsRouter.post("/classes/:classId/sections", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const classId = parseInt(req.params.classId);
    if (isNaN(classId)) return res.status(400).json({ success: false, error: "Invalid class ID." });

    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) return res.status(404).json({ success: false, error: "Class not found." });

    const name = safeString(req.body.name, 50);
    if (!name) return res.status(400).json({ success: false, error: "Section name is required." });

    const existing = await prisma.section.findFirst({ where: { classId, name } });
    if (existing) return res.status(409).json({ success: false, error: `Section "${name}" already exists in this class.` });

    const section = await prisma.section.create({ data: { classId, name } });
    return res.status(201).json({ success: true, section });
  } catch (error) {
    console.error("[SETTINGS] POST /classes/:classId/sections error:", error);
    return res.status(500).json({ success: false, error: "Failed to create section." });
  }
});

/**
 * DELETE /api/settings/classes/:classId/sections/:sectionId
 * Remove a section (only if no students are assigned to it).
 */
settingsRouter.delete("/classes/:classId/sections/:sectionId", requireRole("ADMIN"), async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId!;
    const classId = parseInt(req.params.classId);
    const sectionId = parseInt(req.params.sectionId);
    if (isNaN(classId) || isNaN(sectionId)) return res.status(400).json({ success: false, error: "Invalid IDs." });

    const cls = await prisma.class.findFirst({ where: { id: classId, schoolId } });
    if (!cls) return res.status(404).json({ success: false, error: "Class not found." });

    const section = await prisma.section.findFirst({ where: { id: sectionId, classId } });
    if (!section) return res.status(404).json({ success: false, error: "Section not found." });

    const studentCount = await prisma.student.count({ where: { sectionId } });
    if (studentCount > 0) {
      return res.status(409).json({
        success: false,
        error: `Cannot remove section "${section.name}" — ${studentCount} student(s) are assigned to it.`,
      });
    }

    await prisma.section.delete({ where: { id: sectionId } });
    return res.json({ success: true, message: `Section "${section.name}" removed.` });
  } catch (error) {
    console.error("[SETTINGS] DELETE /classes/:classId/sections/:sectionId error:", error);
    return res.status(500).json({ success: false, error: "Failed to delete section." });
  }
});

// ── GET /api/settings/audit-logs ──────────────────────────────────────────
// School-scoped activity audit log for Principals (ADMIN role only).
// Strictly isolated to the requesting user's school. No cross-tenant access.
settingsRouter.get(
  "/audit-logs",
  requireRole("ADMIN"),
  async (req: AuthenticatedRequest, res: Response) => {
    try {
      const schoolId = req.user!.schoolId;
      if (!schoolId) {
        return res.status(403).json({ success: false, error: "No school context for this user." });
      }

      const skip  = Math.max(0, parseInt((req.query.skip  as string) || "0")  || 0);
      const take  = Math.min(100, Math.max(1, parseInt((req.query.take as string) || "50") || 50));
      const outcome = ((req.query.outcome as string) || "").toUpperCase();
      const actorId = req.query.actorId ? parseInt(req.query.actorId as string) : undefined;

      const where: any = { targetSchoolId: schoolId };
      if (outcome === "SUCCESS" || outcome === "FAILURE") where.outcome = outcome;
      if (actorId && !isNaN(actorId)) where.actorUserId = actorId;

      const [logs, totalCount] = await Promise.all([
        prisma.systemAuditLog.findMany({
          where,
          orderBy: { createdAt: "desc" },
          skip,
          take,
          select: {
            id: true,
            action: true,
            targetType: true,
            outcome: true,
            createdAt: true,
            metadata: true,
            actor: { select: { id: true, name: true, email: true, role: true } },
          },
        }),
        prisma.systemAuditLog.count({ where }),
      ]);

      return res.json({ success: true, logs, totalCount, skip, take });
    } catch (error) {
      console.error("[SETTINGS] GET /audit-logs error:", error);
      return res.status(500).json({ success: false, error: "Failed to retrieve audit logs." });
    }
  }
);
