// prisma/seed.ts
// EduWell Psych — Development Seed Data
// Synthetic demo data only. No real student information.
// Safe to re-run: uses upsert with stable identifiers.

import "dotenv/config";
import { PrismaClient, UserRole, WellnessStatus, ObservationStatus, ObservationSource } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("🌱 Starting seed...");

  // ── 1. School ──────────────────────────────────────────────
  const school = await prisma.school.upsert({
    where: { id: "seed-school-westside" },
    update: {},
    create: {
      id: "seed-school-westside",
      name: "Westside Academy",
    },
  });
  console.log(`  ✅ School: ${school.name}`);

  // ── 2. Users (Staff) ───────────────────────────────────────
  const adminUser = await prisma.user.upsert({
    where: { email: "admin@westside.edu" },
    update: {},
    create: {
      id: "seed-user-admin",
      schoolId: school.id,
      name: "Dr. Sarah Chen",
      email: "admin@westside.edu",
      role: UserRole.ADMIN,
    },
  });

  const psychUser = await prisma.user.upsert({
    where: { email: "psych@westside.edu" },
    update: {},
    create: {
      id: "seed-user-psych",
      schoolId: school.id,
      name: "Dr. James Okafor",
      email: "psych@westside.edu",
      role: UserRole.PSYCHOLOGIST,
    },
  });

  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@westside.edu" },
    update: {},
    create: {
      id: "seed-user-teacher",
      schoolId: school.id,
      name: "Ms. Laura Bennett",
      email: "teacher@westside.edu",
      role: UserRole.TEACHER,
    },
  });
  console.log(`  ✅ Users: ${adminUser.name}, ${psychUser.name}, ${teacherUser.name}`);

  // ── 3. Students ────────────────────────────────────────────
  const student1 = await prisma.student.upsert({
    where: { schoolId_studentCode: { schoolId: school.id, studentCode: "STU-4029" } },
    update: {},
    create: {
      id: "seed-student-1",
      schoolId: school.id,
      studentCode: "STU-4029",
      name: "Demo Student A",
      dateOfBirth: null, // Cannot auto-migrate from mock age — to be filled manually
      grade: "Grade 8",
      classGroup: "8B",
      homeroom: "Homeroom 8B",
      iepStatus: "None Active",
      wellnessStatus: WellnessStatus.ATTENTION_REQUIRED,
      primaryDomainFlag: "Emotional Regulation",
    },
  });

  const student2 = await prisma.student.upsert({
    where: { schoolId_studentCode: { schoolId: school.id, studentCode: "STU-4055" } },
    update: {},
    create: {
      id: "seed-student-2",
      schoolId: school.id,
      studentCode: "STU-4055",
      name: "Demo Student B",
      dateOfBirth: null,
      grade: "Grade 4",
      classGroup: "4B",
      homeroom: "Homeroom 4B",
      iepStatus: "Under Evaluation",
      wellnessStatus: WellnessStatus.MONITOR,
      primaryDomainFlag: "Focus & Attention",
    },
  });

  const student3 = await prisma.student.upsert({
    where: { schoolId_studentCode: { schoolId: school.id, studentCode: "STU-4102" } },
    update: {},
    create: {
      id: "seed-student-3",
      schoolId: school.id,
      studentCode: "STU-4102",
      name: "Demo Student C",
      dateOfBirth: null,
      grade: "Grade 5",
      classGroup: "5A",
      homeroom: "Homeroom 5A",
      iepStatus: "None Active",
      wellnessStatus: WellnessStatus.NORMAL,
    },
  });
  console.log(`  ✅ Students: ${student1.studentCode}, ${student2.studentCode}, ${student3.studentCode}`);

  // ── 4. Guardians ───────────────────────────────────────────
  await prisma.guardian.upsert({
    where: { id: "seed-guardian-1" },
    update: {},
    create: {
      id: "seed-guardian-1",
      studentId: student1.id,
      name: "Guardian A",
      relationship: "Parent",
      email: "guardian.a@example.com",
      phone: null,
    },
  });

  await prisma.guardian.upsert({
    where: { id: "seed-guardian-2" },
    update: {},
    create: {
      id: "seed-guardian-2",
      studentId: student2.id,
      name: "Guardian B",
      relationship: "Legal Guardian",
      email: null,
      phone: "+1-555-0100",
    },
  });
  console.log("  ✅ Guardians: 2 created");

  // ── 5. Observation ─────────────────────────────────────────
  await prisma.observation.upsert({
    where: { recordNumber: "#SEED-001" },
    update: {},
    create: {
      id: "seed-obs-1",
      recordNumber: "#SEED-001",
      studentId: student1.id,
      authorId: teacherUser.id,
      submittedByName: null,
      source: ObservationSource.TEACHER,
      concernCategory: "Emotional Regulation",
      status: ObservationStatus.PENDING_REVIEW,
      classGroupSnapshot: "8B - Science",
      observedAt: new Date("2024-10-24"),
      incidentTime: "Oct 23, 2024 - 11:15 AM",
      setting: "Science Lab",
      narrative: "Demo observation narrative for seed verification purposes only.",
      triggers: "Group work with shared materials.",
      interventions: "Verbal reassurance provided.",
      psychologistNotes: null,
    },
  });
  console.log("  ✅ Observation: #SEED-001");

  // ── 6. Assessment Protocol ─────────────────────────────────
  const protocol = await prisma.assessmentProtocol.upsert({
    where: { id: "seed-protocol-ewi" },
    update: {},
    create: {
      id: "seed-protocol-ewi",
      title: "Emotional Wellbeing Inventory (Demo)",
      description: "Demo protocol for seed verification. Not for clinical use.",
      domains: ["Anxiety", "Mood", "Stress"],
      estimatedTime: "15-20 mins",
    },
  });

  // Assessment Questions with explicit ordering
  const questionData = [
    { id: "seed-q-1", text: "Student expresses nervousness before assessments.", domain: "Anxiety", order: 1 },
    { id: "seed-q-2", text: "Student recovers quickly after making a mistake.", domain: "Mood", order: 2 },
    { id: "seed-q-3", text: "Student appears overwhelmed with multi-step instructions.", domain: "Stress", order: 3 },
  ];

  for (const q of questionData) {
    await prisma.assessmentQuestion.upsert({
      where: { id: q.id },
      update: {},
      create: {
        id: q.id,
        protocolId: protocol.id,
        text: q.text,
        domain: q.domain,
        order: q.order,
        questionType: "LIKERT",
      },
    });
  }
  console.log(`  ✅ AssessmentProtocol: ${protocol.title} (${questionData.length} questions)`);

  // ── Summary ────────────────────────────────────────────────
  console.log("\n🎉 Seed complete.");
  console.log("   School → Users → Students → Guardians → Observation → Protocol ✅");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
