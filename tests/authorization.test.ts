// tests/authorization.test.ts
// Authorization (RBAC) + Cross-Tenant Isolation integration tests for EduWell Psych.
//
// Isolation rules:
//  - Runs against a SEPARATE test database via TEST_DATABASE_URL (name ends "_test").
//  - Never touches the development database (DATABASE_URL).
//  - Creates two schools (A and B) to prove cross-tenant isolation.
//  - Cleans up only the records created by this suite.

import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";

// ────────────────────────────────────────────────────────────
// Safety guard
// ────────────────────────────────────────────────────────────
function abort(message: string): never {
  console.error(`\n❌ [AUTHORIZATION TEST] Aborting: ${message}\n`);
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

  if (!testUrl || !testUrl.trim()) {
    abort("TEST_DATABASE_URL is not set. Refusing to run tests against the development database.");
  }
  if (!devUrl || !devUrl.trim()) {
    abort("DATABASE_URL is not set.");
  }

  if (testUrl.trim().toLowerCase() === devUrl.trim().toLowerCase()) {
    abort("TEST_DATABASE_URL must differ from DATABASE_URL.");
  }

  const testParsed = parseDbUrl(testUrl);
  const devParsed = parseDbUrl(devUrl);

  if (testParsed.database === devParsed.database) {
    abort("TEST_DATABASE_URL and DATABASE_URL point to the same database.");
  }

  if (!testParsed.database.toLowerCase().endsWith("_test")) {
    abort(`Test database name "${testParsed.database}" must end with "_test".`);
  }
}

assertTestDatabaseSafe();

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL!;

const { authRouter } = await import("../src/server/auth");
const { studentsRouter } = await import("../src/server/students");
const { observationsRouter } = await import("../src/server/observations");
const { lookupsRouter } = await import("../src/server/lookups");
const { schoolApiRouter } = await import("../src/server/schoolApi");
const { requireRole } = await import("../src/server/middleware/role");
const { respondNotFound, schoolScopedWhere, isSchoolResource } = await import("../src/server/middleware/tenant");
const { prisma } = await import("../src/lib/db");

// ────────────────────────────────────────────────────────────
// Fixtures — two tenant schools to prove cross-tenant isolation
// ────────────────────────────────────────────────────────────
const SCHOOL_A_CODE = "AUTHZ_A";
const SCHOOL_B_CODE = "AUTHZ_B";
const PASSWORD = "password123";

const ADMIN_A = "admin-authz-a@example.com";
const TEACHER_A = "teacher-authz-a@example.com";
const PSYCH_A = "psych-authz-a@example.com";
const ADMIN_B = "admin-authz-b@example.com";
const TEACHER_B = "teacher-authz-b@example.com";

