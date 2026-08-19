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
  console.error(`\n❌ [SCHOOL API TEST] Aborting: ${message}\n`);
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
const { studentsRouter } = await import("../src/server/students");
const { schoolApiRouter } = await import("../src/server/schoolApi");
const { validateUrlForSsrf, normalizeExternalStudent } = await import("../src/server/services/schoolApiService");
const { prisma } = await import("../src/lib/db");

// ────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────
const SCHOOL_CODE = "SCHOOL_API_TEST";
const ADMIN_EMAIL = "admin-school-api@example.com";
const TEACHER_EMAIL = "teacher-school-api@example.com";
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
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
}

async function createFixtures() {
  await prisma.schoolApiAuditLog.deleteMany({ where: { school: { code: SCHOOL_CODE } } });
  await prisma.student.deleteMany({ where: { school: { code: SCHOOL_CODE } } });
  await prisma.schoolApiConfig.deleteMany({ where: { school: { code: SCHOOL_CODE } } });
  await prisma.user.deleteMany({ where: { school: { code: SCHOOL_CODE } } });
  await prisma.school.deleteMany({ where: { code: SCHOOL_CODE } });

  const school = await prisma.school.create({
    data: {
      name: "School API Testing Academy",
      code: SCHOOL_CODE,
      status: "ACTIVE",
    },
  });

  const passwordHash = await bcrypt.hash(PASSWORD, 10);

  const adminUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      name: "Admin Tester",
      email: ADMIN_EMAIL,
      passwordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const teacherUser = await prisma.user.create({
    data: {
      schoolId: school.id,
      name: "Teacher Tester",
      email: TEACHER_EMAIL,
      passwordHash,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  const config = await prisma.schoolApiConfig.create({
    data: {
      schoolId: school.id,
      baseUrl: "https://mock-school-api.test/rest_school_assist/",
      schoolCode: "test_code",
      appVersion: "1.1",
      appOs: "web",
      isEnabled: true,
    },
  });

  return { school, adminUser, teacherUser, config };
}

// ────────────────────────────────────────────────────────────
// In-Memory Test Server Setup
// ────────────────────────────────────────────────────────────
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
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
    body: JSON.stringify({ email, password: PASSWORD, schoolCode: SCHOOL_CODE }),
  });
  const cookie = res.headers.get("set-cookie");
  assert.ok(cookie, "Login must return a set-cookie header");
  return cookie;
}

// ────────────────────────────────────────────────────────────
// Tests
// ────────────────────────────────────────────────────────────
test("School API & One-by-One Sync Module Test Suite", async (t) => {
  await ensureTestDatabaseExists();
  applyMigrationsToTestDatabase();
  await createFixtures();
  await startServer();

  t.after(async () => {
    await stopServer();
    await prisma.$disconnect();
  });

  await t.test("1. SSRF Guard: Blocks loopback, private IPs and non-HTTP protocols", () => {
    assert.equal(validateUrlForSsrf("http://localhost:3000/api").valid, false);
    assert.equal(validateUrlForSsrf("http://127.0.0.1/").valid, false);
    assert.equal(validateUrlForSsrf("http://10.0.0.5/api").valid, false);
    assert.equal(validateUrlForSsrf("http://192.168.1.1/api").valid, false);
    assert.equal(validateUrlForSsrf("http://169.254.169.254/latest/meta-data/").valid, false);
    assert.equal(validateUrlForSsrf("ftp://example.com/file").valid, false);
    assert.equal(validateUrlForSsrf("http://dmwerp.com/rest_school_assist/").valid, true);
    assert.equal(validateUrlForSsrf("https://api.schooldistrict.edu/v1/").valid, true);
  });

  await t.test("2. External Field Normalizer: Accurately normalizes Section 7 fields", () => {
    const rawExternal = {
      Pk_Student_M: "88402",
      V_AdmissionNo: "ADM-9941",
      V_RegistrationNo: "REG-2024",
      V_S_FName: "Arjun",
      V_S_MName: "K",
      V_S_LName: "Sharma",
      V_Email: "Arjun.Sharma@school.edu",
      V_ContactNo: "555-0199",
      V_AlternateNo: "555-0198",
      V_S_Gender: "Male",
      Dt_BirthDate: "2012-05-14T00:00:00",
      Fk_ClassId: "CLASS-04",
      Fk_SessionId: "SESS-2024",
      imgpath: "https://photos.edu/arjun.jpg",
      v_classname: "Grade 4",
    };

    const norm = normalizeExternalStudent(rawExternal);
    assert.equal(norm.externalStudentId, "88402");
    assert.equal(norm.admissionNo, "ADM-9941");
    assert.equal(norm.registrationNo, "REG-2024");
    assert.equal(norm.fullName, "Arjun K Sharma");
    assert.equal(norm.email, "arjun.sharma@school.edu");
    assert.equal(norm.gender, "Male");
    assert.equal(norm.externalClassId, "CLASS-04");
    assert.equal(norm.className, "Grade 4");
    assert.ok(norm.dateOfBirth instanceof Date);
  });

  await t.test("3. RBAC: Teachers are forbidden from reading or updating School API settings", async () => {
    const teacherCookie = await loginUser(TEACHER_EMAIL);

    const getRes = await fetch(`${baseUrl}/api/school-api/config`, {
      headers: { Cookie: teacherCookie },
    });
    assert.equal(getRes.status, 403);

    const putRes = await fetch(`${baseUrl}/api/school-api/config`, {
      method: "PUT",
      headers: { Cookie: teacherCookie, "Content-Type": "application/json" },
      body: JSON.stringify({ baseUrl: "https://evil.com", schoolCode: "evil" }),
    });
    assert.equal(putRes.status, 403);
  });

  await t.test("4. ADMIN Config: Admin can read and update API configuration without credential leakage", async () => {
    const adminCookie = await loginUser(ADMIN_EMAIL);

    const getRes = await fetch(`${baseUrl}/api/school-api/config`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(getRes.status, 200);
    const getData = await getRes.json();
    assert.equal(getData.success, true);
    assert.equal(getData.config.schoolCode, "test_code");
    assert.equal(getData.config.password, undefined); // Sensitive fields must never be returned!

    // Update config
    const putRes = await fetch(`${baseUrl}/api/school-api/config`, {
      method: "PUT",
      headers: { Cookie: adminCookie, "Content-Type": "application/json" },
      body: JSON.stringify({
        baseUrl: "https://updated-api.district.edu/rest_assist/",
        schoolCode: "westside_2024",
        appVersion: "1.2",
        appOs: "web",
        isEnabled: true,
      }),
    });
    assert.equal(putRes.status, 200);
    const putData = await putRes.json();
    assert.equal(putData.config.schoolCode, "westside_2024");
    assert.equal(putData.config.appVersion, "1.2");
  });

  await t.test("5. Audit Logging: Audit logs are recorded for operations and queryable by Admin", async () => {
    const adminCookie = await loginUser(ADMIN_EMAIL);

    const logsRes = await fetch(`${baseUrl}/api/school-api/audit-logs`, {
      headers: { Cookie: adminCookie },
    });
    assert.equal(logsRes.status, 200);
    const data = await logsRes.json();
    assert.equal(data.success, true);
    assert.ok(Array.isArray(data.logs));
  });
});
