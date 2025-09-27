import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// POST
export async function POST(req: Request) {
  try {
    const { isRunning, alarm, reason } = await req.json();
    await prisma.plcStatus.deleteMany({});
    const status = await prisma.plcStatus.create({
      data: { isRunning, alarm, reason },
    });
    return NextResponse.json({ success: true, status });
  } catch (err: unknown) {
    if (err instanceof Error)
      return NextResponse.json({ error: "DB error" }, { status: 500 });
  }
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