async function ensureTestDatabaseExists() {
  const url = new URL(TEST_DATABASE_URL);
  const dbName = url.pathname.replace(/^\//, "").split("?")[0];
  url.pathname = "/postgres";
  url.search = "";

  const admin = new Client({ connectionString: url.toString() });
  await admin.connect();
  try {
    const res = await admin.query("SELECT 1 FROM pg_database WHERE datname = $1", [dbName]);
    if ((res.rowCount ?? 0) === 0) {
      await admin.query(`CREATE DATABASE "${dbName.replace(/"/g, '""')}"`);
    }
  } finally {
    await admin.end();
  }
}

function applyMigrationsToTestDatabase() {
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
}

async function createFixtures() {
  // Clean any stale suite-owned records (schoolA/B codes are unique to this suite).
  for (const code of [SCHOOL_A_CODE, SCHOOL_B_CODE]) {
    await prisma.schoolApiAuditLog.deleteMany({ where: { school: { code } } });
    await prisma.schoolApiConfig.deleteMany({ where: { school: { code } } });
    await prisma.studentObservation.deleteMany({ where: { school: { code } } });
    await prisma.student.deleteMany({ where: { school: { code } } });
    await prisma.teacherSectionAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.teacherClassAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.section.deleteMany({ where: { class: { school: { code } } } });
    await prisma.class.deleteMany({ where: { school: { code } } });
    await prisma.user.deleteMany({ where: { school: { code } } });
    await prisma.school.deleteMany({ where: { code } });
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── School A ──
  const schoolA = await prisma.school.create({
    data: { name: "Authorization School A", code: SCHOOL_A_CODE, status: "ACTIVE" },
  });
  await prisma.user.createMany({
    data: [
      { schoolId: schoolA.id, name: "Admin A", email: ADMIN_A, passwordHash, role: "ADMIN", status: "ACTIVE" },
      { schoolId: schoolA.id, name: "Teacher A", email: TEACHER_A, passwordHash, role: "TEACHER", status: "ACTIVE" },
      { schoolId: schoolA.id, name: "Psych A", email: PSYCH_A, passwordHash, role: "PSYCHOLOGIST", status: "ACTIVE" },
    ],
  });
  const classA = await prisma.class.create({
    data: { schoolId: schoolA.id, name: "Alpha Grade", displayOrder: 1, isActive: true },
  });
  const sectionA = await prisma.section.create({
    data: { classId: classA.id, name: "Alpha A", isActive: true },
  });
  const studentA = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      studentId: "AUTHZ-STU-A1",
      firstName: "Alice",
      lastName: "Alpha",
      fullName: "Alice Alpha",
      classId: classA.id,
      sectionId: sectionA.id,
      isActive: true,
    },
  });
  const psychA = await prisma.user.findUnique({ where: { email: PSYCH_A } });
  await prisma.studentObservation.create({
    data: {
      schoolId: schoolA.id,
      studentId: studentA.id,
      submittedBy: psychA!.id,
      source: "PSYCHOLOGIST",
      category: "Behavioral",
      observation: "School A observation — should never be visible to School B.",
      recordNumber: "OBS-AUTHZ-A1",
      status: "NEW",
      observedAt: new Date("2025-01-10"),
    },
  });

  // ── School B ──
  const schoolB = await prisma.school.create({
    data: { name: "Authorization School B", code: SCHOOL_B_CODE, status: "ACTIVE" },
  });
  await prisma.user.createMany({
    data: [
      { schoolId: schoolB.id, name: "Admin B", email: ADMIN_B, passwordHash, role: "ADMIN", status: "ACTIVE" },
      { schoolId: schoolB.id, name: "Teacher B", email: TEACHER_B, passwordHash, role: "TEACHER", status: "ACTIVE" },
    ],
  });
  const classB = await prisma.class.create({
    data: { schoolId: schoolB.id, name: "Beta Grade", displayOrder: 1, isActive: true },
  });
  const studentB = await prisma.student.create({
    data: {
      schoolId: schoolB.id,
      studentId: "AUTHZ-STU-B1",
      firstName: "Bob",
      lastName: "Beta",
      fullName: "Bob Beta",
      classId: classB.id,
      isActive: true,
    },
  });
  const teacherB = await prisma.user.findUnique({ where: { email: TEACHER_B } });
  await prisma.studentObservation.create({
    data: {
      schoolId: schoolB.id,
      studentId: studentB.id,
      submittedBy: teacherB!.id,
      source: "TEACHER",
      category: "Behavioral",
      observation: "School B observation — must not be readable by School A.",
      recordNumber: "OBS-AUTHZ-B1",
      status: "NEW",
      observedAt: new Date("2025-02-10"),
    },
  });

  return { schoolA, schoolB, studentA, studentB };
}

async function destroyFixtures() {
  for (const code of [SCHOOL_A_CODE, SCHOOL_B_CODE]) {
    await prisma.schoolApiAuditLog.deleteMany({ where: { school: { code } } });
    await prisma.schoolApiConfig.deleteMany({ where: { school: { code } } });
    await prisma.studentObservation.deleteMany({ where: { school: { code } } });
    await prisma.student.deleteMany({ where: { school: { code } } });
    await prisma.teacherSectionAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.teacherClassAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.section.deleteMany({ where: { class: { school: { code } } } });
    await prisma.class.deleteMany({ where: { school: { code } } });
    await prisma.user.deleteMany({ where: { school: { code } } });
    await prisma.school.deleteMany({ where: { code } });
  }
}

// ────────────────────────────────────────────────────────────
// Test server
// ────────────────────────────────────────────────────────────
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
app.use("/api/observations", observationsRouter);
app.use("/api/lookups", lookupsRouter);
app.use("/api/school-api", schoolApiRouter);

let server: http.Server;
let baseUrl: string;

function startServer(): Promise<string> {
  return new Promise((resolve) => {
    server = http.createServer(app);
    server.listen(0, "127.0.0.1", () => {
      const addr = server.address() as any;
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve(baseUrl);
    });
  });
}

function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    server.close(() => resolve());
  });
}

async function loginUser(email: string): Promise<string> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const cookie = res.headers.get("set-cookie");
  assert.ok(cookie, `Login must return a set-cookie header for ${email}`);
  return cookie;
}

