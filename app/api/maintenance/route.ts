// app/api/maintenance/route.ts
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const plans = await prisma.maintenancePlan.findMany({
    include: { template: true, vehicle: true },
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
    const { vehicleId, category, item, action, intervalHr } = body;

    // สร้าง template ใหม่ (หรือจะผูกกับ template เดิมก็ได้)
    const template = await prisma.maintenanceTemplate.create({
      data: {
        category,
        item,
        action,
        intervalHr: Number(intervalHr),
        note: "",
      },
    });

    // สร้าง plan ใหม่
    const plan = await prisma.maintenancePlan.create({
      data: {
        vehicleId,
        templateId: template.id,
        nextDueHour: 0,
        lastDoneHour: 0,
        status: "PENDING",
      },
      include: { template: true },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("❌ POST /maintenance error:", err);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
