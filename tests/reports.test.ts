// tests/reports.test.ts
// Comprehensive Report & Clinical Access Security Test Suite

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

import { prisma } from "../src/lib/db";
import { authRouter } from "../src/server/auth";
import { reportsRouter } from "../src/server/reports";
import { assessmentsRouter } from "../src/server/assessments";
import { observationsRouter } from "../src/server/observations";

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/assessments", assessmentsRouter);
app.use("/api/observations", observationsRouter);

const server = http.createServer(app);
const PORT = 4004;
const baseUrl = `http://localhost:${PORT}/api/reports`;
const assessmentsUrl = `http://localhost:${PORT}/api/assessments`;

// Sentinels for clinical data leak verification
const SENTINEL_PSYCH_NOTE = "CONFIDENTIAL_PSYCHOLOGIST_NOTE_DO_NOT_EXPOSE";
const SENTINEL_AI_ANALYSIS = "PRIVATE_AI_ANALYSIS_DO_NOT_EXPOSE";
const SENTINEL_PROF_INTERP = "CONFIDENTIAL_PROFESSIONAL_INTERPRETATION_DO_NOT_EXPOSE";
const SENTINEL_RECOMMENDATION = "CONFIDENTIAL_RECOMMENDATION_DO_NOT_EXPOSE";
const SENTINEL_CLINICAL_NOTES = "CONFIDENTIAL_CLINICAL_NOTES_DO_NOT_EXPOSE";

// Users
const ADMIN_A = "admin_rep_a@eduwell.com";
const PSYCH_A = "psych_rep_a@eduwell.com";
const TEACHER_CLASS_A = "teacher_class_a@eduwell.com";
const TEACHER_SEC_A = "teacher_sec_a@eduwell.com";
const TEACHER_UNASSIGNED_A = "teacher_unassigned_a@eduwell.com";

const ADMIN_B = "admin_rep_b@eduwell.com";
const PSYCH_B = "psych_rep_b@eduwell.com";
const TEACHER_B = "teacher_rep_b@eduwell.com";

const PASSWORD = "Password123!";

let schoolAId: number;
let schoolBId: number;
let classAId: number;
let sectionA1Id: number;
let sectionA2Id: number;
let studentA1Id: number;
let studentA2Id: number;
let sessionAId: number;

let classBId: number;
let studentB1Id: number;

