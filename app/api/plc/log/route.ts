import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!Array.isArray(body.pressure) || !Array.isArray(body.temperature)) {
      return NextResponse.json(
        { success: false, error: "Invalid payload" },
        { status: 400 }
      );
    }

    const log = await prisma.plcLog.create({
      data: {
        pressure: body.pressure,
        temperature: body.temperature,
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
