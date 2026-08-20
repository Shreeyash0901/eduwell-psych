import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "./auth";
import { prisma } from "../../lib/db";

/**
 * Route pattern → human-readable description map.
 * Patterns are matched in order. The first match wins.
 * Supports :id wildcards (replaced with a numeric segment regex).
 */
const ACTION_DESCRIPTIONS: Array<{ method: string; pattern: RegExp; description: string }> = [
  // ── Students ─────────────────────────────────────────────
  { method: "POST",   pattern: /^\/api\/students$/,                         description: "Created a new student record" },
  { method: "PUT",    pattern: /^\/api\/students\/\d+$/,                    description: "Updated a student record" },
  { method: "PATCH",  pattern: /^\/api\/students\/\d+$/,                    description: "Updated a student record" },
  { method: "DELETE", pattern: /^\/api\/students\/\d+$/,                    description: "Deleted a student record" },
  { method: "POST",   pattern: /^\/api\/students\/import$/,                 description: "Imported students via bulk upload" },
  { method: "POST",   pattern: /^\/api\/students\/sync$/,                   description: "Triggered student data synchronization" },

  // ── Observations ─────────────────────────────────────────
  { method: "POST",   pattern: /^\/api\/observations$/,                     description: "Submitted a new student observation" },
  { method: "PUT",    pattern: /^\/api\/observations\/\d+$/,                description: "Updated a student observation" },
  { method: "PATCH",  pattern: /^\/api\/observations\/\d+$/,                description: "Updated a student observation" },
  { method: "PATCH",  pattern: /^\/api\/observations\/\d+\/status$/,        description: "Changed observation status" },
  { method: "DELETE", pattern: /^\/api\/observations\/\d+$/,                description: "Deleted a student observation" },

  // ── Assessments ──────────────────────────────────────────
  { method: "POST",   pattern: /^\/api\/assessments\/templates$/,           description: "Created a new assessment template" },
  { method: "PUT",    pattern: /^\/api\/assessments\/templates\/\d+$/,      description: "Updated an assessment template" },
  { method: "PATCH",  pattern: /^\/api\/assessments\/templates\/\d+$/,      description: "Updated an assessment template" },
  { method: "DELETE", pattern: /^\/api\/assessments\/templates\/\d+$/,      description: "Deleted an assessment template" },
  { method: "POST",   pattern: /^\/api\/assessments\/start$/,               description: "Started a new student assessment session" },
  { method: "PUT",    pattern: /^\/api\/assessments\/\d+\/responses$/,      description: "Saved assessment question responses" },
  { method: "POST",   pattern: /^\/api\/assessments\/\d+\/complete$/,       description: "Completed and submitted a student assessment" },
  { method: "PATCH",  pattern: /^\/api\/assessments\/\d+\/review$/,         description: "Reviewed and finalised an assessment" },
  { method: "DELETE", pattern: /^\/api\/assessments\/\d+$/,                 description: "Deleted a student assessment" },

  // ── Reports ───────────────────────────────────────────────
  { method: "POST",   pattern: /^\/api\/reports$/,                          description: "Generated a new report" },
  { method: "PUT",    pattern: /^\/api\/reports\/\d+$/,                     description: "Updated a report" },
  { method: "DELETE", pattern: /^\/api\/reports\/\d+$/,                     description: "Deleted a report" },

  // ── Settings ─────────────────────────────────────────────
  { method: "PUT",    pattern: /^\/api\/settings\/school-profile$/,         description: "Updated school profile settings" },
  { method: "PATCH",  pattern: /^\/api\/settings\/school-profile$/,         description: "Updated school profile settings" },
  { method: "POST",   pattern: /^\/api\/settings\/users$/,                  description: "Created a new user account" },
  { method: "PUT",    pattern: /^\/api\/settings\/users\/\d+$/,             description: "Updated a user account" },
  { method: "PATCH",  pattern: /^\/api\/settings\/users\/\d+$/,             description: "Updated a user account" },
  { method: "DELETE", pattern: /^\/api\/settings\/users\/\d+$/,             description: "Deleted a user account" },
  { method: "PATCH",  pattern: /^\/api\/settings\/users\/\d+\/password$/,   description: "Changed a user's password" },
  { method: "POST",   pattern: /^\/api\/settings\/teacher-access$/,         description: "Updated teacher class/section access" },
  { method: "DELETE", pattern: /^\/api\/settings\/teacher-access$/,         description: "Removed teacher class/section access" },
  { method: "PUT",    pattern: /^\/api\/settings\/school-settings$/,        description: "Updated school preferences" },
  { method: "POST",   pattern: /^\/api\/settings\/classes$/,                description: "Added a new grade/class" },
  { method: "PATCH",  pattern: /^\/api\/settings\/classes\/\d+$/,           description: "Renamed or updated a class" },
  { method: "DELETE", pattern: /^\/api\/settings\/classes\/\d+$/,           description: "Deleted a grade/class" },
  { method: "POST",   pattern: /^\/api\/settings\/classes\/\d+\/sections$/,  description: "Added a section to a class" },
  { method: "DELETE", pattern: /^\/api\/settings\/classes\/\d+\/sections\/\d+$/, description: "Removed a section from a class" },

  // ── School API ────────────────────────────────────────────
  { method: "POST",   pattern: /^\/api\/school-api\/config$/,               description: "Saved school API configuration" },
  { method: "PUT",    pattern: /^\/api\/school-api\/config$/,               description: "Updated school API configuration" },
  { method: "POST",   pattern: /^\/api\/school-api\/test$/,                 description: "Tested school API connection" },
  { method: "POST",   pattern: /^\/api\/school-api\/sync$/,                 description: "Triggered school API student sync" },

  // ── Notifications ─────────────────────────────────────────
  { method: "PATCH",  pattern: /^\/api\/notifications\/\d+\/read$/,         description: "Marked a notification as read" },
  { method: "PATCH",  pattern: /^\/api\/notifications\/read-all$/,          description: "Marked all notifications as read" },
  { method: "POST",   pattern: /^\/api\/notifications\/mark-all-read$/,     description: "Marked all notifications as read" },
];

