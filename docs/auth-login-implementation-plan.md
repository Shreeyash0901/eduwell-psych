# EduWell Psych — Authentication & Login Implementation Plan

## 1. Executive Summary

This document specifies the technical design, security architecture, and implementation strategy for the password-based authentication module in the **EduWell Psych** application. 

The implementation introduces enterprise-grade JWT authentication using **HttpOnly cookies**, **bcrypt-compatible password hashing**, **express-rate-limit**, **Helmet security headers**, and a centralized React **AuthContext** with session auto-restoration via `/api/auth/me`.

---

## 2. Security Architecture & Threat Model

```
+-----------------------------------------------------------------------------------+
|                                 CLIENT (Browser)                                  |
|                                                                                   |
|  +---------------------+      credentials: 'include'       +-------------------+  |
|  |   React Frontend    | --------------------------------> |  HttpOnly Cookie  |  |
|  | (AuthProvider/Hook) |                                   | (No JS Access)    |  |
|  +---------------------+                                   +-------------------+  |
+-----------------------------------------------------------------------------------+
                                        |
                            HTTPS / Same-Origin API
                                        v
+-----------------------------------------------------------------------------------+
|                                EXPRESS BACKEND                                    |
|                                                                                   |
|  [Helmet Headers] -> [Rate Limiter (Auth)] -> [Cookie Parser] -> [Body Parser]    |
|                                        |                                          |
|                                        v                                          |
|                        +-------------------------------+                          |
|                        |     Auth Controller / API     |                          |
|                        |  /login, /me, /logout         |                          |
|                        +-------------------------------+                          |
|                                        |                                          |
|                 +----------------------+----------------------+                   |
|                 |                                             |                   |
|                 v                                             v                   |
|       +-------------------+                         +-------------------+         |
|       | JWT Sign & Verify |                         |  Bcrypt Password  |         |
|       | (HMAC-SHA256)     |                         |  Hash Verify      |         |
|       +-------------------+                         +-------------------+         |
|                                                               |                   |
|                                                               v                   |
|                                                     +-------------------+         |
|                                                     |  Prisma Client    |         |
|                                                     | (PostgreSQL V1)   |         |
|                                                     +-------------------+         |
+-----------------------------------------------------------------------------------+
```

### Key Security Decisions

1. **Storage Strategy (HttpOnly Cookies vs. LocalStorage)**:
   - **Zero LocalStorage Token Storage**: Storing JWT tokens in `localStorage` makes the application vulnerable to Cross-Site Scripting (XSS) attacks where malicious scripts extract auth tokens.
   - **HttpOnly, Secure, SameSite Cookies**: The auth token is stored in an `HttpOnly` cookie (`eduwell_token`). JavaScript cannot read or modify this cookie.
   - `SameSite=Lax` prevents Cross-Site Request Forgery (CSRF) on standard cross-site navigation.
   - `Secure=true` in production enforces transmission over HTTPS only.

2. **Password Verification**:
   - Passwords are verified against the `password_hash` column using constant-time `bcrypt.compare()`.
   - Plaintext passwords are never logged, stored in cache, or returned in API responses.

3. **Generic Error Responses**:
   - Authentication failures return generic messages (`Invalid email or password`) with HTTP 401 status to prevent user enumeration attacks.

4. **Rate Limiting**:
   - Auth endpoints are protected with `express-rate-limit` (e.g., max 10 failed login attempts per 15 minutes per IP) to mitigate brute-force and credential-stuffing attacks.

5. **Sanitization and Data Minimization**:
   - The user payload returned by `/api/auth/login` and `/api/auth/me` includes only non-sensitive attributes: `id`, `schoolId`, `name`, `email`, `role`, and `schoolName`.
   - `passwordHash` is explicitly excluded from database query projections.

---

## 3. Database Alignment (Manager V1 Schema)

The authentication system operates directly on the approved `users` and `schools` tables from `prisma/schema.prisma`:

