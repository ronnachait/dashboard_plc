// app/api/plc/reset/route.ts
import { prisma } from "@/lib/prisma";

export async function POST() {
  try {
    const SECRET_KEY = process.env.PLC_SECRET_KEY!;

    // 🔎 ดึง ngrok URL ล่าสุดตรงจาก DB
    const record = await prisma.ngrokTunnel.findUnique({
      where: { id: "ngrok-url" },
    });

    if (!record?.url) {
      return Response.json({ error: "No Pi server URL set" }, { status: 500 });
    }

    const PI_SERVER = record.url;

    // ✅ ยิงไปที่ Pi
    const res = await fetch(`${PI_SERVER}/plc/reset`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": SECRET_KEY,
      },
    });

    if (!res.ok) {
      const text = await res.text();
      return Response.json({ error: text }, { status: res.status });
    }

    const data = await res.json();
    return Response.json({ success: true, data });
  } catch (err: unknown) {
    console.error("❌ Reset proxy error:", err);
    return Response.json({ error: "Proxy reset failed" }, { status: 500 });
  }
}
