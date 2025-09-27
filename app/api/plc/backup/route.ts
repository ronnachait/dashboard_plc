import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { format } from "date-fns";
import { toZonedTime, format as formatTz } from "date-fns-tz";

// ✅ หาตัว type ของ PlcLog อัตโนมัติจาก Prisma
type PlcLog = Awaited<ReturnType<typeof prisma.plcLog.findMany>>[number];

export async function GET() {
  const logs: PlcLog[] = await prisma.plcLog.findMany({
    orderBy: { createdAt: "asc" },
  });

  if (logs.length === 0) {
    return new NextResponse("No PlcLog data found", { status: 404 });
  }

  const minDate = logs[0].createdAt;
  const maxDate = logs[logs.length - 1].createdAt;

  const start = format(minDate, "yyyy-MM-dd");
  const end = format(maxDate, "yyyy-MM-dd");
  const total = logs.length;

  const maxPressureLen = Math.max(...logs.map((l) => l.pressure.length));
  const maxTempLen = Math.max(...logs.map((l) => l.temperature.length));

  const header = [
    "id",
    "createdAt(TH)",
    ...Array.from({ length: maxPressureLen }, (_, i) => `pressure_${i + 1}`),
    ...Array.from({ length: maxTempLen }, (_, i) => `temperature_${i + 1}`),
    "Action",
    "Reason",
  ];

  const timeZone = "Asia/Bangkok";

  const rows = logs.map((log) => {
    const zonedDate = toZonedTime(log.createdAt, timeZone);
    const createdAtTH = formatTz(zonedDate, "dd/MM/yyyy HH:mm:ss", {
      timeZone,
    });

    const pressures = Array.from(
      { length: maxPressureLen },
      (_, i) => log.pressure[i] ?? ""
    );
    const temps = Array.from(
      { length: maxTempLen },
      (_, i) => log.temperature[i] ?? ""
    );

    return [
      log.id,
      createdAtTH,
      ...pressures,
      ...temps,
      log.action,
      `"${log.reason || ""}"`,
    ].join(",");
  });

  const csv = "\uFEFF" + [header.join(","), ...rows].join("\n");

  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="plclog-${start}-to-${end}-${total}rows.csv"`,
    },
  });
}
