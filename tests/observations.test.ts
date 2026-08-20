// tests/observations.test.ts
// Automated Test Suite for EduWell Psych Observations API
//
// Isolation rules:
//  - Runs against a SEPARATE test database via TEST_DATABASE_URL.
//  - Never touches the development database (DATABASE_URL) or its seed data.
//  - Uses fixed fake emails as fixtures; no personal emails.
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
// Safety guard: run BEFORE any test migration, fixture, or cleanup.
// ────────────────────────────────────────────────────────────
function abort(message: string): never {
  console.error(`\n❌ [OBSERVATIONS TEST] Aborting: ${message}\n`);
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

// Point the shared Prisma singleton (and the observation router) at the test database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL!;

// App modules must be imported AFTER the env override.
const { authRouter } = await import("../src/server/auth");
const { observationsRouter } = await import("../src/server/observations");
const { requireAuth } = await import("../src/server/middleware/auth");
const { prisma } = await import("../src/lib/db");

// ────────────────────────────────────────────────────────────
// Fixture constants — fixed fake identities, never personal.
// ────────────────────────────────────────────────────────────
const FIXTURE_SCHOOL_CODE = "OBS_TEST_A";
const FIXTURE_SCHOOL_B_CODE = "OBS_TEST_B";
const PSYCH_EMAIL = "obs-psych-test@example.com";
const TEACHER_EMAIL = "obs-teacher-test@example.com";
const FIXTURE_PASSWORD = "password123";

// ────────────────────────────────────────────────────────────
// Test database provisioning (create-if-missing + migrations)
// ────────────────────────────────────────────────────────────
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
      console.log(`  ✅ Created test database "${dbName}"`);
    }
  } finally {
    await admin.end();
  }
}

function applyMigrationsToTestDatabase() {
  console.log("  Applying migrations to the test database...");
  execSync("npx prisma migrate deploy", { stdio: "inherit", env: process.env });
}

let schoolAId = 0;
let schoolBId = 0;
let psychUserId = 0;
let teacherUserId = 0;
let studentA1Id = 0;
let studentA2Id = 0;
let studentB1Id = 0;

async function createFixtures() {
  // Clean up stale records from a previously interrupted run (suite-owned only).
  await destroyFixtures();

  const passwordHash = await bcrypt.hash(FIXTURE_PASSWORD, 10);

  // School A: psychologist + teacher (teacher scoped to classA1)
  const schoolA = await prisma.school.create({
    data: { name: "Observations Test School A", code: FIXTURE_SCHOOL_CODE, status: "ACTIVE" },
  });
  schoolAId = schoolA.id;

  const psych = await prisma.user.create({
    data: {
      schoolId: schoolA.id,
      name: "Obs Test Psychologist",
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
      name: "Obs Test Teacher",
      email: TEACHER_EMAIL,
      passwordHash,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });
  teacherUserId = teacher.id;

  const classA1 = await prisma.class.create({
    data: { schoolId: schoolA.id, name: "5A" },
  });
  const classA2 = await prisma.class.create({
    data: { schoolId: schoolA.id, name: "6C" },
  });
  const sectionA1 = await prisma.section.create({
    data: { classId: classA1.id, name: "5A" },
  });
  const sectionA2 = await prisma.section.create({
    data: { classId: classA2.id, name: "6C" },
  });

  await prisma.teacherClassAccess.create({
    data: { userId: teacher.id, classId: classA1.id },
  });

  const sA1 = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      studentId: "OBS-STU-A1",
      fullName: "Obs Student Alpha",
      classId: classA1.id,
      sectionId: sectionA1.id,
    },
  });
  studentA1Id = sA1.id;

  const sA2 = await prisma.student.create({
    data: {
      schoolId: schoolA.id,
      studentId: "OBS-STU-A2",
      fullName: "Obs Student Beta",
      classId: classA2.id,
      sectionId: sectionA2.id,
    },
  });
  studentA2Id = sA2.id;

  // School B: separate tenant with its own student
  const schoolB = await prisma.school.create({
    data: { name: "Observations Test School B", code: FIXTURE_SCHOOL_B_CODE, status: "ACTIVE" },
  });
  schoolBId = schoolB.id;

  const classB1 = await prisma.class.create({
    data: { schoolId: schoolB.id, name: "7B" },
  });
  const sB1 = await prisma.student.create({
    data: {
      schoolId: schoolB.id,
      studentId: "OBS-STU-B1",
      fullName: "Obs Student Gamma",
      classId: classB1.id,
    },
  });
  studentB1Id = sB1.id;
}

