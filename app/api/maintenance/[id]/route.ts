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
