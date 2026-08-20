// src/server/services/schoolApiService.ts
// Secure outbound service for School API integration (dmwerp.com / rest_school_assist)

import http from "http";
import https from "https";
import { URL } from "url";
import net from "net";

// ────────────────────────────────────────────────────────────
// Security & Limits Configuration
// ────────────────────────────────────────────────────────────
const REQUEST_TIMEOUT_MS = 8000; // 8 seconds timeout
const MAX_RESPONSE_SIZE_BYTES = 1024 * 1024; // 1 MB response ceiling
const MAX_REDIRECTS = 3;

export interface NormalizedStudentPayload {
  externalStudentId: string | null;
  admissionNo: string | null;
  registrationNo: string | null;
  firstName: string | null;
  middleName: string | null;
  lastName: string | null;
  fullName: string;
  email: string | null;
  phone: string | null;
  alternatePhone: string | null;
  gender: string | null;
  dateOfBirth: Date | null;
  externalClassId: string | null;
  externalSessionId: string | null;
  photoUrl: string | null;
  className: string | null;
}

export interface SchoolApiRequestConfig {
  baseUrl: string;
  schoolCode: string;
  appVersion?: string;
  appOs?: string;
  password?: string;
}

/**
 * Validates a target URL against SSRF threats.
 * Disallows loopback (127.0.0.1, localhost), link-local (169.254.x.x),
 * private subnets (10.x.x.x, 192.168.x.x, 172.16-31.x.x), and non-http/https protocols.
 */
export function validateUrlForSsrf(urlString: string): { valid: boolean; reason?: string; url?: URL } {
  let parsedUrl: URL;
  try {
    parsedUrl = new URL(urlString);
  } catch {
    return { valid: false, reason: "Malformed URL." };
  }

  // 1. Protocol check
  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
    return { valid: false, reason: `Disallowed protocol "${parsedUrl.protocol}". Only HTTP and HTTPS are permitted.` };
  }

  const hostname = parsedUrl.hostname.toLowerCase();

  // 2. Reject localhost / loopback names
  if (hostname === "localhost" || hostname.endsWith(".localhost") || hostname === "0.0.0.0") {
    return { valid: false, reason: "Localhost / loopback destination is not permitted." };
  }

  // 3. IP address evaluation
  if (net.isIP(hostname)) {
    // IPv4 private ranges
    if (
      hostname.startsWith("127.") || // Loopback
      hostname.startsWith("10.") || // Class A private
      hostname.startsWith("192.168.") || // Class C private
      hostname.startsWith("169.254.") || // Link-local / AWS / GCP metadata
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(hostname) // Class B private (172.16 - 172.31)
    ) {
      return { valid: false, reason: "Private network and metadata IP ranges are not permitted." };
    }

    // IPv6 loopback and private
    if (hostname === "::1" || hostname === "::" || hostname.startsWith("fe80:") || hostname.startsWith("fc00:")) {
      return { valid: false, reason: "Private / loopback IPv6 addresses are not permitted." };
    }
  }

  return { valid: true, url: parsedUrl };
}

/**
 * Normalizes raw external JSON fields from GetUserList into canonical internal types.
 * Maps exact specification fields:
 *   Pk_Student_M       -> externalStudentId
 *   V_AdmissionNo      -> admissionNo
 *   V_RegistrationNo   -> registrationNo
 *   V_S_FName          -> firstName
 *   V_S_MName          -> middleName
 *   V_S_LName          -> lastName
 *   V_Email            -> email
 *   V_ContactNo        -> phone
 *   V_AlternateNo      -> alternatePhone
 *   V_S_Gender         -> gender
 *   Dt_BirthDate       -> dateOfBirth
 *   Fk_ClassId         -> externalClassId
 *   Fk_SessionId       -> externalSessionId
 *   imgpath            -> photoUrl
 *   v_classname        -> className
 */
