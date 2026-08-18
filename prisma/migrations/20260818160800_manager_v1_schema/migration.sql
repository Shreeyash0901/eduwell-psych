-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "Assessment" DROP CONSTRAINT "Assessment_studentId_fkey";

-- DropForeignKey
ALTER TABLE "AssessmentQuestion" DROP CONSTRAINT "AssessmentQuestion_protocolId_fkey";

-- DropForeignKey
ALTER TABLE "AssessmentResponse" DROP CONSTRAINT "AssessmentResponse_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "AssessmentResponse" DROP CONSTRAINT "AssessmentResponse_questionId_fkey";

-- DropForeignKey
ALTER TABLE "AssessmentResult" DROP CONSTRAINT "AssessmentResult_assessmentId_fkey";

-- DropForeignKey
ALTER TABLE "Guardian" DROP CONSTRAINT "Guardian_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_authorId_fkey";

-- DropForeignKey
ALTER TABLE "Observation" DROP CONSTRAINT "Observation_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_createdById_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "Report" DROP CONSTRAINT "Report_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Student" DROP CONSTRAINT "Student_schoolId_fkey";

-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_schoolId_fkey";

-- DropTable
DROP TABLE "Assessment";

-- DropTable
DROP TABLE "AssessmentProtocol";

-- DropTable
DROP TABLE "AssessmentQuestion";

-- DropTable
DROP TABLE "AssessmentResponse";

-- DropTable
DROP TABLE "AssessmentResult";

-- DropTable
DROP TABLE "Guardian";

-- DropTable
DROP TABLE "Observation";

-- DropTable
DROP TABLE "Report";

-- DropTable
DROP TABLE "School";

-- DropTable
DROP TABLE "Student";

-- DropTable
DROP TABLE "User";

-- DropEnum
DROP TYPE "AssessmentStatus";

-- DropEnum
DROP TYPE "ObservationSource";

-- DropEnum
DROP TYPE "ObservationStatus";

-- DropEnum
DROP TYPE "ReportStatus";

-- DropEnum
DROP TYPE "UserRole";

-- DropEnum
DROP TYPE "WellnessStatus";

