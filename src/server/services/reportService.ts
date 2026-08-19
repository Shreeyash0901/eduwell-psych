import { prisma } from "../../lib/db";

export type ReportType = "STUDENT" | "CLASS" | "GRADE";

export interface ReportAggregationOptions {
  schoolId: number;
  reportType: ReportType;
  title: string;
  generatedBy: number;
  studentId?: number;
  classId?: number;
  sectionId?: number;
  academicSessionId?: number;
  // RBAC boundaries
  allowedClassIds?: number[];
  allowedSectionIds?: number[];
}

export const generateReportData = async (options: ReportAggregationOptions) => {
  const { schoolId, reportType, studentId, classId, sectionId, academicSessionId, allowedClassIds, allowedSectionIds } = options;

  // Build the student filter based on report type and RBAC
  const studentWhere: any = { schoolId };
  if (studentId) {
    studentWhere.id = studentId;
  }
  if (classId) {
    studentWhere.classId = classId;
  }
  if (sectionId) {
    studentWhere.sectionId = sectionId;
  }

  // Enforce teacher RBAC boundaries if provided
  if (allowedClassIds || allowedSectionIds) {
    const orConditions: any[] = [];
    if (allowedClassIds && allowedClassIds.length > 0) {
      orConditions.push({ classId: { in: allowedClassIds } });
    }
    if (allowedSectionIds && allowedSectionIds.length > 0) {
      orConditions.push({ sectionId: { in: allowedSectionIds } });
    }
    if (orConditions.length > 0) {
      studentWhere.AND = [{ OR: orConditions }];
    } else {
      // If a teacher has no classes/sections assigned but tries to generate a report, block them by forcing a 0 result
      studentWhere.id = -1; 
    }
  }

  // Fetch students matching the criteria
  const students = await prisma.student.findMany({
    where: studentWhere,
    select: {
      id: true,
      studentId: true,
      firstName: true,
      lastName: true,
      classId: true,
      sectionId: true,
    }
  });

  if (students.length === 0) {
    throw new Error("No students found matching the report criteria or you do not have permission.");
  }

  const studentIds = students.map((s) => s.id);

  // Fetch assessments for these students
  const assessments = await prisma.studentAssessment.findMany({
    where: {
      studentId: { in: studentIds },
      status: "COMPLETED",
    },
    include: {
      assessmentTemplate: {
        select: { name: true, category: true }
      },
      domainResults: {
        include: {
          domain: { select: { name: true } }
        }
      }
    }
  });

  // Fetch observations for these students
  const observations = await prisma.studentObservation.findMany({
    where: {
      studentId: { in: studentIds },
    },
    orderBy: {
      observedAt: 'desc'
    }
  });

  return {
    students,
    assessments,
    observations,
    summary: {
      totalStudents: students.length,
      totalAssessments: assessments.length,
      totalObservations: observations.length
    }
  };
};
