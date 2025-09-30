import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const latest = await prisma.plcLog.findFirst({
    orderBy: [
      { createdAt: "desc" },
      { id: "desc" }, // กันกรณี createdAt เท่ากัน
    ],
  });

  if (!latest) {
    return NextResponse.json({ message: "no data" }, { status: 404 });
  }

  return NextResponse.json({
    id: latest.id, // ✅ ใช้ id จริงจาก DB
    pressure: latest.pressure,
    temperature: latest.temperature,
    timestamp: latest.createdAt.toISOString(), // ISO string
    fetchTime: Date.now(), // ✅ debug ได้ แต่ไม่ใช้เทียบ
  });
}
