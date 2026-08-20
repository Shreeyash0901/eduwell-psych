-- AlterTable: Make school_id nullable to support SUPER_ADMIN (no school)
ALTER TABLE "users" ALTER COLUMN "school_id" DROP NOT NULL;

-- AddConstraint: Enforce SUPER_ADMIN <=> school_id IS NULL invariant.
-- SUPER_ADMIN must have school_id = NULL.
-- Every other role must have a non-null school_id.
-- This cannot be bypassed by application code.
ALTER TABLE "users" ADD CONSTRAINT "users_role_school_check"
  CHECK (
    (role = 'SUPER_ADMIN' AND school_id IS NULL) OR
    (role <> 'SUPER_ADMIN' AND school_id IS NOT NULL)
  );

-- CreateTable
CREATE TABLE "system_audit_logs" (
    "id" SERIAL NOT NULL,
    "actor_user_id" INTEGER NOT NULL,
    "action" VARCHAR(100) NOT NULL,
    "target_type" VARCHAR(50),
    "target_id" INTEGER,
    "target_school_id" INTEGER,
    "metadata" JSONB NOT NULL DEFAULT '{}',
    "request_id" VARCHAR(100),
    "outcome" VARCHAR(20) NOT NULL DEFAULT 'SUCCESS',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "system_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "system_audit_logs_actor_user_id_idx" ON "system_audit_logs"("actor_user_id");

-- CreateIndex
CREATE INDEX "system_audit_logs_target_school_id_idx" ON "system_audit_logs"("target_school_id");

-- CreateIndex
CREATE INDEX "system_audit_logs_created_at_idx" ON "system_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "system_audit_logs" ADD CONSTRAINT "system_audit_logs_actor_user_id_fkey" FOREIGN KEY ("actor_user_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "system_audit_logs" ADD CONSTRAINT "system_audit_logs_target_school_id_fkey" FOREIGN KEY ("target_school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

