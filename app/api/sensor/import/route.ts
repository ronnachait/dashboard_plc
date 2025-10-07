import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { date, shift, hourMeter, summaries } = body;

    // ✅ กันซ้ำ
    const exist = await prisma.sensorSummaryBatch.findFirst({
      where: { date: new Date(date), shift },
    });

    if (exist) {
      return NextResponse.json(
        { error: "ข้อมูลวันที่นี้และกะนี้ถูกบันทึกแล้ว" },
        { status: 400 }
      );
    }

    // ✅ สร้างใหม่
    const record = await prisma.sensorSummaryBatch.create({
      data: {
        date: new Date(date),
        shift,
        hourMeter: parseFloat(hourMeter),
        sensors: summaries,
      },
    });

    return NextResponse.json({ ok: true, record });
  } catch (err) {
    console.error("❌ POST /sensor/import error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}

export async function GET() {
  try {
    const records = await prisma.sensorSummaryBatch.findMany({
      orderBy: { date: "desc" },
    });
    return NextResponse.json({ records });
  } catch (err) {
    console.error("❌ GET /sensor/import error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
