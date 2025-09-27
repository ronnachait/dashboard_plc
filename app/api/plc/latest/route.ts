import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const latest = await prisma.plcLog.findFirst({
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" }, // 👈 กันกรณี createdAt เท่ากัน
    ],
  });

  if (!latest) {
    return NextResponse.json({ message: "no data" }, { status: 404 });
  }

  return NextResponse.json({
    id: latest.id + "-" + Date.now(), // 👈 ทำให้ unique เสมอ
    pressure: latest.pressure,
    temperature: latest.temperature,
    timestamp: latest.createdAt.toISOString(), // 👈 ใช้ ISO string
  });
}
