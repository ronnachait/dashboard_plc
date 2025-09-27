-- CreateTable
CREATE TABLE "public"."PlcLog" (
    "id" SERIAL NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "pressure" DOUBLE PRECISION[],
    "temperature" DOUBLE PRECISION[],

    CONSTRAINT "PlcLog_pkey" PRIMARY KEY ("id")
);