/**
 * Returns a friendly one-line description for an API action,
 * or falls back to a formatted version of the raw route.
 */
function resolveDescription(method: string, path: string): string {
  const cleanPath = path.split("?")[0];
  for (const entry of ACTION_DESCRIPTIONS) {
    if (entry.method === method && entry.pattern.test(cleanPath)) {
      return entry.description;
    }
  }
  // Fallback: still human-ify it a bit (e.g. "POST /api/students" → "POST /api/students")
  return `${method} ${cleanPath}`.substring(0, 100);
}

export function globalAuditMiddleware(req: AuthenticatedRequest, res: Response, next: NextFunction) {
  // Only audit mutating methods
  const mutatingMethods = ["POST", "PUT", "PATCH", "DELETE"];
  if (!mutatingMethods.includes(req.method)) {
    return next();
  }

  // Ensure user identity is present
  if (!req.user) {
    return next();
  }

  // Exclude super-admin routes to avoid duplicating existing manual SystemAuditLog entries
  if (req.originalUrl.startsWith("/api/super-admin")) {
    return next();
  }

  // Skip audit logging in test environment to avoid breaking foreign key constraints during test user teardown
  if (process.env.NODE_ENV === "test" || (process.env.TEST_DATABASE_URL && process.env.DATABASE_URL === process.env.TEST_DATABASE_URL)) {
    return next();
  }

  const action = resolveDescription(req.method, req.originalUrl);

  // Capture safe operational metadata (body intentionally excluded to avoid PII)
  const metadata = {
    method: req.method,
    path: req.originalUrl,
    query: req.query,
    params: req.params,
  };

  // Wait for the response to finish to determine the outcome
  res.on("finish", async () => {
    try {
      const outcome = res.statusCode >= 400 ? "FAILURE" : "SUCCESS";

      await prisma.systemAuditLog.create({
        data: {
          actorUserId: req.user!.id,
          action,
          targetType: "API_ROUTE",
          targetSchoolId: req.user!.schoolId,
          outcome,
          metadata,
        },
      });
    } catch (error) {
      console.error("[AUDIT_MIDDLEWARE] Failed to write audit log:", error);
    }
  });

  next();
}
