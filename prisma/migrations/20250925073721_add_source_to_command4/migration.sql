/*
  Warnings:

  - You are about to drop the `PlcCommand` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."PlcCommand";

-- CreateTable
CREATE TABLE "public"."plcCommand" (
    "id" TEXT NOT NULL,
    "command" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "source" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "plcCommand_pkey" PRIMARY KEY ("id")
);
