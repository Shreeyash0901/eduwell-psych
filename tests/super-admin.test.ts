// tests/super-admin.test.ts
// Integration tests for Super Admin Control Plane
// Tests: authentication, role enforcement, school CRUD, status toggle, audit log, and security invariants.

import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import bcrypt from "bcryptjs";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";

function abort(message: string): never {
  console.error(`\n❌ [SUPER_ADMIN TEST] Aborting: ${message}\n`);
  process.exit(1);
}

function parseDbUrl(url: string) {
  const u = new URL(url);
  const protocol = u.protocol.replace(":", "");
  const defaultPort = protocol === "postgres" || protocol === "postgresql" ? "5432" : "";
  return {
    host: `${u.hostname}:${u.port || defaultPort}`,
    database: u.pathname.replace(/^\//, ""),
  };
}

function assertTestDatabaseSafe() {
  const testUrl = process.env.TEST_DATABASE_URL;
  const devUrl = process.env.DATABASE_URL;
  if (!testUrl || !testUrl.trim()) abort("TEST_DATABASE_URL is not set.");
  if (!devUrl || !devUrl.trim()) abort("DATABASE_URL is not set.");
  const testParsed = parseDbUrl(testUrl);
  if (!testParsed.database.toLowerCase().endsWith("_test")) {
    abort(`Test database name "${testParsed.database}" must end with "_test".`);
  }
}

assertTestDatabaseSafe();

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL!;

const { prisma } = await import("../src/lib/db");
const { authRouter } = await import("../src/server/auth");
const { superAdminRouter } = await import("../src/server/superAdmin");
const { studentsRouter } = await import("../src/server/students");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/super-admin", superAdminRouter);
app.use("/api/students", studentsRouter);

const server = http.createServer(app);
const PORT = 4010;

await new Promise<void>((resolve) => server.listen(PORT, resolve));

const BASE = `http://localhost:${PORT}`;

// ── Test Helpers ──────────────────────────────────────────────

async function api(method: string, path: string, body?: any, cookies?: string) {
  const headers: Record<string, string> = { "Content-Type": "application/json", Accept: "application/json" };
  if (cookies) headers["Cookie"] = cookies;
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json();
  return { status: res.status, data, headers: res.headers };
}

async function loginUser(email: string, password: string): Promise<string> {
  const res = await api("POST", "/api/auth/login", { email, password });
  assert.equal(res.status, 200, `Login failed for ${email}: ${JSON.stringify(res.data)}`);
  const setCookie = res.headers.get("set-cookie") || "";
  assert.ok(setCookie, "Login must set cookie");
  return setCookie;
}

// ── Setup ──────────────────────────────────────────────────────

let superAdminCookie: string;
let tenantAdminCookie: string;
let tenantUserId: number;
let school2Id: number;
let school1Id: number;

const SA_EMAIL = "sa_test@eduwell.platform";
const SA_PASS = "SATestPass@2024!";
const TENANT_EMAIL = "ta_test@sa_suite.test";
const TENANT_PASS = "TenantAdmin@2024!";

await test("SETUP: Create test data", async () => {
  // Clean up any previous test run leftovers
  await prisma.systemAuditLog.deleteMany({ where: { actor: { email: SA_EMAIL } } });
  await prisma.user.deleteMany({ where: { email: { in: [SA_EMAIL, TENANT_EMAIL] } } });
  await prisma.school.deleteMany({ where: { code: { in: ["SA_TEST_SCHOOL1", "SA_TEST_SCHOOL2"] } } });

  // Create school 1 for tenant admin
  const school1 = await prisma.school.create({
    data: { name: "SA Suite School 1", code: "SA_TEST_SCHOOL1", status: "ACTIVE" },
  });
  school1Id = school1.id;

  // Create SUPER_ADMIN user (null schoolId)
  const saHash = await bcrypt.hash(SA_PASS, 10);
  await prisma.user.create({
    data: {
      name: "Test Super Admin",
      email: SA_EMAIL,
      passwordHash: saHash,
      role: "SUPER_ADMIN",
      schoolId: null,
      status: "ACTIVE",
    },
  });

  // Create ADMIN user for tenant school
  const taHash = await bcrypt.hash(TENANT_PASS, 10);
  const ta = await prisma.user.create({
    data: {
      name: "Test Tenant Admin",
      email: TENANT_EMAIL,
      passwordHash: taHash,
      role: "ADMIN",
      schoolId: school1Id,
      status: "ACTIVE",
    },
  });
  tenantUserId = ta.id;
});

// ── Authentication ─────────────────────────────────────────────

await test("AUTH: Super Admin can log in", async () => {
  superAdminCookie = await loginUser(SA_EMAIL, SA_PASS);
  assert.ok(superAdminCookie, "Must receive auth cookie");
});

await test("AUTH: Tenant Admin can log in", async () => {
  tenantAdminCookie = await loginUser(TENANT_EMAIL, TENANT_PASS);
  assert.ok(tenantAdminCookie, "Must receive auth cookie");
});

// ── Role Enforcement ───────────────────────────────────────────

await test("SECURITY: Unauthenticated request to /api/super-admin/metrics → 401", async () => {
  const res = await api("GET", "/api/super-admin/metrics");
  assert.equal(res.status, 401);
});

await test("SECURITY: Tenant ADMIN cannot access /api/super-admin/metrics → 403", async () => {
  const res = await api("GET", "/api/super-admin/metrics", undefined, tenantAdminCookie);
  assert.equal(res.status, 403);
  assert.equal(res.data.success, false);
});

await test("SECURITY: Tenant ADMIN cannot list schools via super-admin → 403", async () => {
  const res = await api("GET", "/api/super-admin/schools", undefined, tenantAdminCookie);
  assert.equal(res.status, 403);
});

await test("SECURITY: Tenant ADMIN cannot create school via super-admin → 403", async () => {
  const res = await api("POST", "/api/super-admin/schools", { name: "Hacked", code: "HACKED" }, tenantAdminCookie);
  assert.equal(res.status, 403);
});

await test("SECURITY: Super Admin cannot access tenant /api/students → 403 (fail-closed)", async () => {
  const res = await api("GET", "/api/students", undefined, superAdminCookie);
  // SUPER_ADMIN has null schoolId; schoolScopedWhere throws → 403
  assert.equal(res.status, 403, `Expected 403, got ${res.status}: ${JSON.stringify(res.data)}`);
});

// ── Super Admin Metrics ────────────────────────────────────────

await test("METRICS: Super Admin can fetch platform metrics", async () => {
  const res = await api("GET", "/api/super-admin/metrics", undefined, superAdminCookie);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  const m = res.data.metrics;
  assert.ok(typeof m.totalSchools === "number");
  assert.ok(typeof m.activeSchools === "number");
  assert.ok(typeof m.inactiveSchools === "number");
  assert.ok(typeof m.totalActiveStudents === "number");
});

// ── School CRUD ────────────────────────────────────────────────

await test("SCHOOL: Super Admin can list schools", async () => {
  const res = await api("GET", "/api/super-admin/schools", undefined, superAdminCookie);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.schools));
  assert.ok(typeof res.data.totalCount === "number");
});

