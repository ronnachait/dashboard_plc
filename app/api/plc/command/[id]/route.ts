import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

// ✅ GET: อ่าน command ตาม id
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const command = await prisma.plcCommand.findUnique({
      where: { id },
    });

    if (!command) {
      return NextResponse.json({ error: "Command not found" }, { status: 404 });
    }

    return NextResponse.json(command);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ GET command error:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}

// ✅ PUT: อัปเดต command (เช่น เปลี่ยนเป็น DONE)
export async function PUT(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  try {
    const body = await req.json();

    // อนุญาตเฉพาะบาง field
    const { status } = body as { status?: "PENDING" | "DONE" | "FAILED" };

    if (!status) {
      return NextResponse.json({ error: "Missing status" }, { status: 400 });
    }

    const command = await prisma.plcCommand.update({
      where: { id },
      data: { status },
    });

    return NextResponse.json(command);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ PUT command error:", err);
      return NextResponse.json({ error: err.message }, { status: 500 });
    }
  }
}
