/*
  Warnings:

  - A unique constraint covering the columns `[sensor]` on the table `PlcSetting` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "PlcSetting_sensor_key" ON "public"."PlcSetting"("sensor");
