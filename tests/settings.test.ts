// tests/settings.test.ts
// Settings Module integration tests for EduWell Psych.
//
// Covers:
//   - RBAC on school-profile (GET auth, PUT ADMIN) and users (ADMIN)
//   - Cross-tenant isolation (schoolId derived only from JWT)
//   - Real persistence of school profile + settings
//   - No secret/password/student-sensitive leakage in settings responses

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
  console.error(`\n❌ [SETTINGS TEST] Aborting: ${message}\n`);
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
    abort("TEST_DATABASE_URL is not set.");
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
const { settingsRouter } = await import("../src/server/settings");
const { prisma } = await import("../src/lib/db");

// ────────────────────────────────────────────────────────────
// Fixtures — two tenant schools to prove cross-tenant isolation
// ────────────────────────────────────────────────────────────
const SCHOOL_A_CODE = "SETTINGS_A";
const SCHOOL_B_CODE = "SETTINGS_B";
const PASSWORD = "password123";

const ADMIN_A = "admin-settings-a@example.com";
const TEACHER_A = "teacher-settings-a@example.com";
const PSYCH_A = "psych-settings-a@example.com";
const ADMIN_B = "admin-settings-b@example.com";

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
  for (const code of [SCHOOL_A_CODE, SCHOOL_B_CODE]) {
    await prisma.schoolApiAuditLog.deleteMany({ where: { school: { code } } });
    await prisma.schoolApiConfig.deleteMany({ where: { school: { code } } });
    await prisma.teacherSectionAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.teacherClassAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.section.deleteMany({ where: { class: { school: { code } } } });
    await prisma.class.deleteMany({ where: { school: { code } } });
    await prisma.academicSession.deleteMany({ where: { school: { code } } });
    await prisma.schoolSettings.deleteMany({ where: { school: { code } } });
    await prisma.user.deleteMany({ where: { school: { code } } });
    await prisma.school.deleteMany({ where: { code } });
  }

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  // ── School A ──
  const schoolA = await prisma.school.create({
    data: {
      name: "Settings School A",
      code: SCHOOL_A_CODE,
      status: "ACTIVE",
      addressLine1: "100 Alpha Road",
      city: "Alpha City",
      state: "AL",
      postalCode: "35000",
      country: "USA",
      phone: "+1-555-0100",
      website: "https://alpha.example.edu",
    },
  });
  await prisma.user.createMany({
    data: [
      { schoolId: schoolA.id, name: "Admin A", email: ADMIN_A, passwordHash, role: "ADMIN", status: "ACTIVE" },
      { schoolId: schoolA.id, name: "Teacher A", email: TEACHER_A, passwordHash, role: "TEACHER", status: "ACTIVE" },
      { schoolId: schoolA.id, name: "Psych A", email: PSYCH_A, passwordHash, role: "PSYCHOLOGIST", status: "ACTIVE" },
    ],
  });
  const classA = await prisma.class.create({
    data: { schoolId: schoolA.id, name: "Grade A", displayOrder: 1, isActive: true },
  });
  const sectionA = await prisma.section.create({
    data: { classId: classA.id, name: "Section A1", isActive: true },
  });
  const teacherA = await prisma.user.findUnique({ where: { email: TEACHER_A } });
  await prisma.teacherClassAccess.create({
    data: { userId: teacherA!.id, classId: classA.id },
  });
  await prisma.teacherSectionAccess.create({
    data: { userId: teacherA!.id, sectionId: sectionA.id },
  });
  await prisma.academicSession.create({
    data: {
      schoolId: schoolA.id,
      name: "2024-2025",
      startDate: new Date("2024-08-01"),
      endDate: new Date("2025-06-30"),
      isCurrent: true,
    },
  });

  // ── School B ──
  const schoolB = await prisma.school.create({
    data: { name: "Settings School B", code: SCHOOL_B_CODE, status: "ACTIVE" },
  });
  await prisma.user.create({
    data: { schoolId: schoolB.id, name: "Admin B", email: ADMIN_B, passwordHash, role: "ADMIN", status: "ACTIVE" },
  });

  return { schoolA, schoolB, teacherA: teacherA! };
}

