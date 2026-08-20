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
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { requireRole } from "./middleware/role";
import { requireTenant } from "./middleware/tenant";

export const settingsRouter = Router();

settingsRouter.use(requireAuth);
settingsRouter.use(requireTenant);

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
          select: { section: { select: { id: true, name: true, class: { select: { name: true } } } } },
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
        createdAt: u.createdAt.toISOString(),
        classAccess: u.teacherClassAccesses.map((a) => a.class.name),
        sectionAccess: u.teacherSectionAccesses.map((a) => ({
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