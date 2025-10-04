import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params; // 🔑 ต้อง await

  const vehicle = await prisma.vehicle.findUnique({
    where: { id },
  });

  return NextResponse.json({ vehicle });
}
