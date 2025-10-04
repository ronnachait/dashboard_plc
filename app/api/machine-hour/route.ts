import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const { vehicleId, beforeTestHour, afterTestHour } = await req.json();

    if (!vehicleId || beforeTestHour == null || afterTestHour == null) {
      return NextResponse.json(
        { ok: false, error: "Missing required fields" },
        { status: 400 }
      );
    }

    // บันทึกลง Vehicle หรือ Log ก็ได้
    const updated = await prisma.vehicle.update({
      where: { id: vehicleId },
      data: {
        lastHourBeforeTest: beforeTestHour,
        lastHourAfterTest: afterTestHour,
      },
    });

    return NextResponse.json({ ok: true, vehicle: updated });
  } catch (err) {
    console.error("❌ Error in grease-hour API:", err);
    return NextResponse.json(
      { ok: false, error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
