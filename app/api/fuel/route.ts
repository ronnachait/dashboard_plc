import { prisma } from "@/lib/prisma";

function getShiftAndShiftDate(date: Date): {
  shift: "MORNING" | "NIGHT";
  shiftDate: Date;
} {
  const h = date.getHours();
  console.log(new Date(date.toDateString()));
  if (h >= 8 && h < 19) {
    // 🌞 กะเช้า (08:00 - 18:59)
    return { shift: "MORNING", shiftDate: new Date(date.toDateString()) };
  } else {
    // 🌙 กะดึก (19:00 - 07:59)
    // ถ้าเวลายังไม่ถึง 08:00 → ให้นับเป็นกะดึกของเมื่อวาน
    const base = h < 8 ? new Date(date.getTime() - 24 * 60 * 60 * 1000) : date;
    return { shift: "NIGHT", shiftDate: new Date(base.toDateString()) };
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { vehicleId, type, amount, note } = body;

    if (!vehicleId || !type || !amount) {
      return Response.json(
        { ok: false, error: "Missing fields" },
        { status: 400 }
      );
    }

    const now = new Date();
    const { shift, shiftDate } = getShiftAndShiftDate(now);

    const log = await prisma.fuelLog.create({
      data: {
        vehicleId,
        fuelIn: type === "IN" ? amount : 0,
        fuelUsed: type === "USED" ? amount : 0,
        note: note ?? null,
        shift,
        shiftDate,
      },
      include: { vehicle: true },
    });

    return Response.json({ ok: true, log });
  } catch (err) {
    console.error("❌ FuelLog POST error:", err);
    return Response.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}