async function destroyFixtures() {
  // Clean up ONLY records created by this suite, in FK-safe order.
  await prisma.studentObservation.deleteMany({
    where: { school: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } },
  });
  await prisma.teacherSectionAccess.deleteMany({
    where: { user: { school: { code: FIXTURE_SCHOOL_CODE } } },
  });
  await prisma.teacherClassAccess.deleteMany({
    where: { user: { school: { code: FIXTURE_SCHOOL_CODE } } },
  });
  await prisma.student.deleteMany({
    where: { school: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } },
  });
  await prisma.section.deleteMany({
    where: { class: { school: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } } },
  });
  await prisma.class.deleteMany({
    where: { school: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } },
  });
  await prisma.user.deleteMany({
    where: { school: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } } },
  });
  await prisma.school.deleteMany({
    where: { code: { in: [FIXTURE_SCHOOL_CODE, FIXTURE_SCHOOL_B_CODE] } },
  });
}

// ────────────────────────────────────────────────────────────
// Test server
// ────────────────────────────────────────────────────────────
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);
app.use("/api/observations", observationsRouter);

// Mirror the server.ts wiring: Gemini endpoints sit behind requireAuth.
app.post("/api/gemini/analyze-observation", requireAuth, (_req, res) => {
  res.json({ ok: true });
});
app.post("/api/gemini/assessment-summary", requireAuth, (_req, res) => {
  res.json({ ok: true });
});

let server: http.Server;
let baseUrl: string;
let authUrl: string;
let geminiUrl: string;

test.before(async () => {
  await ensureTestDatabaseExists();
  applyMigrationsToTestDatabase();
  await createFixtures();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as { port: number };
      baseUrl = `http://localhost:${address.port}/api/observations`;
      authUrl = `http://localhost:${address.port}/api/auth`;
      geminiUrl = `http://localhost:${address.port}/api/gemini`;
      resolve();
    });
  });
});

test.after(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await destroyFixtures();
  await prisma.$disconnect();
});

// ────────────────────────────────────────────────────────────
// Helpers
// ────────────────────────────────────────────────────────────
async function login(email: string): Promise<string> {
  const res = await fetch(`${authUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: FIXTURE_PASSWORD }),
  });
  assert.equal(res.status, 200, `Login failed for ${email}`);
  const setCookie = res.headers.get("set-cookie");
  assert.ok(setCookie, "Session cookie must be set");
  return setCookie.split(";")[0];
}

async function createObservation(cookie: string, body: any) {
  return fetch(`${baseUrl}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify(body),
  });
}

// ────────────────────────────────────────────────────────────
// 1. Unauthenticated requests are rejected with 401
// ────────────────────────────────────────────────────────────
test("1. Unauthenticated requests to observations and Gemini APIs return 401", async () => {
  const cases: { url: string; method: string; body?: any }[] = [
    { url: `${baseUrl}`, method: "GET" },
    { url: `${baseUrl}/1`, method: "GET" },
    { url: `${baseUrl}`, method: "POST", body: { studentId: studentA1Id, observation: "x" } },
    { url: `${baseUrl}/1`, method: "PATCH", body: { status: "Reviewed" } },
    { url: `${geminiUrl}/analyze-observation`, method: "POST", body: {} },
    { url: `${geminiUrl}/assessment-summary`, method: "POST", body: {} },
  ];

  for (const c of cases) {
    const res = await fetch(c.url, {
      method: c.method,
      headers: { "Content-Type": "application/json" },
      body: c.body ? JSON.stringify(c.body) : undefined,
    });
    assert.equal(res.status, 401, `Expected 401 for ${c.method} ${c.url}`);
    const data = await res.json();
    assert.equal(data.success, false);
  }
});

