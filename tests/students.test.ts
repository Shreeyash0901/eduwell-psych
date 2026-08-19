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
  console.error(`\n❌ [STUDENTS TEST] Aborting: ${message}\n`);
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
    abort("TEST_DATABASE_URL and DATABASE_URL point to the same database. Test cleanup must never target the development database.");
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
const { lookupsRouter } = await import("../src/server/lookups");
const { prisma } = await import("../src/lib/db");

// ────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────
const SCHOOL_CODE = "STUDENTS_TEST";
const ADMIN_EMAIL = "admin-stu-test@example.com";
const TEACHER_EMAIL = "teacher-stu-test@example.com";
const PSYCH_EMAIL = "psych-stu-test@example.com";
const PASSWORD = "password123";

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
  execSync("npx prisma db push --accept-data-loss", { stdio: "inherit", env: { ...process.env, PRISMA_USER_CONSENT_FOR_DANGEROUS_AI_ACTION: "yes" } });
}

async function createFixtures() {
  await prisma.teacherSectionAccess.deleteMany({ where: { user: { email: { in: [ADMIN_EMAIL, TEACHER_EMAIL, PSYCH_EMAIL] } } } });
  await prisma.teacherClassAccess.deleteMany({ where: { user: { email: { in: [ADMIN_EMAIL, TEACHER_EMAIL, PSYCH_EMAIL] } } } });
  await prisma.student.deleteMany({ where: { school: { code: SCHOOL_CODE } } });
  await prisma.section.deleteMany({ where: { class: { school: { code: SCHOOL_CODE } } } });
  await prisma.class.deleteMany({ where: { school: { code: SCHOOL_CODE } } });
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN_EMAIL, TEACHER_EMAIL, PSYCH_EMAIL] } } });
  await prisma.school.deleteMany({ where: { code: SCHOOL_CODE } });

  const school = await prisma.school.create({
    data: { name: "Student Test School", code: SCHOOL_CODE, status: "ACTIVE" },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);
  
  await prisma.user.createMany({
    data: [
      { schoolId: school.id, name: "Admin", email: ADMIN_EMAIL, passwordHash, role: "ADMIN", status: "ACTIVE" },
      { schoolId: school.id, name: "Teacher", email: TEACHER_EMAIL, passwordHash, role: "TEACHER", status: "ACTIVE" },
      { schoolId: school.id, name: "Psychologist", email: PSYCH_EMAIL, passwordHash, role: "PSYCHOLOGIST", status: "ACTIVE" },
    ]
  });

  const teacher = await prisma.user.findFirst({ where: { email: TEACHER_EMAIL } });

  const cls1 = await prisma.class.create({ data: { schoolId: school.id, name: "Class 1", isActive: true, displayOrder: 1 } });
  const cls2 = await prisma.class.create({ data: { schoolId: school.id, name: "Class 2", isActive: true, displayOrder: 2 } });

  const sec1A = await prisma.section.create({ data: { classId: cls1.id, name: "A", isActive: true } });
  const sec2B = await prisma.section.create({ data: { classId: cls2.id, name: "B", isActive: true } });

  // Give teacher access to class 1 only (which includes Section 1A)
  await prisma.teacherClassAccess.create({
    data: { userId: teacher!.id, classId: cls1.id }
  });

  await prisma.student.createMany({
    data: [
      { schoolId: school.id, studentId: "STU-001", firstName: "Alice", lastName: "Smith", classId: cls1.id, sectionId: sec1A.id, isActive: true },
      { schoolId: school.id, studentId: "STU-002", firstName: "Bob", lastName: "Jones", classId: cls2.id, sectionId: sec2B.id, isActive: true },
    ]
  });
}

async function destroyFixtures() {
  await prisma.teacherSectionAccess.deleteMany({ where: { user: { email: { in: [ADMIN_EMAIL, TEACHER_EMAIL, PSYCH_EMAIL] } } } });
  await prisma.teacherClassAccess.deleteMany({ where: { user: { email: { in: [ADMIN_EMAIL, TEACHER_EMAIL, PSYCH_EMAIL] } } } });
  await prisma.student.deleteMany({ where: { school: { code: SCHOOL_CODE } } });
  await prisma.section.deleteMany({ where: { class: { school: { code: SCHOOL_CODE } } } });
  await prisma.class.deleteMany({ where: { school: { code: SCHOOL_CODE } } });
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN_EMAIL, TEACHER_EMAIL, PSYCH_EMAIL] } } });
  await prisma.school.deleteMany({ where: { code: SCHOOL_CODE } });
}

// ────────────────────────────────────────────────────────────
// Test server
// ────────────────────────────────────────────────────────────
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
app.use("/api/lookups", lookupsRouter);

let server: http.Server;
let baseUrl: string;
let authUrl: string;
let lookupsUrl: string;

