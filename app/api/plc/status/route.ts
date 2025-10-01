import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
export async function POST(req: Request) {
  const { alarm, reason } = await req.json();

  // ดึง status ปัจจุบัน
  const current = await prisma.plcStatus.findFirst();

  let isRunning = current?.isRunning ?? false;

  if (alarm) {
    // 🚨 ถ้ามี alarm → บังคับ stop
    isRunning = false;
  }

  const status = await prisma.plcStatus.upsert({
    where: { id: current?.id ?? "plc-status-01" },
    update: { isRunning, alarm, reason },
    create: { id: "plc-status-01", isRunning, alarm, reason },
  });

  return Response.json({ success: true, status });
}

// GET
export async function GET() {
  try {
    const lastStatus = await prisma.plcStatus.findFirst({
      orderBy: { updatedAt: "desc" },
    });

    if (!lastStatus) {
      return NextResponse.json({ error: "No status found" }, { status: 404 });
    }

    return NextResponse.json(lastStatus);
  } catch (err: unknown) {
    if (err instanceof Error)
      return NextResponse.json(
        { error: "DB error", details: err.message },
        { status: 500 }
      );
  }
}
