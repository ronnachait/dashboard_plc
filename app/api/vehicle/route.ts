// app/api/vehicle/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const vehicles = await prisma.vehicle.findMany({
    orderBy: { name: "asc" },
  });
  return Response.json({ vehicles });
}
