import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: params.id },
  });

  return NextResponse.json({ vehicle });
}
