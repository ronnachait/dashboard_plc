-- CreateEnum
CREATE TYPE "public"."PlanStatus" AS ENUM ('PENDING', 'DONE', 'OVERDUE');

-- CreateEnum
CREATE TYPE "public"."LogStatus" AS ENUM ('DONE', 'SKIPPED');

-- CreateTable
CREATE TABLE "public"."MaintenanceTemplate" (
    "id" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "item" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "intervalHr" INTEGER,
    "note" TEXT,
    "active" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenanceTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenancePlan" (
    "id" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "nextDueHour" DOUBLE PRECISION NOT NULL,
    "lastDoneHour" DOUBLE PRECISION,
    "status" "public"."PlanStatus" NOT NULL DEFAULT 'PENDING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "MaintenancePlan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "public"."MaintenanceLog" (
    "id" TEXT NOT NULL,
    "planId" TEXT NOT NULL,
    "doneAtHour" DOUBLE PRECISION NOT NULL,
    "doneAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "doneBy" TEXT,
    "remarks" TEXT,
    "photoUrl" TEXT,
    "status" "public"."LogStatus" NOT NULL DEFAULT 'DONE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "MaintenanceLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenancePlan" ADD CONSTRAINT "MaintenancePlan_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "public"."MaintenanceTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."MaintenanceLog" ADD CONSTRAINT "MaintenanceLog_planId_fkey" FOREIGN KEY ("planId") REFERENCES "public"."MaintenancePlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;
