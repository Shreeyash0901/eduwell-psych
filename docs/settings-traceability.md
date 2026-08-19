# EduWell Psych — Settings Module Requirements Traceability & Readiness

**Last verified:** 2026-08-19 (commit `5be69cd`, feature/auth-login-module)
**Scope:** Settings module, authentication, tenant isolation, and RBAC backend

---

## 1. Readiness Verdict

| Context | Verdict |
| :--- | :--- |
| MVP / demo readiness | ✅ READY |
| Production readiness with real student data | 🚫 NOT YET READY |

Reasons production is NOT YET READY:

- General audit logging covers only School API events; school-profile mutations are not audited.
- CSRF protection relies on layered cookie/CORS mitigation (SameSite=Lax, HttpOnly, Secure-in-production, strict same-origin, JSON-only mutations) but has not been verified with an explicit CSRF token or Origin check; documented as recommended production hardening.
- User invitations, Assessment Settings, Report Settings, and Notifications remain incomplete.

---

## 2. Requirements Traceability Matrix

| Requirement | Status |
| :--- | :--- |
| School Profile | ✅ Implemented — read/update via `GET/PUT /api/settings/school-profile`, ADMIN-gated, tenant-scoped |
| Academic Year | 🟡 Read-only/Partial — current academic session surfaced from `academic_sessions`; not editable |
| Users & Roles | 🟡 Partial — real tenant-scoped users via `GET /api/settings/users`; invitation workflow pending |
| Teacher Access | 🟡 Read-only/Partial — class/section access scopes returned; no management UI |
| Assessment Settings | ⏳ Coming Soon — placeholder section, no backend |
| Report Settings | ⏳ Coming Soon — placeholder section, no backend |
| Notifications | ⏳ Coming Soon — placeholder section, no backend |
| Audit Logs | 🟡 Partial — School API events only (`school_api_audit_logs`) |
| Permission Management | 🟡 Backend RBAC implemented (`requireRole`, tenant middleware); management workflow partial |

---

## 3. Remaining Production Limitations

- General audit logging (school-profile changes, admin actions) not implemented.
- CSRF hardening: no explicit CSRF token or Origin verification (see Section 5).
- User invitation API not implemented; Invite User is disabled in the UI.
- Assessment Settings, Report Settings, and Notifications have no backend.
- Logo management is URL-only (no file upload endpoint).
- Server-side pagination/scoping of user lists not yet required at current user counts.

---

## 4. Verification Evidence (2026-08-19)

| Gate | Result |
| :--- | :--- |
| `npm run lint` (tsc --noEmit) | ✅ Pass |
| `npm test` | ✅ 51/51 pass |
| `npm run build` | ✅ Pass |
| `npx prisma validate` | ✅ Schema valid |
| `npx prisma migrate status` | ✅ Up to date (7 migrations) |
| Settings tests (`tests/settings.test.ts`) | ✅ 401, role-based access, ADMIN-only PUT, persistence, forbidden fields, cross-tenant, no secrets |

---

## 5. CSRF & Cookie-Security Verification

Classification: **ADEQUATE FOR CURRENT SAME-ORIGIN MVP** — no blocking vulnerability found.

Current layered mitigation:

| Control | State |
| :--- | :--- |
| `httpOnly: true` | ✅ `src/server/auth.ts` `getCookieOptions()` |
| `secure: true` in production | ✅ `secure: serverConfig.isProduction` |
| `sameSite: "lax"` | ✅ Set on set/clear in login, Google SSO, `/me`, logout |
| Cookie path / domain | ✅ `path: "/"`, host-only (no `domain` attribute) |
| CORS | ✅ No CORS middleware — strict same-origin (Express serves `dist/` in production; Vite middleware in dev) |
| Credentials | ✅ Frontend uses `credentials: "include"` on same-origin `/api` fetches only |
| Wildcard origin with credentials | ✅ None (no CORS configured at all) |
| State-changing GET endpoints | ✅ None — all mutations are POST/PUT/PATCH/DELETE |
| PUT/PATCH/DELETE JSON-only | ✅ Only `express.json()` body parser; no urlencoded/multipart parser |
| Cross-origin form-compatible mutations | ✅ Not possible — no urlencoded parser; cookie not sent on cross-site POST (SameSite=Lax) |
| Authentication on mutations | ✅ All routers mount `requireAuth`; mutations use `requireRole(...)` |
| Logout | ✅ POST `/logout` clears cookie with matching attributes; SameSite=Lax prevents cross-site submission of the cookie |

Notes / hardening recommendations (not blockers):

- HttpOnly protects the cookie from JavaScript access; it does **not** independently prevent CSRF.
- CORS absence is not a complete CSRF defense on its own; SameSite=Lax is the primary mitigation for cross-site POSTs.
- For production, add explicit CSRF protection (synchronizer token or Origin/Referer verification) as a separate follow-up task — intentionally out of scope for this commit.
- All state-changing routes currently accept JSON only; this already forces a CORS preflight for any cross-origin JSON request, which fails without CORS configuration.