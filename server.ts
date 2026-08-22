import express from "express";
import http from "http";
import path from "path";
import { fileURLToPath } from "url";
import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";
import helmet from "helmet";
import cookieParser from "cookie-parser";
import { authRouter } from "./src/server/auth";
import { studentsRouter } from "./src/server/students";
import { lookupsRouter } from "./src/server/lookups";
import { observationsRouter } from "./src/server/observations";
import { assessmentsRouter } from "./src/server/assessments";
import { reportsRouter } from "./src/server/reports";
import { schoolApiRouter } from "./src/server/schoolApi";
import { settingsRouter } from "./src/server/settings";
import { notificationsRouter } from "./src/server/notifications";
import { superAdminRouter } from "./src/server/superAdmin";
import { requireAuth } from "./src/server/middleware/auth";
import { serverConfig } from "./src/server/env";

dotenv.config();

let __filename = "";
let __dirname = process.cwd();

try {
  // Try using ESM import.meta.url if it exists
  if (typeof import.meta !== "undefined" && import.meta.url) {
    __filename = fileURLToPath(import.meta.url);
    __dirname = path.dirname(__filename);
  } else if (typeof __filename !== "undefined" && typeof __dirname !== "undefined") {
    // We are in a CommonJS environment (esbuild bundle)
    // __filename and __dirname are already globally available
  } else {
    __filename = path.join(__dirname, "server.ts");
  }
} catch (e) {
  // Fallback if fileURLToPath throws
  __filename = path.join(__dirname, "server.ts");
}

const app = express();
const server = http.createServer(app);
const PORT = serverConfig.port || 3000;

// Security Headers with Helmet
// crossOriginOpenerPolicy MUST be same-origin-allow-popups so that the
// Google Identity Services popup (accounts.google.com/gsi/transform) can
// post the credential JWT back to this window via postMessage.
app.use(
  helmet({
    contentSecurityPolicy: false, // Disabled to allow Vite HMR and dynamic script loading in SPA development
    crossOriginEmbedderPolicy: false,
    crossOriginOpenerPolicy: { policy: "same-origin-allow-popups" },
  })
);

// Cookie Parser for HttpOnly Auth Token handling
app.use(cookieParser());

// JSON Body Parser
app.use(express.json());

// Mount API Routers
app.use("/api/auth", authRouter);
app.use("/api/students", studentsRouter);
app.use("/api/lookups", lookupsRouter);
app.use("/api/observations", observationsRouter);
app.use("/api/assessments", assessmentsRouter);
app.use("/api/reports", reportsRouter);
app.use("/api/school-api", schoolApiRouter);
app.use("/api/settings", settingsRouter);
app.use("/api/notifications", notificationsRouter);
app.use("/api/super-admin", superAdminRouter);

// Initialize Gemini API client on server
const getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build",
      },
    },
  });
};

// Health check endpoint
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "EduWell Psych" });
});

// AI Observation Analysis endpoint
app.post("/api/gemini/analyze-observation", requireAuth, async (req, res) => {
  try {
    const { studentName, grade, narrative, triggers, interventions } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured.",
        analysis: "AI assistance requires a valid GEMINI_API_KEY. Please verify configuration in Settings > Secrets."
      });
    }

    const prompt = `
You are an expert Educational & Child Psychologist assisting school staff.
Analyze this submitted student observation record:

Student: ${studentName || "Liam Miller"} (Grade: ${grade || "8"})
Observation Narrative: "${narrative || "Student became highly frustrated during group work when apparatus broke, pushed materials off desk, covered ears, and refused to speak."}"
Reported Triggers: "${triggers || "Group work involving fine motor skills and shared materials"}"
Interventions Attempted: "${interventions || "Offered alternative independent task, verbal reassurance"}"

Please provide a concise, highly professional psychological assessment with:
1. Primary Emotional & Behavioral Hypotheses (e.g. Executive Functioning overload, social frustration tolerance)
2. Recommended School-based Support Strategies (3 actionable points for teachers/counselors)
3. Suggested Follow-up Screening or Tier 2/3 interventions

Keep tone objective, supportive, and formatted in clear sections with bullet points.
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ analysis: response.text });
  } catch (error: any) {
    console.error("Error analyzing observation:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI analysis" });
  }
});

// AI Assessment Interpretation endpoint
app.post("/api/gemini/assessment-summary", requireAuth, async (req, res) => {
  try {
    const { studentName, assessmentName, scores, overallScore } = req.body;
    const ai = getGeminiClient();

    if (!ai) {
      return res.status(400).json({
        error: "GEMINI_API_KEY is not configured.",
        summary: "AI synthesis requires a valid GEMINI_API_KEY."
      });
    }

    const prompt = `
You are a senior School Psychologist synthesizing assessment results.
Details:
Student Name: ${studentName || "Alex Johnson"}
Assessment Protocol: ${assessmentName || "Emotional Wellbeing Scale"}
Overall Score: ${overallScore || 72}/100
Domain Scores: ${JSON.stringify(scores || { "Emotional Regulation": 45, "Social Interaction": 82, "Self Confidence": 68, "School Adjustment": 90 })}

Generate a brief 3-paragraph clinical summary:
1. Executive Summary of strengths and key area of concern
2. Domain Insights focusing on areas needing attention
3. Recommended Accommodations for IEP / 504 / Classroom support
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });

    res.json({ summary: response.text });
  } catch (error: any) {
    console.error("Error generating assessment summary:", error);
    res.status(500).json({ error: error.message || "Failed to generate summary" });
  }
});

// Serve frontend assets or mount Vite dev middleware
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server,
        },
      },
      appType: "spa",
    });
    app.use(vite.middlewares);

    // Re-assert COOP after Vite middlewares — Vite's internal dev server can
    // inject its own Cross-Origin-Opener-Policy header that overwrites Helmet.
    // This middleware runs after Vite and unconditionally stamps the correct
    // value on every HTML response so the GIS popup can return its credential.
    app.use((_req, res, next) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
      next();
    });
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (_req, res) => {
      res.setHeader("Cross-Origin-Opener-Policy", "same-origin-allow-popups");
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  server.listen(PORT, () => {
    console.log(`EduWell Psych Server running on http://localhost:${PORT}`);
  });
}

setupViteOrStatic();
