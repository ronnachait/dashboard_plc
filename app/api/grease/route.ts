// app/api/grease/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json();
  const { pointId, currentHour } = body;

  const point = await prisma.greasePoint.findUnique({ where: { id: pointId } });
  if (!point)
    return Response.json(
      { ok: false, error: "Point not found" },
      { status: 404 }
    );

  const nextDue = currentHour + point.intervalHours;

  const updated = await prisma.greasePoint.update({
    where: { id: pointId },
    data: {
      lastGreaseHour: currentHour,
      nextDueHour: nextDue,
    },
  });

  return Response.json({ ok: true, point: updated });
}

export async function GET() {
  const points = await prisma.greasePoint.findMany({
    orderBy: { pointNo: "asc" },
    include: {
      vehicle: true, // 👈 ดึงข้อมูล vehicle มาด้วย
    },
  });
  return Response.json({ points });
}
