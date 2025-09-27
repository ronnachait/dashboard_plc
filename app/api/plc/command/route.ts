import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { command, source } = body;

    if (!["SET", "RST"].includes(command)) {
      return Response.json({ error: "Invalid command" }, { status: 400 });
    }

    // 🔹 ลบคำสั่งเก่า
    await prisma.plcCommand.deleteMany({});

    // 🔹 สร้างคำสั่งใหม่
    const newCommand = await prisma.plcCommand.create({
      data: {
        id: "ws-server-01",
        command,
        source: source || "WEB",
        status: "PENDING",
      },
    });

    // 🔹 ยิงไป relay server ให้มัน broadcast ต่อ
    await fetch("http://localhost:8091/broadcast", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event: "NEW_COMMAND",
        payload: { id: newCommand.id },
      }),
    });

    return Response.json(newCommand);
  } catch (err: unknown) {
    if (err instanceof Error) {
      console.error("❌ POST command error:", err);
      return Response.json({ error: err.message }, { status: 500 });
    }
  }
}