let adminACookie = "";
let psychACookie = "";
let teacherClassACookie = "";
let teacherSecACookie = "";
let teacherUnassignedACookie = "";
let psychBCookie = "";

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
  const suiteCodes = ["REP_SEC_A", "REP_SEC_B"];
  for (const code of suiteCodes) {
    await prisma.reportSnapshot.deleteMany({ where: { report: { school: { code } } } });
    await prisma.report.deleteMany({ where: { school: { code } } });
    await prisma.assessmentDomainResult.deleteMany({ where: { studentAssessment: { school: { code } } } });
    await prisma.assessmentResponse.deleteMany({ where: { studentAssessment: { school: { code } } } });
    await prisma.studentAssessment.deleteMany({ where: { school: { code } } });
    await prisma.assessmentOption.deleteMany({ where: { question: { assessmentTemplate: { school: { code } } } } });
    await prisma.assessmentQuestion.deleteMany({ where: { assessmentTemplate: { school: { code } } } });
    await prisma.assessmentScoringRule.deleteMany({ where: { assessmentTemplate: { school: { code } } } });
    await prisma.assessmentDomain.deleteMany({ where: { assessmentTemplate: { school: { code } } } });
    await prisma.assessmentTemplate.deleteMany({ where: { school: { code } } });
    await prisma.studentObservation.deleteMany({ where: { school: { code } } });
    await prisma.teacherSectionAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.teacherClassAccess.deleteMany({ where: { user: { school: { code } } } });
    await prisma.student.deleteMany({ where: { school: { code } } });
    await prisma.section.deleteMany({ where: { class: { school: { code } } } });
    await prisma.class.deleteMany({ where: { school: { code } } });
    await prisma.academicSession.deleteMany({ where: { school: { code } } });
    await prisma.user.deleteMany({ where: { school: { code } } });
    await prisma.school.deleteMany({ where: { code } });
  }

  const pw = await bcrypt.hash(PASSWORD, 10);

  // ── School A ──
  const schoolA = await prisma.school.create({
    data: { name: "Security School A", code: "REP_SEC_A", status: "ACTIVE" },
  });
  schoolAId = schoolA.id;

  const sessionA = await prisma.academicSession.create({
    data: {
      schoolId: schoolA.id,
      name: "2025-2026 Academic Year",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });
  sessionAId = sessionA.id;

  const adminA = await prisma.user.create({
    data: { schoolId: schoolA.id, name: "Admin A", email: ADMIN_A, passwordHash: pw, role: "ADMIN" },
  });
  const psychA = await prisma.user.create({
    data: { schoolId: schoolA.id, name: "Psych A", email: PSYCH_A, passwordHash: pw, role: "PSYCHOLOGIST" },
  });
  const teacherClassA = await prisma.user.create({
    data: { schoolId: schoolA.id, name: "Teacher Class A", email: TEACHER_CLASS_A, passwordHash: pw, role: "TEACHER" },
  });
  const teacherSecA = await prisma.user.create({
    data: { schoolId: schoolA.id, name: "Teacher Sec A", email: TEACHER_SEC_A, passwordHash: pw, role: "TEACHER" },
  });
  const teacherUnassignedA = await prisma.user.create({
    data: { schoolId: schoolA.id, name: "Teacher Unassigned A", email: TEACHER_UNASSIGNED_A, passwordHash: pw, role: "TEACHER" },
  });

  const clsA = await prisma.class.create({
    data: { schoolId: schoolA.id, name: "Grade 9", displayOrder: 9, isActive: true },
  });
  classAId = clsA.id;

  const secA1 = await prisma.section.create({
    data: { classId: clsA.id, name: "9-A", isActive: true },
  });
  sectionA1Id = secA1.id;

  const secA2 = await prisma.section.create({
    data: { classId: clsA.id, name: "9-B", isActive: true },
  });
  sectionA2Id = secA2.id;

  // Student 1 (in Section 9-A)
  const studentA1 = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      studentId: "=1+1 STU-A1", // Formula injection test candidate
      firstName: "+FormulaFirst",
      lastName: "StudentA1",
      classId: clsA.id,
      sectionId: secA1.id,
      isActive: true,
    },
  });
  studentA1Id = studentA1.id;

  // Student 2 (in Section 9-B)
  const studentA2 = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      studentId: "STU-A2",
      firstName: "Second",
      lastName: "StudentA2",
      classId: clsA.id,
      sectionId: secA2.id,
      isActive: true,
    },
  });
  studentA2Id = studentA2.id;

  // Assign TeacherClassA to whole Class Grade 9
  await prisma.teacherClassAccess.create({
    data: { userId: teacherClassA.id, classId: clsA.id },
  });

  // Assign TeacherSecA ONLY to Section 9-A
  await prisma.teacherSectionAccess.create({
    data: { userId: teacherSecA.id, sectionId: secA1.id },
  });

  // Assessment Template in School A
  const templateA = await prisma.assessmentTemplate.create({
    data: {
      schoolId: schoolA.id,
      name: "Wellness Screening Protocol",
      category: "Behavioral",
      status: "PUBLISHED",
      createdBy: psychA.id,
    },
  });

  const domainA = await prisma.assessmentDomain.create({
    data: {
      assessmentTemplateId: templateA.id,
      name: "Emotional Balance",
      displayOrder: 1,
    },
  });

  // Completed Student Assessment with Sentinel confidential values
  await prisma.studentAssessment.create({
    data: {
      schoolId: schoolA.id,
      studentId: studentA1.id,
      assessmentTemplateId: templateA.id,
      startedAt: new Date("2025-09-01"),
      completedAt: new Date("2025-09-01"),
      status: "COMPLETED",
      overallScore: 85,
      attentionLevel: "ATTENTION_REQUIRED",
      createdBy: psychA.id,
      professionalInterpretation: SENTINEL_PROF_INTERP,
      recommendations: SENTINEL_RECOMMENDATION,
      domainResults: {
        create: {
          domainId: domainA.id,
          score: 85,
          maxScore: 100,
          resultLabel: "Elevated",
          attentionLevel: "ATTENTION_REQUIRED",
        },
      },
    },
  });

  // Observation with Sentinel confidential notes
  await prisma.studentObservation.create({
    data: {
      schoolId: schoolA.id,
      studentId: studentA1.id,
      submittedBy: teacherClassA.id,
      source: "TEACHER",
      category: "Classroom",
      observation: "Student actively participated in classroom activities.",
      psychologistNotes: SENTINEL_PSYCH_NOTE,
      aiAnalysis: SENTINEL_AI_ANALYSIS,
      status: "REVIEWED",
      observedAt: new Date("2025-09-05"),
    },
  });

  // ── School B ──
  const schoolB = await prisma.school.create({
    data: { name: "Security School B", code: "REP_SEC_B", status: "ACTIVE" },
  });
  schoolBId = schoolB.id;

  const adminB = await prisma.user.create({
    data: { schoolId: schoolB.id, name: "Admin B", email: ADMIN_B, passwordHash: pw, role: "ADMIN" },
  });
  const psychB = await prisma.user.create({
    data: { schoolId: schoolB.id, name: "Psych B", email: PSYCH_B, passwordHash: pw, role: "PSYCHOLOGIST" },
  });
  const teacherB = await prisma.user.create({
    data: { schoolId: schoolB.id, name: "Teacher B", email: TEACHER_B, passwordHash: pw, role: "TEACHER" },
  });

  const clsB = await prisma.class.create({
    data: { schoolId: schoolB.id, name: "Grade 10", displayOrder: 10, isActive: true },
  });
  classBId = clsB.id;

  const studentB = await prisma.student.create({
    data: {
      schoolId: schoolB.id,
      studentId: "STU-B1",
      firstName: "Bob",
      lastName: "Beta",
      classId: clsB.id,
      isActive: true,
    },
  });
  studentB1Id = studentB.id;
}

