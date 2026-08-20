// tests/notifications.test.ts
// Comprehensive Test Suite for EduWell Psych Notifications Architecture & API

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
  console.error(`\n❌ [NOTIFICATIONS TEST] Aborting: ${message}\n`);
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

  const testParsed = parseDbUrl(testUrl);
  if (!testParsed.database.toLowerCase().endsWith("_test")) {
    abort(`Test database name "${testParsed.database}" must end with "_test".`);
  }
}

assertTestDatabaseSafe();

// Ensure test database url override for test runner
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL!;

const { prisma } = await import("../src/lib/db");
const { authRouter } = await import("../src/server/auth");
const { notificationsRouter } = await import("../src/server/notifications");
const { observationsRouter } = await import("../src/server/observations");
const { assessmentsRouter } = await import("../src/server/assessments");
const { reportsRouter } = await import("../src/server/reports");
const { NotificationService } = await import("../src/server/services/notificationService");

const app = express();
app.use(express.json());
app.use(cookieParser());
app.use("/api/auth", authRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/observations", observationsRouter);
app.use("/api/assessments", assessmentsRouter);
app.use("/api/reports", reportsRouter);

const server = http.createServer(app);
const PORT = 4005;
const notificationsUrl = `http://localhost:${PORT}/api/notifications`;
const observationsUrl = `http://localhost:${PORT}/api/observations`;
const assessmentsUrl = `http://localhost:${PORT}/api/assessments`;
const reportsUrl = `http://localhost:${PORT}/api/reports`;

const SCHOOL_A_CODE = "NOTIF_TEST_A";
const SCHOOL_B_CODE = "NOTIF_TEST_B";
const ADMIN_A_EMAIL = "admin_notif_a@eduwell.com";
const PSYCH_A_EMAIL = "psych_notif_a@eduwell.com";
const TEACHER_A_EMAIL = "teacher_notif_a@eduwell.com";
const ADMIN_B_EMAIL = "admin_notif_b@eduwell.com";
const PSYCH_B_EMAIL = "psych_notif_b@eduwell.com";
const PASSWORD = "Password123!";

let schoolAId: number;
let schoolBId: number;
let adminAId: number;
let psychAId: number;
let teacherAId: number;
let adminBId: number;
let psychBId: number;
let studentAId: number;
let classAId: number;
let sectionAId: number;

let adminACookie = "";
let psychACookie = "";
let teacherACookie = "";
let psychBCookie = "";

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
  } catch (error) {
    console.error("Failed to setup test database:", error);
  } finally {
    await admin.end();
  }
}

async function createFixtures() {
  const suiteCodes = [SCHOOL_A_CODE, SCHOOL_B_CODE];
  for (const code of suiteCodes) {
    await prisma.notification.deleteMany({ where: { school: { code } } });
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
    data: { name: "Notification Test School A", code: SCHOOL_A_CODE, status: "ACTIVE" },
  });
  schoolAId = schoolA.id;

  const adminA = await prisma.user.create({
    data: { schoolId: schoolA.id, name: "Admin A", email: ADMIN_A_EMAIL, passwordHash: pw, role: "ADMIN" },
  });
  adminAId = adminA.id;

  const psychA = await prisma.user.create({
    data: { schoolId: schoolA.id, name: "Psych A", email: PSYCH_A_EMAIL, passwordHash: pw, role: "PSYCHOLOGIST" },
  });
  psychAId = psychA.id;

  const teacherA = await prisma.user.create({
    data: { schoolId: schoolA.id, name: "Teacher A", email: TEACHER_A_EMAIL, passwordHash: pw, role: "TEACHER" },
  });
  teacherAId = teacherA.id;

  const clsA = await prisma.class.create({
    data: { schoolId: schoolA.id, name: "Grade 5", displayOrder: 5, isActive: true },
  });
  classAId = clsA.id;

  const secA = await prisma.section.create({
    data: { classId: clsA.id, name: "5-A", isActive: true },
  });
  sectionAId = secA.id;

  await prisma.teacherClassAccess.create({
    data: { userId: teacherA.id, classId: clsA.id },
  });

  const studentA = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      studentId: "NOTIF-STU-1",
      firstName: "Alex",
      lastName: "Rivera",
      fullName: "Alex Rivera",
      classId: clsA.id,
      sectionId: secA.id,
      isActive: true,
    },
  });
  studentAId = studentA.id;

  // ── School B ──
  const schoolB = await prisma.school.create({
    data: { name: "Notification Test School B", code: SCHOOL_B_CODE, status: "ACTIVE" },
  });
  schoolBId = schoolB.id;

  const adminB = await prisma.user.create({
    data: { schoolId: schoolB.id, name: "Admin B", email: ADMIN_B_EMAIL, passwordHash: pw, role: "ADMIN" },
  });
  adminBId = adminB.id;

  const psychB = await prisma.user.create({
    data: { schoolId: schoolB.id, name: "Psych B", email: PSYCH_B_EMAIL, passwordHash: pw, role: "PSYCHOLOGIST" },
  });
  psychBId = psychB.id;
}

