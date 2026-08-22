// prisma/seed.ts
// EduWell Psych — Comprehensive Real-World Test Mock Data
// Provides rich, connected, realistic data across all school wellness workflows:
// Classes, Sections, Staff Roles, Students, Observations, Protocols, Assigned & Completed Screenings,
// Item-level Responses, Domain Results, Clinical Interpretations, and Reports.

import "dotenv/config";
import { PrismaClient, Prisma } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env["DATABASE_URL"]! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting EduWell Psych Comprehensive Real-World Seed...");

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

  // ── 1.5 School Settings ───────────────────────────────────
  await prisma.schoolSettings.upsert({
    where: { schoolId: school.id },
    update: {
      defaultGradingSystem: "Standard Letter (A-F)",
      anonymizeExports: false,
      require2FA: false,
      timezone: "America/New_York",
      locale: "en-US",
    },
    create: {
      schoolId: school.id,
      defaultGradingSystem: "Standard Letter (A-F)",
      anonymizeExports: false,
      require2FA: false,
      timezone: "America/New_York",
      locale: "en-US",
    },
  });
  console.log(`  ✅ 1.5 School Settings configured`);

  // ── 2. Academic Session ───────────────────────────────────
  const academicSession = await prisma.academicSession.upsert({
    where: { id: 1 },
    update: {
      name: "2025-2026 Academic Year",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
    create: {
      schoolId: school.id,
      externalSessionId: "EXT-SESS-2025-2026",
      name: "2025-2026 Academic Year",
      startDate: new Date("2025-08-01"),
      endDate: new Date("2026-06-30"),
      isCurrent: true,
    },
  });
  console.log(`  ✅ 2. Academic Session: ${academicSession.name}`);

  // ── 3. Classes & Sections ─────────────────────────────────
  const classDefs = [
    { name: "Grade 10", ext: "EXT-CLS-10", order: 10, sections: ["Section A", "Section B"] },
    { name: "Grade 9", ext: "EXT-CLS-9", order: 9, sections: ["Section A", "Section B"] },
    { name: "Grade 8", ext: "EXT-CLS-8", order: 8, sections: ["Section 8A", "Section 8B"] },
    { name: "Grade 4", ext: "EXT-CLS-4", order: 4, sections: ["Section 4A", "Section 4B"] },
  ];

  const createdClasses: Record<string, any> = {};
  const createdSections: Record<string, any> = {};

  for (const cDef of classDefs) {
    let cls = await prisma.class.findFirst({
      where: { schoolId: school.id, name: cDef.name },
    });
    if (!cls) {
      cls = await prisma.class.create({
        data: {
          schoolId: school.id,
          externalClassId: cDef.ext,
          name: cDef.name,
          displayOrder: cDef.order,
          isActive: true,
        },
      });
    }
    createdClasses[cDef.name] = cls;

    for (const secName of cDef.sections) {
      let sec = await prisma.section.findFirst({
        where: { classId: cls.id, name: secName },
      });
      if (!sec) {
        sec = await prisma.section.create({
          data: {
            classId: cls.id,
            externalSectionId: `EXT-SEC-${cls.id}-${secName.replace(/\s+/g, '')}`,
            name: secName,
            isActive: true,
          },
        });
      }
      createdSections[`${cDef.name}-${secName}`] = sec;
    }
  }
  console.log(`  ✅ 3. Classes & Sections: Grade 10 (A, B), Grade 9 (A, B), Grade 8 (8A, 8B), Grade 4 (4A, 4B)`);

  // ── 4. Users (Staff & Clinical Team) ──────────────────────
  const defaultPasswordHash = bcrypt.hashSync("password123", 10);

  const staffUsers = [
    {
      email: "admin@westside.edu",
      name: "Dr. Sarah Chen",
      role: "ADMIN",
      title: "Principal & School Administrator",
    },
    {
      email: "principal@eduwell.org",
      name: "Principal Robert Mercer",
      role: "ADMIN",
      title: "Executive Director of Student Services",
    },
    {
      email: "psych@westside.edu",
      name: "Dr. James Okafor",
      role: "PSYCHOLOGIST",
      title: "Lead Clinical Psychologist",
    },
    {
      email: "dr.jenkins@eduwell.org",
      name: "Dr. Sarah Jenkins",
      role: "PSYCHOLOGIST",
      title: "School & Pediatric Psychologist",
    },
    {
      email: "harsh.teacher@eduwell.org",
      name: "Harsh Watkar",
      role: "TEACHER",
      title: "High School Educator (Grade 10 Lead)",
    },
    {
      email: "teacher@westside.edu",
      name: "Laura Bennett",
      role: "TEACHER",
      title: "Middle School Educator",
    },
    {
      email: "ananya.teacher@eduwell.org",
      name: "Ananya Sharma",
      role: "TEACHER",
      title: "Middle School Educator (Grade 8 Lead)",
    },
    {
      email: "marcus.teacher@eduwell.org",
      name: "Marcus Vance",
      role: "TEACHER",
      title: "Primary School Educator (Grade 4 Lead)",
    },
  ];

  const dbUsers: Record<string, any> = {};
  for (const u of staffUsers) {
    const user = await prisma.user.upsert({
      where: { email: u.email },
      update: { name: u.name, role: u.role, status: "ACTIVE", passwordHash: defaultPasswordHash },
      create: {
        schoolId: school.id,
        name: u.name,
        email: u.email,
        passwordHash: defaultPasswordHash,
        role: u.role,
        status: "ACTIVE",
      },
    });
    dbUsers[u.email] = user;
  }
  console.log(`  ✅ 4. Staff Accounts Created: 2 Admins, 2 Psychologists, 4 Teachers (Password: password123)`);

  // ── 4.5 Teacher Class & Section Access Permissions ────────
  // Harsh Watkar -> Grade 10 (all sections)
  if (dbUsers["harsh.teacher@eduwell.org"]) {
    const harshId = dbUsers["harsh.teacher@eduwell.org"].id;
    await prisma.teacherClassAccess.upsert({
      where: { userId_classId: { userId: harshId, classId: createdClasses["Grade 10"].id } },
      update: {},
      create: { userId: harshId, classId: createdClasses["Grade 10"].id },
    });
  }

  // Ananya Sharma -> Grade 8 (all sections)
  if (dbUsers["ananya.teacher@eduwell.org"]) {
    const ananyaId = dbUsers["ananya.teacher@eduwell.org"].id;
    await prisma.teacherClassAccess.upsert({
      where: { userId_classId: { userId: ananyaId, classId: createdClasses["Grade 8"].id } },
      update: {},
      create: { userId: ananyaId, classId: createdClasses["Grade 8"].id },
    });
  }

  // Marcus Vance -> Grade 4 (all sections)
  if (dbUsers["marcus.teacher@eduwell.org"]) {
    const marcusId = dbUsers["marcus.teacher@eduwell.org"].id;
    await prisma.teacherClassAccess.upsert({
      where: { userId_classId: { userId: marcusId, classId: createdClasses["Grade 4"].id } },
      update: {},
      create: { userId: marcusId, classId: createdClasses["Grade 4"].id },
    });
  }

  // Laura Bennett -> Section 8B & Grade 9
  if (dbUsers["teacher@westside.edu"]) {
    const lauraId = dbUsers["teacher@westside.edu"].id;
    await prisma.teacherClassAccess.upsert({
      where: { userId_classId: { userId: lauraId, classId: createdClasses["Grade 9"].id } },
      update: {},
      create: { userId: lauraId, classId: createdClasses["Grade 9"].id },
    });
  }
  console.log(`  ✅ 4.5 Teacher Classroom Permissions Mapped (Grade 10, Grade 8, Grade 4, Grade 9)`);

  // ── 5. Students Roster (12 Meaningful Student Profiles) ────
  const studentDataList = [
    // Grade 10 (Harsh Watkar's Class)
    {
      studentId: "STU-1004",
      extId: "EXT-STU-1004",
      admissionNo: "ADM-2025-104",
      firstName: "Ashish",
      lastName: "Ingole",
      fullName: "Ashish Ingole",
      email: "ashish.ingole@westside.edu",
      phone: "+1-555-0144",
      gender: "Male",
      dob: new Date("2009-07-14"),
      className: "Grade 10",
      sectionName: "Section A",
      photoUrl: "https://images.unsplash.com/photo-1539571696357-5a69c17a67c6",
    },
    {
      studentId: "STU-1005",
      extId: "EXT-STU-1005",
      admissionNo: "ADM-2025-105",
      firstName: "Priya",
      lastName: "Nair",
      fullName: "Priya Nair",
      email: "priya.nair@westside.edu",
      phone: "+1-555-0145",
      gender: "Female",
      dob: new Date("2009-11-20"),
      className: "Grade 10",
      sectionName: "Section A",
      photoUrl: "https://images.unsplash.com/photo-1517841905240-472988babdf9",
    },
    {
      studentId: "STU-1006",
      extId: "EXT-STU-1006",
      admissionNo: "ADM-2025-106",
      firstName: "Rohan",
      lastName: "Verma",
      fullName: "Rohan Verma",
      email: "rohan.verma@westside.edu",
      phone: "+1-555-0146",
      gender: "Male",
      dob: new Date("2009-03-08"),
      className: "Grade 10",
      sectionName: "Section B",
      photoUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d",
    },
    {
      studentId: "STU-1007",
      extId: "EXT-STU-1007",
      admissionNo: "ADM-2025-107",
      firstName: "Sneha",
      lastName: "Kulkarni",
      fullName: "Sneha Kulkarni",
      email: "sneha.kulkarni@westside.edu",
      phone: "+1-555-0147",
      gender: "Female",
      dob: new Date("2009-09-25"),
      className: "Grade 10",
      sectionName: "Section B",
      photoUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330",
    },

    // Grade 8 (Ananya Sharma's Class)
    {
      studentId: "STU-1001",
      extId: "EXT-STU-1001",
      admissionNo: "ADM-2024-001",
      firstName: "Alex",
      lastName: "Morgan",
      fullName: "Alex Morgan",
      email: "alex.morgan@westside.edu",
      phone: "+1-555-0141",
      gender: "Male",
      dob: new Date("2011-04-12"),
      className: "Grade 8",
      sectionName: "Section 8B",
      photoUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e",
    },
    {
      studentId: "STU-1003",
      extId: "EXT-STU-1003",
      admissionNo: "ADM-2024-003",
      firstName: "Liam",
      lastName: "Johnson",
      fullName: "Liam Johnson",
      email: "liam.johnson@westside.edu",
      phone: "+1-555-0199",
      gender: "Male",
      dob: new Date("2011-11-05"),
      className: "Grade 8",
      sectionName: "Section 8A",
      photoUrl: "https://images.unsplash.com/photo-1522075469751-3a6694fb2f61",
    },
    {
      studentId: "STU-1008",
      extId: "EXT-STU-1008",
      admissionNo: "ADM-2024-008",
      firstName: "Anaya",
      lastName: "Joshi",
      fullName: "Anaya Joshi",
      email: "anaya.joshi@westside.edu",
      phone: "+1-555-0148",
      gender: "Female",
      dob: new Date("2011-06-18"),
      className: "Grade 8",
      sectionName: "Section 8A",
      photoUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb",
    },
    {
      studentId: "STU-1009",
      extId: "EXT-STU-1009",
      admissionNo: "ADM-2024-009",
      firstName: "Kabir",
      lastName: "Mehta",
      fullName: "Kabir Mehta",
      email: "kabir.mehta@westside.edu",
      phone: "+1-555-0149",
      gender: "Male",
      dob: new Date("2011-02-10"),
      className: "Grade 8",
      sectionName: "Section 8B",
      photoUrl: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d",
    },

    // Grade 4 (Marcus Vance's Class)
    {
      studentId: "STU-1002",
      extId: "EXT-STU-1002",
      admissionNo: "ADM-2024-002",
      firstName: "Maya",
      lastName: "Patel",
      fullName: "Maya Patel",
      email: "maya.patel@westside.edu",
      phone: "+1-555-0188",
      gender: "Female",
      dob: new Date("2015-09-21"),
      className: "Grade 4",
      sectionName: "Section 4A",
      photoUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2",
    },
    {
      studentId: "STU-1010",
      extId: "EXT-STU-1010",
      admissionNo: "ADM-2024-010",
      firstName: "Aarav",
      lastName: "Deshmukh",
      fullName: "Aarav Deshmukh",
      email: "aarav.deshmukh@westside.edu",
      phone: "+1-555-0150",
      gender: "Male",
      dob: new Date("2015-12-03"),
      className: "Grade 4",
      sectionName: "Section 4A",
      photoUrl: "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7",
    },
    {
      studentId: "STU-1011",
      extId: "EXT-STU-1011",
      admissionNo: "ADM-2024-011",
      firstName: "Chloe",
      lastName: "Bennett",
      fullName: "Chloe Bennett",
      email: "chloe.bennett@westside.edu",
      phone: "+1-555-0151",
      gender: "Female",
      dob: new Date("2015-04-16"),
      className: "Grade 4",
      sectionName: "Section 4B",
      photoUrl: "https://images.unsplash.com/photo-1524504388940-b1c1722653e1",
    },
  ];

  const dbStudents: Record<string, any> = {};
  for (const s of studentDataList) {
    const cls = createdClasses[s.className];
    const sec = createdSections[`${s.className}-${s.sectionName}`];

    const student = await prisma.student.upsert({
      where: { schoolId_studentId: { schoolId: school.id, studentId: s.studentId } },
      update: {
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        dateOfBirth: s.dob,
        classId: cls.id,
        sectionId: sec?.id || null,
        photoUrl: s.photoUrl,
        isActive: true,
      },
      create: {
        schoolId: school.id,
        studentId: s.studentId,
        externalStudentId: s.extId,
        admissionNo: s.admissionNo,
        registrationNo: `REG-${s.studentId}`,
        firstName: s.firstName,
        lastName: s.lastName,
        fullName: s.fullName,
        email: s.email,
        phone: s.phone,
        gender: s.gender,
        dateOfBirth: s.dob,
        classId: cls.id,
        sectionId: sec?.id || null,
        photoUrl: s.photoUrl,
        source: "SCHOOL_API",
        isActive: true,
      },
    });
    dbStudents[s.studentId] = student;
  }
  console.log(`  ✅ 5. Students: 11 active student records seeded with class associations`);

  // ── 6. Assessment Protocols (3 Standardized Protocols) ──────
  // Protocol 1: Emotional & Behavioral Wellbeing Inventory
  let protocol1 = await prisma.assessmentTemplate.findFirst({
    where: { schoolId: school.id, name: "Emotional & Behavioral Wellbeing Inventory" },
  });
  if (!protocol1) {
    protocol1 = await prisma.assessmentTemplate.create({
      data: {
        schoolId: school.id,
        name: "Emotional & Behavioral Wellbeing Inventory",
        description: "Standardized psychometric screening protocol evaluating emotional regulation, peer engagement, and classroom adjustment.",
        category: "Social/Emotional",
        estimatedMinutes: 15,
        status: "PUBLISHED",
        version: "2.1",
        createdBy: dbUsers["psych@westside.edu"].id,
      },
    });
  }

  // Domains for Protocol 1
  const p1Domains = [
    { name: "Emotional Regulation", desc: "Frustration tolerance, coping strategies, emotional equilibrium" },
    { name: "Peer Engagement", desc: "Social collaboration, peer conflict resolution, interpersonal trust" },
    { name: "Self Confidence", desc: "Academic resilience, self-efficacy, risk-taking in learning" },
    { name: "Classroom Adjustment", desc: "Attention span, task transition compliance, sensory comfort" },
  ];

  const dbP1Domains: Record<string, any> = {};
  for (let i = 0; i < p1Domains.length; i++) {
    const d = p1Domains[i];
    let dom = await prisma.assessmentDomain.findFirst({
      where: { assessmentTemplateId: protocol1.id, name: d.name },
    });
    if (!dom) {
      dom = await prisma.assessmentDomain.create({
        data: {
          assessmentTemplateId: protocol1.id,
          name: d.name,
          description: d.desc,
          displayOrder: i + 1,
        },
      });
    }
    dbP1Domains[d.name] = dom;
  }

  // Questions for Protocol 1
  const p1Questions = [
    {
      text: "Demonstrates emotional equilibrium and stays calm when faced with difficult academic challenges or unexpected transitions.",
      domain: "Emotional Regulation",
    },
    {
      text: "Recovers quickly from frustration or critical feedback without prolonged distress or withdrawal.",
      domain: "Emotional Regulation",
    },
    {
      text: "Initiates collaborative interactions with peers and participates cooperatively in group projects.",
      domain: "Peer Engagement",
    },
    {
      text: "Resolves interpersonal peer misunderstandings constructively without verbal escalation.",
      domain: "Peer Engagement",
    },
    {
      text: "Expresses confidence in attempting new learning tasks independently before requesting adult assistance.",
      domain: "Self Confidence",
    },
    {
      text: "Maintains sustained focus and follows multi-step instructions during independent work periods.",
      domain: "Classroom Adjustment",
    },
  ];

  const defaultLikertOptions = [
    { label: "Never (1)", value: "1", score: 1, displayOrder: 1 },
    { label: "Rarely (2)", value: "2", score: 2, displayOrder: 2 },
    { label: "Sometimes (3)", value: "3", score: 3, displayOrder: 3 },
    { label: "Often (4)", value: "4", score: 4, displayOrder: 4 },
    { label: "Almost Always (5)", value: "5", score: 5, displayOrder: 5 },
  ];

  const dbP1Questions: any[] = [];
  for (let i = 0; i < p1Questions.length; i++) {
    const q = p1Questions[i];
    const dom = dbP1Domains[q.domain];
    let createdQ = await prisma.assessmentQuestion.findFirst({
      where: { assessmentTemplateId: protocol1.id, questionText: q.text },
    });
    if (!createdQ) {
      createdQ = await prisma.assessmentQuestion.create({
        data: {
          assessmentTemplateId: protocol1.id,
          domainId: dom.id,
          questionText: q.text,
          questionType: "LIKERT",
          isRequired: true,
          displayOrder: i + 1,
        },
      });

      for (const opt of defaultLikertOptions) {
        await prisma.assessmentOption.create({
          data: {
            questionId: createdQ.id,
            label: opt.label,
            value: opt.value,
            score: new Prisma.Decimal(opt.score),
            displayOrder: opt.displayOrder,
          },
        });
      }
    }
    dbP1Questions.push(createdQ);
  }

  // Protocol 2: ADHD & Executive Function Screener
  let protocol2 = await prisma.assessmentTemplate.findFirst({
    where: { schoolId: school.id, name: "Conners Classroom ADHD & Executive Function Screener" },
  });
  if (!protocol2) {
    protocol2 = await prisma.assessmentTemplate.create({
      data: {
        schoolId: school.id,
        name: "Conners Classroom ADHD & Executive Function Screener",
        description: "Standardized tool for assessing inattention, hyperactivity, impulsivity, and executive organization in structured classroom settings.",
        category: "ADHD / Executive Function",
        estimatedMinutes: 12,
        status: "PUBLISHED",
        version: "1.0",
        createdBy: dbUsers["psych@westside.edu"].id,
      },
    });

    const domADHD = await prisma.assessmentDomain.create({
      data: {
        assessmentTemplateId: protocol2.id,
        name: "Sustained Attention",
        displayOrder: 1,
      },
    });

    const domImpulse = await prisma.assessmentDomain.create({
      data: {
        assessmentTemplateId: protocol2.id,
        name: "Impulse & Motor Control",
        displayOrder: 2,
      },
    });

    const adhdQuestions = [
      { text: "Easily distracted by extraneous auditory or visual stimuli in the classroom.", dom: domADHD },
      { text: "Has difficulty organizing multi-stage tasks and keeping learning materials tidy.", dom: domADHD },
      { text: "Leaves seat or fidgets excessively during situations when remaining seated is expected.", dom: domImpulse },
      { text: "Interrupts or intrudes on others during conversations or quiet work time.", dom: domImpulse },
    ];

    for (let i = 0; i < adhdQuestions.length; i++) {
      const q = adhdQuestions[i];
      const qCreated = await prisma.assessmentQuestion.create({
        data: {
          assessmentTemplateId: protocol2.id,
          domainId: q.dom.id,
          questionText: q.text,
          questionType: "LIKERT",
          isRequired: true,
          displayOrder: i + 1,
        },
      });
      for (const opt of defaultLikertOptions) {
        await prisma.assessmentOption.create({
          data: {
            questionId: qCreated.id,
            label: opt.label,
            value: opt.value,
            score: new Prisma.Decimal(opt.score),
            displayOrder: opt.displayOrder,
          },
        });
      }
    }
  }

  console.log(`  ✅ 6. Standardized Assessment Protocols configured (Wellbeing Inventory & ADHD Screener)`);

  // ── 7. Teacher Observations with Assessment Links ─────────
  const ashishStudent = dbStudents["STU-1004"];
  const harshTeacher = dbUsers["harsh.teacher@eduwell.org"];
  const psychOkafor = dbUsers["psych@westside.edu"];

  // Observation 1: Ashish Ingole (Grade 10) - Assessment Started
  let obs1 = await prisma.studentObservation.findFirst({
    where: { studentId: ashishStudent.id, recordNumber: "OBS-2026-104" },
  });
  if (!obs1) {
    obs1 = await prisma.studentObservation.create({
      data: {
        schoolId: school.id,
        studentId: ashishStudent.id,
        submittedBy: harshTeacher.id,
        source: "TEACHER",
        category: "Behavioral",
        observation: "Student demonstrated marked frustration, clenching fists and withdrawing from group during timed physics problem solving.",
        additionalComments: "Returned to work after quiet breathing exercise. Occurs primarily during time-pressured assessments.",
        recordNumber: "OBS-2026-104",
        setting: "Physics Laboratory / Grade 10",
        incidentTime: "Period 2 (9:30 AM)",
        triggers: "Timed analytical tasks, unexpected group pairings",
        interventions: "Offered 5-min sensory break, extended time cue, verbal reassurance",
        submitterName: harshTeacher.name,
        psychologistNotes: "Formal screening launched. Protocol: Emotional & Behavioral Wellbeing Inventory.",
        status: "UNDER_REVIEW",
        observedAt: new Date("2026-08-20"),
      },
    });
  }

  // Observation 2: Alex Morgan (Grade 8) - Reviewed
  const alexStudent = dbStudents["STU-1001"];
  const ananyaTeacher = dbUsers["ananya.teacher@eduwell.org"];
  let obs2 = await prisma.studentObservation.findFirst({
    where: { studentId: alexStudent.id, recordNumber: "OBS-2026-101" },
  });
  if (!obs2) {
    obs2 = await prisma.studentObservation.create({
      data: {
        schoolId: school.id,
        studentId: alexStudent.id,
        submittedBy: ananyaTeacher.id,
        source: "TEACHER",
        category: "Social/Emotional",
        observation: "Alex showed heightened anxiety and somatic complaints (headache) prior to classroom debate presentation.",
        additionalComments: "Student was able to present after peer pairing adaptation.",
        recordNumber: "OBS-2026-101",
        setting: "English Classroom",
        incidentTime: "Period 4 (11:15 AM)",
        triggers: "Public speaking in front of entire cohort",
        interventions: "Small group presentation alternative, pre-briefing with teacher",
        submitterName: ananyaTeacher.name,
        psychologistNotes: "Screening completed. Clinical interpretation and recommendations formulated.",
        status: "REVIEWED",
        observedAt: new Date("2026-08-18"),
      },
    });
  }

  // Observation 3: Maya Patel (Grade 4) - New Submission
  const mayaStudent = dbStudents["STU-1002"];
  const marcusTeacher = dbUsers["marcus.teacher@eduwell.org"];
  let obs3 = await prisma.studentObservation.findFirst({
    where: { studentId: mayaStudent.id, recordNumber: "OBS-2026-102" },
  });
  if (!obs3) {
    obs3 = await prisma.studentObservation.create({
      data: {
        schoolId: school.id,
        studentId: mayaStudent.id,
        submittedBy: marcusTeacher.id,
        source: "TEACHER",
        category: "Academic",
        observation: "Maya displays separation anxiety during morning drop-off, resulting in 15-20 minutes of tearfulness before engaging with reading tasks.",
        additionalComments: "Calms down with morning greeting routine and classroom helper responsibilities.",
        recordNumber: "OBS-2026-102",
        setting: "Homeroom Classroom",
        incidentTime: "Morning Arrival (8:15 AM)",
        triggers: "Transition from parent drop-off to morning assembly",
        interventions: "Assigned as morning door greeter, designated buddy system",
        submitterName: marcusTeacher.name,
        status: "SUBMITTED",
        observedAt: new Date("2026-08-21"),
      },
    });
  }
  console.log(`  ✅ 7. Student Observations seeded with realistic triggers, settings, and interventions`);

  // ── 8. Active Assigned Assessments (Pending Submissions) ──
  // Assigned 1: Harsh Watkar for Ashish Ingole (linked to Obs 1)
  let assigned1 = await prisma.studentAssessment.findFirst({
    where: {
      studentId: ashishStudent.id,
      assessmentTemplateId: protocol1.id,
      status: "ASSIGNED",
    },
  });
  if (!assigned1) {
    assigned1 = await prisma.studentAssessment.create({
      data: {
        schoolId: school.id,
        studentId: ashishStudent.id,
        assessmentTemplateId: protocol1.id,
        status: "ASSIGNED",
        respondentType: "TEACHER",
        dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
        instructions: "Please evaluate Ashish's emotional regulation and peer dynamics during high-stakes lab tasks.",
        observationId: obs1.id,
        createdBy: psychOkafor.id,
        reviewedBy: harshTeacher.id,
      },
    });
  }

  // Assigned 2: Marcus Vance for Maya Patel
  let assigned2 = await prisma.studentAssessment.findFirst({
    where: {
      studentId: mayaStudent.id,
      assessmentTemplateId: protocol1.id,
      status: "ASSIGNED",
    },
  });
  if (!assigned2) {
    assigned2 = await prisma.studentAssessment.create({
      data: {
        schoolId: school.id,
        studentId: mayaStudent.id,
        assessmentTemplateId: protocol1.id,
        status: "ASSIGNED",
        respondentType: "TEACHER",
        dueDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        instructions: "Complete baseline screening regarding morning transition regulation and emotional resilience.",
        observationId: obs3.id,
        createdBy: psychOkafor.id,
        reviewedBy: marcusTeacher.id,
      },
    });
  }
  console.log(`  ✅ 8. Active Assigned Assessments created (Assigned to Grade 10 & Grade 4 Educators)`);

  // ── 9. Completed Assessments with Responses & Interpretations ─
  // Completed Assessment 1: Ashish Ingole (Grade 10)
  let completedAshish = await prisma.studentAssessment.findFirst({
    where: {
      studentId: ashishStudent.id,
      status: "REVIEWED",
    },
  });

  if (!completedAshish) {
    completedAshish = await prisma.studentAssessment.create({
      data: {
        schoolId: school.id,
        studentId: ashishStudent.id,
        assessmentTemplateId: protocol1.id,
        startedAt: new Date("2026-08-21T09:00:00Z"),
        completedAt: new Date("2026-08-21T09:14:00Z"),
        status: "REVIEWED",
        overallScore: new Prisma.Decimal("74.00"),
        attentionLevel: "MONITOR",
        createdBy: harshTeacher.id,
        reviewedBy: psychOkafor.id,
        reviewedAt: new Date("2026-08-21T14:30:00Z"),
        professionalInterpretation:
          "Evaluation reveals moderate emotional reactivity under timed conditions (Score: 65/100) and elevated social performance pressure. Peer collaboration is strong in informal settings but exhibits tension during competitive graded tasks.",
        recommendations:
          "1. Provide extended time (1.5x) on high-stakes STEM quizzes.\n2. Implement a 2-minute self-regulation transition break before exams.\n3. Bi-weekly check-in with school psychologist to build cognitive reframing strategies.",
      },
    });

    // Populate item-level responses for Ashish
    const p1Opts = await prisma.assessmentOption.findMany({
      where: { question: { assessmentTemplateId: protocol1.id } },
    });

    for (let i = 0; i < dbP1Questions.length; i++) {
      const q = dbP1Questions[i];
      const qOptions = p1Opts.filter((o) => o.questionId === q.id);
      // Select varying scores: 2 (rarely), 3 (sometimes), 4 (often)
      const targetScore = i % 2 === 0 ? 3 : 4;
      const selected = qOptions.find((o) => Number(o.score) === targetScore) || qOptions[0];

      await prisma.assessmentResponse.create({
        data: {
          studentAssessmentId: completedAshish.id,
          questionId: q.id,
          selectedOptionId: selected.id,
          score: selected.score,
          textResponse: i === 0 ? "Exhibits clenching fists during timed exercises." : null,
        },
      });
    }

    // Domain Results for Ashish
    await prisma.assessmentDomainResult.createMany({
      data: [
        {
          studentAssessmentId: completedAshish.id,
          domainId: dbP1Domains["Emotional Regulation"].id,
          score: new Prisma.Decimal("65.00"),
          maxScore: new Prisma.Decimal("100.00"),
          resultLabel: "Elevated Frustration Under Pressure",
          attentionLevel: "ATTENTION_REQUIRED",
        },
        {
          studentAssessmentId: completedAshish.id,
          domainId: dbP1Domains["Peer Engagement"].id,
          score: new Prisma.Decimal("82.00"),
          maxScore: new Prisma.Decimal("100.00"),
          resultLabel: "Healthy Peer Connections",
          attentionLevel: "OPTIMAL",
        },
        {
          studentAssessmentId: completedAshish.id,
          domainId: dbP1Domains["Self Confidence"].id,
          score: new Prisma.Decimal("70.00"),
          maxScore: new Prisma.Decimal("100.00"),
          resultLabel: "Developing Self-Efficacy",
          attentionLevel: "MONITOR",
        },
        {
          studentAssessmentId: completedAshish.id,
          domainId: dbP1Domains["Classroom Adjustment"].id,
          score: new Prisma.Decimal("78.00"),
          maxScore: new Prisma.Decimal("100.00"),
          resultLabel: "Good Task Transition",
          attentionLevel: "OPTIMAL",
        },
      ],
    });
  }

  // Completed Assessment 2: Alex Morgan (Grade 8)
  let completedAlex = await prisma.studentAssessment.findFirst({
    where: {
      studentId: alexStudent.id,
      status: "COMPLETED",
    },
  });

  if (!completedAlex) {
    completedAlex = await prisma.studentAssessment.create({
      data: {
        schoolId: school.id,
        studentId: alexStudent.id,
        assessmentTemplateId: protocol1.id,
        startedAt: new Date("2026-08-19T10:00:00Z"),
        completedAt: new Date("2026-08-19T10:12:00Z"),
        status: "COMPLETED",
        overallScore: new Prisma.Decimal("58.00"),
        attentionLevel: "ATTENTION_REQUIRED",
        createdBy: ananyaTeacher.id,
        professionalInterpretation: null,
      },
    });

    const p1Opts = await prisma.assessmentOption.findMany({
      where: { question: { assessmentTemplateId: protocol1.id } },
    });

    for (let i = 0; i < dbP1Questions.length; i++) {
      const q = dbP1Questions[i];
      const qOptions = p1Opts.filter((o) => o.questionId === q.id);
      const selected = qOptions.find((o) => Number(o.score) === 2) || qOptions[0];

      await prisma.assessmentResponse.create({
        data: {
          studentAssessmentId: completedAlex.id,
          questionId: q.id,
          selectedOptionId: selected.id,
          score: selected.score,
        },
      });
    }

    await prisma.assessmentDomainResult.createMany({
      data: [
        {
          studentAssessmentId: completedAlex.id,
          domainId: dbP1Domains["Emotional Regulation"].id,
          score: new Prisma.Decimal("52.00"),
          maxScore: new Prisma.Decimal("100.00"),
          resultLabel: "High Vulnerability to Performance Stress",
          attentionLevel: "ATTENTION_REQUIRED",
        },
        {
          studentAssessmentId: completedAlex.id,
          domainId: dbP1Domains["Peer Engagement"].id,
          score: new Prisma.Decimal("60.00"),
          maxScore: new Prisma.Decimal("100.00"),
          resultLabel: "Mild Social Withdrawal",
          attentionLevel: "MONITOR",
        },
      ],
    });
  }

  // Completed Assessment 3: Priya Nair (Grade 10)
  const priyaStudent = dbStudents["STU-1005"];
  let completedPriya = await prisma.studentAssessment.findFirst({
    where: { studentId: priyaStudent.id, status: "REVIEWED" },
  });

  if (!completedPriya) {
    completedPriya = await prisma.studentAssessment.create({
      data: {
        schoolId: school.id,
        studentId: priyaStudent.id,
        assessmentTemplateId: protocol1.id,
        startedAt: new Date("2026-08-18T14:00:00Z"),
        completedAt: new Date("2026-08-18T14:11:00Z"),
        status: "REVIEWED",
        overallScore: new Prisma.Decimal("88.00"),
        attentionLevel: "OPTIMAL",
        createdBy: harshTeacher.id,
        reviewedBy: psychOkafor.id,
        reviewedAt: new Date("2026-08-19T09:00:00Z"),
        professionalInterpretation:
          "Excellent executive function, exceptional peer engagement, and well-developed emotional resilience. Mild anticipatory test perfectionism which is well within adaptive limits.",
        recommendations: "Maintain current classroom enrichment and encourage mentorship roles in study groups.",
      },
    });

    await prisma.assessmentDomainResult.createMany({
      data: [
        {
          studentAssessmentId: completedPriya.id,
          domainId: dbP1Domains["Emotional Regulation"].id,
          score: new Prisma.Decimal("85.00"),
          maxScore: new Prisma.Decimal("100.00"),
          resultLabel: "Strong Coping Mechanisms",
          attentionLevel: "OPTIMAL",
        },
        {
          studentAssessmentId: completedPriya.id,
          domainId: dbP1Domains["Peer Engagement"].id,
          score: new Prisma.Decimal("92.00"),
          maxScore: new Prisma.Decimal("100.00"),
          resultLabel: "Exceptional Peer Rapport",
          attentionLevel: "OPTIMAL",
        },
      ],
    });
  }
  console.log(`  ✅ 9. Completed Assessment Submissions with item scores & clinical notes seeded`);

  // ── 10. Official Psychological Reports ────────────────────
  let reportAshish = await prisma.report.findFirst({
    where: { schoolId: school.id, studentId: ashishStudent.id },
  });
  if (!reportAshish) {
    reportAshish = await prisma.report.create({
      data: {
        schoolId: school.id,
        studentId: ashishStudent.id,
        assessmentId: completedAshish.id,
        reportType: "STUDENT",
        title: `Comprehensive Psychological Wellbeing & Assessment Report: ${ashishStudent.fullName}`,
        status: "FINALIZED",
        classId: createdClasses["Grade 10"].id,
        sectionId: createdSections["Grade 10-Section A"].id,
        academicSessionId: academicSession.id,
        generatedBy: psychOkafor.id,
        generatedAt: new Date("2026-08-21T15:00:00Z"),
        fileUrl: "https://storage.westside.edu/reports/rep-2026-1004.pdf",
      },
    });

    await prisma.reportSnapshot.create({
      data: {
        reportId: reportAshish.id,
        contentJson: {
          reportVersion: "2.0",
          student: {
            id: ashishStudent.studentId,
            fullName: ashishStudent.fullName,
            dob: ashishStudent.dateOfBirth?.toISOString().split("T")[0],
            class: "Grade 10 - Section A",
          },
          summary: {
            overallScore: 74,
            attentionLevel: "MONITOR",
            assessmentTitle: protocol1.name,
            domains: [
              { name: "Emotional Regulation", score: 65, maxScore: 100, level: "ATTENTION_REQUIRED" },
              { name: "Peer Engagement", score: 82, maxScore: 100, level: "OPTIMAL" },
              { name: "Self Confidence", score: 70, maxScore: 100, level: "MONITOR" },
              { name: "Classroom Adjustment", score: 78, maxScore: 100, level: "OPTIMAL" },
            ],
          },
          clinicalNotes: completedAshish.professionalInterpretation,
          recommendations: completedAshish.recommendations,
          signOff: {
            psychologist: psychOkafor.name,
            timestamp: "2026-08-21T15:00:00Z",
          },
        },
      },
    });
  }
  console.log(`  ✅ 10. Official Psychological Reports and Snapshots created`);

  // ── 11. Super Admin User ──────────────────────────────────
  const superAdminPassword = await bcrypt.hash("SuperAdmin@2024!", 10);
  await prisma.user.upsert({
    where: { email: "superadmin@eduwell.platform" },
    update: {},
    create: {
      name: "Platform Administrator",
      email: "superadmin@eduwell.platform",
      passwordHash: superAdminPassword,
      role: "SUPER_ADMIN",
      schoolId: null,
      status: "ACTIVE",
    },
  });
  console.log(`  ✅ 11. Super Admin User: superadmin@eduwell.platform (Password: SuperAdmin@2024!)`);

  console.log("\n=======================================================");
  console.log("🎉 SEED COMPLETE! Meaningful real-world test data loaded!");
  console.log("=======================================================");
  console.log("Staff Login Credentials (Password for all: password123):");
  console.log("  • Principal / Admin:        admin@westside.edu (Dr. Sarah Chen)");
  console.log("  • Lead Psychologist:        psych@westside.edu (Dr. James Okafor)");
  console.log("  • School Psychologist:      dr.jenkins@eduwell.org (Dr. Sarah Jenkins)");
  console.log("  • Grade 10 Lead Teacher:    harsh.teacher@eduwell.org (Harsh Watkar)");
  console.log("  • Grade 8 Lead Teacher:     ananya.teacher@eduwell.org (Ananya Sharma)");
  console.log("  • Grade 4 Lead Teacher:     marcus.teacher@eduwell.org (Marcus Vance)");
  console.log("=======================================================\n");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
