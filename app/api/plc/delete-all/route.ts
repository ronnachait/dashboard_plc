import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    // 🧹 1. ลบข้อมูลทั้งหมด
    await prisma.plcLog.deleteMany();

    // 🧽 2. บีบขนาด table (คืนพื้นที่ใน disk)
    await prisma.$executeRawUnsafe(`VACUUM FULL ANALYZE public."PlcLog";`);

    return NextResponse.json({
      success: true,
      message: "All PlcLog deleted and table vacuumed",
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Delete or vacuum failed" },
      { status: 500 }
    );
  }
}
