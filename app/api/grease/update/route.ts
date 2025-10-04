// app/api/grease/update/route.ts
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  const { pointId, currentHour } = await req.json();

  const point = await prisma.greasePoint.findUnique({
    where: { id: pointId },
  });

  if (!point) {
    return Response.json(
      { ok: false, error: "Point not found" },
      { status: 404 }
    );
  }

  const updated = await prisma.greasePoint.update({
    where: { id: pointId },
    data: {
      lastGreaseHour: currentHour,
      nextDueHour: currentHour + point.intervalHours, // ✅ ใช้ intervalHours จาก DB
    },
  });

  return Response.json({ ok: true, point: updated });
}