async function loginUser(email: string): Promise<string> {
  const res = await fetch(`http://localhost:${PORT}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: PASSWORD }),
  });
  assert.equal(res.status, 200, `Login failed for ${email}`);
  const cookies = res.headers.get("set-cookie");
  return cookies ? cookies.split(";")[0] : "";
}

test.before(async () => {
  await ensureTestDatabaseExists();
  execSync("npx prisma migrate deploy", { stdio: "ignore", env: { ...process.env, DATABASE_URL: TEST_DATABASE_URL } });
  process.env.DATABASE_URL = TEST_DATABASE_URL;
  await prisma.$connect();
  await createFixtures();

  await new Promise<void>((resolve) => server.listen(PORT, resolve));

  adminACookie = await loginUser(ADMIN_A_EMAIL);
  psychACookie = await loginUser(PSYCH_A_EMAIL);
  teacherACookie = await loginUser(TEACHER_A_EMAIL);
  psychBCookie = await loginUser(PSYCH_B_EMAIL);
});

test.after(async () => {
  await prisma.$disconnect();
  await new Promise<void>((resolve) => server.close(() => resolve()));
});

// ────────────────────────────────────────────────────────────
// 1. Schema & NotificationService Unit Tests
// ────────────────────────────────────────────────────────────

test("NotificationService: create notification with all schema types & default priority", async () => {
  const service = new NotificationService(prisma as any);

  const notif = await service.createNotification({
    schoolId: schoolAId,
    userId: psychAId,
    type: "URGENT",
    title: "Urgent Behavior Alert",
    message: "Student demonstrated escalated behavior.",
    entityType: "OBSERVATION",
    entityId: 101,
  });

  assert.ok(notif.id > 0);
  assert.equal(notif.type, "URGENT");
  assert.equal(notif.priority, "NORMAL"); // Default priority
  assert.equal(notif.isRead, false);
  assert.equal(notif.readAt, null);
  assert.equal(notif.schoolId, schoolAId);
  assert.equal(notif.userId, psychAId);
  assert.equal(notif.entityType, "OBSERVATION");
  assert.equal(notif.entityId, 101);
});

test("NotificationService: dedupeKey prevents duplicate notifications in the same school", async () => {
  const service = new NotificationService(prisma as any);
  const dedupeKey = "dedupe-test-obs-1";

  const first = await service.createNotification({
    schoolId: schoolAId,
    userId: psychAId,
    type: "URGENT",
    priority: "HIGH",
    title: "High Alert",
    message: "First occurrence",
    dedupeKey,
  });

  const duplicate = await service.createNotification({
    schoolId: schoolAId,
    userId: psychAId,
    type: "URGENT",
    priority: "HIGH",
    title: "High Alert Duplicate",
    message: "Should be deduped",
    dedupeKey,
  });

  assert.equal(first.id, duplicate.id);
  assert.equal(duplicate.message, "First occurrence");
});

test("NotificationService: same dedupeKey allowed across different schools (tenant-scoped uniqueness)", async () => {
  const service = new NotificationService(prisma as any);
  const sharedKey = "shared-cross-school-key-1";

  const notifA = await service.createNotification({
    schoolId: schoolAId,
    userId: adminAId,
    type: "SYSTEM",
    title: "System Update School A",
    message: "School A announcement",
    dedupeKey: sharedKey,
  });

  const notifB = await service.createNotification({
    schoolId: schoolBId,
    userId: adminBId,
    type: "SYSTEM",
    title: "System Update School B",
    message: "School B announcement",
    dedupeKey: sharedKey,
  });

  assert.notEqual(notifA.id, notifB.id);
  assert.equal(notifA.schoolId, schoolAId);
  assert.equal(notifB.schoolId, schoolBId);
});

test("NotificationService: calculates expiresAt when expiresInDays is provided", async () => {
  const service = new NotificationService(prisma as any);
  const notif = await service.createNotification({
    schoolId: schoolAId,
    userId: adminAId,
    type: "SYSTEM",
    title: "Expiring Notification",
    message: "Expires in 7 days",
    expiresInDays: 7,
  });

  assert.ok(notif.expiresAt !== null);
  const diffDays = Math.round((notif.expiresAt!.getTime() - notif.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  assert.equal(diffDays, 7);
});

test("NotificationService: getUserNotifications pagination and unread counts", async () => {
  const service = new NotificationService(prisma as any);

  // Clean out for test isolation
  await prisma.notification.deleteMany({ where: { userId: adminAId } });

  await service.createNotification({
    schoolId: schoolAId,
    userId: adminAId,
    type: "ASSESSMENT",
    title: "Assessment 1",
    message: "Msg 1",
  });
  await service.createNotification({
    schoolId: schoolAId,
    userId: adminAId,
    type: "FEEDBACK",
    title: "Feedback 2",
    message: "Msg 2",
  });
  await service.createNotification({
    schoolId: schoolAId,
    userId: adminAId,
    type: "SYSTEM",
    title: "System 3",
    message: "Msg 3",
  });

  const all = await service.getUserNotifications(schoolAId, adminAId, false, 0, 10);
  assert.equal(all.totalCount, 3);
  assert.equal(all.unreadCount, 3);
  assert.equal(all.notifications.length, 3);

  const paginated = await service.getUserNotifications(schoolAId, adminAId, false, 0, 2);
  assert.equal(paginated.notifications.length, 2);
  assert.equal(paginated.totalCount, 3);
});

test("NotificationService: markAsRead and markAllAsRead updates state safely", async () => {
  const service = new NotificationService(prisma as any);

  const notif = await service.createNotification({
    schoolId: schoolAId,
    userId: psychAId,
    type: "URGENT",
    title: "To Read",
    message: "Mark me read",
  });

  assert.equal(notif.isRead, false);

  // Cross-user access attempt must return null
  const unauthorizedAttempt = await service.markAsRead(schoolAId, adminAId, notif.id);
  assert.equal(unauthorizedAttempt, null);

  // Cross-tenant access attempt must return null
  const crossTenantAttempt = await service.markAsRead(schoolBId, psychAId, notif.id);
  assert.equal(crossTenantAttempt, null);

  // Legitimate mark as read
  const readResult = await service.markAsRead(schoolAId, psychAId, notif.id);
  assert.ok(readResult !== null);
  assert.equal(readResult!.isRead, true);
  assert.ok(readResult!.readAt !== null);

  // Mark all as read
  await service.createNotification({
    schoolId: schoolAId,
    userId: psychAId,
    type: "ASSESSMENT",
    title: "Another Unread",
    message: "Unread 2",
  });

  const countUpdated = await service.markAllAsRead(schoolAId, psychAId);
  assert.ok(countUpdated >= 1);

  const unreadCount = await service.getUnreadCount(schoolAId, psychAId);
  assert.equal(unreadCount, 0);
});

// ────────────────────────────────────────────────────────────
// 2. HTTP API Endpoints & Security/RBAC Tests
// ────────────────────────────────────────────────────────────

test("API: GET /api/notifications returns user notifications", async () => {
  const res = await fetch(`${notificationsUrl}`, {
    headers: { Cookie: adminACookie },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(Array.isArray(body.data.notifications));
  assert.ok(typeof body.data.unreadCount === "number");
});

test("API: GET /api/notifications/unread-count returns unread count", async () => {
  const res = await fetch(`${notificationsUrl}/unread-count`, {
    headers: { Cookie: adminACookie },
  });
  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(typeof body.count === "number");
});

test("API: PATCH /api/notifications/:id/read marks single notification read", async () => {
  const service = new NotificationService(prisma as any);
  const notif = await service.createNotification({
    schoolId: schoolAId,
    userId: adminAId,
    type: "SYSTEM",
    title: "Test Read API",
    message: "Testing patch read",
  });

  const res = await fetch(`${notificationsUrl}/${notif.id}/read`, {
    method: "PATCH",
    headers: { Cookie: adminACookie },
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.equal(body.notification.isRead, true);
});

test("API: PATCH /api/notifications/:id/read returns 404 for cross-school unauthorized notification", async () => {
  const service = new NotificationService(prisma as any);
  const notifB = await service.createNotification({
    schoolId: schoolBId,
    userId: psychBId,
    type: "URGENT",
    title: "School B Private Alert",
    message: "School B only",
  });

  // Admin A from School A tries to read School B's notification
  const res = await fetch(`${notificationsUrl}/${notifB.id}/read`, {
    method: "PATCH",
    headers: { Cookie: adminACookie },
  });

  assert.equal(res.status, 404);
});

test("API: PATCH /api/notifications/read-all marks all unread notifications read", async () => {
  const res = await fetch(`${notificationsUrl}/read-all`, {
    method: "PATCH",
    headers: { Cookie: adminACookie },
  });

  assert.equal(res.status, 200);
  const body = await res.json();
  assert.equal(body.success, true);
  assert.ok(typeof body.count === "number");

  const countRes = await fetch(`${notificationsUrl}/unread-count`, {
    headers: { Cookie: adminACookie },
  });
  const countBody = await countRes.json();
  assert.equal(countBody.count, 0);
});

// ────────────────────────────────────────────────────────────
// 3. Domain Event Triggers Integration Tests
// ────────────────────────────────────────────────────────────

test("Trigger: Submitting an observation dispatches URGENT notification to Psychologists & Admins", async () => {
  // Clear Psych A notifications before trigger
  await prisma.notification.deleteMany({ where: { userId: psychAId } });

  const res = await fetch(`${observationsUrl}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: teacherACookie,
    },
    body: JSON.stringify({
      studentId: studentAId,
      source: "Teacher",
      category: "Behavioral",
      observation: "Student refused to participate in group exercise.",
      setting: "Classroom",
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.success, true);

  // Psych A should have received the notification
  const psychNotifs = await prisma.notification.findMany({
    where: { schoolId: schoolAId, userId: psychAId, type: "URGENT" },
  });

  assert.ok(psychNotifs.length >= 1);
  const latest = psychNotifs[0];
  assert.equal(latest.entityType, "OBSERVATION");
  assert.equal(latest.priority, "HIGH");
  assert.ok(latest.title.includes("Observation"));
  assert.ok(latest.message.includes("Alex Rivera"));

  // Privacy Check: Observation raw clinical narrative must NOT be in notification message
  assert.ok(!latest.message.includes("refused to participate"));
});