test.before(async () => {
  await setupDatabase();
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

async function login(email: string): Promise<string> {
  const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert.equal(res.status, 200, `Login failed for ${email}`);
  const cookies = res.headers.get("set-cookie");
  return cookies ? cookies.split(";")[0] : "";
}

// ────────────────────────────────────────────────────────────
// 1. Authentication and Roles
// ────────────────────────────────────────────────────────────

test("1.1 Unauthenticated requests are rejected with 401", async () => {
  const res = await fetch(baseUrl);
  assert.equal(res.status, 401);

  const genRes = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reportType: "STUDENT", title: "Unauth" }),
  });
  assert.equal(genRes.status, 401);

  const exportRes = await fetch(`${baseUrl}/1/export`);
  assert.equal(exportRes.status, 401);
});

test("1.2 Psychologist can generate, view, and see clinical interpretation", async () => {
  psychACookie = await login(PSYCH_A);

  const genRes = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: psychACookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Student A1 Clinical Report",
      studentId: studentA1Id,
      academicSessionId: sessionAId,
    }),
  });
  assert.equal(genRes.status, 201);
  const genData = await genRes.json();
  assert.equal(genData.success, true);
  const reportId = genData.report.id;

  const viewRes = await fetch(`${baseUrl}/${reportId}`, {
    headers: { Cookie: psychACookie },
  });
  assert.equal(viewRes.status, 200);
  const viewData = await viewRes.json();
  const snapshotJson = viewData.report.snapshots[0].contentJson;

  // Psychologist must see clinical notes
  assert.ok(snapshotJson.assessments.length > 0);
  assert.equal(snapshotJson.assessments[0].professionalInterpretation, SENTINEL_PROF_INTERP);
  assert.equal(snapshotJson.assessments[0].recommendations, SENTINEL_RECOMMENDATION);
  assert.equal(snapshotJson.observations[0].psychologistNotes, SENTINEL_PSYCH_NOTE);
  assert.equal(snapshotJson.observations[0].aiAnalysis, SENTINEL_AI_ANALYSIS);
});

