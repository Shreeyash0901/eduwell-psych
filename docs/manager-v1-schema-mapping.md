# Manager V1 Schema Mapping Specification

This document details the mapping between the 20 manager-required PostgreSQL tables and their corresponding Prisma models in `prisma/schema.prisma`.

---

## Complete Table & Model Mappings (20 Tables)

### 1. `schools`
* **Prisma Model:** `School` (`@@map("schools")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `name`: `String` (`VARCHAR(255)`)
  * `code`: `String` (`VARCHAR(50)`, unique tenant identifier)
  * `status`: `String` (`VARCHAR(20)`, default: `'ACTIVE'`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@unique([code])`
* **Relationships:**
  * Has many `school_api_configs`, `users`, `academic_sessions`, `classes`, `students`, `student_imports`, `student_observations`, `assessment_templates`, `student_assessments`, `reports`.

---

### 2. `school_api_configs`
* **Prisma Model:** `SchoolApiConfig` (`@@map("school_api_configs")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `base_url`: `String` (`VARCHAR(255)`)
  * `school_code`: `String` (`VARCHAR(50)`)
  * `app_version`: `String` (`VARCHAR(20)`)
  * `app_os`: `String` (`VARCHAR(20)`)
  * `is_enabled`: `Boolean` (default: `true`)
  * `last_tested_at`: `DateTime?` (`TIMESTAMP(6)`)
  * `last_sync_at`: `DateTime?` (`TIMESTAMP(6)`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([school_id])`
* **Referential Actions:**
  * `school`: `onDelete: Cascade`

---

### 3. `users`
* **Prisma Model:** `User` (`@@map("users")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `name`: `String` (`VARCHAR(100)`)
  * `email`: `String` (`VARCHAR(255)`, unique)
  * `password_hash`: `String` (`VARCHAR(255)`)
  * `role`: `String` (`VARCHAR(30)`, default: `'TEACHER'`)
  * `status`: `String` (`VARCHAR(20)`, default: `'ACTIVE'`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@unique([email])`
  * `@@index([school_id])`
* **Referential Actions:**
  * `school`: `onDelete: Restrict`

---

### 4. `academic_sessions`
* **Prisma Model:** `AcademicSession` (`@@map("academic_sessions")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `external_session_id`: `String?` (`VARCHAR(50)`)
  * `name`: `String` (`VARCHAR(100)`)
  * `start_date`: `DateTime` (`DATE`, date-only)
  * `end_date`: `DateTime` (`DATE`, date-only)
  * `is_current`: `Boolean` (default: `false`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([school_id])`
* **Referential Actions:**
  * `school`: `onDelete: Cascade`

---

### 5. `classes`
* **Prisma Model:** `Class` (`@@map("classes")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `external_class_id`: `String?` (`VARCHAR(50)`)
  * `name`: `String` (`VARCHAR(100)`)
  * `display_order`: `Int` (default: `0`)
  * `isActive`: `Boolean` (default: `true`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([school_id])`
* **Referential Actions:**
  * `school`: `onDelete: Cascade`

---

### 6. `sections`
* **Prisma Model:** `Section` (`@@map("sections")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `class_id`: `Int` (FK -> `classes.id`)
  * `external_section_id`: `String?` (`VARCHAR(50)`)
  * `name`: `String` (`VARCHAR(50)`)
  * `is_active`: `Boolean` (default: `true`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([class_id])`
* **Referential Actions:**
  * `class`: `onDelete: Cascade`

---

### 7. `students`
* **Prisma Model:** `Student` (`@@map("students")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `student_id`: `String` (`VARCHAR(50)`, local normalized ID)
  * `external_student_id`: `String?` (`VARCHAR(50)`, API Pk_Student_M)
  * `admission_no`: `String?` (`VARCHAR(50)`)
  * `registration_no`: `String?` (`VARCHAR(50)`)
  * `first_name`: `String?` (`VARCHAR(100)`)
  * `middle_name`: `String?` (`VARCHAR(100)`)
  * `last_name`: `String?` (`VARCHAR(100)`)
  * `full_name`: `String?` (`VARCHAR(255)`)
  * `email`: `String?` (`VARCHAR(255)`, non-unique auxiliary matching)
  * `phone`: `String?` (`VARCHAR(50)`)
  * `alternate_phone`: `String?` (`VARCHAR(50)`)
  * `gender`: `String?` (`VARCHAR(20)`)
  * `date_of_birth`: `DateTime?` (`DATE`, date-only)
  * `class_id`: `Int?` (FK -> `classes.id`)
  * `section_id`: `Int?` (FK -> `sections.id`)
  * `photo_url`: `String?` (`VARCHAR(500)`)
  * `source`: `String` (`VARCHAR(30)`, default: `'MANUAL'`)
  * `is_active`: `Boolean` (default: `true`)
  * `last_synced_at`: `DateTime?` (`TIMESTAMP(6)`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@unique([school_id, student_id])`
  * `@@unique([school_id, external_student_id])`
  * `@@index([school_id])`
  * `@@index([student_id])`
  * `@@index([external_student_id])`
  * `@@index([admission_no])`
  * `@@index([registration_no])`
  * `@@index([class_id])`
  * `@@index([section_id])`
* **Referential Actions:**
  * `school`: `onDelete: Restrict`
  * `class`: `onDelete: SetNull`
  * `section`: `onDelete: SetNull`

---

### 8. `student_imports`
* **Prisma Model:** `StudentImport` (`@@map("student_imports")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `file_name`: `String` (`VARCHAR(255)`)
  * `total_rows`: `Int` (default: `0`)
  * `success_count`: `Int` (default: `0`)
  * `failed_count`: `Int` (default: `0`)
  * `uploaded_by`: `Int` (FK -> `users.id`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
* **Constraints & Indexes:**
  * `@@index([school_id])`
  * `@@index([uploaded_by])`
* **Referential Actions:**
  * `school`: `onDelete: Cascade`
  * `uploader`: `onDelete: Restrict`

---

### 9. `student_import_errors`
* **Prisma Model:** `StudentImportError` (`@@map("student_import_errors")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `import_id`: `Int` (FK -> `student_imports.id`)
  * `row_number`: `Int`
  * `student_id`: `String?` (`VARCHAR(50)`)
  * `email`: `String?` (`VARCHAR(255)`)
  * `name`: `String?` (`VARCHAR(255)`)
  * `error_message`: `String` (`TEXT`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
* **Constraints & Indexes:**
  * `@@index([import_id])`
* **Referential Actions:**
  * `studentImport`: `onDelete: Cascade`

---

### 10. `student_observations`
* **Prisma Model:** `StudentObservation` (`@@map("student_observations")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `student_id`: `Int` (FK -> `students.id`)
  * `submitted_by`: `Int` (FK -> `users.id`)
  * `source`: `String` (`VARCHAR(30)`)
  * `category`: `String` (`VARCHAR(100)`)
  * `observation`: `String` (`TEXT`)
  * `additional_comments`: `String?` (`TEXT`)
  * `status`: `String` (`VARCHAR(30)`, default: `'PENDING'`)
  * `observed_at`: `DateTime` (`DATE`, date-only)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([school_id])`
  * `@@index([student_id])`
  * `@@index([submitted_by])`
* **Referential Actions:**
  * `school`: `onDelete: Restrict`
  * `student`: `onDelete: Cascade`
  * `submitter`: `onDelete: Restrict`

---

### 11. `assessment_templates`
* **Prisma Model:** `AssessmentTemplate` (`@@map("assessment_templates")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `name`: `String` (`VARCHAR(255)`)
  * `description`: `String?` (`TEXT`)
  * `category`: `String` (`VARCHAR(100)`)
  * `estimated_minutes`: `Int?`
  * `status`: `String` (`VARCHAR(20)`, default: `'DRAFT'`)
  * `version`: `String` (`VARCHAR(20)`, default: `'1.0'`)
  * `created_by`: `Int` (FK -> `users.id`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([school_id])`
  * `@@index([created_by])`
* **Referential Actions:**
  * `school`: `onDelete: Restrict`
  * `creator`: `onDelete: Restrict`

---

### 12. `assessment_domains`
* **Prisma Model:** `AssessmentDomain` (`@@map("assessment_domains")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `assessment_template_id`: `Int` (FK -> `assessment_templates.id`)
  * `name`: `String` (`VARCHAR(100)`)
  * `description`: `String?` (`TEXT`)
  * `display_order`: `Int` (default: `0`)
* **Constraints & Indexes:**
  * `@@index([assessment_template_id])`
* **Referential Actions:**
  * `assessmentTemplate`: `onDelete: Cascade`

---

### 13. `assessment_questions`
* **Prisma Model:** `AssessmentQuestion` (`@@map("assessment_questions")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `assessment_template_id`: `Int` (FK -> `assessment_templates.id`)
  * `domain_id`: `Int` (FK -> `assessment_domains.id`)
  * `question_text`: `String` (`TEXT`)
  * `question_type`: `String` (`VARCHAR(50)`, default: `'LIKERT'`)
  * `is_required`: `Boolean` (default: `true`)
  * `display_order`: `Int` (default: `0`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([assessment_template_id])`
  * `@@index([domain_id])`
* **Referential Actions:**
  * `assessmentTemplate`: `onDelete: Cascade`
  * `domain`: `onDelete: Cascade`

---

### 14. `assessment_options`
* **Prisma Model:** `AssessmentOption` (`@@map("assessment_options")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `question_id`: `Int` (FK -> `assessment_questions.id`)
  * `label`: `String` (`VARCHAR(100)`)
  * `value`: `String` (`VARCHAR(100)`)
  * `score`: `Decimal` (`DECIMAL(5,2)`, default: `0.00`)
  * `display_order`: `Int` (default: `0`)
* **Constraints & Indexes:**
  * `@@index([question_id])`
* **Referential Actions:**
  * `question`: `onDelete: Cascade`

---

### 15. `assessment_scoring_rules`
* **Prisma Model:** `AssessmentScoringRule` (`@@map("assessment_scoring_rules")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `assessment_template_id`: `Int` (FK -> `assessment_templates.id`)
  * `scope`: `String` (`VARCHAR(20)`, `'OVERALL'` / `'DOMAIN'`)
  * `domain_id`: `Int?` (FK -> `assessment_domains.id`)
  * `min_score`: `Decimal` (`DECIMAL(5,2)`)
  * `max_score`: `Decimal` (`DECIMAL(5,2)`)
  * `result_label`: `String` (`VARCHAR(100)`)
  * `attention_level`: `String` (`VARCHAR(50)`)
* **Constraints & Indexes:**
  * `@@index([assessment_template_id])`
  * `@@index([domain_id])`
* **Referential Actions:**
  * `assessmentTemplate`: `onDelete: Cascade`
  * `domain`: `onDelete: Cascade`

---

### 16. `student_assessments`
* **Prisma Model:** `StudentAssessment` (`@@map("student_assessments")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `student_id`: `Int` (FK -> `students.id`)
  * `assessment_template_id`: `Int` (FK -> `assessment_templates.id`)
  * `started_at`: `DateTime?` (`TIMESTAMP(6)`)
  * `completed_at`: `DateTime?` (`TIMESTAMP(6)`)
  * `status`: `String` (`VARCHAR(30)`, default: `'DRAFT'`)
  * `overall_score`: `Decimal?` (`DECIMAL(5,2)`)
  * `attention_level`: `String?` (`VARCHAR(50)`)
  * `created_by`: `Int` (FK -> `users.id`)
  * `reviewed_by`: `Int?` (FK -> `users.id`)
  * `reviewed_at`: `DateTime?` (`TIMESTAMP(6)`)
  * `professional_interpretation`: `String?` (`TEXT`)
  * `recommendations`: `String?` (`TEXT`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([school_id])`
  * `@@index([student_id])`
  * `@@index([assessment_template_id])`
  * `@@index([created_by])`
  * `@@index([reviewed_by])`
* **Referential Actions:**
  * `school`: `onDelete: Restrict`
  * `student`: `onDelete: Cascade`
  * `assessmentTemplate`: `onDelete: Restrict`
  * `creator`: `onDelete: Restrict`
  * `reviewer`: `onDelete: SetNull`

---

### 17. `assessment_responses`
* **Prisma Model:** `AssessmentResponse` (`@@map("assessment_responses")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `student_assessment_id`: `Int` (FK -> `student_assessments.id`)
  * `question_id`: `Int` (FK -> `assessment_questions.id`)
  * `selected_option_id`: `Int?` (FK -> `assessment_options.id`)
  * `text_response`: `String?` (`TEXT`)
  * `score`: `Decimal?` (`DECIMAL(5,2)`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
* **Constraints & Indexes:**
  * `@@unique([student_assessment_id, question_id])`
  * `@@index([student_assessment_id])`
  * `@@index([question_id])`
  * `@@index([selected_option_id])`
* **Referential Actions:**
  * `studentAssessment`: `onDelete: Cascade`
  * `question`: `onDelete: Cascade`
  * `selectedOption`: `onDelete: SetNull`

---

### 18. `assessment_domain_results`
* **Prisma Model:** `AssessmentDomainResult` (`@@map("assessment_domain_results")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `student_assessment_id`: `Int` (FK -> `student_assessments.id`)
  * `domain_id`: `Int` (FK -> `assessment_domains.id`)
  * `score`: `Decimal` (`DECIMAL(5,2)`)
  * `max_score`: `Decimal` (`DECIMAL(5,2)`)
  * `result_label`: `String?` (`VARCHAR(100)`)
  * `attention_level`: `String?` (`VARCHAR(50)`)
* **Constraints & Indexes:**
  * `@@unique([student_assessment_id, domain_id])`
  * `@@index([student_assessment_id])`
  * `@@index([domain_id])`
* **Referential Actions:**
  * `studentAssessment`: `onDelete: Cascade`
  * `domain`: `onDelete: Cascade`

---

### 19. `reports`
* **Prisma Model:** `Report` (`@@map("reports")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `school_id`: `Int` (FK -> `schools.id`)
  * `student_id`: `Int?` (FK -> `students.id`)
  * `assessment_id`: `Int?` (FK -> `student_assessments.id`)
  * `report_type`: `String` (`VARCHAR(30)`, `'STUDENT'`, `'CLASS'`, `'GRADE'`)
  * `title`: `String` (`VARCHAR(255)`)
  * `status`: `String` (`VARCHAR(30)`, default: `'DRAFT'`)
  * `class_id`: `Int?` (FK -> `classes.id`)
  * `section_id`: `Int?` (FK -> `sections.id`)
  * `academic_session_id`: `Int?` (FK -> `academic_sessions.id`)
  * `generated_by`: `Int` (FK -> `users.id`)
  * `generated_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `file_url`: `String?` (`VARCHAR(500)`)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
  * `updated_at`: `DateTime` (`TIMESTAMP(6)`, `@updatedAt`)
* **Constraints & Indexes:**
  * `@@index([school_id])`
  * `@@index([student_id])`
  * `@@index([assessment_id])`
  * `@@index([class_id])`
  * `@@index([section_id])`
  * `@@index([academicSessionId])`
  * `@@index([generatedBy])`
* **Referential Actions:**
  * `school`: `onDelete: Restrict`
  * `student`: `onDelete: SetNull`
  * `assessment`: `onDelete: SetNull`
  * `class`: `onDelete: SetNull`
  * `section`: `onDelete: SetNull`
  * `academicSession`: `onDelete: SetNull`
  * `generator`: `onDelete: Restrict`

---

### 20. `report_snapshots`
* **Prisma Model:** `ReportSnapshot` (`@@map("report_snapshots")`)
* **Primary Key:** `id` (`SERIAL` / `Int @id @default(autoincrement())`)
* **Columns:**
  * `id`: `Int` (PK, auto-increment)
  * `report_id`: `Int` (FK -> `reports.id`)
  * `content_json`: `Json` (`JSONB`, immutable report payload)
  * `created_at`: `DateTime` (`TIMESTAMP(6)`, default: `now()`)
* **Constraints & Indexes:**
  * `@@index([report_id])`
* **Referential Actions:**
  * `report`: `onDelete: Cascade`
