-- AlterTable: extend student_observations with display fields used by the Observations UI
ALTER TABLE "student_observations"
    ADD COLUMN "record_number" VARCHAR(50),
    ADD COLUMN "setting" VARCHAR(100),
    ADD COLUMN "incident_time" VARCHAR(50),
    ADD COLUMN "triggers" TEXT,
    ADD COLUMN "interventions" TEXT,
    ADD COLUMN "submitter_name" VARCHAR(100),
    ADD COLUMN "psychologist_notes" TEXT,
    ADD COLUMN "ai_analysis" TEXT;

-- Backfill existing records with generated record numbers for display continuity
UPDATE "student_observations"
SET "record_number" = 'OBS-' || LPAD(CAST("id" AS TEXT), 4, '0')
WHERE "record_number" IS NULL;

-- CreateIndex
CREATE UNIQUE INDEX "student_observations_school_id_record_number_key" ON "student_observations"("school_id", "record_number");