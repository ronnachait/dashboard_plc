// app/api/grease/[id]/route.ts
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

// ✅ PATCH: Update GreasePoint
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // 👈 ต้องเป็น Promise
) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user.role !== "admin" && session.user.role !== "cdhw-wfh8ogfup")
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params; // 👈 ต้อง await
  const body = await req.json();

  // ป้องกัน vehicleId หลุดมา override โดยไม่ตั้งใจ
  delete body.vehicleId;

  try {
    const updated = await prisma.greasePoint.update({
      where: { id },
      data: body,
    });
    return Response.json(updated);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ PATCH error:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }
}

// ✅ DELETE: Remove GreasePoint
export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);

  if (
    !session ||
    (session.user.role !== "admin" && session.user.role !== "cdhw-wfh8ogfup")
  ) {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  try {
    await prisma.greasePoint.delete({ where: { id } });
    return Response.json({ ok: true });
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ DELETE error:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }
}
