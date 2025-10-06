import { prisma } from "@/lib/prisma";
import type { FuelLog, Vehicle, Shift } from "@prisma/client";

type DailySummary = {
  shiftDate: string; // YYYY-MM-DD
  shift: Shift | null;
  fuelIn: number;
  fuelUsed: number;
  logs: (FuelLog & { vehicle: Vehicle })[];
};

export async function GET() {
  const all = await prisma.fuelLog.findMany({
    include: { vehicle: true },
    orderBy: { date: "asc" },
  });

  const daily: Record<string, DailySummary> = {};

  all.forEach((log) => {
    const baseDate = log.shiftDate ?? log.date; // ถ้า shiftDate ว่าง ใช้ date แทน
    const d = new Date(baseDate).toLocaleDateString("sv-SE", {
      timeZone: "Asia/Bangkok",
    }); // 👉 "2025-10-06"

    const key = `${d}-${log.shift ?? "UNKNOWN"}`;

    if (!daily[key]) {
      daily[key] = {
        shiftDate: d,
        shift: log.shift,
        fuelIn: 0,
        fuelUsed: 0,
        logs: [],
      };
    }
    daily[key].fuelIn += log.fuelIn;
    daily[key].fuelUsed += log.fuelUsed;
    daily[key].logs.push(log);
  });

  return Response.json({ summary: Object.values(daily) });
}
