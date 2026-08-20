// src/server/superAdmin.ts
// Super Admin Control Plane — dedicated /api/super-admin/* routes.
// All routes require authentication AND exact SUPER_ADMIN role.
// No cross-tenant clinical/student record access.
// Every mutation creates a SystemAuditLog entry.
// No global filter bypass of schoolScopedWhere — this router uses explicit global queries only.

import { Router, Request, Response } from "express";
import { prisma } from "../lib/db";
import { requireAuth } from "./middleware/auth";
import { requireRole } from "./middleware/role";
import { randomUUID } from "crypto";

export const superAdminRouter = Router();

// Apply auth + SUPER_ADMIN role guard to every route in this router.
superAdminRouter.use(requireAuth);
superAdminRouter.use(requireRole("SUPER_ADMIN"));

// ── Helper ────────────────────────────────────────────────────

async function writeAuditLog(params: {
  actorUserId: number;
  action: string;
  targetType?: string;
  targetId?: number;
  targetSchoolId?: number;
  metadata?: Record<string, unknown>;
  requestId?: string;
  outcome?: string;
}) {
  await prisma.systemAuditLog.create({
    data: {
      actorUserId: params.actorUserId,
      action: params.action,
      targetType: params.targetType ?? null,
      targetId: params.targetId ?? null,
      targetSchoolId: params.targetSchoolId ?? null,
      metadata: (params.metadata ?? {}) as any,
      requestId: params.requestId ?? null,
      outcome: params.outcome ?? "SUCCESS",
    },
  });
}

const SAFE_SCHOOL_FIELDS = {
  id: true,
  name: true,
  code: true,
  status: true,
  addressLine1: true,
  city: true,
  state: true,
  country: true,
  phone: true,
  website: true,
  createdAt: true,
  updatedAt: true,
} as const;

