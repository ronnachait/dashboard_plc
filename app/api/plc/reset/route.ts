// app/api/plc/reset/route.ts
export async function POST() {
  try {
    const SECRET_KEY = process.env.PLC_SECRET_KEY!;
    const URL = process.env.DASHBOARD_URL!;
    // 🌍 ดึง ngrok URL ล่าสุดจาก API ในโปรเจกต์เดียวกัน
    const urlRes = await fetch(`${URL}/api/ngrok-url`);
    const { url: PI_SERVER } = await urlRes.json();

    if (!PI_SERVER) {
      return Response.json({ error: "No Pi server URL set" }, { status: 500 });
    }

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
