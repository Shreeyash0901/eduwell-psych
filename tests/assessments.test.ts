// tests/assessments.test.ts
// Automated Test Suite for EduWell Psych Assessments API

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
// Safety guard: run BEFORE any test migration, fixture, or cleanup.
// ────────────────────────────────────────────────────────────
function abort(message: string): never {
  console.error(`\n❌ [ASSESSMENTS TEST] Aborting: ${message}\n`);
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
const { assessmentsRouter } = await import("../src/server/assessments");
const { prisma } = await import("../src/lib/db");

// ────────────────────────────────────────────────────────────
// Fixtures
// ────────────────────────────────────────────────────────────
const FIXTURE_SCHOOL_CODE = "ASMT_TEST_A";
const FIXTURE_SCHOOL_B_CODE = "ASMT_TEST_B";
const PSYCH_EMAIL = "asmt-psych-test@example.com";
const TEACHER_EMAIL = "asmt-teacher-test@example.com";
const FIXTURE_PASSWORD = "password123";

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

let schoolAId = 0;
let schoolBId = 0;
let psychUserId = 0;
let teacherUserId = 0;
let studentA1Id = 0;
let studentA2Id = 0;
let studentB1Id = 0;
let templateId = 0;
let question1Id = 0;
let question2Id = 0;
let option1Id = 0;
let option2Id = 0;

async function createFixtures() {
  await destroyFixtures();

  const passwordHash = await bcrypt.hash(FIXTURE_PASSWORD, 10);

  const schoolA = await prisma.school.create({
    data: { name: "Assessments Test School A", code: FIXTURE_SCHOOL_CODE, status: "ACTIVE" },
  });
  schoolAId = schoolA.id;

  const psych = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      name: "Asmt Test Psychologist",
      email: PSYCH_EMAIL,
      passwordHash,
      role: "PSYCHOLOGIST",
      status: "ACTIVE",
    },
  });
  psychUserId = psych.id;

  const teacher = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      name: "Asmt Test Teacher",
      email: TEACHER_EMAIL,
      passwordHash,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });
  teacherUserId = teacher.id;

  const classA1 = await prisma.class.create({ data: { schoolId: schoolA.id, name: "5A" } });
  const classA2 = await prisma.class.create({ data: { schoolId: schoolA.id, name: "6C" } });
  await prisma.teacherClassAccess.create({ data: { userId: teacher.id, classId: classA1.id } });

  const sA1 = await prisma.student.create({
    data: { schoolId: schoolA.id, studentId: "ASMT-STU-A1", fullName: "Student Alpha", classId: classA1.id },
  });
  studentA1Id = sA1.id;

  const sA2 = await prisma.student.create({
    data: { schoolId: schoolA.id, studentId: "ASMT-STU-A2", fullName: "Student Beta", classId: classA2.id },
  });
  studentA2Id = sA2.id;

  const schoolB = await prisma.school.create({
    data: { name: "Assessments Test School B", code: FIXTURE_SCHOOL_B_CODE, status: "ACTIVE" },
  });
  schoolBId = schoolB.id;

  const sB1 = await prisma.student.create({
    data: { schoolId: schoolB.id, studentId: "ASMT-STU-B1", fullName: "Student Gamma" },
  });
  studentB1Id = sB1.id;

  // Create assessment template
  const template = await prisma.assessmentTemplate.create({
    data: {
      schoolId: schoolA.id,
      name: "Test Protocol",
      description: "Test description",
      category: "CLINICAL",
      status: "PUBLISHED",
      version: "1.0",
      createdBy: psych.id
    }
  });
  templateId = template.id;

  const domain = await prisma.assessmentDomain.create({
    data: {
      assessmentTemplateId: template.id,
      name: "Test Domain"
    }
  });

  const q1 = await prisma.assessmentQuestion.create({
    data: {
      assessmentTemplateId: template.id,
      domainId: domain.id,
      questionText: "Question 1",
      questionType: "MULTIPLE_CHOICE",
      displayOrder: 1,
      isRequired: true
    }
  });
  question1Id = q1.id;

  const q2 = await prisma.assessmentQuestion.create({
    data: {
      assessmentTemplateId: template.id,
      domainId: domain.id,
      questionText: "Question 2",
      questionType: "MULTIPLE_CHOICE",
      displayOrder: 2,
      isRequired: true
    }
  });
  question2Id = q2.id;

  const opt1 = await prisma.assessmentOption.create({
    data: { questionId: q1.id, label: "Yes", value: "Yes", score: 1, displayOrder: 1 }
  });
  option1Id = opt1.id;
  const opt2 = await prisma.assessmentOption.create({
    data: { questionId: q1.id, label: "No", value: "No", score: 0, displayOrder: 2 }
  });
  const opt3 = await prisma.assessmentOption.create({
    data: { questionId: q2.id, label: "Yes", value: "Yes", score: 1, displayOrder: 1 }
  });
  option2Id = opt3.id;

  await prisma.assessmentScoringRule.create({
    data: {
      assessmentTemplateId: template.id,
      scope: "OVERALL",
      minScore: 0,
      maxScore: 1,
      resultLabel: "Normal",
      attentionLevel: "NORMAL"
    }
  });
  await prisma.assessmentScoringRule.create({
    data: {
      assessmentTemplateId: template.id,
      scope: "OVERALL",
      minScore: 2,
      maxScore: 2,
      resultLabel: "Critical",
      attentionLevel: "CRITICAL"
    }
  });
}