// ── GET /api/super-admin/metrics ─────────────────────────────────
superAdminRouter.get("/metrics", async (_req: Request, res: Response) => {
  try {
    const [totalSchools, activeSchools, inactiveSchools, totalActiveStudents, staffCounts, syncMetrics] =
      await Promise.all([
        prisma.school.count(),
        prisma.school.count({ where: { status: "ACTIVE" } }),
        prisma.school.count({ where: { status: "INACTIVE" } }),
        prisma.student.count({ where: { isActive: true } }),
        prisma.user.groupBy({
          by: ["role"],
          where: { status: "ACTIVE", role: { not: "SUPER_ADMIN" } },
          _count: { id: true },
        }),
        prisma.schoolApiConfig.aggregate({
          _count: { id: true },
          where: { isEnabled: true },
        }),
      ]);

    const staffByRole: Record<string, number> = {};
    for (const group of staffCounts) {
      staffByRole[group.role] = group._count.id;
    }

    res.json({
      success: true,
      metrics: {
        totalSchools,
        activeSchools,
        inactiveSchools,
        totalActiveStudents,
        staffByRole,
        enabledApiSyncConfigs: syncMetrics._count.id,
      },
    });
  } catch (error) {
    console.error("[SUPER_ADMIN] metrics error:", error);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// ── GET /api/super-admin/schools ─────────────────────────────────
superAdminRouter.get("/schools", async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || "").trim().toLowerCase();
    const status = (req.query.status as string) || undefined;
    const skip = Math.max(0, parseInt((req.query.skip as string) || "0") || 0);
    const take = Math.min(100, Math.max(1, parseInt((req.query.take as string) || "20") || 20));

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { code: { contains: search, mode: "insensitive" } },
      ];
    }
    if (status && ["ACTIVE", "INACTIVE"].includes(status.toUpperCase())) {
      where.status = status.toUpperCase();
    }

    const [schools, totalCount] = await Promise.all([
      prisma.school.findMany({
        where,
        select: {
          ...SAFE_SCHOOL_FIELDS,
          _count: { select: { users: true, students: true } },
        },
        orderBy: { createdAt: "desc" },
        skip,
        take,
      }),
      prisma.school.count({ where }),
    ]);

    res.json({ success: true, schools, totalCount, skip, take });
  } catch (error) {
    console.error("[SUPER_ADMIN] schools list error:", error);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// ── POST /api/super-admin/schools ────────────────────────────────
superAdminRouter.post("/schools", async (req: Request, res: Response) => {
  const actor = (req as any).user!;
  const requestId = randomUUID();
  try {
    const { name, code, addressLine1, city, state, country, phone, website } = req.body;

    if (!name || typeof name !== "string" || name.trim().length < 2) {
      return res.status(400).json({ success: false, error: "School name is required (min 2 chars)." });
    }
    if (!code || typeof code !== "string" || !/^[A-Z0-9_]{2,50}$/i.test(code.trim())) {
      return res.status(400).json({ success: false, error: "School code must be 2-50 alphanumeric characters." });
    }

    const safeName = name.trim().substring(0, 255);
    const safeCode = code.trim().toUpperCase().substring(0, 50);

    const existing = await prisma.school.findUnique({ where: { code: safeCode } });
    if (existing) {
      return res.status(409).json({ success: false, error: "A school with this code already exists." });
    }

    const school = await prisma.$transaction(async (tx) => {
      const created = await tx.school.create({
        data: {
          name: safeName,
          code: safeCode,
          status: "ACTIVE",
          addressLine1: addressLine1 ? String(addressLine1).substring(0, 255) : null,
          city: city ? String(city).substring(0, 100) : null,
          state: state ? String(state).substring(0, 100) : null,
          country: country ? String(country).substring(0, 100) : null,
          phone: phone ? String(phone).substring(0, 50) : null,
          website: website ? String(website).substring(0, 255) : null,
        },
        select: SAFE_SCHOOL_FIELDS,
      });

      await tx.systemAuditLog.create({
        data: {
          actorUserId: actor.id,
          action: "school.create",
          targetType: "SCHOOL",
          targetId: created.id,
          targetSchoolId: created.id,
          metadata: { name: safeName, code: safeCode },
          requestId,
          outcome: "SUCCESS",
        },
      });

      return created;
    });

    res.status(201).json({ success: true, school });
  } catch (error: any) {
    console.error("[SUPER_ADMIN] school create error:", error);
    await writeAuditLog({ actorUserId: actor.id, action: "school.create", requestId, outcome: "FAILURE" }).catch(() => {});
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// ── GET /api/super-admin/schools/:schoolId ───────────────────────
superAdminRouter.get("/schools/:schoolId", async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.schoolId);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid school ID." });

    const school = await prisma.school.findUnique({
      where: { id },
      select: {
        ...SAFE_SCHOOL_FIELDS,
        schoolSettings: { select: { timezone: true, locale: true, defaultGradingSystem: true } },
        _count: { select: { users: true, students: true, observations: true } },
      },
    });

    if (!school) return res.status(404).json({ success: false, error: "School not found." });

    res.json({ success: true, school });
  } catch (error) {
    console.error("[SUPER_ADMIN] school detail error:", error);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// ── PATCH /api/super-admin/schools/:schoolId ─────────────────────
superAdminRouter.patch("/schools/:schoolId", async (req: Request, res: Response) => {
  const actor = (req as any).user!;
  const requestId = randomUUID();
  try {
    const id = parseInt(req.params.schoolId);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid school ID." });

    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: "School not found." });

    // Allow-list of editable fields (never status — use the dedicated status endpoint)
    const { name, addressLine1, city, state, country, phone, website } = req.body;
    const data: any = {};
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ success: false, error: "School name must be at least 2 characters." });
      }
      data.name = name.trim().substring(0, 255);
    }
    if (addressLine1 !== undefined) data.addressLine1 = addressLine1 ? String(addressLine1).substring(0, 255) : null;
    if (city !== undefined) data.city = city ? String(city).substring(0, 100) : null;
    if (state !== undefined) data.state = state ? String(state).substring(0, 100) : null;
    if (country !== undefined) data.country = country ? String(country).substring(0, 100) : null;
    if (phone !== undefined) data.phone = phone ? String(phone).substring(0, 50) : null;
    if (website !== undefined) data.website = website ? String(website).substring(0, 255) : null;

    if (Object.keys(data).length === 0) {
      return res.status(400).json({ success: false, error: "No valid fields to update." });
    }

    const school = await prisma.$transaction(async (tx) => {
      const updated = await tx.school.update({
        where: { id },
        data,
        select: SAFE_SCHOOL_FIELDS,
      });

      await tx.systemAuditLog.create({
        data: {
          actorUserId: actor.id,
          action: "school.update",
          targetType: "SCHOOL",
          targetId: id,
          targetSchoolId: id,
          metadata: { updatedFields: Object.keys(data) },
          requestId,
          outcome: "SUCCESS",
        },
      });

      return updated;
    });

    res.json({ success: true, school });
  } catch (error) {
    console.error("[SUPER_ADMIN] school update error:", error);
    await writeAuditLog({ actorUserId: actor.id, action: "school.update", targetSchoolId: parseInt(req.params.schoolId) || undefined, requestId, outcome: "FAILURE" }).catch(() => {});
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// ── PATCH /api/super-admin/schools/:schoolId/status ──────────────
superAdminRouter.patch("/schools/:schoolId/status", async (req: Request, res: Response) => {
  const actor = (req as any).user!;
  const requestId = randomUUID();
  try {
    const id = parseInt(req.params.schoolId);
    if (isNaN(id)) return res.status(400).json({ success: false, error: "Invalid school ID." });

    const { status, reason } = req.body;
    if (!["ACTIVE", "INACTIVE"].includes((status || "").toUpperCase())) {
      return res.status(400).json({ success: false, error: "status must be 'ACTIVE' or 'INACTIVE'." });
    }

    const safeStatus = status.toUpperCase();
    const existing = await prisma.school.findUnique({ where: { id } });
    if (!existing) return res.status(404).json({ success: false, error: "School not found." });

    if (existing.status === safeStatus) {
      return res.status(400).json({ success: false, error: `School is already ${safeStatus}.` });
    }

    // Deactivation: soft, reversible. Data is preserved. Tenant users are blocked by auth middleware.
    const school = await prisma.$transaction(async (tx) => {
      const updated = await tx.school.update({
        where: { id },
        data: { status: safeStatus },
        select: SAFE_SCHOOL_FIELDS,
      });

      await tx.systemAuditLog.create({
        data: {
          actorUserId: actor.id,
          action: safeStatus === "INACTIVE" ? "school.deactivate" : "school.activate",
          targetType: "SCHOOL",
          targetId: id,
          targetSchoolId: id,
          metadata: {
            previousStatus: existing.status,
            newStatus: safeStatus,
            reason: reason ? String(reason).substring(0, 255) : null,
          },
          requestId,
          outcome: "SUCCESS",
        },
      });

      return updated;
    });

    res.json({ success: true, school });
  } catch (error) {
    console.error("[SUPER_ADMIN] school status error:", error);
    await writeAuditLog({ actorUserId: actor.id, action: "school.status_change", targetSchoolId: parseInt(req.params.schoolId) || undefined, requestId, outcome: "FAILURE" }).catch(() => {});
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});

// ── GET /api/super-admin/audit-logs ──────────────────────────────
superAdminRouter.get("/audit-logs", async (req: Request, res: Response) => {
  try {
    const skip = Math.max(0, parseInt((req.query.skip as string) || "0") || 0);
    const take = Math.min(100, Math.max(1, parseInt((req.query.take as string) || "50") || 50));
    const targetSchoolId = req.query.targetSchoolId ? parseInt(req.query.targetSchoolId as string) : undefined;

    const where: any = {};
    if (targetSchoolId && !isNaN(targetSchoolId)) where.targetSchoolId = targetSchoolId;

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
          targetId: true,
          targetSchoolId: true,
          outcome: true,
          createdAt: true,
          actor: { select: { id: true, name: true, email: true, role: true } },
          targetSchool: { select: { id: true, name: true, code: true } },
        },
      }),
      prisma.systemAuditLog.count({ where }),
    ]);

    res.json({ success: true, logs, totalCount, skip, take });
  } catch (error) {
    console.error("[SUPER_ADMIN] audit-logs error:", error);
    res.status(500).json({ success: false, error: "Internal server error." });
  }
});
