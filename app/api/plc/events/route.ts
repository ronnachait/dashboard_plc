// app/api/plc/events/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  // ✅ หา ngrok URL ล่าสุดจาก DB
  const record = await prisma.ngrokTunnel.findUnique({
    where: { id: "ngrok-url" },
  });

  if (!record?.url) {
    return new Response(JSON.stringify({ error: "No Pi server URL set" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  const PI_SERVER = record.url;
  const SECRET_KEY = process.env.PLC_SECRET_KEY || "D8BB2CA8E5EA8";

  // ✅ proxy ไปยัง Pi server ผ่าน ngrok พร้อมส่ง API key
  const upstream = await fetch(`${PI_SERVER}/plc/events`, {
    headers: {
      Accept: "text/event-stream",
      "x-api-key": SECRET_KEY,
    },
  });
  console.log("upstream.ok", upstream.ok);
  if (!upstream.ok) {
    return new Response(
      JSON.stringify({ error: `Pi server error: ${upstream.status}` }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }

  return new Response(upstream.body, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}
