// src/server/schoolApi.ts
// Protected School API configuration and diagnostics router for EduWell Psych (ADMIN-only)

import { Router, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth, AuthenticatedRequest } from "./middleware/auth";
import { requireRole } from "./middleware/role";
import { globalAuditMiddleware } from "./middleware/audit";
import {
  testSchoolApiConnection,
  validateUrlForSsrf,
} from "./services/schoolApiService";

export const schoolApiRouter = Router();

// Protect all endpoints with JWT authentication, then require the ADMIN role.
// School API credentials and synchronization are ADMIN-only per specification.
schoolApiRouter.use(requireAuth);
schoolApiRouter.use(requireRole("ADMIN"));
schoolApiRouter.use(globalAuditMiddleware);

/**
 * GET /api/school-api/config
 * Retrieve the current school API configuration with credentials masked.
 */
schoolApiRouter.get("/config", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;

    let config = await prisma.schoolApiConfig.findFirst({
      where: { schoolId },
    });

    if (!config) {
      // Create initial default record if absent
      config = await prisma.schoolApiConfig.create({
        data: {
          schoolId,
          baseUrl: "http://dmwerp.com/rest_school_assist/",
          schoolCode: "test",
          appVersion: "1.1",
          appOs: "web",
          isEnabled: true,
        },
      });
    }

    return res.json({
      success: true,
      config: {
        id: config.id,
        baseUrl: config.baseUrl,
        schoolCode: config.schoolCode,
        appVersion: config.appVersion,
        appOs: config.appOs,
        isEnabled: config.isEnabled,
        lastTestedAt: config.lastTestedAt ? config.lastTestedAt.toISOString() : null,
        lastSyncAt: config.lastSyncAt ? config.lastSyncAt.toISOString() : null,
        createdAt: config.createdAt.toISOString(),
        updatedAt: config.updatedAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("[SCHOOL_API] GET /config error:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve API configuration." });
  }
});

/**
 * PUT /api/school-api/config
 * Update the School API configuration settings.
 */
schoolApiRouter.put("/config", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const { baseUrl, schoolCode, appVersion, appOs, isEnabled } = req.body;

    if (!baseUrl || typeof baseUrl !== "string" || !baseUrl.trim()) {
      return res.status(400).json({ success: false, error: "Base URL is required." });
    }

    if (!schoolCode || typeof schoolCode !== "string" || !schoolCode.trim()) {
      return res.status(400).json({ success: false, error: "School Code is required." });
    }

    // SSRF Check on updated Base URL
    const ssrfCheck = validateUrlForSsrf(baseUrl.trim());
    if (!ssrfCheck.valid) {
      return res.status(400).json({ success: false, error: `Invalid Base URL: ${ssrfCheck.reason}` });
    }

    const updated = await prisma.schoolApiConfig.upsert({
      where: { id: (await prisma.schoolApiConfig.findFirst({ where: { schoolId } }))?.id || 0 },
      create: {
        schoolId,
        baseUrl: baseUrl.trim(),
        schoolCode: schoolCode.trim(),
        appVersion: appVersion ? String(appVersion).trim() : "1.1",
        appOs: appOs ? String(appOs).trim() : "web",
        isEnabled: typeof isEnabled === "boolean" ? isEnabled : true,
      },
      update: {
        baseUrl: baseUrl.trim(),
        schoolCode: schoolCode.trim(),
        appVersion: appVersion ? String(appVersion).trim() : "1.1",
        appOs: appOs ? String(appOs).trim() : "web",
        isEnabled: typeof isEnabled === "boolean" ? isEnabled : true,
      },
    });

    return res.json({
      success: true,
      message: "School API configuration updated successfully.",
      config: {
        id: updated.id,
        baseUrl: updated.baseUrl,
        schoolCode: updated.schoolCode,
        appVersion: updated.appVersion,
        appOs: updated.appOs,
        isEnabled: updated.isEnabled,
        lastTestedAt: updated.lastTestedAt ? updated.lastTestedAt.toISOString() : null,
        lastSyncAt: updated.lastSyncAt ? updated.lastSyncAt.toISOString() : null,
      },
    });
  } catch (error) {
    console.error("[SCHOOL_API] PUT /config error:", error);
    return res.status(500).json({ success: false, error: "Failed to update API configuration." });
  }
});

/**
 * POST /api/school-api/test
 * Test the active connection to the external School API.
 */
schoolApiRouter.post("/test", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const actorId = req.user!.id;

    const config = await prisma.schoolApiConfig.findFirst({
      where: { schoolId },
    });

    if (!config) {
      return res.status(400).json({ success: false, error: "No API configuration found for this school." });
    }

    if (!config.isEnabled) {
      return res.status(400).json({ success: false, error: "School API integration is currently disabled." });
    }

    const result = await testSchoolApiConnection({
      baseUrl: config.baseUrl,
      schoolCode: config.schoolCode,
      appVersion: config.appVersion,
      appOs: config.appOs,
    });

    // Record non-sensitive audit log
    await prisma.schoolApiAuditLog.create({
      data: {
        schoolId,
        actorId,
        action: "CONNECTION_TEST",
        status: result.success ? "SUCCESS" : "FAILED",
        errorMessage: result.success ? null : result.message,
        metadata: {
          latencyMs: result.latencyMs,
        },
      },
    });

    if (result.success) {
      await prisma.schoolApiConfig.update({
        where: { id: config.id },
        data: { lastTestedAt: new Date() },
      });
    }

    return res.json({
      success: result.success,
      message: result.message,
      latencyMs: result.latencyMs,
    });
  } catch (error) {
    console.error("[SCHOOL_API] POST /test error:", error);
    return res.status(500).json({ success: false, error: "An unexpected error occurred during connection test." });
  }
});

/**
 * GET /api/school-api/audit-logs
 * Retrieve recent non-sensitive audit log records for the school's API operations.
 */
schoolApiRouter.get("/audit-logs", async (req: AuthenticatedRequest, res: Response) => {
  try {
    const schoolId = req.user!.schoolId;
    const logs = await prisma.schoolApiAuditLog.findMany({
      where: { schoolId },
      orderBy: { createdAt: "desc" },
      take: 20,
      include: {
        actor: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return res.json({
      success: true,
      logs: logs.map((l) => ({
        id: l.id,
        action: l.action,
        status: l.status,
        targetIdentifier: l.targetIdentifier,
        errorMessage: l.errorMessage,
        metadata: l.metadata,
        createdAt: l.createdAt.toISOString(),
        actorName: l.actor.name,
      })),
    });
  } catch (error) {
    console.error("[SCHOOL_API] GET /audit-logs error:", error);
    return res.status(500).json({ success: false, error: "Failed to retrieve audit logs." });
  }
});
