-- CreateTable
CREATE TABLE "public"."GreaseLog" (
    "id" TEXT NOT NULL,
    "greasePointId" TEXT NOT NULL,
    "vehicleId" TEXT NOT NULL,
    "shift" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hourMeter" DOUBLE PRECISION,
    "createdBy" TEXT,
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "GreaseLog_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."GreaseLog" ADD CONSTRAINT "GreaseLog_greasePointId_fkey" FOREIGN KEY ("greasePointId") REFERENCES "public"."GreasePoint"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."GreaseLog" ADD CONSTRAINT "GreaseLog_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
