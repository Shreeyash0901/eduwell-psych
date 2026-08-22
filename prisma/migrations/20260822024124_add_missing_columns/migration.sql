-- AlterTable
ALTER TABLE "student_assessments" ADD COLUMN     "due_date" DATE,
ADD COLUMN     "instructions" TEXT,
ADD COLUMN     "observation_id" INTEGER,
ADD COLUMN     "respondent_type" VARCHAR(50);

-- CreateTable
CREATE TABLE "staff_invitations" (
    "id" SERIAL NOT NULL,
    "token" VARCHAR(100) NOT NULL,
    "school_id" INTEGER NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "role" VARCHAR(30) NOT NULL DEFAULT 'TEACHER',
    "status" VARCHAR(20) NOT NULL DEFAULT 'PENDING',
    "invited_by" INTEGER NOT NULL,
    "invited_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(6) NOT NULL,
    "accepted_at" TIMESTAMP(6),

    CONSTRAINT "staff_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "staff_invitations_token_key" ON "staff_invitations"("token");

-- CreateIndex
CREATE INDEX "staff_invitations_school_id_idx" ON "staff_invitations"("school_id");

-- CreateIndex
CREATE INDEX "staff_invitations_token_idx" ON "staff_invitations"("token");

-- CreateIndex
CREATE INDEX "staff_invitations_email_idx" ON "staff_invitations"("email");

-- CreateIndex
CREATE INDEX "student_assessments_observation_id_idx" ON "student_assessments"("observation_id");

-- AddForeignKey
ALTER TABLE "student_assessments" ADD CONSTRAINT "student_assessments_observation_id_fkey" FOREIGN KEY ("observation_id") REFERENCES "student_observations"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "staff_invitations" ADD CONSTRAINT "staff_invitations_invited_by_fkey" FOREIGN KEY ("invited_by") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
