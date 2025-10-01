import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { url } = body;
    const secret = req.headers.get("x-api-key");

    if (secret !== process.env.PLC_SECRET_KEY) {
      return NextResponse.json(
        { ok: false, error: "Unauthorized" },
        { status: 401 }
      );
    }

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "Missing url" },
        { status: 400 }
      );
    }

    // 👉 update ถ้ามี, create ถ้าไม่มี
    const record = await prisma.ngrokTunnel.upsert({
      where: { id: "ngrok-url" },
      update: { url },
      create: { id: "ngrok-url", url },
    });

    console.log("🌍 Ngrok URL updated:", record.url);

    return NextResponse.json({
      ok: true,
      url: record.url,
      updatedAt: record.updatedAt,
    });
  } catch (error) {
    console.error("❌ Update ngrok error:", error);
    return NextResponse.json(
      { ok: false, error: "Server error" },
      { status: 500 }
    );
  }
}
