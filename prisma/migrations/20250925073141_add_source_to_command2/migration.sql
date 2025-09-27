/*
  Warnings:

  - The primary key for the `plcCommand` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `plcCommand` table. All the data in the column will be lost.
  - The `id` column on the `plcCommand` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "public"."plcCommand" DROP CONSTRAINT "plcCommand_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "id",
ADD COLUMN     "id" INTEGER NOT NULL DEFAULT 1,
ALTER COLUMN "status" SET DEFAULT 'PENDING',
ADD CONSTRAINT "plcCommand_pkey" PRIMARY KEY ("id");