-- CreateTable
CREATE TABLE "schools" (
    "id" SERIAL NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "school_api_configs" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "base_url" VARCHAR(255) NOT NULL,
    "school_code" VARCHAR(50) NOT NULL,
    "app_version" VARCHAR(20) NOT NULL,
    "app_os" VARCHAR(20) NOT NULL,
    "is_enabled" BOOLEAN NOT NULL DEFAULT true,
    "last_tested_at" TIMESTAMP(6),
    "last_sync_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "school_api_configs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(30) NOT NULL DEFAULT 'TEACHER',
    "status" VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "academic_sessions" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "external_session_id" VARCHAR(50),
    "name" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "is_current" BOOLEAN NOT NULL DEFAULT false,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "academic_sessions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "classes" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "external_class_id" VARCHAR(50),
    "name" VARCHAR(100) NOT NULL,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "classes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "sections" (
    "id" SERIAL NOT NULL,
    "class_id" INTEGER NOT NULL,
    "external_section_id" VARCHAR(50),
    "name" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "sections_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "students" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "student_id" VARCHAR(50) NOT NULL,
    "external_student_id" VARCHAR(50),
    "admission_no" VARCHAR(50),
    "registration_no" VARCHAR(50),
    "first_name" VARCHAR(100),
    "middle_name" VARCHAR(100),
    "last_name" VARCHAR(100),
    "full_name" VARCHAR(255),
    "email" VARCHAR(255),
    "phone" VARCHAR(50),
    "alternate_phone" VARCHAR(50),
    "gender" VARCHAR(20),
    "date_of_birth" DATE,
    "class_id" INTEGER,
    "section_id" INTEGER,
    "photo_url" VARCHAR(500),
    "source" VARCHAR(30) NOT NULL DEFAULT 'MANUAL',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "last_synced_at" TIMESTAMP(6),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "students_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_imports" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "file_name" VARCHAR(255) NOT NULL,
    "total_rows" INTEGER NOT NULL DEFAULT 0,
    "success_count" INTEGER NOT NULL DEFAULT 0,
    "failed_count" INTEGER NOT NULL DEFAULT 0,
    "uploaded_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_imports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_import_errors" (
    "id" SERIAL NOT NULL,
    "import_id" INTEGER NOT NULL,
    "row_number" INTEGER NOT NULL,
    "student_id" VARCHAR(50),
    "email" VARCHAR(255),
    "name" VARCHAR(255),
    "error_message" TEXT NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "student_import_errors_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_observations" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "submitted_by" INTEGER NOT NULL,
    "source" VARCHAR(30) NOT NULL,
    "category" VARCHAR(100) NOT NULL,
    "observation" TEXT NOT NULL,
    "additional_comments" TEXT,
    "status" VARCHAR(30) NOT NULL DEFAULT 'PENDING',
    "observed_at" DATE NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "student_observations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_templates" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "category" VARCHAR(100) NOT NULL,
    "estimated_minutes" INTEGER,
    "status" VARCHAR(20) NOT NULL DEFAULT 'DRAFT',
    "version" VARCHAR(20) NOT NULL DEFAULT '1.0',
    "created_by" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "assessment_templates_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_domains" (
    "id" SERIAL NOT NULL,
    "assessment_template_id" INTEGER NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "assessment_domains_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_questions" (
    "id" SERIAL NOT NULL,
    "assessment_template_id" INTEGER NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "question_text" TEXT NOT NULL,
    "question_type" VARCHAR(50) NOT NULL DEFAULT 'LIKERT',
    "is_required" BOOLEAN NOT NULL DEFAULT true,
    "display_order" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "assessment_questions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_options" (
    "id" SERIAL NOT NULL,
    "question_id" INTEGER NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "value" VARCHAR(100) NOT NULL,
    "score" DECIMAL(5,2) NOT NULL DEFAULT 0.00,
    "display_order" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "assessment_options_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_scoring_rules" (
    "id" SERIAL NOT NULL,
    "assessment_template_id" INTEGER NOT NULL,
    "scope" VARCHAR(20) NOT NULL,
    "domain_id" INTEGER,
    "min_score" DECIMAL(5,2) NOT NULL,
    "max_score" DECIMAL(5,2) NOT NULL,
    "result_label" VARCHAR(100) NOT NULL,
    "attention_level" VARCHAR(50) NOT NULL,

    CONSTRAINT "assessment_scoring_rules_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "student_assessments" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "student_id" INTEGER NOT NULL,
    "assessment_template_id" INTEGER NOT NULL,
    "started_at" TIMESTAMP(6),
    "completed_at" TIMESTAMP(6),
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "overall_score" DECIMAL(5,2),
    "attention_level" VARCHAR(50),
    "created_by" INTEGER NOT NULL,
    "reviewed_by" INTEGER,
    "reviewed_at" TIMESTAMP(6),
    "professional_interpretation" TEXT,
    "recommendations" TEXT,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "student_assessments_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_responses" (
    "id" SERIAL NOT NULL,
    "student_assessment_id" INTEGER NOT NULL,
    "question_id" INTEGER NOT NULL,
    "selected_option_id" INTEGER,
    "text_response" TEXT,
    "score" DECIMAL(5,2),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assessment_responses_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assessment_domain_results" (
    "id" SERIAL NOT NULL,
    "student_assessment_id" INTEGER NOT NULL,
    "domain_id" INTEGER NOT NULL,
    "score" DECIMAL(5,2) NOT NULL,
    "max_score" DECIMAL(5,2) NOT NULL,
    "result_label" VARCHAR(100),
    "attention_level" VARCHAR(50),

    CONSTRAINT "assessment_domain_results_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "reports" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "student_id" INTEGER,
    "assessment_id" INTEGER,
    "report_type" VARCHAR(30) NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "status" VARCHAR(30) NOT NULL DEFAULT 'DRAFT',
    "class_id" INTEGER,
    "section_id" INTEGER,
    "academic_session_id" INTEGER,
    "generated_by" INTEGER NOT NULL,
    "generated_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "file_url" VARCHAR(500),
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "reports_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "report_snapshots" (
    "id" SERIAL NOT NULL,
    "report_id" INTEGER NOT NULL,
    "content_json" JSONB NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "report_snapshots_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "schools_code_key" ON "schools"("code");

-- CreateIndex
CREATE INDEX "school_api_configs_school_id_idx" ON "school_api_configs"("school_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE INDEX "users_school_id_idx" ON "users"("school_id");

-- CreateIndex
CREATE INDEX "academic_sessions_school_id_idx" ON "academic_sessions"("school_id");

-- CreateIndex
CREATE INDEX "classes_school_id_idx" ON "classes"("school_id");

-- CreateIndex
CREATE INDEX "sections_class_id_idx" ON "sections"("class_id");

-- CreateIndex
CREATE INDEX "students_school_id_idx" ON "students"("school_id");

-- CreateIndex
CREATE INDEX "students_student_id_idx" ON "students"("student_id");

-- CreateIndex
CREATE INDEX "students_external_student_id_idx" ON "students"("external_student_id");

-- CreateIndex
CREATE INDEX "students_admission_no_idx" ON "students"("admission_no");

-- CreateIndex
CREATE INDEX "students_registration_no_idx" ON "students"("registration_no");

-- CreateIndex
CREATE INDEX "students_class_id_idx" ON "students"("class_id");

-- CreateIndex
CREATE INDEX "students_section_id_idx" ON "students"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_student_id_key" ON "students"("school_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "students_school_id_external_student_id_key" ON "students"("school_id", "external_student_id");

-- CreateIndex
CREATE INDEX "student_imports_school_id_idx" ON "student_imports"("school_id");

-- CreateIndex
CREATE INDEX "student_imports_uploaded_by_idx" ON "student_imports"("uploaded_by");

-- CreateIndex
CREATE INDEX "student_import_errors_import_id_idx" ON "student_import_errors"("import_id");

-- CreateIndex
CREATE INDEX "student_observations_school_id_idx" ON "student_observations"("school_id");

-- CreateIndex
CREATE INDEX "student_observations_student_id_idx" ON "student_observations"("student_id");

-- CreateIndex
CREATE INDEX "student_observations_submitted_by_idx" ON "student_observations"("submitted_by");

-- CreateIndex
CREATE INDEX "assessment_templates_school_id_idx" ON "assessment_templates"("school_id");

-- CreateIndex
CREATE INDEX "assessment_templates_created_by_idx" ON "assessment_templates"("created_by");

-- CreateIndex
CREATE INDEX "assessment_domains_assessment_template_id_idx" ON "assessment_domains"("assessment_template_id");

-- CreateIndex
CREATE INDEX "assessment_questions_assessment_template_id_idx" ON "assessment_questions"("assessment_template_id");

-- CreateIndex
CREATE INDEX "assessment_questions_domain_id_idx" ON "assessment_questions"("domain_id");

-- CreateIndex
CREATE INDEX "assessment_options_question_id_idx" ON "assessment_options"("question_id");

-- CreateIndex
CREATE INDEX "assessment_scoring_rules_assessment_template_id_idx" ON "assessment_scoring_rules"("assessment_template_id");

-- CreateIndex
CREATE INDEX "assessment_scoring_rules_domain_id_idx" ON "assessment_scoring_rules"("domain_id");

-- CreateIndex
CREATE INDEX "student_assessments_school_id_idx" ON "student_assessments"("school_id");

-- CreateIndex
CREATE INDEX "student_assessments_student_id_idx" ON "student_assessments"("student_id");

-- CreateIndex
CREATE INDEX "student_assessments_assessment_template_id_idx" ON "student_assessments"("assessment_template_id");

-- CreateIndex
CREATE INDEX "student_assessments_created_by_idx" ON "student_assessments"("created_by");

-- CreateIndex
CREATE INDEX "student_assessments_reviewed_by_idx" ON "student_assessments"("reviewed_by");

-- CreateIndex
CREATE INDEX "assessment_responses_student_assessment_id_idx" ON "assessment_responses"("student_assessment_id");

-- CreateIndex
CREATE INDEX "assessment_responses_question_id_idx" ON "assessment_responses"("question_id");

-- CreateIndex
CREATE INDEX "assessment_responses_selected_option_id_idx" ON "assessment_responses"("selected_option_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_responses_student_assessment_id_question_id_key" ON "assessment_responses"("student_assessment_id", "question_id");

-- CreateIndex
CREATE INDEX "assessment_domain_results_student_assessment_id_idx" ON "assessment_domain_results"("student_assessment_id");

-- CreateIndex
CREATE INDEX "assessment_domain_results_domain_id_idx" ON "assessment_domain_results"("domain_id");

-- CreateIndex
CREATE UNIQUE INDEX "assessment_domain_results_student_assessment_id_domain_id_key" ON "assessment_domain_results"("student_assessment_id", "domain_id");

-- CreateIndex
CREATE INDEX "reports_school_id_idx" ON "reports"("school_id");

-- CreateIndex
CREATE INDEX "reports_student_id_idx" ON "reports"("student_id");

-- CreateIndex
CREATE INDEX "reports_assessment_id_idx" ON "reports"("assessment_id");

-- CreateIndex
CREATE INDEX "reports_class_id_idx" ON "reports"("class_id");

-- CreateIndex
CREATE INDEX "reports_section_id_idx" ON "reports"("section_id");

-- CreateIndex
CREATE INDEX "reports_academic_session_id_idx" ON "reports"("academic_session_id");

-- CreateIndex
CREATE INDEX "reports_generated_by_idx" ON "reports"("generated_by");

-- CreateIndex
CREATE INDEX "report_snapshots_report_id_idx" ON "report_snapshots"("report_id");

-- AddForeignKey
ALTER TABLE "school_api_configs" ADD CONSTRAINT "school_api_configs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "academic_sessions" ADD CONSTRAINT "academic_sessions_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "classes" ADD CONSTRAINT "classes_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "sections" ADD CONSTRAINT "sections_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "students" ADD CONSTRAINT "students_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_imports" ADD CONSTRAINT "student_imports_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_imports" ADD CONSTRAINT "student_imports_uploaded_by_fkey" FOREIGN KEY ("uploaded_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_import_errors" ADD CONSTRAINT "student_import_errors_import_id_fkey" FOREIGN KEY ("import_id") REFERENCES "student_imports"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_observations" ADD CONSTRAINT "student_observations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_observations" ADD CONSTRAINT "student_observations_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_observations" ADD CONSTRAINT "student_observations_submitted_by_fkey" FOREIGN KEY ("submitted_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_templates" ADD CONSTRAINT "assessment_templates_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_domains" ADD CONSTRAINT "assessment_domains_assessment_template_id_fkey" FOREIGN KEY ("assessment_template_id") REFERENCES "assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_assessment_template_id_fkey" FOREIGN KEY ("assessment_template_id") REFERENCES "assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_questions" ADD CONSTRAINT "assessment_questions_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "assessment_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_options" ADD CONSTRAINT "assessment_options_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_scoring_rules" ADD CONSTRAINT "assessment_scoring_rules_assessment_template_id_fkey" FOREIGN KEY ("assessment_template_id") REFERENCES "assessment_templates"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_scoring_rules" ADD CONSTRAINT "assessment_scoring_rules_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "assessment_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assessments" ADD CONSTRAINT "student_assessments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assessments" ADD CONSTRAINT "student_assessments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assessments" ADD CONSTRAINT "student_assessments_assessment_template_id_fkey" FOREIGN KEY ("assessment_template_id") REFERENCES "assessment_templates"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assessments" ADD CONSTRAINT "student_assessments_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_assessments" ADD CONSTRAINT "student_assessments_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_student_assessment_id_fkey" FOREIGN KEY ("student_assessment_id") REFERENCES "student_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_question_id_fkey" FOREIGN KEY ("question_id") REFERENCES "assessment_questions"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_responses" ADD CONSTRAINT "assessment_responses_selected_option_id_fkey" FOREIGN KEY ("selected_option_id") REFERENCES "assessment_options"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_domain_results" ADD CONSTRAINT "assessment_domain_results_student_assessment_id_fkey" FOREIGN KEY ("student_assessment_id") REFERENCES "student_assessments"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "assessment_domain_results" ADD CONSTRAINT "assessment_domain_results_domain_id_fkey" FOREIGN KEY ("domain_id") REFERENCES "assessment_domains"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_assessment_id_fkey" FOREIGN KEY ("assessment_id") REFERENCES "student_assessments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_academic_session_id_fkey" FOREIGN KEY ("academic_session_id") REFERENCES "academic_sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "reports" ADD CONSTRAINT "reports_generated_by_fkey" FOREIGN KEY ("generated_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "report_snapshots" ADD CONSTRAINT "report_snapshots_report_id_fkey" FOREIGN KEY ("report_id") REFERENCES "reports"("id") ON DELETE CASCADE ON UPDATE CASCADE;
