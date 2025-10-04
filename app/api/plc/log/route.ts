import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();

    // ✅ Extract data จาก payload ใหม่
    const cylinderTemps = body.cylinder?.temperature ?? [];
    const chopperTemps = body.chopper?.temperature ?? [];
    const pressures = body.chopper?.pressure ?? [];

    // ✅ รวมอุณหภูมิทั้งหมด (Cylinder + Chopper)
    const temperatures = [...cylinderTemps, ...chopperTemps];

    if (!Array.isArray(pressures) || !Array.isArray(temperatures)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const log = await prisma.plcLog.create({
      data: {
        pressure: pressures,
        temperature: temperatures,
        action: body.action ?? "OK",
        reason: Array.isArray(body.reason)
          ? body.reason.join(", ")
          : body.reason ?? null,
      },
    });

    return NextResponse.json({ success: true, log });
  } catch (err: unknown) {
    if (err instanceof Error) {
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
    }
  }
}

// GET = ดึง logs ล่าสุด
export async function GET() {
  try {
    const logs = await prisma.plcLog.findMany({
      orderBy: { createdAt: "desc" },
      take: 50,
    });

    return NextResponse.json(logs);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ Error fetching logs:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}
