-- CreateTable
CREATE TABLE "teacher_class_access" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "class_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_class_access_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "teacher_section_access" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "section_id" INTEGER NOT NULL,
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "teacher_section_access_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "teacher_class_access_user_id_idx" ON "teacher_class_access"("user_id");

-- CreateIndex
CREATE INDEX "teacher_class_access_class_id_idx" ON "teacher_class_access"("class_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_class_access_user_id_class_id_key" ON "teacher_class_access"("user_id", "class_id");

-- CreateIndex
CREATE INDEX "teacher_section_access_user_id_idx" ON "teacher_section_access"("user_id");

-- CreateIndex
CREATE INDEX "teacher_section_access_section_id_idx" ON "teacher_section_access"("section_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_section_access_user_id_section_id_key" ON "teacher_section_access"("user_id", "section_id");

-- AddForeignKey
ALTER TABLE "teacher_class_access" ADD CONSTRAINT "teacher_class_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_class_access" ADD CONSTRAINT "teacher_class_access_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_section_access" ADD CONSTRAINT "teacher_section_access_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_section_access" ADD CONSTRAINT "teacher_section_access_section_id_fkey" FOREIGN KEY ("section_id") REFERENCES "sections"("id") ON DELETE CASCADE ON UPDATE CASCADE;
