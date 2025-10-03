/*
  Warnings:

  - You are about to drop the column `createdAt` on the `FuelLog` table. All the data in the column will be lost.
  - You are about to drop the column `createdAt` on the `Vehicle` table. All the data in the column will be lost.
  - You are about to drop the column `type` on the `Vehicle` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."FuelLog" DROP COLUMN "createdAt",
ALTER COLUMN "fuelIn" DROP DEFAULT,
ALTER COLUMN "fuelUsed" DROP DEFAULT;

-- AlterTable
ALTER TABLE "public"."Vehicle" DROP COLUMN "createdAt",
DROP COLUMN "type";
