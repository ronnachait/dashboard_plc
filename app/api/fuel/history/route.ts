// app/api/fuel/history/route.ts
import { prisma } from "@/lib/prisma";

export async function GET() {
  const logs = await prisma.fuelLog.findMany({
    include: { vehicle: true },
    orderBy: { date: "asc" }, // ✅ คำนวณจากเก่าไปใหม่
  });

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

  // ✅ กลับลำดับเพื่อให้แสดงใหม่สุดบนสุด
  logsWithBalance.reverse();

  return Response.json({ logs: logsWithBalance });
}
