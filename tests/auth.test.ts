// tests/auth.test.ts
// Automated Test Suite for EduWell Psych Authentication (Google SSO & Session Management)
//
// Isolation rules:
//  - Runs against a SEPARATE test database via TEST_DATABASE_URL.
//  - Never touches the development database (DATABASE_URL) or its seed data.
//  - Uses a fixed fake email as the authorized user fixture; no personal emails.
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
// Aborts immediately if TEST_DATABASE_URL is unsafe.
// ────────────────────────────────────────────────────────────
function abort(message: string): never {
  console.error(`\n❌ [AUTH TEST] Aborting: ${message}\n`);
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

// Point the shared Prisma singleton (and the auth router that uses it) at the test database.
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL!;
const TEST_DATABASE_URL = process.env.TEST_DATABASE_URL!;

// Static import graph is loaded above; the app modules must be imported AFTER the env override.
const { authRouter, googleClient } = await import("../src/server/auth");
const { prisma } = await import("../src/lib/db");

// ────────────────────────────────────────────────────────────
// Fixture constants — fixed fake identities, never personal.
// ────────────────────────────────────────────────────────────
const FIXTURE_EMAIL = "google-auth-test@example.com";
const FIXTURE_SCHOOL_CODE = "AUTH_TEST";
const FIXTURE_SUB = "google-sub-auth-test-00001";
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

async function createFixtures() {
  // Remove any stale records left by a previously interrupted run (suite-owned only).
  await prisma.user.deleteMany({ where: { email: FIXTURE_EMAIL } });
  await prisma.school.deleteMany({ where: { code: FIXTURE_SCHOOL_CODE } });

  const school = await prisma.school.create({
    data: { name: "Auth Test School", code: FIXTURE_SCHOOL_CODE, status: "ACTIVE" },
  });

  const passwordHash = await bcrypt.hash(FIXTURE_PASSWORD, 10);
  await prisma.user.create({
    data: {
      schoolId: school.id,
      name: "Auth Test Psychologist",
      email: FIXTURE_EMAIL,
      passwordHash,
      role: "PSYCHOLOGIST",
      status: "ACTIVE",
    },
  });
}

async function destroyFixtures() {
  // Clean up ONLY records created by this suite.
  await prisma.user.deleteMany({ where: { email: FIXTURE_EMAIL } });
  await prisma.school.deleteMany({ where: { code: FIXTURE_SCHOOL_CODE } });
}

// ────────────────────────────────────────────────────────────
// Test server
// ────────────────────────────────────────────────────────────
const app = express();
app.use(cookieParser());
app.use(express.json());
app.use("/api/auth", authRouter);

let server: http.Server;
let baseUrl: string;

test.before(async () => {
  await ensureTestDatabaseExists();
  applyMigrationsToTestDatabase();
  await createFixtures();

  await new Promise<void>((resolve) => {
    server = app.listen(0, () => {
      const address = server.address() as { port: number };
      baseUrl = `http://localhost:${address.port}/api/auth`;
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
// 1. Invalid Google token rejection returns HTTP 401
// ────────────────────────────────────────────────────────────
test("1. Invalid Google token rejection returns HTTP 401", async () => {
  const originalVerify = googleClient.verifyIdToken;
  googleClient.verifyIdToken = async () => {
    throw new Error("Invalid token signature");
  };

  try {
    const res = await fetch(`${baseUrl}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: "invalid_fake_token" }),
    });

    assert.equal(res.status, 401);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error, "Invalid or expired Google authentication credential.");
  } finally {
    googleClient.verifyIdToken = originalVerify;
  }
});

// ────────────────────────────────────────────────────────────
// 2. Unknown email rejection returns HTTP 403
// ────────────────────────────────────────────────────────────
test("2. Unknown email rejection returns HTTP 403 with exact error message", async () => {
  const originalVerify = googleClient.verifyIdToken;
  googleClient.verifyIdToken = async () => {
    return {
      getPayload: () => ({
        sub: "google-sub-unknown-99999",
        email: "unknown.user.not.in.db@example.com",
        email_verified: true,
        iss: "https://accounts.google.com",
        name: "Unknown User",
      }),
    } as any;
  };

  try {
    const res = await fetch(`${baseUrl}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: "valid_unknown_token" }),
    });

    assert.equal(res.status, 403);
    const data = await res.json();
    assert.equal(data.success, false);
    assert.equal(data.error, "Your account is not authorized. Contact your administrator.");
  } finally {
    googleClient.verifyIdToken = originalVerify;
  }
});

// ────────────────────────────────────────────────────────────
// 3. Authorized Google login preserves DB role, links googleId, session survives refresh and logout
// ────────────────────────────────────────────────────────────
test("3. Authorized Google login succeeds, preserves database role, and links googleId", async () => {
  const originalVerify = googleClient.verifyIdToken;
  googleClient.verifyIdToken = async () => {
    return {
      getPayload: () => ({
        sub: FIXTURE_SUB,
        email: FIXTURE_EMAIL,
        email_verified: true,
        iss: "https://accounts.google.com",
        name: "Auth Test Psychologist",
        // Client/Google attempting to claim ADMIN role — must be IGNORED
        role: "ADMIN",
      }),
    } as any;
  };

  let sessionCookie = "";

  try {
    const res = await fetch(`${baseUrl}/google`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ credential: "valid_google_token" }),
    });

    assert.equal(res.status, 200);
    const data = await res.json();
    assert.equal(data.success, true);
    assert.equal(data.user.email, FIXTURE_EMAIL);
    // Database role preserved (PSYCHOLOGIST in fixture -> psychologist in frontend representation)
    assert.equal(data.user.role, "psychologist");

    // Extract cookie
    const setCookie = res.headers.get("set-cookie");
    assert.ok(setCookie, "Session cookie must be set");
    sessionCookie = setCookie.split(";")[0];

    // Verify googleId was linked in database
    const dbUser = await prisma.user.findFirst({
      where: { email: FIXTURE_EMAIL },
    });
    assert.equal(dbUser?.googleId, FIXTURE_SUB);

    // 4. Test refresh persistence via /api/auth/me using the session cookie
    const meRes = await fetch(`${baseUrl}/me`, {
      method: "GET",
      headers: { Cookie: sessionCookie },
    });
    assert.equal(meRes.status, 200);
    const meData = await meRes.json();
    assert.equal(meData.authenticated, true);
    assert.equal(meData.user.email, FIXTURE_EMAIL);
    assert.equal(meData.user.role, "psychologist");

    // 5. Test Logout clearing the session
    const logoutRes = await fetch(`${baseUrl}/logout`, {
      method: "POST",
      headers: { Cookie: sessionCookie },
    });
    assert.equal(logoutRes.status, 200);

    const logoutCookie = logoutRes.headers.get("set-cookie") || "";
    const meAfterLogoutRes = await fetch(`${baseUrl}/me`, {
      method: "GET",
      headers: { Cookie: logoutCookie },
    });
    assert.equal(meAfterLogoutRes.status, 401);
    const meAfterLogoutData = await meAfterLogoutRes.json();
    assert.equal(meAfterLogoutData.authenticated, false);
  } finally {
    googleClient.verifyIdToken = originalVerify;
  }
});

// ────────────────────────────────────────────────────────────
// 4. Password login still works against the same fixture
// ────────────────────────────────────────────────────────────
test("4. Password login still works", async () => {
  const res = await fetch(`${baseUrl}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email: FIXTURE_EMAIL, password: FIXTURE_PASSWORD }),
  });

  assert.equal(res.status, 200);
  const data = await res.json();
  assert.equal(data.success, true);
  assert.equal(data.user.email, FIXTURE_EMAIL);
  assert.equal(data.user.role, "psychologist");
});
