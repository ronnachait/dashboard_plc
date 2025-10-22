import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import type { FuelLog } from "@prisma/client";

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const dateParam = url.searchParams.get("date"); // YYYY-MM-DD
    const shift = (url.searchParams.get("shift") as "day" | "night") || "day";
    const vehicleId = url.searchParams.get("vehicleId") || undefined;

    if (!dateParam) {
      return NextResponse.json({ error: "Missing date" }, { status: 400 });
    }

    const baseDate = new Date(dateParam);

    // ✅ ช่วงเวลาแต่ละกะ
    const startDayShift = new Date(`${dateParam}T08:30:00`);
    const endDayShift = new Date(`${dateParam}T20:30:00`);

    const startNightShift = new Date(`${dateParam}T20:30:00`);
    const endNightShift = new Date(baseDate);
    endNightShift.setDate(baseDate.getDate() + 1);
    endNightShift.setHours(8, 30, 0, 0);

    // ✅ สร้างช่วงเวลา query
    const range: { gte: Date; lt: Date } =
      shift === "day"
        ? { gte: startDayShift, lt: endDayShift }
        : { gte: startNightShift, lt: endNightShift };

    // ✅ where เงื่อนไขแบบ type-safe
    const where: {
      date: typeof range;
      vehicleId?: string;
    } = { date: range };

    if (vehicleId) where.vehicleId = vehicleId;

    // ✅ ดึงข้อมูลจาก Prisma
    const logs: FuelLog[] = await prisma.fuelLog.findMany({
      where,
      orderBy: { date: "asc" },
    });

    if (logs.length === 0) {
      return NextResponse.json({
        message: "No logs found",
        fuelIn: 0,
        fuelUsed: 0,
      });
    }

    // ✅ รวมผลลัพธ์ทั้งกะ
    const totalFuelIn = logs.reduce((sum, l) => sum + (l.fuelIn ?? 0), 0);
    const totalFuelUsed = logs.reduce((sum, l) => sum + (l.fuelUsed ?? 0), 0);

    // ✅ สร้าง response type-safe
    const response = {
      date: dateParam,
      shift,
      records: logs.length,
      fuelIn: Number(totalFuelIn.toFixed(2)),
      fuelUsed: Number(totalFuelUsed.toFixed(2)),
      logs,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("❌ fuel/log error:", err);
    if (err instanceof Error) {
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 500 });
  }
}