export function normalizeExternalStudent(raw: Record<string, any>): NormalizedStudentPayload {
  const getStr = (val: any): string | null => {
    if (val === undefined || val === null) return null;
    const s = String(val).trim();
    return s.length > 0 ? s : null;
  };

  const externalStudentId = getStr(raw.Pk_Student_M || raw.pk_student_m || raw.external_student_id);
  const admissionNo = getStr(raw.V_AdmissionNo || raw.v_admissionno || raw.admission_no);
  const registrationNo = getStr(raw.V_RegistrationNo || raw.v_registrationno || raw.registration_no);
  const firstName = getStr(raw.V_S_FName || raw.v_s_fname || raw.first_name);
  const middleName = getStr(raw.V_S_MName || raw.v_s_mname || raw.middle_name);
  const lastName = getStr(raw.V_S_LName || raw.v_s_lname || raw.last_name);
  const email = getStr(raw.V_Email || raw.v_email || raw.email)?.toLowerCase() || null;
  const phone = getStr(raw.V_ContactNo || raw.v_contactno || raw.phone);
  const alternatePhone = getStr(raw.V_AlternateNo || raw.v_alternateno || raw.alternate_phone);
  const gender = getStr(raw.V_S_Gender || raw.v_s_gender || raw.gender);
  const photoUrl = getStr(raw.imgpath || raw.photo_url || raw.imgPath);
  const externalClassId = getStr(raw.Fk_ClassId || raw.fk_classid || raw.external_class_id);
  const externalSessionId = getStr(raw.Fk_SessionId || raw.fk_sessionid || raw.external_session_id);
  const className = getStr(raw.v_classname || raw.v_ClassName || raw.className || raw.classname);

  // Compute Full Name
  const rawFullName = getStr(raw.full_name || raw.V_FullName);
  const computedName = rawFullName || [firstName, middleName, lastName].filter(Boolean).join(" ") || admissionNo || externalStudentId || "Unnamed Student";

  // Parse Date of Birth safely
  let dateOfBirth: Date | null = null;
  const rawDob = raw.Dt_BirthDate || raw.dt_birthdate || raw.date_of_birth || raw.dob;
  if (rawDob) {
    const parsed = new Date(rawDob);
    if (!isNaN(parsed.getTime())) {
      dateOfBirth = parsed;
    }
  }

  return {
    externalStudentId,
    admissionNo,
    registrationNo,
    firstName,
    middleName,
    lastName,
    fullName: computedName,
    email,
    phone,
    alternatePhone,
    gender,
    dateOfBirth,
    externalClassId,
    externalSessionId,
    photoUrl,
    className,
  };
}

/**
 * Executes a secure HTTP POST request to the School API with SSRF guard, timeout,
 * response-size ceiling, and sanitized error handling.
 */
export async function executeSchoolApiRequest(
  endpointUrl: string,
  payload: Record<string, any>,
  redirectCount = 0
): Promise<{ status: number; data: any; rawResponseText: string }> {
  if (redirectCount > MAX_REDIRECTS) {
    throw new Error("Too many redirects from external School API.");
  }

  // SSRF Validation
  const validation = validateUrlForSsrf(endpointUrl);
  if (!validation.valid || !validation.url) {
    throw new Error(`SSRF Guard Violation: ${validation.reason}`);
  }

  const url = validation.url;
  const isHttps = url.protocol === "https:";
  const client = isHttps ? https : http;

  const postBody = JSON.stringify(payload);

  return new Promise((resolve, reject) => {
    let hasTimedOut = false;

    const req = client.request(
      url,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Content-Length": Buffer.byteLength(postBody),
          "User-Agent": "EduWell-Psych-Sync/1.0",
          Accept: "application/json, text/plain, */*",
        },
      },
      (res) => {
        // Handle 3xx Redirects safely
        if (res.statusCode && res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          const redirectUrl = new URL(res.headers.location, url).toString();
          req.destroy();
          resolve(executeSchoolApiRequest(redirectUrl, payload, redirectCount + 1));
          return;
        }

        let totalBytes = 0;
        const chunks: Buffer[] = [];

        res.on("data", (chunk: Buffer) => {
          totalBytes += chunk.length;
          if (totalBytes > MAX_RESPONSE_SIZE_BYTES) {
            req.destroy(new Error(`Response exceeded maximum allowed size of ${MAX_RESPONSE_SIZE_BYTES} bytes.`));
            return;
          }
          chunks.push(chunk);
        });

        res.on("end", () => {
          if (hasTimedOut) return;
          const bodyText = Buffer.concat(chunks).toString("utf8");
          let parsedData: any = null;

          try {
            parsedData = JSON.parse(bodyText);
          } catch {
            // Some WCF / SOAP JSON endpoints wrap results or return XML/text error
            parsedData = { rawText: bodyText };
          }

          resolve({
            status: res.statusCode || 200,
            data: parsedData,
            rawResponseText: bodyText,
          });
        });
      }
    );

    // Timeout protection
    req.setTimeout(REQUEST_TIMEOUT_MS, () => {
      hasTimedOut = true;
      req.destroy(new Error(`External School API request timed out after ${REQUEST_TIMEOUT_MS}ms.`));
    });

    req.on("error", (err) => {
      reject(new Error(err.message || "Failed to communicate with external School API."));
    });

    req.write(postBody);
    req.end();
  });
}

