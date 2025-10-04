-- CreateTable
CREATE TABLE "public"."GreasePoint" (
    "id" TEXT NOT NULL,
    "pointNo" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "fittings" INTEGER NOT NULL,
    "intervalHours" INTEGER NOT NULL,
    "lastGreaseHour" INTEGER NOT NULL,
    "nextDueHour" INTEGER NOT NULL,
    "detail" TEXT,
    "vehicleId" TEXT NOT NULL,

    CONSTRAINT "GreasePoint_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "public"."GreasePoint" ADD CONSTRAINT "GreasePoint_vehicleId_fkey" FOREIGN KEY ("vehicleId") REFERENCES "public"."Vehicle"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
