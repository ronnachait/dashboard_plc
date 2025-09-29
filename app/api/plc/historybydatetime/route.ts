import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);

  const start = searchParams.get("start");
  const end = searchParams.get("end");
  const action = searchParams.get("action");
  const reason = searchParams.get("reason");
  const sortOrder = searchParams.get("sortOrder") === "asc" ? "asc" : "desc";
  const limit = Math.min(parseInt(searchParams.get("limit") || "100", 10), 500);
  const offset = Math.max(parseInt(searchParams.get("offset") || "0", 10), 0);

  if (!start || !end) {
    return NextResponse.json({ error: "missing start/end" }, { status: 400 });
  }

  const startDate = new Date(start);
  const endDate = new Date(end);

  const where: Prisma.PlcLogWhereInput = {
    createdAt: {
      gte: startDate,
      lte: endDate,
    },
  };

  if (action) where.action = action as "OK" | "STOP";

  if (reason && reason.trim() !== "") {
    where.reason = { contains: reason.trim(), mode: "insensitive" };
  }

  try {
    const [logs, totalCount] = await Promise.all([
      prisma.plcLog.findMany({
        where,
        orderBy: { createdAt: sortOrder },
        skip: offset, // ✅ สำคัญ
        take: limit, // ✅ สำคัญ
      }),
      prisma.plcLog.count({ where }),
    ]);

    console.log("➡ Query", { offset, limit, sortOrder, where });

    return NextResponse.json({ data: logs, totalCount });
  } catch (err) {
    console.error("❌ Query failed:", err);
    return NextResponse.json({ error: "query failed" }, { status: 500 });
  }
}
