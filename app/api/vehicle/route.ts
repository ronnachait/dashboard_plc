// app/api/vehicle/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const vehicles = await prisma.vehicle.findMany({
      orderBy: { name: "asc" },
    });
    return NextResponse.json({ vehicles });
  } catch (err) {
    console.error("Error fetching vehicles:", err);
    return NextResponse.json(
      { error: "Failed to fetch vehicles" },
      { status: 500 }
    );
  }
}