test("1.3 Admin receives operational report with clinical fields redacted", async () => {
  adminACookie = await login(ADMIN_A);

  const genRes = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: adminACookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Student A1 Admin Report",
      studentId: studentA1Id,
    }),
  });
  assert.equal(genRes.status, 201);
  const genData = await genRes.json();
  const reportId = genData.report.id;

  const viewRes = await fetch(`${baseUrl}/${reportId}`, {
    headers: { Cookie: adminACookie },
  });
  assert.equal(viewRes.status, 200);
  const viewData = await viewRes.json();
  const snapshotJson = viewData.report.snapshots[0].contentJson;

  // Redactions for Admin:
  assert.equal(snapshotJson.assessments[0].professionalInterpretation, undefined);
  assert.equal(snapshotJson.assessments[0].recommendations, undefined);
  assert.equal(snapshotJson.observations[0].psychologistNotes, undefined);
  assert.equal(snapshotJson.observations[0].aiAnalysis, undefined);
});

// ────────────────────────────────────────────────────────────
// 2. Tenant Isolation
// ────────────────────────────────────────────────────────────

test("2.1 Cross-tenant targets return 404", async () => {
  psychBCookie = await login(PSYCH_B);

  // School B psychologist trying to target School A student -> 404
  const resStudent = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: psychBCookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Cross-Tenant Student",
      studentId: studentA1Id,
    }),
  });
  assert.equal(resStudent.status, 404);

  // School B psychologist trying to target School A class -> 404
  const resClass = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: psychBCookie },
    body: JSON.stringify({
      reportType: "CLASS",
      title: "Cross-Tenant Class",
      classId: classAId,
    }),
  });
  assert.equal(resClass.status, 404);

  // School B psychologist trying to target School A section -> 404
  const resSection = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: psychBCookie },
    body: JSON.stringify({
      reportType: "CLASS",
      title: "Cross-Tenant Section",
      sectionId: sectionA1Id,
    }),
  });
  assert.equal(resSection.status, 404);

  // School B psychologist trying to target School A session -> 404
  const resSession = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: psychBCookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Cross-Tenant Session",
      studentId: studentB1Id,
      academicSessionId: sessionAId,
    }),
  });
  assert.equal(resSession.status, 404);
});

test("2.2 Cross-tenant report view and export return 404", async () => {
  // Get an existing report from School A
  const listRes = await fetch(baseUrl, { headers: { Cookie: psychACookie } });
  const listData = await listRes.json();
  const schoolAReportId = listData.reports[0].id;

  // School B psych requests School A report -> 404
  const viewRes = await fetch(`${baseUrl}/${schoolAReportId}`, {
    headers: { Cookie: psychBCookie },
  });
  assert.equal(viewRes.status, 404);

  const exportRes = await fetch(`${baseUrl}/${schoolAReportId}/export?format=pdf`, {
    headers: { Cookie: psychBCookie },
  });
  assert.equal(exportRes.status, 404);
});

// ────────────────────────────────────────────────────────────
// 3. Teacher Scope Semantics & Permissions
// ────────────────────────────────────────────────────────────

test("3.1 Teacher with class access can generate student and class reports", async () => {
  teacherClassACookie = await login(TEACHER_CLASS_A);

  // Student report in assigned class (Section 9-A)
  const res1 = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherClassACookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Teacher Class Student Report",
      studentId: studentA1Id,
    }),
  });
  assert.equal(res1.status, 201);

  // Class-wide report for assigned Class Grade 9
  const res2 = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherClassACookie },
    body: JSON.stringify({
      reportType: "CLASS",
      title: "Teacher Class-wide Report",
      classId: classAId,
    }),
  });
  assert.equal(res2.status, 201);
});

