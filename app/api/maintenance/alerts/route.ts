import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const plans = await prisma.maintenancePlan.findMany({
      where: {
        status: { not: "DONE" },
      },
      include: {
        vehicle: {
          select: {
            name: true,
            plateNo: true, // ✅ เพิ่มตรงนี้
            lastHourAfterTest: true,
          },
        },
        template: { select: { item: true } },
      },
    });

    // ✅ filter เฉพาะที่มี vehicle และถึงรอบ
    const alerts = plans
      .filter(
        (p) =>
          p.vehicle &&
          (p.vehicle.lastHourAfterTest ?? 0) >= (p.nextDueHour ?? Infinity)
      )
      .map((p) => ({
        id: p.id,
        item: p.template.item,
        nextDueHour: p.nextDueHour,
        vehicleName: p.vehicle?.name ?? "-",
        plateNo: p.vehicle?.plateNo ?? "-", // ✅ เพิ่ม plateNo
      }));

    return NextResponse.json({ alerts });
  } catch (err) {
    console.error("❌ GET /maintenance/alerts error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
