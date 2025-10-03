-- CreateEnum
CREATE TYPE "public"."Shift" AS ENUM ('MORNING', 'NIGHT');

-- AlterTable
ALTER TABLE "public"."FuelLog" ADD COLUMN     "shift" "public"."Shift";
