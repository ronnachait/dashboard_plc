import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ⚠️ ต้องใช้ raw query เพื่อดึง size ของ table
export async function GET() {
  try {
    const count = await prisma.plcLog.count();

    // ใช้ raw SQL หา table size
    const result = await prisma.$queryRaw<
      { size: bigint }[]
    >`SELECT pg_total_relation_size('public."PlcLog"') as size`;

    const size = Number(result[0]?.size ?? 0);

    return NextResponse.json({ count, size });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed to get stats" }, { status: 500 });
  }
}