await test("SCHOOL: Super Admin can create a new school", async () => {
  const res = await api(
    "POST",
    "/api/super-admin/schools",
    { name: "Super Admin Test School 2", code: "SA_TEST_SCHOOL2", city: "Test City", country: "USA" },
    superAdminCookie
  );
  assert.equal(res.status, 201, JSON.stringify(res.data));
  assert.equal(res.data.success, true);
  assert.equal(res.data.school.code, "SA_TEST_SCHOOL2");
  school2Id = res.data.school.id;
});

await test("SCHOOL: Duplicate school code is rejected → 409", async () => {
  const res = await api(
    "POST",
    "/api/super-admin/schools",
    { name: "Duplicate", code: "SA_TEST_SCHOOL2" },
    superAdminCookie
  );
  assert.equal(res.status, 409);
});

await test("SCHOOL: Super Admin can get school detail", async () => {
  const res = await api("GET", `/api/super-admin/schools/${school2Id}`, undefined, superAdminCookie);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.school.id, school2Id);
});

await test("SCHOOL: Super Admin can update school name", async () => {
  const res = await api(
    "PATCH",
    `/api/super-admin/schools/${school2Id}`,
    { name: "Updated School Name" },
    superAdminCookie
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.school.name, "Updated School Name");
});

// ── School Status Toggle ───────────────────────────────────────

