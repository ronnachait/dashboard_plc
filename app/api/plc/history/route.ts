import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    // 👇 Prisma จะ infer type ให้เอง
    const logs = await prisma.plcLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // ✅ บอก TS ว่า l เป็น typeof logs[number]
    const result = logs.map((l: (typeof logs)[number]) => ({
      ...l,
      createdAt: l.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("❌ GET /api/plc/history error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
