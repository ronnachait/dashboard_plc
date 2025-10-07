/*
  Warnings:

  - A unique constraint covering the columns `[date,shift]` on the table `SensorSummaryBatch` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "SensorSummaryBatch_date_shift_key" ON "public"."SensorSummaryBatch"("date", "shift");
