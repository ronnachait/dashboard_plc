/*
  Warnings:

  - You are about to drop the `plcCommand` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."plcCommand";

-- CreateTable
CREATE TABLE "public"."PlcCommand" (
    "id" INTEGER NOT NULL DEFAULT 1,
    "command" TEXT NOT NULL,
    "source" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlcCommand_pkey" PRIMARY KEY ("id")
);