async function destroyFixtures() {
  for (const code of [SCHOOL_A_CODE, SCHOOL_B_CODE]) {
    await prisma.schoolApiAuditLog.deleteMany({ where: { school: { code } } });
    await prisma.schoolApiConfig.deleteMany({ where: { school: { code } } });
    await prisma.teacherSectionAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.teacherClassAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.section.deleteMany({ where: { class: { school: { code } } } });
    await prisma.class.deleteMany({ where: { school: { code } } });
    await prisma.academicSession.deleteMany({ where: { school: { code } } });
    await prisma.schoolSettings.deleteMany({ where: { school: { code } } });
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
app.use("/api/settings", settingsRouter);

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

// ────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────
test("Settings Module Test Suite", async (t) => {
  await ensureTestDatabaseExists();
  applyMigrationsToTestDatabase();
  const fixtures = await createFixtures();
  await startServer();

  t.after(async () => {
    await stopServer();
    await destroyFixtures();
    await prisma.$disconnect();
  });

  await t.test("1. Unauthenticated requests to settings endpoints are rejected (401)", async () => {
    const profileRes = await fetch(`${baseUrl}/api/settings/school-profile`);
    assert.equal(profileRes.status, 401);

    const putRes = await fetch(`${baseUrl}/api/settings/school-profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacked" }),
    });
    assert.equal(putRes.status, 401);

    const usersRes = await fetch(`${baseUrl}/api/settings/users`);
    assert.equal(usersRes.status, 401);
  });

  await t.test("2. GET school-profile works for any authenticated role and returns tenant-scoped data", async () => {
    for (const email of [ADMIN_A, TEACHER_A, PSYCH_A]) {
      const cookie = await loginUser(email);
      const res = await fetch(`${baseUrl}/api/settings/school-profile`, {
        headers: { Cookie: cookie },
      });
      assert.equal(res.status, 200);
      const data = await res.json();
      assert.equal(data.success, true);
      assert.equal(data.school.code, SCHOOL_A_CODE);
      assert.equal(data.school.name, "Settings School A");
      assert.equal(data.school.addressLine1, "100 Alpha Road");
      assert.equal(data.currentAcademicSession?.name, "2024-2025");
      // Settings defaults
      assert.equal(typeof data.settings.anonymizeExports, "boolean");
      assert.equal(typeof data.settings.require2FA, "boolean");
      // Must never leak forbidden fields
      assert.equal(data.settings.passwordHash, undefined);
      assert.equal(data.school.schoolId, undefined);
    }
  });

  await t.test("3. PUT school-profile is ADMIN-only (403 for TEACHER / PSYCHOLOGIST)", async () => {
    const teacherCookie = await loginUser(TEACHER_A);
    const teacherRes = await fetch(`${baseUrl}/api/settings/school-profile`, {
      method: "PUT",
      headers: { Cookie: teacherCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacked By Teacher" }),
    });
    assert.equal(teacherRes.status, 403);

    const psychCookie = await loginUser(PSYCH_A);
    const psychRes = await fetch(`${baseUrl}/api/settings/school-profile`, {
      method: "PUT",
      headers: { Cookie: psychCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacked By Psych" }),
    });
    assert.equal(psychRes.status, 403);

    // Ensure the attempted mutations did not persist
    const dbSchool = await prisma.school.findUnique({ where: { id: fixtures.schoolA.id } });
    assert.equal(dbSchool?.name, "Settings School A");
  });

  await t.test("4. ADMIN can update school profile and settings (real persistence)", async () => {
    const adminCookie = await loginUser(ADMIN_A);
    const res = await fetch(`${baseUrl}/api/settings/school-profile`, {
      method: "PUT",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        name: "Settings School A Renamed",
        city: "New Alpha City",
        defaultGradingSystem: "Standards-Based (1-4)",
        anonymizeExports: true,
        require2FA: true,
        timezone: "America/New_York",
        locale: "en-US",
      }),
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.school.name, "Settings School A Renamed");
    assert.equal(data.school.city, "New Alpha City");
    assert.equal(data.settings.defaultGradingSystem, "Standards-Based (1-4)");
    assert.equal(data.settings.anonymizeExports, true);
    assert.equal(data.settings.require2FA, true);
    assert.equal(data.settings.timezone, "America/New_York");

    // Verify persistence in DB
    const dbSchool = await prisma.school.findUnique({ where: { id: fixtures.schoolA.id } });
    assert.equal(dbSchool?.name, "Settings School A Renamed");
    const dbSettings = await prisma.schoolSettings.findUnique({ where: { schoolId: fixtures.schoolA.id } });
    assert.equal(dbSettings?.defaultGradingSystem, "Standards-Based (1-4)");
    assert.equal(dbSettings?.anonymizeExports, true);
    assert.equal(dbSettings?.require2FA, true);
    assert.equal(dbSettings?.timezone, "America/New_York");
  });

  await t.test("5. Tenant identity fields are rejected from the request body", async () => {
    const adminCookie = await loginUser(ADMIN_A);
    for (const forbidden of ["schoolId", "code", "status"]) {
      const res = await fetch(`${baseUrl}/api/settings/school-profile`, {
        method: "PUT",
        headers: { Cookie: adminCookie, "Content-Type": "application/json" },
        body: JSON.stringify({ [forbidden]: 999 }),
      });
      assert.equal(res.status, 400, `Body field "${forbidden}" must be rejected`);
    }
  });

  await t.test("6. Cross-tenant: School B cannot read or modify School A profile", async () => {
    const adminBCookie = await loginUser(ADMIN_B);

    const readRes = await fetch(`${baseUrl}/api/settings/school-profile`, {
      headers: { Cookie: adminBCookie },
    });
    assert.equal(readRes.status, 200);
    const readData = await readRes.json();
    assert.equal(readData.school.code, SCHOOL_B_CODE);
    assert.equal(readData.school.name, "Settings School B");

    // School B admin cannot spoof School A updates (schoolId always from JWT)
    const putRes = await fetch(`${baseUrl}/api/settings/school-profile`, {
      method: "PUT",
      headers: { Cookie: adminBCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ name: "Hacked School A", schoolId: fixtures.schoolA.id }),
    });
    assert.equal(putRes.status, 400); // schoolId rejected

    const dbSchoolA = await prisma.school.findUnique({ where: { id: fixtures.schoolA.id } });
    assert.equal(dbSchoolA?.name, "Settings School A Renamed");
  });

  await t.test("7. GET users is ADMIN-only and exposes real records with teacher access scopes (no secrets)", async () => {
    const teacherCookie = await loginUser(TEACHER_A);
    const teacherRes = await fetch(`${baseUrl}/api/settings/users`, {
      headers: { Cookie: teacherCookie },
    });
    assert.equal(teacherRes.status, 403);

    const adminCookie = await loginUser(ADMIN_A);
    const res = await fetch(`${baseUrl}/api/settings/users`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.users));
    assert.ok(data.users.length >= 3, "All School A users should be returned");

    const emails = data.users.map((u: any) => u.email);
    assert.ok(emails.includes(ADMIN_A));
    assert.ok(emails.includes(TEACHER_A));
    assert.ok(emails.includes(PSYCH_A));
    assert.ok(!emails.includes(ADMIN_B), "School B users must never appear");

    const teacher = data.users.find((u: any) => u.email === TEACHER_A);
    assert.ok(teacher.classAccess.includes("Grade A"));
    assert.ok(teacher.sectionAccess.some((s: any) => s.sectionName === "Section A1"));

    for (const u of data.users) {
      assert.equal(u.passwordHash, undefined, "passwordHash must never be exposed");
      assert.equal(u.googleId, undefined, "googleId must never be exposed");
      assert.equal(u.schoolId, undefined, "schoolId must never be exposed in user rows");
    }
  });
});