/**
 * Fetches student record from configured GetUserList endpoint.
 */
export async function fetchStudentFromSchoolApi(
  config: SchoolApiRequestConfig,
  studentIdentifier: string
): Promise<{ success: boolean; student: NormalizedStudentPayload | null; rawCount: number; error?: string }> {
  // Construct full endpoint URL
  let fullUrl = config.baseUrl.trim();
  if (!fullUrl.endsWith("/ws_getuser.svc/GetUserList") && !fullUrl.endsWith("/GetUserList")) {
    fullUrl = fullUrl.replace(/\/+$/, "") + "/ws_getuser.svc/GetUserList";
  }

  const payload = {
    school: config.schoolCode,
    stdno: studentIdentifier.trim(),
    pass: config.password || "",
    Appver: config.appVersion || "1.1",
    appos: config.appOs || "web",
  };

  try {
    const response = await executeSchoolApiRequest(fullUrl, payload);

    if (response.status < 200 || response.status >= 300) {
      return {
        success: false,
        student: null,
        rawCount: 0,
        error: `School API responded with HTTP status ${response.status}`,
      };
    }

    const data = response.data;
    // WCF service may return array directly or wrapped in GetUserListResult / d / Table
    let records: any[] = [];
    if (Array.isArray(data)) {
      records = data;
    } else if (Array.isArray(data?.GetUserListResult)) {
      records = data.GetUserListResult;
    } else if (Array.isArray(data?.d)) {
      records = data.d;
    } else if (Array.isArray(data?.Table)) {
      records = data.Table;
    } else if (typeof data === "object" && data !== null && (data.Pk_Student_M || data.V_AdmissionNo || data.student_id)) {
      records = [data];
    }

    if (records.length === 0) {
      return {
        success: true,
        student: null,
        rawCount: 0,
      };
    }

    const normalized = normalizeExternalStudent(records[0]);
    return {
      success: true,
      student: normalized,
      rawCount: records.length,
    };
  } catch (err: any) {
    return {
      success: false,
      student: null,
      rawCount: 0,
      error: err.message || "Failed to communicate with external School API.",
    };
  }
}

/**
 * Tests connection to the configured School API.
 */
export async function testSchoolApiConnection(
  config: SchoolApiRequestConfig
): Promise<{ success: boolean; message: string; latencyMs: number }> {
  const startTime = Date.now();
  const res = await fetchStudentFromSchoolApi(config, "0"); // Query probe ID 0 / test
  const latencyMs = Date.now() - startTime;

  if (res.success) {
    return {
      success: true,
      message: `Connection successful (${latencyMs}ms). School API responded normally.`,
      latencyMs,
    };
  }

  return {
    success: false,
    message: res.error || "Connection test failed.",
    latencyMs,
  };
}
