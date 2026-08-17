var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// server.ts
var import_express = __toESM(require("express"), 1);
var import_http = __toESM(require("http"), 1);
var import_path = __toESM(require("path"), 1);
var import_url = require("url");
var import_genai = require("@google/genai");
var import_dotenv = __toESM(require("dotenv"), 1);
var import_meta = {};
import_dotenv.default.config();
var __filename = "";
var __dirname = process.cwd();
if (import_meta.url) {
  __filename = (0, import_url.fileURLToPath)(import_meta.url);
  __dirname = import_path.default.dirname(__filename);
} else {
  __filename = import_path.default.join(__dirname, "server.ts");
}
var app = (0, import_express.default)();
var server = import_http.default.createServer(app);
var PORT = 3e3;
app.use(import_express.default.json());
var getGeminiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new import_genai.GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        "User-Agent": "aistudio-build"
      }
    }
  });
};
app.get("/api/health", (_req, res) => {
  res.json({ status: "ok", app: "EduWell Psych" });
});
app.post("/api/gemini/analyze-observation", async (req, res) => {
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
      contents: prompt
    });
    res.json({ analysis: response.text });
  } catch (error) {
    console.error("Error analyzing observation:", error);
    res.status(500).json({ error: error.message || "Failed to generate AI analysis" });
  }
});
app.post("/api/gemini/assessment-summary", async (req, res) => {
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
      contents: prompt
    });
    res.json({ summary: response.text });
  } catch (error) {
    console.error("Error generating assessment summary:", error);
    res.status(500).json({ error: error.message || "Failed to generate summary" });
  }
});
async function setupViteOrStatic() {
  if (process.env.NODE_ENV !== "production") {
    const { createServer: createViteServer } = await import("vite");
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: {
          server
        }
      },
      appType: "spa"
    });
    app.use(vite.middlewares);
  } else {
    const distPath = import_path.default.join(process.cwd(), "dist");
    app.use(import_express.default.static(distPath));
    app.get("*", (_req, res) => {
      res.sendFile(import_path.default.join(distPath, "index.html"));
    });
  }
  server.listen(PORT, () => {
    console.log(`EduWell Psych Server running on http://localhost:${PORT}`);
  });
}
setupViteOrStatic();
//# sourceMappingURL=server.cjs.map