| Model / Table | Field | Type | Auth Role |
| :--- | :--- | :--- | :--- |
| `User` (`users`) | `id` | `Int` (PK) | Unique user identifier stored in JWT payload |
| `User` (`users`) | `schoolId` | `Int` (FK) | Multi-tenant root association |
| `User` (`users`) | `email` | `VarChar(255)` (Unique) | Primary login identifier (normalized lowercase) |
| `User` (`users`) | `passwordHash` | `VarChar(255)` | Bcrypt hash string |
| `User` (`users`) | `role` | `VarChar(30)` | RBAC role: `ADMIN`, `PSYCHOLOGIST`, `TEACHER`, `PARENT` |
| `User` (`users`) | `status` | `VarChar(20)` | Account status: must be `ACTIVE` to authenticate |
| `School` (`schools`)| `name` | `VarChar(255)` | School name populated in safe session |

---

## 4. API Endpoints Specification

### 4.1 `POST /api/auth/login`
- **Description**: Validates credentials, checks user status, generates JWT, sets `HttpOnly` cookie, and returns safe user session.
- **Rate Limit**: 10 requests / 15 minutes.
- **Request Body**:
  ```json
  {
    "email": "psych@westside.edu",
    "password": "password123"
  }
  ```
- **Success Response (200 OK)**:
  - Header: `Set-Cookie: eduwell_token=<JWT>; Path=/; HttpOnly; SameSite=Lax; Max-Age=604800`
  - Body:
    ```json
    {
      "success": true,
      "user": {
        "id": 2,
        "schoolId": 1,
        "name": "Dr. James Okafor",
        "email": "psych@westside.edu",
        "role": "psychologist",
        "schoolName": "Westside Academy"
      }
    }
    ```
- **Failure Response (400 / 401)**:
  ```json
  {
    "success": false,
    "error": "Invalid email or password."
  }
  ```

### 4.2 `GET /api/auth/me`
- **Description**: Verifies session cookie, validates user in database, and returns current user session.
- **Request**: Cookie `eduwell_token`.
- **Success Response (200 OK)**:
  ```json
  {
    "authenticated": true,
    "user": {
      "id": 2,
      "schoolId": 1,
      "name": "Dr. James Okafor",
      "email": "psych@westside.edu",
      "role": "psychologist",
      "schoolName": "Westside Academy"
    }
  }
  ```
- **Failure Response (401 Unauthorized)**:
  ```json
  {
    "authenticated": false,
    "error": "Not authenticated."
  }
  ```

### 4.3 `POST /api/auth/logout`
- **Description**: Invalidates client session by clearing the `eduwell_token` cookie.
- **Success Response (200 OK)**:
  - Header: `Set-Cookie: eduwell_token=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT; HttpOnly; SameSite=Lax`
  - Body:
    ```json
    {
      "success": true,
      "message": "Logged out successfully."
    }
    ```

---

## 5. Frontend Authentication Architecture

### 5.1 `AuthContext` and `useAuth` Hook
A unified React Context manages global authentication state:
- `user`: Currently authenticated `UserSession | null`
- `isLoading`: Boolean flag true while checking `/api/auth/me` on app boot
- `login(email, password)`: Calls `POST /api/auth/login` with `credentials: 'include'`
- `logout()`: Calls `POST /api/auth/logout` and resets state to `null`

### 5.2 Application State Synchronization
- When unauthenticated, the application renders `LoginView`.
- When authenticated, the application loads the user's appropriate workspace (Psychologist Dashboard, Teacher Dashboard, Admin, or Parent Feedback View).
- All mock data (students, observations, assessment protocols, results) remains functional and available.

---

## 6. Seed Data Strategy

Existing seed hashes in `prisma/seed.ts` are updated to standard bcrypt hashes generated with 10 salt rounds:
- **Default Demo Password**: `password123`
- **Seeded Accounts**:
  - `admin@westside.edu` / `password123` (Admin)
  - `psych@westside.edu` / `password123` (Lead Psychologist)
  - `teacher@westside.edu` / `password123` (Educator)
  - `dr.jenkins@eduwell.org` / `password123` (Demo Psychologist)
  - `sarah.teacher@eduwell.org` / `password123` (Demo Teacher)
  - `admin@eduwell.org` / `password123` (Demo Admin)
  - `parent.johnson@eduwell.org` / `password123` (Demo Parent)

---

## 7. Future-Proofing for Phase 3 (Google OAuth)
- The JWT payload and session cookie design can accommodate Google OAuth profile IDs without altering cookie handling or RBAC resolution.
- `VITE_GOOGLE_CLIENT_ID` will be added in Phase 3 without exposing any server secrets.
