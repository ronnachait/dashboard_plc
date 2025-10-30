// app/api/maintenance/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const vehicleId = searchParams.get("vehicleId") || undefined;
  const plans = await prisma.maintenancePlan.findMany({
    where: vehicleId ? { vehicleId } : undefined,
    include: { template: true, vehicle: true },
    orderBy: { nextDueHour: "asc" },
  });

  const updates = await Promise.all(
    plans.map(async (plan) => {
      const currentHour = plan.vehicle?.lastHourAfterTest ?? 0;
      const isOverdue =
        currentHour >= plan.nextDueHour && plan.status !== "DONE";

      if (isOverdue && plan.status !== "OVERDUE") {
        await prisma.maintenancePlan.update({
          where: { id: plan.id },
          data: { status: "OVERDUE" },
        });
        plan.status = "OVERDUE";
      }

      return plan;
    })
  );

  return NextResponse.json(updates);
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      vehicleId,
      category,
      item,
      action,
      intervalHr,
      lastDoneHour,
      nextDueHour,
      createdBy,
    } = body;

    // ✅ สร้าง template ใหม่
    const template = await prisma.maintenanceTemplate.create({
      data: {
        category,
        item,
        action,
        intervalHr: Number(intervalHr),
        note: "",
      },
    });

    // ✅ สร้างแผนใหม่ โดยใช้ค่าที่กรอกจากฟอร์ม
    const plan = await prisma.maintenancePlan.create({
      data: {
        vehicleId,
        templateId: template.id,
        lastDoneHour: Number(lastDoneHour ?? 0),
        nextDueHour: Number(nextDueHour ?? 0),
        status: "PENDING",
        createdBy: createdBy ?? "System",
      },
      include: { template: true },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("❌ POST /maintenance error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err) },
      { status: 500 }
    );
  }
}