test("Authorization & Cross-Tenant Isolation Test Suite", async (t) => {
  await ensureTestDatabaseExists();
  applyMigrationsToTestDatabase();
  const fixtures = await createFixtures();
  await startServer();

  t.after(async () => {
    await stopServer();
    await destroyFixtures();
    await prisma.$disconnect();
  });

  // ── Unit tests: requireRole middleware semantics ───────────
  await t.test("1. requireRole: 401 when no authenticated user, 403 for wrong role, 200 for allowed role", async () => {
    // App that never sets req.user → requireRole must answer 401.
    const noUserApp = express();
    noUserApp.get("/admin", requireRole("ADMIN"), (_req, res) => res.json({ ok: true }));

    const noUserServer = await new Promise<http.Server>((resolve) => {
      const s = noUserApp.listen(0, "127.0.0.1", () => resolve(s));
    });
    const noUserPort = (noUserServer.address() as any).port;
    const noUserRes = await fetch(`http://127.0.0.1:${noUserPort}/admin`);
    assert.equal(noUserRes.status, 401);
    await new Promise<void>((resolve) => noUserServer.close(() => resolve()));

    // App that simulates an authenticated session with a request-scoped role header.
    const roleApp = express();
    roleApp.use((req: any, _res, next) => {
      req.user = {
        id: 1,
        schoolId: fixtures.schoolA.id,
        role: req.headers["x-test-role"] || "TEACHER",
        email: "unit@example.com",
        name: "Unit",
      };
      next();
    });
    roleApp.get("/admin", requireRole("ADMIN"), (_req, res) => res.json({ ok: true }));
    roleApp.get("/staff", requireRole("PSYCHOLOGIST", "ADMIN"), (_req, res) => res.json({ ok: true }));

    const roleServer = await new Promise<http.Server>((resolve) => {
      const s = roleApp.listen(0, "127.0.0.1", () => resolve(s));
    });
    const rolePort = (roleServer.address() as any).port;

    const teacherOnAdmin = await fetch(`http://127.0.0.1:${rolePort}/admin`, {
      headers: { "x-test-role": "TEACHER" },
    });
    assert.equal(teacherOnAdmin.status, 403);

    const adminOnAdmin = await fetch(`http://127.0.0.1:${rolePort}/admin`, {
      headers: { "x-test-role": "ADMIN" },
    });
    assert.equal(adminOnAdmin.status, 200);

    const teacherOnStaff = await fetch(`http://127.0.0.1:${rolePort}/staff`, {
      headers: { "x-test-role": "TEACHER" },
    });
    assert.equal(teacherOnStaff.status, 403);

    const psychOnStaff = await fetch(`http://127.0.0.1:${rolePort}/staff`, {
      headers: { "x-test-role": "PSYCHOLOGIST" },
    });
    assert.equal(psychOnStaff.status, 200);

    await new Promise<void>((resolve) => roleServer.close(() => resolve()));
  });

  await t.test("2. tenant helpers: schoolScopedWhere / isSchoolResource / respondNotFound", async () => {
    assert.deepEqual(schoolScopedWhere(7), { schoolId: 7 });

    const inSchool = { id: 1, schoolId: fixtures.schoolA.id };
    const otherSchool = { id: 2, schoolId: fixtures.schoolB.id };
    const missing = null;

    assert.equal(isSchoolResource(inSchool, fixtures.schoolA.id), true);
    assert.equal(isSchoolResource(otherSchool, fixtures.schoolA.id), false);
    assert.equal(isSchoolResource(missing, fixtures.schoolA.id), false);

    const mockRes = {
      statusCode: 0,
      status(this: any, code: number) { this.statusCode = code; return this; },
      json(this: any) { return this; },
    } as any;

    assert.equal(respondNotFound(mockRes, otherSchool, fixtures.schoolA.id), true);
    assert.equal(mockRes.statusCode, 404);
    assert.equal(respondNotFound(mockRes, missing, fixtures.schoolA.id), true);
    assert.equal(mockRes.statusCode, 404);
    assert.equal(respondNotFound(mockRes, inSchool, fixtures.schoolA.id), false);
    assert.equal(mockRes.statusCode, 404); // valid resource must NOT write a 404
  });

  // ── Integration: authentication boundary ───────────────────
  await t.test("3. Unauthenticated requests are rejected with 401", async () => {
    const studentsRes = await fetch(`${baseUrl}/api/students`);
    assert.equal(studentsRes.status, 401);

    const schoolApiRes = await fetch(`${baseUrl}/api/school-api/config`);
    assert.equal(schoolApiRes.status, 401);

    const lookupsRes = await fetch(`${baseUrl}/api/lookups/student-filters`);
    assert.equal(lookupsRes.status, 401);

    const observationsRes = await fetch(`${baseUrl}/api/observations`);
    assert.equal(observationsRes.status, 401);
  });

  // ── Integration: RBAC on School API (ADMIN-only) ───────────
  await t.test("4. Non-ADMIN roles are forbidden from School API endpoints (403)", async () => {
    const teacherACookie = await loginUser(TEACHER_A);

    const getRes = await fetch(`${baseUrl}/api/school-api/config`, {
      headers: { Cookie: teacherACookie },
    });
    assert.equal(getRes.status, 403);

    const putRes = await fetch(`${baseUrl}/api/school-api/config`, {
      method: "PUT",
      headers: { Cookie: teacherACookie, "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl: "https://evil.example.com", schoolCode: "evil" }),
    });
    assert.equal(putRes.status, 403);

    const auditRes = await fetch(`${baseUrl}/api/school-api/audit-logs`, {
      headers: { Cookie: teacherACookie },
    });
    assert.equal(auditRes.status, 403);
  });

  await t.test("5. ADMIN can read School API config (no cross-tenant leak)", async () => {
    const adminACookie = await loginUser(ADMIN_A);
    const getRes = await fetch(`${baseUrl}/api/school-api/config`, {
      headers: { Cookie: adminACookie },
    });
    assert.equal(getRes.status, 200);
    const data = await getRes.json();
    assert.equal(data.success, true);
    // Auto-created default must be for School A.
    const config = await prisma.schoolApiConfig.findFirst({ where: { schoolId: fixtures.schoolA.id } });
    assert.equal(config?.id, data.config.id);
  });

  // ── Integration: RBAC on student enrollment / sync (ADMIN-only) ──
  await t.test("6. Non-ADMIN roles are forbidden from student enrollment and sync (403)", async () => {
    const teacherACookie = await loginUser(TEACHER_A);

    const enrollRes = await fetch(`${baseUrl}/api/students`, {
      method: "POST",
      headers: { Cookie: teacherACookie, "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: "Eve", lastName: "Enroll" }),
    });
    assert.equal(enrollRes.status, 403);

    const syncRes = await fetch(`${baseUrl}/api/students/sync-one`, {
      method: "POST",
      headers: { Cookie: teacherACookie, "Content-Type": "application/json" },
      body: JSON.stringify({ studentNo: "STU-123" }),
    });
    assert.equal(syncRes.status, 403);
  });

  // ── Integration: RBAC on observation updates (PSYCHOLOGIST/ADMIN) ──
  await t.test("7. Only PSYCHOLOGIST/ADMIN can PATCH observations (403 for TEACHER)", async () => {
    const schoolAObs = await prisma.studentObservation.findFirst({
      where: { schoolId: fixtures.schoolA.id },
    });
    assert.ok(schoolAObs);

    const teacherACookie = await loginUser(TEACHER_A);
    const teacherPatchRes = await fetch(`${baseUrl}/api/observations/${schoolAObs.id}`, {
      method: "PATCH",
      headers: { Cookie: teacherACookie, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVIEWED" }),
    });
    assert.equal(teacherPatchRes.status, 403);

    const psychACookie = await loginUser(PSYCH_A);
    const psychPatchRes = await fetch(`${baseUrl}/api/observations/${schoolAObs.id}`, {
      method: "PATCH",
      headers: { Cookie: psychACookie, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "REVIEWED" }),
    });
    assert.equal(psychPatchRes.status, 200);
  });

  // ── Integration: cross-tenant isolation ────────────────────
  await t.test("8. Cross-tenant: School A cannot read School B students (404)", async () => {
    const adminACookie = await loginUser(ADMIN_A);
    const res = await fetch(`${baseUrl}/api/students/${fixtures.studentB.id}`, {
      headers: { Cookie: adminACookie },
    });
    assert.equal(res.status, 404);
  });

  await t.test("9. Cross-tenant: School A cannot read or update School B observations (404)", async () => {
    const schoolBObs = await prisma.studentObservation.findFirst({
      where: { schoolId: fixtures.schoolB.id },
    });
    assert.ok(schoolBObs);

    const psychACookie = await loginUser(PSYCH_A);

    const readRes = await fetch(`${baseUrl}/api/observations/${schoolBObs.id}`, {
      headers: { Cookie: psychACookie },
    });
    assert.equal(readRes.status, 404);

    const patchRes = await fetch(`${baseUrl}/api/observations/${schoolBObs.id}`, {
      method: "PATCH",
      headers: { Cookie: psychACookie, "Content-Type": "application/json" },
      body: JSON.stringify({ status: "ASSESSED" }),
    });
    assert.equal(patchRes.status, 404);
  });

  await t.test("10. Cross-tenant: lookup filters only expose the caller's school", async () => {
    const adminACookie = await loginUser(ADMIN_A);
    const res = await fetch(`${baseUrl}/api/lookups/student-filters`, {
      headers: { Cookie: adminACookie },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    const classNames = data.classes.map((c: { name: string }) => c.name);
    assert.ok(classNames.includes("Alpha Grade"));
    assert.ok(!classNames.includes("Beta Grade"), "School A lookups must not expose School B classes");
  });
});