await test("STATUS: Super Admin can deactivate a school", async () => {
  const res = await api(
    "PATCH",
    `/api/super-admin/schools/${school2Id}/status`,
    { status: "INACTIVE", reason: "Integration test deactivation" },
    superAdminCookie
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.school.status, "INACTIVE");
});

await test("STATUS: Cannot set same status twice → 400", async () => {
  const res = await api(
    "PATCH",
    `/api/super-admin/schools/${school2Id}/status`,
    { status: "INACTIVE" },
    superAdminCookie
  );
  assert.equal(res.status, 400);
});

await test("STATUS: Super Admin can reactivate a school", async () => {
  const res = await api(
    "PATCH",
    `/api/super-admin/schools/${school2Id}/status`,
    { status: "ACTIVE" },
    superAdminCookie
  );
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.equal(res.data.school.status, "ACTIVE");
});

// ── Audit Logs ─────────────────────────────────────────────────

await test("AUDIT: Super Admin can read audit logs", async () => {
  const res = await api("GET", "/api/super-admin/audit-logs", undefined, superAdminCookie);
  assert.equal(res.status, 200);
  assert.equal(res.data.success, true);
  assert.ok(Array.isArray(res.data.logs));
  // Should have logs for our school.create, school.update, school.deactivate, school.activate
  const actions = res.data.logs.map((l: any) => l.action);
  assert.ok(actions.includes("school.create"), "Must have school.create log");
  assert.ok(actions.includes("school.deactivate"), "Must have school.deactivate log");
  assert.ok(actions.includes("school.activate"), "Must have school.activate log");
});

await test("AUDIT: Tenant Admin cannot read audit logs → 403", async () => {
  const res = await api("GET", "/api/super-admin/audit-logs", undefined, tenantAdminCookie);
  assert.equal(res.status, 403);
});

// ── DB Constraint Verification ─────────────────────────────────

await test("DB: Cannot create SUPER_ADMIN with a schoolId via Prisma (CHECK constraint)", async () => {
  let didThrow = false;
  try {
    // Attempt direct violation — Prisma should propagate the DB CHECK constraint error
    await prisma.user.create({
      data: {
        name: "Bad Super Admin",
        email: "bad_sa@test.invalid",
        passwordHash: "hash",
        role: "SUPER_ADMIN",
        schoolId: school1Id, // This must be rejected by CHECK constraint
        status: "ACTIVE",
      },
    });
  } catch {
    didThrow = true;
    // Clean up in case it somehow succeeded
    await prisma.user.deleteMany({ where: { email: "bad_sa@test.invalid" } }).catch(() => {});
  }
  assert.ok(didThrow, "DB CHECK constraint must prevent SUPER_ADMIN with non-null schoolId");
});

await test("DB: Cannot create regular user with null schoolId via Prisma (CHECK constraint)", async () => {
  let didThrow = false;
  try {
    await prisma.user.create({
      data: {
        name: "Bad Admin",
        email: "bad_admin@test.invalid",
        passwordHash: "hash",
        role: "ADMIN",
        schoolId: null, // This must be rejected by CHECK constraint
        status: "ACTIVE",
      },
    });
  } catch {
    didThrow = true;
    await prisma.user.deleteMany({ where: { email: "bad_admin@test.invalid" } }).catch(() => {});
  }
  assert.ok(didThrow, "DB CHECK constraint must prevent ADMIN with null schoolId");
});

// ── TEARDOWN ───────────────────────────────────────────────────

await test("TEARDOWN: Clean up test data", async () => {
  await prisma.systemAuditLog.deleteMany({ where: { actor: { email: SA_EMAIL } } });
  await prisma.user.deleteMany({ where: { email: { in: [SA_EMAIL, TENANT_EMAIL] } } });
  await prisma.school.deleteMany({ where: { code: { in: ["SA_TEST_SCHOOL1", "SA_TEST_SCHOOL2"] } } });
});

server.close();
await prisma.$disconnect();