test("3.2 Section-only teacher can generate section student report, but cannot generate class-wide report", async () => {
  teacherSecACookie = await login(TEACHER_SEC_A);

  // Student in assigned section 9-A -> 201
  const resStudent = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherSecACookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Section Teacher Student 1",
      studentId: studentA1Id,
    }),
  });
  assert.equal(resStudent.status, 201);

  // Student in non-assigned section 9-B -> 403
  const resOtherStudent = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherSecACookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Section Teacher Other Student",
      studentId: studentA2Id,
    }),
  });
  assert.equal(resOtherStudent.status, 403);

  // Class-wide report (requires whole-class permission) -> 403
  const resClassWide = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherSecACookie },
    body: JSON.stringify({
      reportType: "CLASS",
      title: "Section Teacher Class-Wide Attempt",
      classId: classAId,
    }),
  });
  assert.equal(resClassWide.status, 403);
});

test("3.3 Unassigned teacher cannot generate reports", async () => {
  teacherUnassignedACookie = await login(TEACHER_UNASSIGNED_A);

  const res = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: teacherUnassignedACookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Unassigned Teacher",
      studentId: studentA1Id,
    }),
  });
  assert.equal(res.status, 403);
});

// ────────────────────────────────────────────────────────────
// 4. Access Revocation Behavior
// ────────────────────────────────────────────────────────────

test("4.1 Revoking teacher assignment denies subsequent view and export with 403", async () => {
  // Create a temporary teacher and assign them Section 9-B
  const pw = await bcrypt.hash(PASSWORD, 10);
  const tempTeacher = await prisma.user.create({
    data: {
      schoolId: schoolAId,
      name: "Temp Teacher",
      email: "temp_teacher@eduwell.com",
      passwordHash: pw,
      role: "TEACHER",
    },
  });
  const tempAssignment = await prisma.teacherSectionAccess.create({
    data: { userId: tempTeacher.id, sectionId: sectionA2Id },
  });

  const tempCookie = await login("temp_teacher@eduwell.com");

  // Generate a report while authorized
  const genRes = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: tempCookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Temp Teacher Student A2 Report",
      studentId: studentA2Id,
    }),
  });
  assert.equal(genRes.status, 201);
  const reportId = (await genRes.json()).report.id;

  // Confirm view and export work initially
  const viewBefore = await fetch(`${baseUrl}/${reportId}`, { headers: { Cookie: tempCookie } });
  assert.equal(viewBefore.status, 200);

  const exportBefore = await fetch(`${baseUrl}/${reportId}/export?format=pdf`, { headers: { Cookie: tempCookie } });
  assert.equal(exportBefore.status, 200);

  // Revoke teacher assignment
  await prisma.teacherSectionAccess.delete({ where: { id: tempAssignment.id } });

  // Subsequent view and export must return 403
  const viewAfter = await fetch(`${baseUrl}/${reportId}`, { headers: { Cookie: tempCookie } });
  assert.equal(viewAfter.status, 403);

  const exportAfter = await fetch(`${baseUrl}/${reportId}/export?format=pdf`, { headers: { Cookie: tempCookie } });
  assert.equal(exportAfter.status, 403);

  // Same-school psychologist can still view
  const psychView = await fetch(`${baseUrl}/${reportId}`, { headers: { Cookie: psychACookie } });
  assert.equal(psychView.status, 200);

  // Other-school psychologist receives 404
  const otherSchoolView = await fetch(`${baseUrl}/${reportId}`, { headers: { Cookie: psychBCookie } });
  assert.equal(otherSchoolView.status, 404);
});

// ────────────────────────────────────────────────────────────
// 5. Privacy & Clinical Sentinel Redaction
// ────────────────────────────────────────────────────────────

