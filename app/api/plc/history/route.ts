import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma"; // 👈 ตรงนี้ต้องมีไฟล์ lib/prisma.ts

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = parseInt(searchParams.get("limit") || "50", 10);

    const logs = await prisma.plcLog.findMany({
      orderBy: { createdAt: "desc" },
      take: limit,
    });

    // 🔄 แปลง Date → ISO string
    const result = logs.map((l) => ({
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