async function destroyFixtures() {
  await prisma.assessmentDomainResult.deleteMany();
  await prisma.assessmentResponse.deleteMany();
  await prisma.studentAssessment.deleteMany();
  await prisma.assessmentScoringRule.deleteMany();
  await prisma.assessmentOption.deleteMany();
  await prisma.assessmentQuestion.deleteMany();
  await prisma.assessmentDomain.deleteMany();
  await prisma.assessmentTemplate.deleteMany();
  await prisma.teacherClassAccess.deleteMany({ where: { user: { email: TEACHER_EMAIL } } });
  await prisma.student.deleteMany({ where: { school: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } } });
  await prisma.class.deleteMany({ where: { school: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } } });
  await prisma.user.deleteMany({ where: { school: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } } });
  await prisma.school.deleteMany({ where: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } });
}

const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/assessments", assessmentsRouter);

let server: http.Server;
let baseUrl: string;
let authUrl: string;

test.before(async () => {
  await ensureTestDatabaseExists();
  applyMigrationsToTestDatabase();
  await createFixtures();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as { port: number };
      baseUrl = `http://localhost:${address.port}/api/assessments`;
      authUrl = `http://localhost:${address.port}/api/auth`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await destroyFixtures();
  await prisma.$disconnect();
});

async function login(email: string): Promise<string> {
  const res = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: FIXTURE_PASSWORD }),
  });
  const setCookie = res.headers.get("set-cookie");
  return setCookie!.split(";")[0];
}

test("1. Unauthenticated requests are rejected", async () => {
  const res = await fetch(`${baseUrl}/templates`);
  assert.equal(res.status, 401);
});

test("2. Psychologists can fetch templates", async () => {
  const cookie = await login(PSYCH_EMAIL);
  const res = await fetch(`${baseUrl}/templates`, { headers: { Cookie: cookie } });
  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.templates.length > 0);
  assert.equal(data.templates[0].id, templateId);
});

test("3. Teacher is scoped to assigned classes when starting assessment", async () => {
  const teacherCookie = await login(TEACHER_EMAIL);
  
  // Teacher can start for student A1 (in class)
  const res1 = await fetch(`${baseUrl}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({ studentId: studentA1Id, assessmentTemplateId: templateId }),
  });
  assert.equal(res1.status, 201);

  // Teacher cannot start for student A2 (not in class)
  const res2 = await fetch(`${baseUrl}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({ studentId: studentA2Id, assessmentTemplateId: templateId }),
  });
  assert.equal(res2.status, 403);
});

test("4. Full assessment lifecycle (Start -> Respond -> Complete -> History)", async () => {
  const cookie = await login(PSYCH_EMAIL);
  
  // 4a. Start
  const startRes = await fetch(`${baseUrl}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ studentId: studentA1Id, assessmentTemplateId: templateId }),
  });
  const startData = await startRes.json();
  assert.equal(startRes.status, 201);
  const assessmentId = startData.assessment.id;
  
  // 4b. Respond
  const respondRes = await fetch(`${baseUrl}/${assessmentId}/responses`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      responses: [
        { questionId: question1Id, selectedOptionId: option1Id },
        { questionId: question2Id, selectedOptionId: option2Id },
      ]
    }),
  });
  assert.equal(respondRes.status, 200);
  
  // 4c. Complete
  const completeRes = await fetch(`${baseUrl}/${assessmentId}/complete`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  const completeData = await completeRes.json();
  assert.equal(completeRes.status, 200);
  assert.equal(completeData.assessment.status, "COMPLETED");
  assert.equal(completeData.assessment.overallScore, "2"); // 1 + 1 = 2
  assert.equal(completeData.assessment.attentionLevel, "CRITICAL");
  
  // 4d. History
  const historyRes = await fetch(`${baseUrl}/student/${studentA1Id}`, {
    headers: { Cookie: cookie },
  });
  const historyData = await historyRes.json();
  assert.equal(historyRes.status, 200);
  assert.equal(historyData.success, true);
  assert.ok(historyData.assessments.find((a: any) => a.id === assessmentId));
});

test("5. /start is idempotent for IN_PROGRESS assessments", async () => {
  const cookie = await login(PSYCH_EMAIL);
  
  // Call start once
  const startRes1 = await fetch(`${baseUrl}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ studentId: studentA2Id, assessmentTemplateId: templateId }),
  });
  const startData1 = await startRes1.json();
  assert.equal(startRes1.status, 201);
  const assessmentId1 = startData1.assessment.id;
  
  // Call start again
  const startRes2 = await fetch(`${baseUrl}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ studentId: studentA2Id, assessmentTemplateId: templateId }),
  });
  const startData2 = await startRes2.json();
  assert.equal(startRes2.status, 201);
  const assessmentId2 = startData2.assessment.id;

  assert.equal(assessmentId1, assessmentId2, "Idempotency failed: duplicate sessions created.");
});
