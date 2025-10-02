// app/api/pi/status/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  // 🔎 ดึง ngrok URL ล่าสุดจาก DB
  const record = await prisma.ngrokTunnel.findUnique({
    where: { id: "ngrok-url" },
  });

  if (!record?.url) {
    return Response.json({ error: "No Pi server URL set" }, { status: 500 });
  }

  const PI_SERVER = record.url;

  try {
    // 📡 ยิงไปเช็คที่ Pi (Pi ต้องมี endpoint /pi/status)
    const res = await fetch(`${PI_SERVER}/pi/status`, {
      headers: { "x-api-key": process.env.PLC_SECRET_KEY || "D8BB2CA8E5EA8" },
    });

    if (!res.ok) throw new Error(`Pi responded ${res.status}`);
    const data = await res.json();

    return Response.json(data);
  } catch (err: unknown) {
    if (err instanceof Error)
      console.error("❌ Error fetching Pi status:", err.message);
    return Response.json({ error: "Failed to connect Pi" }, { status: 502 });
  }
}
