-- CreateTable
CREATE TABLE "public"."SensorSummaryBatch" (
    "id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "shift" TEXT,
    "hourMeter" DOUBLE PRECISION,
    "sensors" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "SensorSummaryBatch_pkey" PRIMARY KEY ("id")
);