// ────────────────────────────────────────────────────────────
// 2. Psychologist create / list / detail round-trip
// ────────────────────────────────────────────────────────────
test("2. Psychologist can create, list, and read an observation", async () => {
  const cookie = await login(PSYCH_EMAIL);

  const createRes = await createObservation(cookie, {
    studentId: studentA1Id,
    source: "Teacher",
    category: "Behavioral",
    observation: "Frustration during timed quiz.",
    triggers: "Timed tasks",
    interventions: "Quiet break offered",
    setting: "Math Lab",
  });
  assert.equal(createRes.status, 201);
  const created = await createRes.json();
  assert.equal(created.success, true);
  assert.equal(created.observation.status, "New");
  assert.equal(created.observation.source, "Teacher");
  assert.equal(created.observation.concernCategory, "Behavioral");
  assert.equal(created.observation.studentName, "Obs Student Alpha");
  assert.equal(created.observation.classGroup, "5A");
  assert.ok(created.observation.recordNumber.startsWith("OBS-"), "recordNumber must be assigned");

  const obsId = created.observation.id;

  const listRes = await fetch(`${baseUrl}?limit=100`, {
    headers: { Cookie: cookie },
  });
  assert.equal(listRes.status, 200);
  const listData = await listRes.json();
  assert.equal(listData.success, true);
  assert.ok(listData.observations.some((o: any) => o.id === obsId));

  const detailRes = await fetch(`${baseUrl}/${obsId}`, {
    headers: { Cookie: cookie },
  });
  assert.equal(detailRes.status, 200);
  const detailData = await detailRes.json();
  assert.equal(detailData.observation.id, obsId);
  assert.equal(detailData.observation.narrative, "Frustration during timed quiz.");
});

// ────────────────────────────────────────────────────────────
// 3. Psychologist can update status and psychologist notes
// ────────────────────────────────────────────────────────────
test("3. Psychologist can PATCH status and psychologist notes", async () => {
  const cookie = await login(PSYCH_EMAIL);

  const createRes = await createObservation(cookie, {
    studentId: studentA1Id,
    source: "Parent",
    category: "Social/Emotional",
    observation: "Withdrawn at home.",
  });
  const obsId = (await createRes.json()).observation.id;

  const patchStatus = await fetch(`${baseUrl}/${obsId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "Reviewed" }),
  });
  assert.equal(patchStatus.status, 200);
  const statusData = await patchStatus.json();
  assert.equal(statusData.observation.status, "Reviewed");

  const patchNotes = await fetch(`${baseUrl}/${obsId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ psychologistNotes: "Monitor frequency of outbursts." }),
  });
  assert.equal(patchNotes.status, 200);
  const notesData = await patchNotes.json();
  assert.equal(notesData.observation.psychologistNotes, "Monitor frequency of outbursts.");

  const patchInvalid = await fetch(`${baseUrl}/${obsId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ status: "Nonsense" }),
  });
  assert.equal(patchInvalid.status, 400);
});

// ────────────────────────────────────────────────────────────
// 4. Teacher scoping: only assigned classes, no status/notes updates
// ────────────────────────────────────────────────────────────
test("4. Teacher is scoped to assigned classes and cannot update observations", async () => {
  const psychCookie = await login(PSYCH_EMAIL);
  const teacherCookie = await login(TEACHER_EMAIL);

  // Psychologist logs an observation for student A2 (out of teacher's scope)
  const createA2 = await createObservation(psychCookie, {
    studentId: studentA2Id,
    source: "Teacher",
    category: "Learning",
    observation: "Difficulty focusing in class.",
  });
  const a2ObsId = (await createA2.json()).observation.id;

  // Teacher cannot create for a student outside their assigned classes
  const teacherCreateA2 = await createObservation(teacherCookie, {
    studentId: studentA2Id,
    source: "Teacher",
    category: "Learning",
    observation: "Should be forbidden.",
  });
  assert.equal(teacherCreateA2.status, 403);

  // Teacher CAN create for student A1 (in assigned class)
  const teacherCreateA1 = await createObservation(teacherCookie, {
    studentId: studentA1Id,
    source: "Teacher",
    category: "Attention",
    observation: "Off-task during lesson.",
  });
  assert.equal(teacherCreateA1.status, 201);

  // Teacher's list must include A1 observation but NOT the A2 one
  const listRes = await fetch(`${baseUrl}?limit=100`, {
    headers: { Cookie: teacherCookie },
  });
  const listData = await listRes.json();
  const a1CreateJson = await teacherCreateA1.json();
  const a1ObsId = a1CreateJson.observation.id;
  const ids = listData.observations.map((o: any) => o.id);
  assert.ok(ids.some((id: string) => id === a1ObsId));
  assert.ok(!ids.includes(a2ObsId), "Teacher must not see observations for unassigned students");

  // Teacher's detail view of the A2 observation must 404
  const detailRes = await fetch(`${baseUrl}/${a2ObsId}`, {
    headers: { Cookie: teacherCookie },
  });
  assert.equal(detailRes.status, 404);

  // Teacher cannot PATCH status or notes
  const patchRes = await fetch(`${baseUrl}/${a2ObsId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: teacherCookie },
    body: JSON.stringify({ status: "Reviewed" }),
  });
  assert.equal(patchRes.status, 403);
});

