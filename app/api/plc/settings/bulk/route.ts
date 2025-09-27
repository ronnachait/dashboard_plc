// app/api/plc/settings/bulk/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    // body = [{sensor:"P1",maxValue:6}, {sensor:"T1",maxValue:80}]

    if (!Array.isArray(body)) {
      return NextResponse.json(
        { success: false, error: "Payload must be an array" },
        { status: 400 }
      );
    }

    const updates = await Promise.all(
      body.map((s) =>
        prisma.plcSetting.upsert({
          where: { sensor: s.sensor },
          update: { maxValue: s.maxValue },
          create: { sensor: s.sensor, maxValue: s.maxValue },
        })
      )
    );

    return NextResponse.json({ success: true, settings: updates });
  } catch (err: unknown) {
    if (err instanceof Error)
      return NextResponse.json(
        { success: false, error: err.message },
        { status: 500 }
      );
  }
}