test("5.1 Sentinel confidential texts never leak in Teacher responses, snapshots, PDF, CSV, or assessments", async () => {
  // Generate a report as psychologist on Student A1 (who has sentinel data)
  const genRes = await fetch(`${baseUrl}/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: psychACookie },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Full Sentinel Test Report",
      studentId: studentA1Id,
    }),
  });
  assert.equal(genRes.status, 201);
  const reportId = (await genRes.json()).report.id;

  // 1. Teacher views snapshot JSON
  const teacherView = await fetch(`${baseUrl}/${reportId}`, { headers: { Cookie: teacherClassACookie } });
  assert.equal(teacherView.status, 200);
  const teacherJsonStr = JSON.stringify(await teacherView.json());

  assert.ok(!teacherJsonStr.includes(SENTINEL_PSYCH_NOTE), "Teacher snapshot leaked psychologistNotes");
  assert.ok(!teacherJsonStr.includes(SENTINEL_AI_ANALYSIS), "Teacher snapshot leaked aiAnalysis");
  assert.ok(!teacherJsonStr.includes(SENTINEL_PROF_INTERP), "Teacher snapshot leaked professionalInterpretation");
  assert.ok(!teacherJsonStr.includes(SENTINEL_RECOMMENDATION), "Teacher snapshot leaked recommendations");

  // 2. Teacher exports CSV
  const teacherCsvRes = await fetch(`${baseUrl}/${reportId}/export?format=csv`, { headers: { Cookie: teacherClassACookie } });
  assert.equal(teacherCsvRes.status, 200);
  const teacherCsv = await teacherCsvRes.text();

  assert.ok(!teacherCsv.includes(SENTINEL_PSYCH_NOTE), "Teacher CSV leaked psychologistNotes");
  assert.ok(!teacherCsv.includes(SENTINEL_AI_ANALYSIS), "Teacher CSV leaked aiAnalysis");
  assert.ok(!teacherCsv.includes(SENTINEL_PROF_INTERP), "Teacher CSV leaked professionalInterpretation");
  assert.ok(!teacherCsv.includes(SENTINEL_RECOMMENDATION), "Teacher CSV leaked recommendations");

  // 3. Teacher exports PDF
  const teacherPdfRes = await fetch(`${baseUrl}/${reportId}/export?format=pdf`, { headers: { Cookie: teacherClassACookie } });
  assert.equal(teacherPdfRes.status, 200);
  const teacherPdfBuffer = await teacherPdfRes.arrayBuffer();
  const teacherPdfText = Buffer.from(teacherPdfBuffer).toString("utf-8");

  assert.ok(!teacherPdfText.includes(SENTINEL_PSYCH_NOTE), "Teacher PDF leaked psychologistNotes");
  assert.ok(!teacherPdfText.includes(SENTINEL_AI_ANALYSIS), "Teacher PDF leaked aiAnalysis");
  assert.ok(!teacherPdfText.includes(SENTINEL_PROF_INTERP), "Teacher PDF leaked professionalInterpretation");
  assert.ok(!teacherPdfText.includes(SENTINEL_RECOMMENDATION), "Teacher PDF leaked recommendations");

  // 4. Assessment endpoint: GET /api/assessments/student/:studentId
  const asmtTeacherRes = await fetch(`${assessmentsUrl}/student/${studentA1Id}`, { headers: { Cookie: teacherClassACookie } });
  assert.equal(asmtTeacherRes.status, 200);
  const asmtTeacherJsonStr = JSON.stringify(await asmtTeacherRes.json());

  assert.ok(!asmtTeacherJsonStr.includes(SENTINEL_PROF_INTERP), "Teacher assessment leaked professionalInterpretation");
  assert.ok(!asmtTeacherJsonStr.includes(SENTINEL_RECOMMENDATION), "Teacher assessment leaked recommendations");

  // Admin assessment endpoint
  const asmtAdminRes = await fetch(`${assessmentsUrl}/student/${studentA1Id}`, { headers: { Cookie: adminACookie } });
  assert.equal(asmtAdminRes.status, 200);
  const asmtAdminJsonStr = JSON.stringify(await asmtAdminRes.json());

  assert.ok(!asmtAdminJsonStr.includes(SENTINEL_PROF_INTERP), "Admin assessment leaked professionalInterpretation");
  assert.ok(!asmtAdminJsonStr.includes(SENTINEL_RECOMMENDATION), "Admin assessment leaked recommendations");

  // Psychologist assessment endpoint DOES contain interpretation
  const asmtPsychRes = await fetch(`${assessmentsUrl}/student/${studentA1Id}`, { headers: { Cookie: psychACookie } });
  assert.equal(asmtPsychRes.status, 200);
  const asmtPsychJson = await asmtPsychRes.json();
  assert.equal(asmtPsychJson.assessments[0].professionalInterpretation, SENTINEL_PROF_INTERP);
});

// ────────────────────────────────────────────────────────────
// 6. Export Security & Headers
// ────────────────────────────────────────────────────────────

test("6.1 Export endpoints enforce security headers and CSV formula injection protection", async () => {
  const listRes = await fetch(baseUrl, { headers: { Cookie: psychACookie } });
  const reportId = (await listRes.json()).reports[0].id;

  // PDF Export Headers
  const pdfRes = await fetch(`${baseUrl}/${reportId}/export?format=pdf`, { headers: { Cookie: psychACookie } });
  assert.equal(pdfRes.status, 200);
  assert.equal(pdfRes.headers.get("cache-control"), "no-store, no-cache, must-revalidate, proxy-revalidate");
  assert.equal(pdfRes.headers.get("pragma"), "no-cache");
  assert.equal(pdfRes.headers.get("x-content-type-options"), "nosniff");
  assert.equal(pdfRes.headers.get("content-type"), "application/pdf");
  assert.equal(pdfRes.headers.get("content-disposition"), `attachment; filename="report_${reportId}.pdf"`);

  // CSV Export Headers & Formula Neutralization
  const csvRes = await fetch(`${baseUrl}/${reportId}/export?format=csv`, { headers: { Cookie: psychACookie } });
  assert.equal(csvRes.status, 200);
  assert.equal(csvRes.headers.get("cache-control"), "no-store, no-cache, must-revalidate, proxy-revalidate");
  assert.equal(csvRes.headers.get("pragma"), "no-cache");
  assert.equal(csvRes.headers.get("x-content-type-options"), "nosniff");
  assert.equal(csvRes.headers.get("content-type"), "text/csv; charset=utf-8");
  assert.equal(csvRes.headers.get("content-disposition"), `attachment; filename="report_${reportId}.csv"`);

  const csvText = await csvRes.text();
  // Student 1 studentId starts with '=1+1' -> must be escaped as "'=1+1"
  assert.ok(csvText.includes("''=1+1") || csvText.includes("'=1+1"), "CSV formula injection not neutralized for studentId");
  // Student 1 firstName starts with '+FormulaFirst' -> must be escaped as "'+FormulaFirst"
  assert.ok(csvText.includes("'+FormulaFirst"), "CSV formula injection not neutralized for firstName");
});

// ────────────────────────────────────────────────────────────
// 7. Historical Snapshot Defense & Recursive Sanitization
// ────────────────────────────────────────────────────────────

test("7.1 Historical snapshot containing clinicalNotes in DB is sanitized on read for Admin and Teacher", async () => {
  // Create a historical report directly matching the seed fixture format (containing clinicalNotes)
  const histReport = await prisma.report.create({
    data: {
      schoolId: schoolAId,
      studentId: studentA1Id,
      reportType: "STUDENT",
      title: "Historical Seed-Style Report",
      status: "FINALIZED",
      classId: classAId,
      sectionId: sectionA1Id,
      generatedBy: (await prisma.user.findUnique({ where: { email: PSYCH_A } }))!.id,
    },
  });

  await prisma.reportSnapshot.create({
    data: {
      reportId: histReport.id,
      contentJson: {
        reportVersion: "1.0",
        student: {
          id: "STU-A1",
          fullName: "Student A1",
        },
        summary: {
          overallScore: 85,
          nested: {
            clinicalNotes: SENTINEL_CLINICAL_NOTES,
            recommendations: SENTINEL_RECOMMENDATION,
          },
        },
        clinicalNotes: SENTINEL_CLINICAL_NOTES,
        recommendations: SENTINEL_RECOMMENDATION,
        observations: [
          {
            observation: "Standard observation text",
            psychologistNotes: SENTINEL_PSYCH_NOTE,
            aiAnalysis: SENTINEL_AI_ANALYSIS,
          },
        ],
      },
    },
  });

  // Direct database check: verify DB snapshot-at-rest retains the fields (immutable)
  const dbSnapshot = await prisma.reportSnapshot.findFirst({ where: { reportId: histReport.id } });
  const rawDbContent = JSON.stringify(dbSnapshot!.contentJson);
  assert.ok(rawDbContent.includes(SENTINEL_CLINICAL_NOTES), "DB snapshot must retain original data at rest");

  // 1. Teacher fetch: must be sanitized
  const teacherRes = await fetch(`${baseUrl}/${histReport.id}`, { headers: { Cookie: teacherClassACookie } });
  assert.equal(teacherRes.status, 200);
  const teacherJson = await teacherRes.json();
  const teacherStr = JSON.stringify(teacherJson);

  assert.ok(!teacherStr.includes(SENTINEL_CLINICAL_NOTES), "Teacher read leaked clinicalNotes");
  assert.ok(!teacherStr.includes(SENTINEL_RECOMMENDATION), "Teacher read leaked recommendations");
  assert.ok(!teacherStr.includes(SENTINEL_PSYCH_NOTE), "Teacher read leaked psychologistNotes");
  assert.ok(!teacherStr.includes(SENTINEL_AI_ANALYSIS), "Teacher read leaked aiAnalysis");

  // 2. Admin fetch: must be sanitized
  const adminRes = await fetch(`${baseUrl}/${histReport.id}`, { headers: { Cookie: adminACookie } });
  assert.equal(adminRes.status, 200);
  const adminJson = await adminRes.json();
  const adminStr = JSON.stringify(adminJson);

  assert.ok(!adminStr.includes(SENTINEL_CLINICAL_NOTES), "Admin read leaked clinicalNotes");
  assert.ok(!adminStr.includes(SENTINEL_RECOMMENDATION), "Admin read leaked recommendations");
  assert.ok(!adminStr.includes(SENTINEL_PSYCH_NOTE), "Admin read leaked psychologistNotes");
  assert.ok(!adminStr.includes(SENTINEL_AI_ANALYSIS), "Admin read leaked aiAnalysis");

  // 3. Teacher PDF export of historical report: must be sanitized
  const pdfRes = await fetch(`${baseUrl}/${histReport.id}/export?format=pdf`, { headers: { Cookie: teacherClassACookie } });
  assert.equal(pdfRes.status, 200);
  const pdfBuffer = await pdfRes.arrayBuffer();
  const pdfText = Buffer.from(pdfBuffer).toString("utf-8");

  assert.ok(!pdfText.includes(SENTINEL_CLINICAL_NOTES), "Teacher PDF leaked clinicalNotes");
  assert.ok(!pdfText.includes(SENTINEL_RECOMMENDATION), "Teacher PDF leaked recommendations");

  // 4. Psychologist fetch: receives full clinical notes
  const psychRes = await fetch(`${baseUrl}/${histReport.id}`, { headers: { Cookie: psychACookie } });
  assert.equal(psychRes.status, 200);
  const psychJson = await psychRes.json();
  const psychStr = JSON.stringify(psychJson);

  assert.ok(psychStr.includes(SENTINEL_CLINICAL_NOTES), "Psychologist must receive clinicalNotes");
  assert.ok(psychStr.includes(SENTINEL_RECOMMENDATION), "Psychologist must receive recommendations");
});

