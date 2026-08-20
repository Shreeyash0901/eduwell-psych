// tests/template-builder.test.ts
// Automated Test Suite for Assessment Template Builder

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
  console.error(`\n❌ [TEMPLATE BUILDER TEST] Aborting: ${message}\n`);
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

const FIXTURE_SCHOOL_CODE = "TMPL_BLD_A";
const FIXTURE_SCHOOL_B_CODE = "TMPL_BLD_B";
const PSYCH_EMAIL = "tmpl-psych-test@example.com";
const TEACHER_EMAIL = "tmpl-teacher-test@example.com";
const FIXTURE_PASSWORD = "password123";

let schoolAId = 0;
let schoolBId = 0;
let psychUserId = 0;
let teacherUserId = 0;

async function destroyFixtures() {
  const schools = await prisma.school.findMany({
    where: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } },
    select: { id: true },
  });
  const schoolIds = schools.map((s) => s.id);
  if (schoolIds.length > 0) {
    await prisma.assessmentScoringRule.deleteMany({ where: { assessmentTemplate: { schoolId: { in: schoolIds } } } });
    await prisma.assessmentResponse.deleteMany({ where: { studentAssessment: { schoolId: { in: schoolIds } } } });
    await prisma.assessmentDomainResult.deleteMany({ where: { studentAssessment: { schoolId: { in: schoolIds } } } });
    await prisma.studentAssessment.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.assessmentOption.deleteMany({ where: { question: { assessmentTemplate: { schoolId: { in: schoolIds } } } } });
    await prisma.assessmentQuestion.deleteMany({ where: { assessmentTemplate: { schoolId: { in: schoolIds } } } });
    await prisma.assessmentDomain.deleteMany({ where: { assessmentTemplate: { schoolId: { in: schoolIds } } } });
    await prisma.assessmentTemplate.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.user.deleteMany({ where: { schoolId: { in: schoolIds } } });
    await prisma.school.deleteMany({ where: { id: { in: schoolIds } } });
  }
}

async function createFixtures() {
  await destroyFixtures();

  const passwordHash = await bcrypt.hash(FIXTURE_PASSWORD, 10);

  const schoolA = await prisma.school.create({
    data: { name: "Template Test School A", code: FIXTURE_SCHOOL_CODE, status: "ACTIVE" },
  });
  schoolAId = schoolA.id;

  const psych = await prisma.user.create({
    data: {
      schoolId: schoolAId,
      name: "Template Psychologist",
      email: PSYCH_EMAIL,
      passwordHash,
      role: "PSYCHOLOGIST",
      status: "ACTIVE",
    },
  });
  psychUserId = psych.id;

  const teacher = await prisma.user.create({
    data: {
      schoolId: schoolAId,
      name: "Template Teacher",
      email: TEACHER_EMAIL,
      passwordHash,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });
  teacherUserId = teacher.id;

  const schoolB = await prisma.school.create({
    data: { name: "Template Test School B", code: FIXTURE_SCHOOL_B_CODE, status: "ACTIVE" },
  });
  schoolBId = schoolB.id;
}

let server: http.Server;
let baseUrl = "";

async function startServer(): Promise<void> {
  const app = express();
  app.use(express.json());
  app.use(cookieParser());
  app.use("/api/auth", authRouter);
  app.use("/api/assessments", assessmentsRouter);

  await new Promise<void>((resolve) => {
    server = app.listen(0, "127.0.0.1", () => {
      const addr = server.address() as { port: number };
      baseUrl = `http://127.0.0.1:${addr.port}`;
      resolve();
    });
  });
}

async function loginUser(email: string, password = FIXTURE_PASSWORD): Promise<string> {
  const res = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const setCookie = res.headers.get("set-cookie");
  if (!setCookie) throw new Error(`Login failed for ${email}: ${await res.text()}`);
  return setCookie.split(";")[0];
}

test("SETUP: Initialize test environment & fixtures", async () => {
  await createFixtures();
  await startServer();
  assert.ok(baseUrl.length > 0, "Test server must have started");
});

test("RBAC: Teacher cannot create an assessment template (403)", async () => {
  const teacherCookie = await loginUser(TEACHER_EMAIL);
  const res = await fetch(`${baseUrl}/api/assessments/templates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: teacherCookie,
    },
    body: JSON.stringify({
      name: "Teacher Attempt Protocol",
      domains: [{ name: "Focus" }],
      questions: [{ questionText: "Is student focused?" }],
    }),
  });

  assert.equal(res.status, 403, "Teacher should receive 403 Forbidden");
  const data = await res.json();
  assert.equal(data.success, false);
});

let createdTemplateId = 0;

test("BUILDER: Psychologist can create full template with domains, questions, options & scoring rules", async () => {
  const psychCookie = await loginUser(PSYCH_EMAIL);

  const payload = {
    name: "Comprehensive Behavioral Screening (CBS-24)",
    code: "CBS_24",
    description: "Multi-domain protocol assessing emotional regulation and focus.",
    version: "1.0",
    status: "DRAFT",
    domains: [
      { tempId: 1, name: "Emotional Regulation", description: "Coping with stress and emotional stability", displayOrder: 0 },
      { tempId: 2, name: "Focus & Attention", description: "Task persistence and classroom focus", displayOrder: 1 },
    ],
    questions: [
      {
        domainTempId: 1,
        questionText: "Student recovers quickly from unexpected disruptions.",
        questionType: "LIKERT",
        isRequired: true,
        displayOrder: 0,
        options: [
          { label: "Rarely", value: "rarely", score: 1, displayOrder: 0 },
          { label: "Sometimes", value: "sometimes", score: 2, displayOrder: 1 },
          { label: "Often", value: "often", score: 3, displayOrder: 2 },
          { label: "Almost Always", value: "always", score: 4, displayOrder: 3 },
        ],
      },
      {
        domainTempId: 2,
        questionText: "Student remains engaged during independent work sessions.",
        questionType: "LIKERT",
        isRequired: true,
        displayOrder: 1,
        options: [
          { label: "Rarely", value: "rarely", score: 1, displayOrder: 0 },
          { label: "Sometimes", value: "sometimes", score: 2, displayOrder: 1 },
          { label: "Often", value: "often", score: 3, displayOrder: 2 },
          { label: "Almost Always", value: "always", score: 4, displayOrder: 3 },
        ],
      },
    ],
    scoringRules: [
      { minScore: 1, maxScore: 4, resultLabel: "Attention Required", attentionLevel: "ATTENTION_REQUIRED" },
      { minScore: 5, maxScore: 6, resultLabel: "Monitor Closely", attentionLevel: "MONITOR" },
      { minScore: 7, maxScore: 8, resultLabel: "Optimal Wellbeing", attentionLevel: "OPTIMAL" },
    ],
  };

  const res = await fetch(`${baseUrl}/api/assessments/templates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: psychCookie,
    },
    body: JSON.stringify(payload),
  });

  const data = await res.json();
  assert.equal(res.status, 201, `Template creation should return 201: ${JSON.stringify(data)}`);
  assert.equal(data.success, true);
  assert.ok(data.template.id, "Template must have an id");
  assert.equal(data.template.name, "Comprehensive Behavioral Screening (CBS-24)");
  assert.equal(data.template.domains.length, 2);
  assert.equal(data.template.questions.length, 2);
  assert.equal(data.template.questions[0].options.length, 4);
  assert.equal(data.template.scoringRules.length, 3);

  createdTemplateId = data.template.id;
});

