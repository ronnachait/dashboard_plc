import { prisma } from "@/lib/prisma";
export async function POST(req: Request) {
  try {
    const { command } = await req.json();
    if (!["SET", "RST"].includes(command)) {
      return Response.json({ error: "Invalid command" }, { status: 400 });
    }

    // user ต้องการ run หรือ stop
    const wantRun = command === "SET";

    // ดึง status ปัจจุบัน
    const current = await prisma.plcStatus.findFirst();

    // ถ้ามี alarm ห้าม start
    if (wantRun && current?.alarm) {
      return Response.json(
        { error: "Alarm active, cannot start" },
        { status: 403 }
      );
    }

    const status = await prisma.plcStatus.upsert({
      where: { id: current?.id ?? "plc-status-01" },
      update: { isRunning: wantRun, alarm: false, reason: null },
      create: { id: "plc-status-01", isRunning: wantRun },
    });

    return Response.json({ success: true, status });
  } catch (err) {
    console.error("❌ POST error:", err);
    return Response.json({ error: "Server error" }, { status: 500 });
  }
}
