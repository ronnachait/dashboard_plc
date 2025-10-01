import type { NextApiRequest, NextApiResponse } from "next";
import { prisma } from "@/lib/prisma";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const record = await prisma.ngrokTunnel.findUnique({
    where: { id: "ngrok-url" },
  });

  if (!record) {
    return res.status(404).json({ ok: false, error: "No URL available yet" });
  }

  res.json({ ok: true, url: record.url, updatedAt: record.updatedAt });
}
