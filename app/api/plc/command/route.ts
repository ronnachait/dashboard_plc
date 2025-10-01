import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const SECRET_KEY = process.env.PLC_SECRET_KEY!;

    // ✅ รับ command
    const { command } = await req.json();
    if (!["SET", "RST", "RESET"].includes(command)) {
      return Response.json({ error: "Invalid command" }, { status: 400 });
    }

    // ✅ หา ngrok URL ล่าสุด
    const record = await prisma.ngrokTunnel.findUnique({
      where: { id: "ngrok-url" },
    });
    if (!record?.url) {
      return Response.json({ error: "No Pi server URL set" }, { status: 500 });
    }
    const PI_SERVER = record.url;

    // ✅ Map endpoint
    let endpoint = "/plc/start";
    if (command === "RST") endpoint = "/plc/stop";
    if (command === "RESET") endpoint = "/plc/reset";
    console.log("Run Command", `${PI_SERVER}${endpoint}`);
    // ✅ ยิงไปที่ Pi
    const res = await fetch(`${PI_SERVER}${endpoint}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SECRET_KEY,
      },
      body:
        command !== "RESET"
          ? JSON.stringify({ command, source: "WEB" })
          : undefined,
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (err) {
    console.error("❌ Command proxy error:", err);
    return Response.json({ error: "Proxy command failed" }, { status: 500 });
  }
}