test("BUILDER: Psychologist can query deep template structure via /templates/:id/full", async () => {
  const psychCookie = await loginUser(PSYCH_EMAIL);

  const res = await fetch(`${baseUrl}/api/assessments/templates/${createdTemplateId}/full`, {
    headers: { Cookie: psychCookie },
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.template.id, createdTemplateId);
  assert.equal(data.template.domains.length, 2);
  assert.equal(data.template.questions.length, 2);
  assert.equal(data.template.scoringRules.length, 3);
});

test("STATUS: Psychologist can transition template status DRAFT -> PUBLISHED", async () => {
  const psychCookie = await loginUser(PSYCH_EMAIL);

  const res = await fetch(`${baseUrl}/api/assessments/templates/${createdTemplateId}/status`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      Cookie: psychCookie,
    },
    body: JSON.stringify({ status: "PUBLISHED" }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.template.status, "PUBLISHED");
});

test("LIST: Staff can list all templates using ?status=all", async () => {
  const psychCookie = await loginUser(PSYCH_EMAIL);

  const res = await fetch(`${baseUrl}/api/assessments/templates?status=all`, {
    headers: { Cookie: psychCookie },
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.ok(data.templates.some((t: any) => t.id === createdTemplateId));
});

test("DELETE: Psychologist can delete unused draft template", async () => {
  const psychCookie = await loginUser(PSYCH_EMAIL);

  // Create a throwaway draft template
  const createRes = await fetch(`${baseUrl}/api/assessments/templates`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: psychCookie,
    },
    body: JSON.stringify({
      name: "Temporary Throwaway Protocol",
      domains: [{ name: "General" }],
      questions: [{ questionText: "Test question?" }],
    }),
  });

  const createData = await createRes.json();
  const throwawayId = createData.template.id;

  const deleteRes = await fetch(`${baseUrl}/api/assessments/templates/${throwawayId}`, {
    method: "DELETE",
    headers: { Cookie: psychCookie },
  });

  assert.equal(deleteRes.status, 200);
  const deleteData = await deleteRes.json();
  assert.equal(deleteData.success, true);
});

test("TEARDOWN: Clean up test fixtures and close server", async () => {
  await destroyFixtures();
  await new Promise<void>((resolve) => {
    if (server) server.close(() => resolve());
    else resolve();
  });
  await prisma.$disconnect();
});
