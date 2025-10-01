import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const { command } = await req.json();

    if (!["SET", "RST", "RESET"].includes(command)) {
      return Response.json({ error: "Invalid command" }, { status: 400 });
    }

    // ดึงสถานะปัจจุบัน
    const current = await prisma.plcStatus.findFirst();
    const id = current?.id ?? "plc-status-01";

    if (command === "SET") {
      // ❌ ห้าม start ถ้ามี alarm
      if (current?.alarm) {
        return Response.json(
          { error: "Alarm active, cannot start" },
          { status: 403 }
        );
      }

      const status = await prisma.plcStatus.upsert({
        where: { id },
        update: { isRunning: true },
        create: { id, isRunning: true },
      });
      return Response.json({ success: true, status });
    }

    if (command === "RST") {
      const status = await prisma.plcStatus.upsert({
        where: { id },
        update: { isRunning: false },
        create: { id, isRunning: false },
      });
      return Response.json({ success: true, status });
    }

    if (command === "RESET") {
      // ✅ reset alarm เท่านั้น ไม่ยุ่งกับการ run/stop
      const status = await prisma.plcStatus.upsert({
        where: { id },
        update: { alarm: false, reason: null },
        create: { id, isRunning: false, alarm: false },
      });
      return Response.json({ success: true, status });
    }
  } catch (err) {
    console.error("❌ POST error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