// ────────────────────────────────────────────────────────────
// 5. Tenant isolation between schools
// ────────────────────────────────────────────────────────────
test("5. Observations are isolated between schools", async () => {
  const cookie = await login(PSYCH_EMAIL);

  // School B student observation must not be creatable by school A user (student not found in school A)
  const crossCreate = await createObservation(cookie, {
    studentId: studentB1Id,
    source: "Teacher",
    category: "Behavioral",
    observation: "Cross-tenant attempt.",
  });
  assert.equal(crossCreate.status, 404);

  // A school B user's observation must never appear in school A's list
  const bSchoolPsych = await prisma.user.create({
    data: {
      schoolId: schoolBId,
      name: "Obs Test Psych B",
      email: "obs-psych-b-test@example.com",
      passwordHash: await bcrypt.hash(FIXTURE_PASSWORD, 10),
      role: "PSYCHOLOGIST",
      status: "ACTIVE",
    },
  });
  const bCookie = await login("obs-psych-b-test@example.com");
  const bCreate = await createObservation(bCookie, {
    studentId: studentB1Id,
    source: "Parent",
    category: "Behavioral",
    observation: "School B private observation.",
  });
  assert.equal(bCreate.status, 201);
  const bObsId = (await bCreate.json()).observation.id;

  const listRes = await fetch(`${baseUrl}?limit=100`, {
    headers: { Cookie: cookie },
  });
  const listData = await listRes.json();
  assert.ok(
    !listData.observations.some((o: any) => o.id === bObsId),
    "School A must not see School B observations"
  );

  const detailRes = await fetch(`${baseUrl}/${bObsId}`, {
    headers: { Cookie: cookie },
  });
  assert.equal(detailRes.status, 404);

  // Clean up the school B user and its observation created in this test
  await prisma.studentObservation.deleteMany({ where: { id: parseInt(bObsId, 10) } });
  await prisma.user.deleteMany({ where: { id: bSchoolPsych.id } });
});

// ────────────────────────────────────────────────────────────
// 6. Input validation
// ────────────────────────────────────────────────────────────
test("6. Invalid input returns 400/404", async () => {
  const cookie = await login(PSYCH_EMAIL);

  // Missing narrative
  const noNarrative = await createObservation(cookie, {
    studentId: studentA1Id,
    source: "Teacher",
    category: "Behavioral",
  });
  assert.equal(noNarrative.status, 400);

  // Missing student
  const noStudent = await createObservation(cookie, {
    source: "Teacher",
    category: "Behavioral",
    observation: "Has narrative but no student.",
  });
  assert.equal(noStudent.status, 400);

  // Invalid source
  const badSource = await createObservation(cookie, {
    studentId: studentA1Id,
    source: "Alien",
    category: "Behavioral",
    observation: "Bad source.",
  });
  assert.equal(badSource.status, 400);

  // Missing category
  const noCategory = await createObservation(cookie, {
    studentId: studentA1Id,
    source: "Teacher",
    observation: "No category.",
  });
  assert.equal(noCategory.status, 400);

  // Unknown student
  const unknownStudent = await createObservation(cookie, {
    studentId: 999999,
    source: "Teacher",
    category: "Behavioral",
    observation: "Unknown student.",
  });
  assert.equal(unknownStudent.status, 404);
});

// ────────────────────────────────────────────────────────────
// 7. Pagination and filtering
// ────────────────────────────────────────────────────────────
test("7. Pagination and source/category/status filters work", async () => {
  const cookie = await login(PSYCH_EMAIL);

  for (let i = 0; i < 3; i++) {
    await createObservation(cookie, {
      studentId: studentA1Id,
      source: "Parent",
      category: "Academic",
      observation: `Parent academic note ${i}.`,
    });
  }

  const filtered = await fetch(
    `${baseUrl}?source=Parent&category=Academic&page=1&limit=1`,
    { headers: { Cookie: cookie } }
  );
  const filteredData = await filtered.json();
  assert.equal(filteredData.success, true);
  assert.equal(filteredData.observations.length, 1);
  assert.ok(filteredData.pagination.total >= 3, "filtered total should include the created records");
  assert.ok(filteredData.pagination.totalPages >= 3);
  assert.equal(filteredData.observations[0].source, "Parent");
  assert.equal(filteredData.observations[0].concernCategory, "Academic");

  const statusFiltered = await fetch(`${baseUrl}?status=New&limit=100`, {
    headers: { Cookie: cookie },
  });
  const statusData = await statusFiltered.json();
  assert.equal(statusData.success, true);
  assert.ok(
    statusData.observations.every((o: any) => o.status === "New"),
    "status filter should only return New observations"
  );
});