test.before(async () => {
  await ensureTestDatabaseExists();
  applyMigrationsToTestDatabase();
  await createFixtures();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as { port: number };
      baseUrl = `http://localhost:${address.port}/api/students`;
      authUrl = `http://localhost:${address.port}/api/auth`;
      lookupsUrl = `http://localhost:${address.port}/api/lookups`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await destroyFixtures();
  await prisma.$disconnect();
});

async function login(email: string) {
  const res = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  const cookie = res.headers.get("set-cookie")?.split(";")[0] || "";
  return cookie;
}

test("1. Unauthenticated request to /api/students is rejected", async () => {
  const res = await fetch(baseUrl);
  assert.equal(res.status, 401);
});

test("2. Admin & Psychologist receive full student data with real confidential fields", async () => {
  // Test ADMIN access
  const adminCookie = await login(ADMIN_EMAIL);
  const adminRes = await fetch(baseUrl, { headers: { Cookie: adminCookie } });
  assert.equal(adminRes.status, 200);
  const adminData = await adminRes.json();
  assert.equal(adminData.success, true);
  assert.equal(adminData.students.length, 2);
  
  // Verify non-empty confidential fields
  const student = adminData.students[0];
  assert.ok(typeof student.iepStatus === "string" && student.iepStatus.length > 0);
  assert.ok(typeof student.status === "string" && student.status.length > 0);
  assert.ok(typeof student.priorObsCount === "number");

  // Test PSYCHOLOGIST access
  const psychCookie = await login(PSYCH_EMAIL);
  const psychRes = await fetch(baseUrl, { headers: { Cookie: psychCookie } });
  assert.equal(psychRes.status, 200);
  const psychData = await psychRes.json();
  assert.equal(psychData.success, true);
  assert.equal(psychData.students.length, 2);

  const psychStudent = psychData.students[0];
  assert.ok(typeof psychStudent.iepStatus === "string" && psychStudent.iepStatus.length > 0);
  assert.ok(typeof psychStudent.status === "string" && psychStudent.status.length > 0);
});

test("3. Teacher role restrictions: teacher only sees permitted classes and sensitive fields are masked", async () => {
  const cookie = await login(TEACHER_EMAIL);
  const res = await fetch(baseUrl, { headers: { Cookie: cookie } });
  
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  
  // Teacher has access to Class 1 only, so should only see Alice
  assert.equal(data.students.length, 1);
  assert.equal(data.students[0].firstName, "Alice");
  
  // Confidential fields MUST be undefined/omitted for teacher
  const student = data.students[0];
  assert.equal(student.iepStatus, undefined);
  assert.equal(student.status, undefined);
  assert.equal(student.domainScores, undefined);
  assert.equal(student.primaryDomainFlag, undefined);
  assert.equal(student.scoreFlag, undefined);
  assert.equal(student.priorObsCount, undefined);
});

test("4. Missing students / Unauthorized specific student profile access", async () => {
  const cookie = await login(TEACHER_EMAIL);
  // Teacher tries to fetch Bob (who is in Class 2)
  const bob = await prisma.student.findFirst({ where: { studentId: "STU-002" } });
  
  const res = await fetch(`${baseUrl}/${bob!.id}`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 404);
  const data = await res.json();
  assert.equal(data.success, false);
});

test("5. Filter lookups scoping: Teachers only see assigned classes and sections in lookups", async () => {
  // Teacher lookup
  const teacherCookie = await login(TEACHER_EMAIL);
  const teacherRes = await fetch(`${lookupsUrl}/student-filters`, { headers: { Cookie: teacherCookie } });
  assert.equal(teacherRes.status, 200);
  const teacherData = await teacherRes.json();
  assert.equal(teacherData.success, true);
  // Teacher has only Class 1 assigned
  assert.equal(teacherData.classes.length, 1);
  assert.equal(teacherData.classes[0].name, "Class 1");
  assert.equal(teacherData.sections.length, 1);
  assert.equal(teacherData.sections[0].name, "A");

  // Admin lookup
  const adminCookie = await login(ADMIN_EMAIL);
  const adminRes = await fetch(`${lookupsUrl}/student-filters`, { headers: { Cookie: adminCookie } });
  assert.equal(adminRes.status, 200);
  const adminData = await adminRes.json();
  assert.equal(adminData.success, true);
  // Admin sees all classes and sections
  assert.equal(adminData.classes.length, 2);
  assert.equal(adminData.sections.length, 2);
});

test("6. Pagination works correctly", async () => {
  const cookie = await login(ADMIN_EMAIL);
  const res = await fetch(`${baseUrl}?page=1&limit=1`, { headers: { Cookie: cookie } });
  
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.students.length, 1);
  assert.equal(data.pagination.total, 2);
  assert.equal(data.pagination.totalPages, 2);
});

