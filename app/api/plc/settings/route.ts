// app/api/plc/settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// GET settings
export async function GET() {
  try {
    const settings = await prisma.plcSetting.findMany({
      orderBy: { sensor: "asc" },
    });

    return NextResponse.json({ success: true, settings });
  } catch (err: unknown) {
    if (err instanceof Error)
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
  }
}
// PUT update
// app/api/plc/settings/route.ts
export async function POST(req: Request) {
  try {
    const body = await req.json();
    // body = { sensor: "P1", maxValue: 7 }

    if (!body.sensor || typeof body.maxValue !== "number") {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const setting = await prisma.plcSetting.upsert({
      where: { sensor: body.sensor },
      update: { maxValue: body.maxValue },
      create: { sensor: body.sensor, maxValue: body.maxValue },
    });

    return NextResponse.json({ success: true, setting });
  } catch (err: unknown) {
    if (err instanceof Error)
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
  }
}
