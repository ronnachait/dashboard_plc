/*
  Warnings:

  - A unique constraint covering the columns `[vehicleId,templateId]` on the table `MaintenancePlan` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "MaintenancePlan_vehicleId_templateId_key" ON "public"."MaintenancePlan"("vehicleId", "templateId");
