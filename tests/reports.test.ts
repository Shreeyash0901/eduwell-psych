// tests/reports.test.ts
import "dotenv/config";
import test from "node:test";
import assert from "node:assert/strict";
import { execSync } from "node:child_process";
import bcrypt from "bcryptjs";
import { Client } from "pg";
import express from "express";
import http from "http";
import cookieParser from "cookie-parser";

function abort(message: string): never {
  console.error(`\n❌ [REPORTS TEST] Aborting: ${message}\n`);
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

const testUrl = process.env.TEST_DATABASE_URL;
if (!testUrl || !testUrl.trim() || !parseDbUrl(testUrl).database.toLowerCase().endsWith("_test")) {
  abort("TEST_DATABASE_URL must be set and end with _test.");
}

process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL!;

// We must import these after overriding the environment variables
import { prisma } from "../src/lib/db";
import { authRouter } from "../src/server/auth";
import { reportsRouter } from "../src/server/reports";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/reports", reportsRouter);

const server = http.createServer(app);
const PORT = 4004; // Use a different port for reports tests
const baseUrl = `http://localhost:${PORT}/api/reports`;

// Test Users and Fixtures
const ADMIN_EMAIL = "admin_reports@eduwell.com";
const TEACHER_EMAIL = "teacher_reports@eduwell.com";
const PSYCH_EMAIL = "psych_reports@eduwell.com";
const PASSWORD = "Password123!";

let adminCookie = "";
let teacherCookie = "";
let psychCookie = "";
let student1Id: number;

async function setupDatabase() {
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
  } catch (error) {
    console.error("Failed to setup test database:", error);
  } finally {
    await admin.end();
  }
}

async function createFixtures() {
  await prisma.reportSnapshot.deleteMany({ where: { report: { school: { code: "REP_HIGH" } } } });
  await prisma.report.deleteMany({ where: { school: { code: "REP_HIGH" } } });
  await prisma.teacherSectionAccess.deleteMany({ where: { user: { email: { in: [ADMIN_EMAIL, PSYCH_EMAIL, TEACHER_EMAIL] } } } });
  await prisma.teacherClassAccess.deleteMany({ where: { user: { email: { in: [ADMIN_EMAIL, PSYCH_EMAIL, TEACHER_EMAIL] } } } });
  await prisma.student.deleteMany({ where: { school: { code: "REP_HIGH" } } });
  await prisma.section.deleteMany({ where: { class: { school: { code: "REP_HIGH" } } } });
  await prisma.class.deleteMany({ where: { school: { code: "REP_HIGH" } } });
  await prisma.academicSession.deleteMany({ where: { school: { code: "REP_HIGH" } } });
  await prisma.user.deleteMany({ where: { email: { in: [ADMIN_EMAIL, PSYCH_EMAIL, TEACHER_EMAIL] } } });
  await prisma.school.deleteMany({ where: { code: "REP_HIGH" } });

  const school = await prisma.school.create({
    data: { name: "Reports High", code: "REP_HIGH", status: "ACTIVE" }
  });

  const pw = await bcrypt.hash(PASSWORD, 10);
  const admin = await prisma.user.create({
    data: { schoolId: school.id, name: "Admin", email: ADMIN_EMAIL, passwordHash: pw, role: "ADMIN" }
  });
  const psych = await prisma.user.create({
    data: { schoolId: school.id, name: "Psych", email: PSYCH_EMAIL, passwordHash: pw, role: "PSYCHOLOGIST" }
  });
  const teacher = await prisma.user.create({
    data: { schoolId: school.id, name: "Teacher", email: TEACHER_EMAIL, passwordHash: pw, role: "TEACHER" }
  });

  const cls = await prisma.class.create({
    data: { schoolId: school.id, name: "Grade 10" }
  });
  const sec = await prisma.section.create({
    data: { classId: cls.id, name: "A" }
  });

  const student = await prisma.student.create({
    data: {
      schoolId: school.id,
      studentId: "STU-R1",
      firstName: "Report",
      lastName: "Student",
      classId: cls.id,
      sectionId: sec.id
    }
  });
  student1Id = student.id;

  // Give teacher access to class
  await prisma.teacherClassAccess.create({
    data: { userId: teacher.id, classId: cls.id }
  });
}

test.before(async () => {
  await setupDatabase();
  console.log("  Applying migrations to the test database...");
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL } });
  
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  await prisma.$connect();
  await createFixtures();

  await new Promise<void>((resolve) => server.listen(PORT, resolve));
});

test.after(async () => {
  await prisma.$disconnect();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

async function login(email: string) {
  const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert.equal(res.status, 200, `Login failed for ${email}`);
  const cookies = res.headers.get("set-cookie");
  return cookies ? cookies.split(";")[0] : "";
}

test("1. Unauthenticated requests are rejected", async () => {
  const res = await fetch(baseUrl);
  assert.equal(res.status, 401);
});

test("2. Psychologists can generate and view reports", async () => {
  psychCookie = await login(PSYCH_EMAIL);
  
  const generateRes = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: psychCookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Student R1 Report",
      studentId: student1Id
    })
  });
  const genData = await generateRes.json();
  assert.equal(generateRes.status, 201);
  assert.equal(genData.success, true);
  const reportId = genData.report.id;

  const viewRes = await fetch(`${baseUrl}/${reportId}`, {
    headers: { Cookie: psychCookie }
  });
  const viewData = await viewRes.json();
  assert.equal(viewRes.status, 200);
  assert.equal(viewData.report.title, "Student R1 Report");
});

test("3. Teacher RBAC limits report generation to assigned classes", async () => {
  teacherCookie = await login(TEACHER_EMAIL);
  
  // Create a student in a class the teacher doesn't have access to
  const school = await prisma.school.findFirst({ where: { code: "REP_HIGH" } });
  const cls2 = await prisma.class.create({ data: { schoolId: school!.id, name: `Grade 11-${Date.now()}` } });
  const student2 = await prisma.student.create({
    data: { schoolId: school!.id, studentId: `STU-R2-${Date.now()}`, firstName: "Other", classId: cls2.id }
  });

  const generateRes = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Student R2 Report",
      studentId: student2.id
    })
  });
  
  // Should fail because teacher lacks access
  assert.equal(generateRes.status, 403);
});

test("4. PDF Export works", async () => {
  // Use psych to get a valid report
  const listRes = await fetch(baseUrl, { headers: { Cookie: psychCookie } });
  const listData = await listRes.json();
  const reportId = listData.reports[0].id;

  const exportRes = await fetch(`${baseUrl}/${reportId}/export?format=pdf`, {
    headers: { Cookie: psychCookie }
  });
  assert.equal(exportRes.status, 200);
  assert.equal(exportRes.headers.get("content-type"), "application/pdf");
});
