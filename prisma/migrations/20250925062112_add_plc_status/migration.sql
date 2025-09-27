-- CreateTable
CREATE TABLE "public"."PlcStatus" (
    "id" TEXT NOT NULL,
    "isRunning" BOOLEAN NOT NULL DEFAULT false,
    "alarm" BOOLEAN NOT NULL DEFAULT false,
    "reason" TEXT,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlcStatus_pkey" PRIMARY KEY ("id")
);
