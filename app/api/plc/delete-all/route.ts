import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    await prisma.plcLog.deleteMany();

    return NextResponse.json({ success: true, message: "All PlcLog deleted" });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { success: false, error: "Delete failed" },
      { status: 500 }
    );
  }
}
