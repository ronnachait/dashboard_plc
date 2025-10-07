import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    const { currentHour, doneBy } = await req.json(); // ✅ เพิ่ม doneBy ใน body ด้วย

    // 🔹 ดึงข้อมูล plan พร้อม template ก่อน
    const oldPlan = await prisma.maintenancePlan.findUnique({
      where: { id },
      include: { template: true },
    });

    if (!oldPlan)
      return NextResponse.json({ error: "Plan not found" }, { status: 404 });

    const interval = oldPlan.template?.intervalHr ?? 100;

    // ✅ update แผนใหม่
    const plan = await prisma.maintenancePlan.update({
      where: { id },
      data: {
        lastDoneHour: currentHour,
        nextDueHour: currentHour + interval,
        status: "DONE",
      },
      include: { template: true },
    });

    // ✅ log บันทึกข้อมูลคนทำ
    await prisma.maintenanceLog.create({
      data: {
        planId: plan.id,
        doneAtHour: currentHour,
        doneBy: doneBy ?? "System", // 👈 ถ้าไม่ส่งมา จะ fallback เป็น "System"
        remarks: "บันทึกจากหน้า Dashboard",
        status: "DONE",
      },
    });

    return NextResponse.json({ ok: true, plan });
  } catch (err) {
    console.error("❌ PUT /maintenance/:id error:", err);
    return NextResponse.json(
      { error: "Internal Server Error", details: String(err) },
      { status: 500 }
    );
  }
}

// PATCH (แก้ไข)
export async function PATCH(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const body = await req.json();
    const { category, item, action, intervalHr } = body;

    const updated = await prisma.maintenancePlan.update({
      where: { id: params.id },
      data: {
        template: {
          update: {
            category,
            item,
            action,
            intervalHr: Number(intervalHr),
          },
        },
      },
      include: { template: true },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error("❌ PATCH /maintenance error:", err);
    return NextResponse.json({ error: "Update failed" }, { status: 500 });
  }
}

// DELETE (ลบ)
export async function DELETE(
  _: Request,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.maintenancePlan.delete({ where: { id: params.id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("❌ DELETE /maintenance error:", err);
    return NextResponse.json({ error: "Delete failed" }, { status: 500 });
  }
}