test("Trigger: Completing an assessment dispatches ASSESSMENT notification", async () => {
  // Create template & questions
  const template = await prisma.assessmentTemplate.create({
    data: {
      schoolId: schoolAId,
      name: "Standard Wellness Index",
      category: "Wellbeing",
      status: "PUBLISHED",
      createdBy: psychAId,
    },
  });

  const domain = await prisma.assessmentDomain.create({
    data: { assessmentTemplateId: template.id, name: "Focus & Attention", displayOrder: 1 },
  });

  const question = await prisma.assessmentQuestion.create({
    data: {
      assessmentTemplateId: template.id,
      domainId: domain.id,
      questionText: "Can focus for 20 mins?",
      displayOrder: 1,
      isRequired: true,
    },
  });

  const option = await prisma.assessmentOption.create({
    data: { questionId: question.id, label: "Always", value: "always", score: 5, displayOrder: 1 },
  });

  // Start assessment
  const startRes = await fetch(`${assessmentsUrl}/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: psychACookie },
    body: JSON.stringify({
      studentId: studentAId,
      assessmentTemplateId: template.id,
    }),
  });
  assert.equal(startRes.status, 201);
  const startBody = await startRes.json();
  const assessmentId = startBody.assessment.id;

  // Answer question
  const respRes = await fetch(`${assessmentsUrl}/${assessmentId}/responses`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: psychACookie },
    body: JSON.stringify({
      responses: [{ questionId: question.id, selectedOptionId: option.id }],
    }),
  });
  assert.equal(respRes.status, 200);

  // Complete assessment
  const completeRes = await fetch(`${assessmentsUrl}/${assessmentId}/complete`, {
    method: "POST",
    headers: { Cookie: psychACookie },
  });
  assert.equal(completeRes.status, 200);

  // Admin A should have received an ASSESSMENT notification
  const adminNotifs = await prisma.notification.findMany({
    where: { schoolId: schoolAId, userId: adminAId, type: "ASSESSMENT", entityId: Number(assessmentId) },
  });

  assert.ok(adminNotifs.length >= 1);
  assert.equal(adminNotifs[0].type, "ASSESSMENT");
  assert.ok(adminNotifs[0].message.includes("Standard Wellness Index"));
  assert.ok(adminNotifs[0].message.includes("Alex Rivera"));
});

test("Trigger: Generating a report dispatches SYSTEM notification", async () => {
  const session = await prisma.academicSession.create({
    data: {
      schoolId: schoolAId,
      name: "2025-2026 Session",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });

  const res = await fetch(`${reportsUrl}/generate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: psychACookie,
    },
    body: JSON.stringify({
      reportType: "STUDENT",
      title: "Comprehensive Student Wellness Report",
      studentId: studentAId,
      academicSessionId: session.id,
    }),
  });

  assert.equal(res.status, 201);
  const body = await res.json();
  assert.equal(body.success, true);
  const reportId = body.report.id;

  // Admin A should have received a SYSTEM notification
  const adminNotifs = await prisma.notification.findMany({
    where: { schoolId: schoolAId, userId: adminAId, type: "SYSTEM", entityId: reportId },
  });

  assert.ok(adminNotifs.length >= 1);
  assert.equal(adminNotifs[0].type, "SYSTEM");
  assert.ok(adminNotifs[0].message.includes("Comprehensive Student Wellness Report"));
  assert.ok(adminNotifs[0].message.includes("Alex Rivera"));
});
