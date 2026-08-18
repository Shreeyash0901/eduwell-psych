# Database Gap Analysis & Implementation Plan

## 1. Existing Tables
The current Prisma schema has the following tables that roughly correspond to the manager's requirements but need renaming or refactoring:
- `School` → Needs refactoring to `schools`
- `User` → Needs refactoring to `users`
- `Student` → Needs refactoring to `students`
- `Observation` → Needs refactoring to `student_observations`
- `AssessmentProtocol` → Needs refactoring to `assessment_templates`
- `AssessmentQuestion` → Needs refactoring to `assessment_questions`
- `Assessment` → Needs refactoring to `student_assessments`
- `AssessmentResponse` → Needs refactoring to `assessment_responses`
- `Report` → Needs refactoring to `reports`

*Note: The current schema includes `Guardian` and `AssessmentResult`, which are not in the spec. These will be removed (their data absorbed elsewhere or discarded per the spec).*

## 2. Missing Tables
The following 10 tables are completely missing and must be created:
1. `school_api_configs`
2. `academic_sessions`
3. `classes`
4. `sections`
5. `student_imports`
6. `student_import_errors`
7. `assessment_domains`
8. `assessment_options`
9. `assessment_scoring_rules`
10. `report_snapshots`

## 3. Incorrect Fields
Many fields differ from the specification. Key corrections needed:
- **schools**: Missing `code`, `status`.
- **users**: Missing `password_hash`, `status`.
- **students**:
  - **Missing**: `external_student_id`, `admission_no`, `registration_no`, `first_name`, `middle_name`, `last_name`, `full_name`, `phone`, `alternate_phone`, `gender`, `class_id`, `section_id`, `photo_url`, `source`, `is_active`, `last_synced_at`.
  - **To Remove**: `studentCode` (becomes `student_id`), `grade`, `classGroup`, `homeroom`, `iepStatus`, `wellnessStatus`, `primaryDomainFlag`, `avatarUrl`, `archivedAt`.
- **student_observations** (currently `Observation`):
  - **Missing**: `school_id`, `category`, `observation`, `additional_comments`.
  - **To Remove**: `recordNumber`, `submittedByName`, `incidentTime`, `setting`, `narrative`, `triggers`, `interventions`, `psychologistNotes`, `aiAnalysis`.
- **assessment_templates** (currently `AssessmentProtocol`):
  - **Missing**: `school_id`, `name`, `category`, `estimated_minutes` (integer), `status`, `version`, `created_by`.
  - **To Remove**: `title`, `estimatedTime` (string), `domains` (string array - moves to relational table).
- **assessment_questions**:
  - **Missing**: `domain_id`, `is_required`.
  - **To Remove**: `domain` (string).
- **student_assessments** (currently `Assessment`):
  - **Missing**: `school_id`, `overall_score`, `attention_level`, `reviewed_by`, `reviewed_at`, `professional_interpretation`, `recommendations`.
- **assessment_responses**:
  - **Missing**: `selected_option_id`, `text_response`, `score`.
  - **To Remove**: `response` (JSON).
- **reports**:
  - **Missing**: `assessment_id`, `report_type`, `class_id`, `section_id`, `academic_session_id`, `generated_by`, `generated_at`, `file_url`.
  - **To Remove**: `content` (moves to `report_snapshots`).

## 4. Incorrect Relationships
- `students` needs foreign keys to `classes` and `sections`.
- `student_observations` needs a foreign key to `schools`.
- `assessment_templates` needs foreign keys to `schools` and `users` (as `created_by`).
- `assessment_questions` needs a foreign key to `assessment_domains`.
- `student_assessments` needs foreign keys to `schools` and `users` (as `reviewed_by`).
- `assessment_responses` needs a foreign key to `assessment_options`.
- `reports` needs foreign keys to `student_assessments`, `classes`, `sections`, and `academic_sessions`.

## 5. Required Unique Constraints
- **students**: `@@unique([school_id, student_id])`
- **students**: `@@unique([school_id, external_student_id])`
- **users**: `@@unique([email])` (already exists, but needs to be retained).

## 6. Required Indexes
To optimize multitenant querying and foreign key lookups, the following indexes are required:
- `@@index([school_id])` on all tenant-scoped tables (`users`, `students`, `academic_sessions`, `classes`, `student_imports`, `student_observations`, `assessment_templates`, `student_assessments`, `reports`).
- `@@index([student_id])` on `student_observations`, `student_assessments`, `reports`.
- `@@index([assessment_template_id])` on `assessment_domains`, `assessment_questions`, `assessment_scoring_rules`, `student_assessments`.

## 7. Migration Risks
- **Total Data Loss for Existing Dev DB**: This is a massive schema overhaul. Dropping existing tables (like `Guardian`, `AssessmentResult`) and completely redefining existing tables (like `Observation` to `student_observations`) means existing data cannot be safely migrated.
- **Seed Data Breakage**: `prisma/seed.ts` is tightly coupled to the old schema. It will fail to compile or run once the Prisma schema is updated.
- **Strategy**: Instead of generating a complex up/down migration to morph the current state into the new state, the safest and cleanest approach for local development is to reset the database completely by dropping the old migrations and generating a fresh `init` migration.

## 8. Files That Must Change
To implement this spec purely at the database level, the following files must be modified:
1. `prisma/schema.prisma` — Completely rewritten to define the 20 tables exactly as specified.
2. `prisma/seed.ts` — Updated to insert valid test data mapping to the new schema structures.
3. `prisma/migrations/*` — Existing migrations should be wiped, and a new baseline migration created (`npx prisma migrate dev --name init_v2`).
