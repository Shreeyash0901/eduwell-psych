-- CreateTable
CREATE TABLE "school_api_audit_logs" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "action" VARCHAR(50) NOT NULL,
    "status" VARCHAR(20) NOT NULL,
    "actor_id" INTEGER NOT NULL,
    "target_identifier" VARCHAR(100),
    "error_message" TEXT,
    "metadata" JSONB,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "school_api_audit_logs_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "school_api_audit_logs_school_id_idx" ON "school_api_audit_logs"("school_id");

-- CreateIndex
CREATE INDEX "school_api_audit_logs_actor_id_idx" ON "school_api_audit_logs"("actor_id");

-- CreateIndex
CREATE INDEX "school_api_audit_logs_action_idx" ON "school_api_audit_logs"("action");

-- CreateIndex
CREATE INDEX "school_api_audit_logs_created_at_idx" ON "school_api_audit_logs"("created_at");

-- AddForeignKey
ALTER TABLE "school_api_audit_logs" ADD CONSTRAINT "school_api_audit_logs_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "school_api_audit_logs" ADD CONSTRAINT "school_api_audit_logs_actor_id_fkey" FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
