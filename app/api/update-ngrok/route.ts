import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  if (req.method === "POST") {
    const { url } = req.body;
    if (!url) {
      return res.status(400).json({ ok: false, error: "Missing url" });
    }

    // อัปเดตหรือสร้างใหม่
    const record = await prisma.ngrokTunnel.upsert({
      where: { id: "ngrok-url" },
      update: { url },
      create: { id: "ngrok-url", url },
    });

    console.log("🌍 Ngrok URL updated:", record.url);
    return res.json({ ok: true, url: record.url });
  }

  return res.status(405).json({ ok: false, error: "Method not allowed" });
}
