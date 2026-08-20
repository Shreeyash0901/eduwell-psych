-- AlterTable
ALTER TABLE "schools" ADD COLUMN     "address_line1" VARCHAR(255),
ADD COLUMN     "address_line2" VARCHAR(255),
ADD COLUMN     "city" VARCHAR(100),
ADD COLUMN     "country" VARCHAR(100),
ADD COLUMN     "logo_url" VARCHAR(500),
ADD COLUMN     "phone" VARCHAR(50),
ADD COLUMN     "postal_code" VARCHAR(20),
ADD COLUMN     "state" VARCHAR(100),
ADD COLUMN     "website" VARCHAR(255);

-- CreateTable
CREATE TABLE "school_settings" (
    "id" SERIAL NOT NULL,
    "school_id" INTEGER NOT NULL,
    "default_grading_system" VARCHAR(50),
    "anonymize_exports" BOOLEAN NOT NULL DEFAULT false,
    "require_2fa" BOOLEAN NOT NULL DEFAULT false,
    "timezone" VARCHAR(50) NOT NULL DEFAULT 'UTC',
    "locale" VARCHAR(10) NOT NULL DEFAULT 'en-US',
    "created_at" TIMESTAMP(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(6) NOT NULL,

    CONSTRAINT "school_settings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "school_settings_school_id_key" ON "school_settings"("school_id");

-- AddForeignKey
ALTER TABLE "school_settings" ADD CONSTRAINT "school_settings_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE CASCADE ON UPDATE CASCADE;
