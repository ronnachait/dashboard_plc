-- CreateTable
CREATE TABLE "public"."PlcSetting" (
    "id" TEXT NOT NULL,
    "sensor" TEXT NOT NULL,
    "maxValue" DOUBLE PRECISION NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PlcSetting_pkey" PRIMARY KEY ("id")
);
