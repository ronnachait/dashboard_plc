// app/api/fuel/history/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.fuelLog.findMany({
    include: { vehicle: true },
    orderBy: { date: "desc" },
  });

  // คำนวณคงเหลือสะสมของแต่ละรถ
  const balanceMap: Record<string, number> = {};
  const logsWithBalance = logs.map((log) => {
    const vid = log.vehicleId;
    if (!balanceMap[vid]) balanceMap[vid] = 0;
    balanceMap[vid] += log.fuelIn - log.fuelUsed;
    return {
      ...log,
      balance: balanceMap[vid],
    };
  });

  return Response.json({ logs: logsWithBalance });
}
