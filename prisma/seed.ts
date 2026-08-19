// prisma/seed.ts
// EduWell Psych — Development Seed Data (Manager V1 Specification)
// Synthetic demo data only. No real student information.
// Safe to re-run: repeatable execution using unique keys and idempotent upserts.

import "dotenv/config";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting repeatable Manager V1 database seed...");

  // ── 1. School (Root Tenant) ────────────────────────────────
  const school = await prisma.school.upsert({
    where: { code: "WESTSIDE" },
    update: { name: "Westside Academy", status: "ACTIVE" },
    create: {
      name: "Westside Academy",
      code: "WESTSIDE",
      status: "ACTIVE",
    },
  });
  console.log(`  ✅ 1. School: [${school.id}] ${school.name} (${school.code})`);

  // ── 2. School API Configuration ────────────────────────────
  const existingConfig = await prisma.schoolApiConfig.findFirst({
    where: { schoolId: school.id, schoolCode: "WESTSIDE_API" },
  });
  const apiConfig = existingConfig
    ? await prisma.schoolApiConfig.update({
        where: { id: existingConfig.id },
        data: {
          baseUrl: "http://dmwerp.com/rest_school_assist/",
          appVersion: "1.1",
          appOs: "web",
          isEnabled: true,
          lastTestedAt: new Date(),
          lastSyncAt: new Date(),
        },
      })
    : await prisma.schoolApiConfig.create({
        data: {
          schoolId: school.id,
          baseUrl: "http://dmwerp.com/rest_school_assist/",
          schoolCode: "WESTSIDE_API",
          appVersion: "1.1",
          appOs: "web",
          isEnabled: true,
          lastTestedAt: new Date(),
          lastSyncAt: new Date(),
        },
      });
  console.log(`  ✅ 2. School API Config: ${apiConfig.baseUrl}`);

  // ── 3. Academic Sessions ───────────────────────────────────
  const existingSession = await prisma.academicSession.findFirst({
    where: { schoolId: school.id, name: "2024-2025 Academic Year" },
  });
  const academicSession = existingSession
    ? await prisma.academicSession.update({
        where: { id: existingSession.id },
        data: {
          externalSessionId: "EXT-SESS-2024",
          startDate: new Date("2024-08-01"),
          endDate: new Date("2025-06-30"),
          isCurrent: true,
        },
      })
    : await prisma.academicSession.create({
        data: {
          schoolId: school.id,
          externalSessionId: "EXT-SESS-2024",
          name: "2024-2025 Academic Year",
          startDate: new Date("2024-08-01"),
          endDate: new Date("2025-06-30"),
          isCurrent: true,
        },
      });
  console.log(`  ✅ 3. Academic Session: ${academicSession.name}`);

  // ── 4. Classes & Sections ──────────────────────────────────
  let class8 = await prisma.class.findFirst({
    where: { schoolId: school.id, name: "Grade 8" },
  });
  if (!class8) {
    class8 = await prisma.class.create({
      data: {
        schoolId: school.id,
        externalClassId: "EXT-CLS-8",
        name: "Grade 8",
        displayOrder: 8,
        isActive: true,
      },
    });
  }

  let class4 = await prisma.class.findFirst({
    where: { schoolId: school.id, name: "Grade 4" },
  });
  if (!class4) {
    class4 = await prisma.class.create({
      data: {
        schoolId: school.id,
        externalClassId: "EXT-CLS-4",
        name: "Grade 4",
        displayOrder: 4,
        isActive: true,
      },
    });
  }

  let section8A = await prisma.section.findFirst({
    where: { classId: class8.id, name: "Section 8A" },
  });
  if (!section8A) {
    section8A = await prisma.section.create({
      data: {
        classId: class8.id,
        externalSectionId: "EXT-SEC-8A",
        name: "Section 8A",
        isActive: true,
      },
    });
  }

  let section8B = await prisma.section.findFirst({
    where: { classId: class8.id, name: "Section 8B" },
  });
  if (!section8B) {
    section8B = await prisma.section.create({
      data: {
        classId: class8.id,
        externalSectionId: "EXT-SEC-8B",
        name: "Section 8B",
        isActive: true,
      },
    });
  }

  let section4A = await prisma.section.findFirst({
    where: { classId: class4.id, name: "Section 4A" },
  });
  if (!section4A) {
    section4A = await prisma.section.create({
      data: {
        classId: class4.id,
        externalSectionId: "EXT-SEC-4A",
        name: "Section 4A",
        isActive: true,
      },
    });
  }
  console.log(`  ✅ 4. Classes & Sections: Grade 8 (8A, 8B), Grade 4 (4A)`);

  // ── 5. Users (Staff / Roles) ───────────────────────────────
  // Generate a valid bcrypt hash for "password123" with 10 salt rounds
  const defaultPasswordHash = bcrypt.hashSync("password123", 10);

  const adminUser = await prisma.user.upsert({
    where: { email: "admin@westside.edu" },
    update: { name: "Dr. Sarah Chen", role: "ADMIN", status: "ACTIVE", passwordHash: defaultPasswordHash },
    create: {
      schoolId: school.id,
      name: "Dr. Sarah Chen",
      email: "admin@westside.edu",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  const psychUser = await prisma.user.upsert({
    where: { email: "psych@westside.edu" },
    update: { name: "Dr. James Okafor", role: "PSYCHOLOGIST", status: "ACTIVE", passwordHash: defaultPasswordHash },
    create: {
      schoolId: school.id,
      name: "Dr. James Okafor",
      email: "psych@westside.edu",
      passwordHash: defaultPasswordHash,
      role: "PSYCHOLOGIST",
      status: "ACTIVE",
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@westside.edu" },
    update: { name: "Ms. Laura Bennett", role: "TEACHER", status: "ACTIVE", passwordHash: defaultPasswordHash },
    create: {
      schoolId: school.id,
      name: "Ms. Laura Bennett",
      email: "teacher@westside.edu",
      passwordHash: defaultPasswordHash,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  // Demo accounts aligned with frontend UI presets
  await prisma.user.upsert({
    where: { email: "dr.jenkins@eduwell.org" },
    update: { name: "Dr. Sarah Jenkins", role: "PSYCHOLOGIST", status: "ACTIVE", passwordHash: defaultPasswordHash },
    create: {
      schoolId: school.id,
      name: "Dr. Sarah Jenkins",
      email: "dr.jenkins@eduwell.org",
      passwordHash: defaultPasswordHash,
      role: "PSYCHOLOGIST",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "sarah.teacher@eduwell.org" },
    update: { name: "Sarah Jenkins (Educator)", role: "TEACHER", status: "ACTIVE", passwordHash: defaultPasswordHash },
    create: {
      schoolId: school.id,
      name: "Sarah Jenkins (Educator)",
      email: "sarah.teacher@eduwell.org",
      passwordHash: defaultPasswordHash,
      role: "TEACHER",
      status: "ACTIVE",
    },
  });

  await prisma.user.upsert({
    where: { email: "admin@eduwell.org" },
    update: { name: "Principal Robert Mercer", role: "ADMIN", status: "ACTIVE", passwordHash: defaultPasswordHash },
    create: {
      schoolId: school.id,
      name: "Principal Robert Mercer",
      email: "admin@eduwell.org",
      passwordHash: defaultPasswordHash,
      role: "ADMIN",
      status: "ACTIVE",
    },
  });

  // Optional Development Google SSO user — created ONLY when DEV_GOOGLE_TEST_EMAIL is configured.
  // Keep personal emails out of this repository; set the variable locally in .env instead.
  const devGoogleEmail = process.env.DEV_GOOGLE_TEST_EMAIL?.trim().toLowerCase();
  if (devGoogleEmail) {
    await prisma.user.upsert({
      where: { email: devGoogleEmail },
      update: { name: "Google SSO Test User", role: "PSYCHOLOGIST", status: "ACTIVE", passwordHash: defaultPasswordHash },
      create: {
        schoolId: school.id,
        name: "Google SSO Test User",
        email: devGoogleEmail,
        passwordHash: defaultPasswordHash,
        role: "PSYCHOLOGIST",
        status: "ACTIVE",
      },
    });
  }

  // If a legacy parent user exists from previous seeds, clean it up
  await prisma.user.deleteMany({
    where: { email: "parent.johnson@eduwell.org" },
  });

  console.log(`  ✅ 5. Users: Admin, Psych, Teacher & Demo Staff Accounts (Password: password123)`);

  // ── 5.5 Teacher Class & Section Access ─────────────────────
  const teacherJenkins = await prisma.user.findUnique({ where: { email: "sarah.teacher@eduwell.org" } });
  if (teacherJenkins) {
    // Specific section access: Section 8B only
    await prisma.teacherSectionAccess.upsert({
      where: { userId_sectionId: { userId: teacherJenkins.id, sectionId: section8B.id } },
      update: {},
      create: { userId: teacherJenkins.id, sectionId: section8B.id },
    });

    // Whole class access: Grade 4 (all sections)
    await prisma.teacherClassAccess.upsert({
      where: { userId_classId: { userId: teacherJenkins.id, classId: class4.id } },
      update: {},
      create: { userId: teacherJenkins.id, classId: class4.id },
    });
  }
  console.log(`  ✅ 5.5 Teacher Access assigned to Sarah Jenkins (Grade 4 all sections, Section 8B)`);

  // ── 6. Students (3 Synthetic Records) ──────────────────────
  const student1 = await prisma.student.upsert({
    where: { schoolId_studentId: { schoolId: school.id, studentId: "STU-1001" } },
    update: {
      firstName: "Alex",
      lastName: "Morgan",
      fullName: "Alex Morgan",
      classId: class8.id,
      sectionId: section8B.id,
    },
    create: {
      schoolId: school.id,
      studentId: "STU-1001",
      externalStudentId: "EXT-STU-9001",
      admissionNo: "ADM-2024-001",
      registrationNo: "REG-801",
      firstName: "Alex",
      middleName: "Taylor",
      lastName: "Morgan",
      fullName: "Alex Morgan",
      email: "alex.morgan.student@westside.edu",
      phone: "+1-555-0141",
      alternatePhone: "+1-555-0142",
      gender: "Male",
      dateOfBirth: new Date("2011-04-12"),
      classId: class8.id,
      sectionId: section8B.id,
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
      source: "SCHOOL_API",
      isActive: true,
      lastSyncedAt: new Date(),
    },
  });

  const student2 = await prisma.student.upsert({
    where: { schoolId_studentId: { schoolId: school.id, studentId: "STU-1002" } },
    update: {
      firstName: "Maya",
      lastName: "Patel",
      fullName: "Maya Patel",
      classId: class4.id,
      sectionId: section4A.id,
    },
    create: {
      schoolId: school.id,
      studentId: "STU-1002",
      externalStudentId: "EXT-STU-9002",
      admissionNo: "ADM-2024-002",
      registrationNo: "REG-402",
      firstName: "Maya",
      middleName: "A.",
      lastName: "Patel",
      fullName: "Maya Patel",
      email: "maya.patel.student@westside.edu",
      phone: "+1-555-0188",
      alternatePhone: null,
      gender: "Female",
      dateOfBirth: new Date("2015-09-21"),
      classId: class4.id,
      sectionId: section4A.id,
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
      source: "MANUAL",
      isActive: true,
    },
  });

  const student3 = await prisma.student.upsert({
    where: { schoolId_studentId: { schoolId: school.id, studentId: "STU-1003" } },
    update: {
      firstName: "Liam",
      lastName: "Johnson",
      fullName: "Liam Johnson",
      classId: class8.id,
      sectionId: section8A.id,
    },
    create: {
      schoolId: school.id,
      studentId: "STU-1003",
      externalStudentId: "EXT-STU-9003",
      admissionNo: "ADM-2024-003",
      registrationNo: "REG-803",
      firstName: "Liam",
      middleName: "C.",
      lastName: "Johnson",
      fullName: "Liam Johnson",
      email: "liam.johnson.student@westside.edu",
      phone: "+1-555-0199",
      alternatePhone: null,
      gender: "Male",
      dateOfBirth: new Date("2011-11-05"),
      classId: class8.id,
      sectionId: section8A.id,
      photoUrl: null,
      source: "BULK_IMPORT",
      isActive: true,
    },
  });
  console.log(`  ✅ 6. Students: ${student1.fullName}, ${student2.fullName}, ${student3.fullName}`);

  // ── 7. Student Import & Error Header ───────────────────────
  const existingImport = await prisma.studentImport.findFirst({
    where: { schoolId: school.id, fileName: "students_roster_fall2024.csv" },
  });
  const studentImport = existingImport
    ? existingImport
    : await prisma.studentImport.create({
        data: {
          schoolId: school.id,
          fileName: "students_roster_fall2024.csv",
          totalRows: 50,
          successCount: 49,
          failedCount: 1,
          uploadedBy: adminUser.id,
        },
      });

  const existingError = await prisma.studentImportError.findFirst({
    where: { importId: studentImport.id, rowNumber: 14 },
  });
  if (!existingError) {
    await prisma.studentImportError.create({
      data: {
        importId: studentImport.id,
        rowNumber: 14,
        studentId: "STU-INVALID",
        email: "malformed.email@domain",
        name: "Corrupted Record",
        errorMessage: "Invalid email format and missing mandatory admission number",
      },
    });
  }
  console.log(`  ✅ 7. Student Import & Error log created`);

  // ── 8. Student Observations ────────────────────────────────
  const existingObs = await prisma.studentObservation.findFirst({
    where: { studentId: student1.id, category: "Behavioral" },
  });
  if (!existingObs) {
    await prisma.studentObservation.create({
      data: {
        schoolId: school.id,
        studentId: student1.id,
        submittedBy: teacherUser.id,
        source: "TEACHER",
        category: "Behavioral",
        observation: "Student demonstrated frustration and verbal outburst during timed math quiz.",
        additionalComments: "Calmed down after 5 minutes in quiet corner.",
        recordNumber: "OBS-1001",
        setting: "Classroom / Math Lab",
        incidentTime: "Period 3 (10:40 AM)",
        triggers: "Timed quizzes and sudden transitions between tasks",
        interventions: "Offered quiet-corner break, verbal reassurance, preferential seating",
        submitterName: teacherUser.name,
        psychologistNotes: "Awaiting formal assessment. Monitor frequency of outbursts during timed tasks.",
        status: "REVIEWED",
        observedAt: new Date("2024-10-18"),
      },
    });
  }
  console.log(`  ✅ 8. Student Observation seeded for ${student1.fullName}`);

  // ── 9. Assessment Template, Domains, Questions, Options ────
  let template = await prisma.assessmentTemplate.findFirst({
    where: { schoolId: school.id, name: "Emotional & Behavioral Wellbeing Inventory" },
  });
  if (!template) {
    template = await prisma.assessmentTemplate.create({
      data: {
        schoolId: school.id,
        name: "Emotional & Behavioral Wellbeing Inventory",
        description: "Standardized screening protocol for assessing emotional regulation and social engagement.",
        category: "Social/Emotional",
        estimatedMinutes: 15,
        status: "PUBLISHED",
        version: "1.0",
        createdBy: psychUser.id,
      },
    });
  }

  // Domains
  let domain1 = await prisma.assessmentDomain.findFirst({
    where: { assessmentTemplateId: template.id, name: "Emotional Regulation" },
  });
  if (!domain1) {
    domain1 = await prisma.assessmentDomain.create({
      data: {
        assessmentTemplateId: template.id,
        name: "Emotional Regulation",
        description: "Measures emotional balance, frustration tolerance, and mood consistency.",
        displayOrder: 1,
      },
    });
  }

  let domain2 = await prisma.assessmentDomain.findFirst({
    where: { assessmentTemplateId: template.id, name: "Peer Engagement" },
  });
  if (!domain2) {
    domain2 = await prisma.assessmentDomain.create({
      data: {
        assessmentTemplateId: template.id,
        name: "Peer Engagement",
        description: "Measures collaboration, social interaction, and conflict resolution with peers.",
        displayOrder: 2,
      },
    });
  }

  // Questions & Options
  const q1Text = "How often does the student show intense frustration when facing difficult tasks?";
  let q1 = await prisma.assessmentQuestion.findFirst({
    where: { assessmentTemplateId: template.id, domainId: domain1.id, questionText: q1Text },
  });
  if (!q1) {
    q1 = await prisma.assessmentQuestion.create({
      data: {
        assessmentTemplateId: template.id,
        domainId: domain1.id,
        questionText: q1Text,
        questionType: "LIKERT",
        isRequired: true,
        displayOrder: 1,
      },
    });

    const optionsQ1 = [
      { label: "Never", value: "0", score: new Prisma.Decimal("0.00"), displayOrder: 1 },
      { label: "Rarely", value: "1", score: new Prisma.Decimal("1.00"), displayOrder: 2 },
      { label: "Sometimes", value: "2", score: new Prisma.Decimal("2.00"), displayOrder: 3 },
      { label: "Often", value: "3", score: new Prisma.Decimal("3.00"), displayOrder: 4 },
    ];
    for (const opt of optionsQ1) {
      await prisma.assessmentOption.create({
        data: {
          questionId: q1.id,
          label: opt.label,
          value: opt.value,
          score: opt.score,
          displayOrder: opt.displayOrder,
        },
      });
    }
  }

  const q2Text = "Does the student initiate positive interactions with peers during group work?";
  let q2 = await prisma.assessmentQuestion.findFirst({
    where: { assessmentTemplateId: template.id, domainId: domain2.id, questionText: q2Text },
  });
  if (!q2) {
    q2 = await prisma.assessmentQuestion.create({
      data: {
        assessmentTemplateId: template.id,
        domainId: domain2.id,
        questionText: q2Text,
        questionType: "LIKERT",
        isRequired: true,
        displayOrder: 2,
      },
    });

    const optionsQ2 = [
      { label: "Always", value: "0", score: new Prisma.Decimal("0.00"), displayOrder: 1 },
      { label: "Usually", value: "1", score: new Prisma.Decimal("1.00"), displayOrder: 2 },
      { label: "Seldom", value: "2", score: new Prisma.Decimal("2.00"), displayOrder: 3 },
      { label: "Never", value: "3", score: new Prisma.Decimal("3.00"), displayOrder: 4 },
    ];
    for (const opt of optionsQ2) {
      await prisma.assessmentOption.create({
        data: {
          questionId: q2.id,
          label: opt.label,
          value: opt.value,
          score: opt.score,
          displayOrder: opt.displayOrder,
        },
      });
    }
  }

  // Scoring Rules (Overall + Domain)
  const existingRules = await prisma.assessmentScoringRule.findMany({
    where: { assessmentTemplateId: template.id },
  });
  if (existingRules.length === 0) {
    // Overall Rules
    await prisma.assessmentScoringRule.createMany({
      data: [
        {
          assessmentTemplateId: template.id,
          scope: "OVERALL",
          domainId: null,
          minScore: new Prisma.Decimal("0.00"),
          maxScore: new Prisma.Decimal("2.00"),
          resultLabel: "Typical / Low Concern",
          attentionLevel: "NORMAL",
        },
        {
          assessmentTemplateId: template.id,
          scope: "OVERALL",
          domainId: null,
          minScore: new Prisma.Decimal("2.01"),
          maxScore: new Prisma.Decimal("4.00"),
          resultLabel: "Moderate Concern",
          attentionLevel: "MONITOR",
        },
        {
          assessmentTemplateId: template.id,
          scope: "OVERALL",
          domainId: null,
          minScore: new Prisma.Decimal("4.01"),
          maxScore: new Prisma.Decimal("6.00"),
          resultLabel: "Elevated Concern",
          attentionLevel: "ATTENTION_REQUIRED",
        },
      ],
    });

    // Domain Rules
    await prisma.assessmentScoringRule.create({
      data: {
        assessmentTemplateId: template.id,
        scope: "DOMAIN",
        domainId: domain1.id,
        minScore: new Prisma.Decimal("0.00"),
        maxScore: new Prisma.Decimal("3.00"),
        resultLabel: "Emotional Dysregulation Risk",
        attentionLevel: "MONITOR",
      },
    });
  }
  console.log(`  ✅ 9. Template, Domains, Questions, Options & Scoring Rules configured`);

  // ── 10. Student Assessment, Responses & Domain Results ──────
  let assessment = await prisma.studentAssessment.findFirst({
    where: { schoolId: school.id, studentId: student1.id, assessmentTemplateId: template.id },
  });

  if (!assessment) {
    assessment = await prisma.studentAssessment.create({
      data: {
        schoolId: school.id,
        studentId: student1.id,
        assessmentTemplateId: template.id,
        startedAt: new Date("2024-10-20T10:00:00Z"),
        completedAt: new Date("2024-10-20T10:15:00Z"),
        status: "COMPLETED",
        overallScore: new Prisma.Decimal("4.50"),
        attentionLevel: "ATTENTION_REQUIRED",
        createdBy: psychUser.id,
        reviewedBy: psychUser.id,
        reviewedAt: new Date("2024-10-21T14:30:00Z"),
        professionalInterpretation:
          "Student exhibits elevated emotional reactivity during timed academic tasks. Peer collaboration is moderately impacted.",
        recommendations:
          "1. Provide structured sensory breaks prior to testing.\n2. Utilize visual timers.\n3. Schedule bi-weekly psychologist check-ins.",
      },
    });
  }

  // Responses
  const q1Options = await prisma.assessmentOption.findMany({ where: { questionId: q1.id } });
  const selectedOptQ1 = q1Options.find((o) => o.value === "3") || q1Options[0];

  const q2Options = await prisma.assessmentOption.findMany({ where: { questionId: q2.id } });
  const selectedOptQ2 = q2Options.find((o) => o.value === "2") || q2Options[0];

  await prisma.assessmentResponse.upsert({
    where: {
      studentAssessmentId_questionId: {
        studentAssessmentId: assessment.id,
        questionId: q1.id,
      },
    },
    update: {
      selectedOptionId: selectedOptQ1.id,
      score: selectedOptQ1.score,
      textResponse: "Student exhibited visible distress.",
    },
    create: {
      studentAssessmentId: assessment.id,
      questionId: q1.id,
      selectedOptionId: selectedOptQ1.id,
      score: selectedOptQ1.score,
      textResponse: "Student exhibited visible distress.",
    },
  });

  await prisma.assessmentResponse.upsert({
    where: {
      studentAssessmentId_questionId: {
        studentAssessmentId: assessment.id,
        questionId: q2.id,
      },
    },
    update: {
      selectedOptionId: selectedOptQ2.id,
      score: selectedOptQ2.score,
      textResponse: "Hesitant when joining pairs.",
    },
    create: {
      studentAssessmentId: assessment.id,
      questionId: q2.id,
      selectedOptionId: selectedOptQ2.id,
      score: selectedOptQ2.score,
      textResponse: "Hesitant when joining pairs.",
    },
  });

  // Domain Results
  await prisma.assessmentDomainResult.upsert({
    where: {
      studentAssessmentId_domainId: {
        studentAssessmentId: assessment.id,
        domainId: domain1.id,
      },
    },
    update: {
      score: new Prisma.Decimal("3.00"),
      maxScore: new Prisma.Decimal("3.00"),
      resultLabel: "Elevated Concern",
      attentionLevel: "ATTENTION_REQUIRED",
    },
    create: {
      studentAssessmentId: assessment.id,
      domainId: domain1.id,
      score: new Prisma.Decimal("3.00"),
      maxScore: new Prisma.Decimal("3.00"),
      resultLabel: "Elevated Concern",
      attentionLevel: "ATTENTION_REQUIRED",
    },
  });

  await prisma.assessmentDomainResult.upsert({
    where: {
      studentAssessmentId_domainId: {
        studentAssessmentId: assessment.id,
        domainId: domain2.id,
      },
    },
    update: {
      score: new Prisma.Decimal("1.50"),
      maxScore: new Prisma.Decimal("3.00"),
      resultLabel: "Moderate Concern",
      attentionLevel: "MONITOR",
    },
    create: {
      studentAssessmentId: assessment.id,
      domainId: domain2.id,
      score: new Prisma.Decimal("1.50"),
      maxScore: new Prisma.Decimal("3.00"),
      resultLabel: "Moderate Concern",
      attentionLevel: "MONITOR",
    },
  });
  console.log(`  ✅ 10. Student Assessment, Responses & Domain Results created`);

  // ── 11. Reports & Report Snapshots ─────────────────────────
  let report = await prisma.report.findFirst({
    where: { schoolId: school.id, studentId: student1.id, reportType: "STUDENT" },
  });

  if (!report) {
    report = await prisma.report.create({
      data: {
        schoolId: school.id,
        studentId: student1.id,
        assessmentId: assessment.id,
        reportType: "STUDENT",
        title: `Comprehensive Psychological Assessment Report: ${student1.fullName}`,
        status: "FINALIZED",
        classId: class8.id,
        sectionId: section8B.id,
        academicSessionId: academicSession.id,
        generatedBy: psychUser.id,
        generatedAt: new Date("2024-10-22T09:00:00Z"),
        fileUrl: "https://storage.westside.edu/reports/rep-2024-1001.pdf",
      },
    });
  }

  const existingSnapshot = await prisma.reportSnapshot.findFirst({
    where: { reportId: report.id },
  });

  if (!existingSnapshot) {
    await prisma.reportSnapshot.create({
      data: {
        reportId: report.id,
        contentJson: {
          reportVersion: "1.0",
          student: {
            id: student1.studentId,
            fullName: student1.fullName,
            dob: student1.dateOfBirth?.toISOString().split("T")[0],
            class: "Grade 8 - Section 8B",
          },
          summary: {
            overallScore: 4.5,
            attentionLevel: "ATTENTION_REQUIRED",
            assessmentTitle: template.name,
            domains: [
              { name: "Emotional Regulation", score: 3.0, maxScore: 3.0, level: "ATTENTION_REQUIRED" },
              { name: "Peer Engagement", score: 1.5, maxScore: 3.0, level: "MONITOR" },
            ],
          },
          clinicalNotes: assessment.professionalInterpretation,
          recommendations: assessment.recommendations,
          signOff: {
            psychologist: psychUser.name,
            timestamp: "2024-10-22T09:00:00Z",
          },
        },
      },
    });
  }
  console.log(`  ✅ 11. Report & Immutable Snapshot created`);

  console.log("\n🎉 Seed complete! All 20 tables successfully seeded with connected relational data.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
