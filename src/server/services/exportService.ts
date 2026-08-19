// src/server/services/exportService.ts
// Secure PDF & CSV Export Generation

import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";
import { Writable } from "stream";
import { sanitizeCsvValue } from "./reportAccess";

/**
 * Normalize and clean string inputs for PDF generation:
 * - Truncates excessively long narrative to prevent buffer exploitation / layout breaks.
 * - Strips dangerous ASCII control characters while preserving valid newlines and tabs.
 * - Preserves readable Unicode characters.
 */
function cleanPdfText(val: unknown, maxLength = 3000): string {
  if (val === null || val === undefined) {
    return "";
  }
  let str = String(val);
  if (str.length > maxLength) {
    str = str.slice(0, maxLength) + "… [truncated]";
  }
  // Strip control characters (0x00-0x08, 0x0B, 0x0C, 0x0E-0x1F, 0x7F) while keeping \t (0x09), \n (0x0A), \r (0x0D)
  return str.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "");
}

export const generatePdfStream = (reportData: any, outputStream: Writable) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(outputStream);

  const title = cleanPdfText(reportData?.title || "EduWell Psych - Analytical Report", 150);
  const totalStudents = Number(reportData?.summary?.totalStudents ?? 0);
  const totalAssessments = Number(reportData?.summary?.totalAssessments ?? 0);
  const totalObservations = Number(reportData?.summary?.totalObservations ?? 0);

  // Header
  doc
    .fontSize(20)
    .text(title, { align: "center" })
    .moveDown();

  doc
    .fontSize(12)
    .text(`Total Students: ${totalStudents}`)
    .text(`Total Assessments: ${totalAssessments}`)
    .text(`Total Observations: ${totalObservations}`)
    .moveDown();

  // Assessments Section
  if (Array.isArray(reportData?.assessments) && reportData.assessments.length > 0) {
    doc.fontSize(16).text("Assessments Summary", { underline: true }).moveDown(0.5);
    reportData.assessments.forEach((assessment: any) => {
      const templateName = cleanPdfText(assessment?.assessmentTemplate?.name || "Standard Assessment", 100);
      const score = cleanPdfText(assessment?.overallScore ?? "N/A", 20);
      const attention = cleanPdfText(assessment?.attentionLevel || "NORMAL", 30);

      doc
        .fontSize(12)
        .text(`Template: ${templateName} | Score: ${score} | Attention: ${attention}`)
        .moveDown(0.25);

      // Clinical notes only rendered if present in the authorized reportData
      if (assessment?.professionalInterpretation) {
        doc
          .fontSize(10)
          .text(`Interpretation: ${cleanPdfText(assessment.professionalInterpretation, 1000)}`)
          .moveDown(0.25);
      }
      if (assessment?.recommendations) {
        doc
          .fontSize(10)
          .text(`Recommendations: ${cleanPdfText(assessment.recommendations, 1000)}`)
          .moveDown(0.25);
      }

      // Domains
      if (Array.isArray(assessment?.domainResults) && assessment.domainResults.length > 0) {
        assessment.domainResults.forEach((dr: any) => {
          const domainName = cleanPdfText(dr?.domain?.name || "Domain", 50);
          const dScore = cleanPdfText(dr?.score ?? "0", 10);
          const maxScore = cleanPdfText(dr?.maxScore ?? "0", 10);
          const label = cleanPdfText(dr?.resultLabel || "", 30);
          doc
            .fontSize(10)
            .text(`  - ${domainName}: ${dScore} / ${maxScore} ${label ? `(${label})` : ""}`);
        });
      }
      doc.moveDown(0.5);
    });
    doc.moveDown();
  }

  // Observations Section
  if (Array.isArray(reportData?.observations) && reportData.observations.length > 0) {
    doc.fontSize(16).text("Observations Summary", { underline: true }).moveDown(0.5);
    reportData.observations.forEach((obs: any) => {
      const dateStr = obs?.observedAt
        ? cleanPdfText(String(obs.observedAt).split("T")[0], 20)
        : "N/A";
      const source = cleanPdfText(obs?.source || "Staff", 30);
      const narrative = cleanPdfText(obs?.observation || "", 2000);

      doc
        .fontSize(10)
        .text(`Date: ${dateStr} | Source: ${source}`)
        .text(`Observation: ${narrative}`);

      // Clinical notes only rendered if present in authorized data
      if (obs?.psychologistNotes) {
        doc.text(`Psychologist Notes: ${cleanPdfText(obs.psychologistNotes, 1000)}`);
      }

      doc.moveDown(0.5);
    });
  }

  doc.end();
};

export const generateCsvString = (reportData: any): string => {
  const rows: Record<string, string>[] = [];
  const students: any[] = Array.isArray(reportData?.students) ? reportData.students : [];
  const assessments: any[] = Array.isArray(reportData?.assessments) ? reportData.assessments : [];
  const observations: any[] = Array.isArray(reportData?.observations) ? reportData.observations : [];

  students.forEach((student: any) => {
    const studentAssessments = assessments.filter((a: any) => a.studentId === student.id);
    const studentObservations = observations.filter((o: any) => o.studentId === student.id);

    rows.push({
      StudentId: sanitizeCsvValue(student.studentId),
      FirstName: sanitizeCsvValue(student.firstName),
      LastName: sanitizeCsvValue(student.lastName),
      ClassId: sanitizeCsvValue(student.classId),
      SectionId: sanitizeCsvValue(student.sectionId),
      TotalAssessments: sanitizeCsvValue(studentAssessments.length),
      TotalObservations: sanitizeCsvValue(studentObservations.length),
    });
  });

  return stringify(rows, { header: true });
};
