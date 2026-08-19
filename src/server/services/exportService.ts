import PDFDocument from "pdfkit";
import { stringify } from "csv-stringify/sync";
import { Writable } from "stream";

export const generatePdfStream = (reportData: any, outputStream: Writable) => {
  const doc = new PDFDocument({ margin: 50 });
  doc.pipe(outputStream);

  // Header
  doc
    .fontSize(20)
    .text("EduWell Psych - Analytical Report", { align: "center" })
    .moveDown();

  doc
    .fontSize(14)
    .text(`Total Students: ${reportData.summary.totalStudents}`)
    .text(`Total Assessments: ${reportData.summary.totalAssessments}`)
    .text(`Total Observations: ${reportData.summary.totalObservations}`)
    .moveDown();

  // Assessments Section
  doc.fontSize(16).text("Assessments Summary", { underline: true }).moveDown(0.5);
  reportData.assessments.forEach((assessment: any) => {
    doc
      .fontSize(12)
      .text(
        `Template: ${assessment.assessmentTemplate.name} | Score: ${assessment.overallScore || "N/A"} | Attention: ${assessment.attentionLevel || "NORMAL"}`
      )
      .moveDown(0.5);
    
    // Domains
    if (assessment.domainResults && assessment.domainResults.length > 0) {
      assessment.domainResults.forEach((dr: any) => {
        doc
          .fontSize(10)
          .text(`  - ${dr.domain.name}: ${dr.score} / ${dr.maxScore} (${dr.resultLabel || ""})`)
      });
      doc.moveDown(0.5);
    }
  });
  doc.moveDown();

  // Observations Section
  doc.fontSize(16).text("Observations Summary", { underline: true }).moveDown(0.5);
  reportData.observations.forEach((obs: any) => {
    doc
      .fontSize(10)
      .text(`Date: ${obs.observedAt.toISOString().split("T")[0]} | Source: ${obs.source}`)
      .text(`Observation: ${obs.observation}`)
      .moveDown(0.5);
  });

  doc.end();
};

export const generateCsvString = (reportData: any): string => {
  // We'll flatten the data for a basic CSV format, combining students and their latest assessments/observations.
  const rows: any[] = [];

  reportData.students.forEach((student: any) => {
    const studentAssessments = reportData.assessments.filter((a: any) => a.studentId === student.id);
    const studentObservations = reportData.observations.filter((o: any) => o.studentId === student.id);
    
    rows.push({
      StudentId: student.studentId,
      FirstName: student.firstName,
      LastName: student.lastName,
      ClassId: student.classId,
      TotalAssessments: studentAssessments.length,
      TotalObservations: studentObservations.length,
    });
  });

  return stringify(rows, { header: true });
};
