import { NextResponse } from "next/server";

export async function GET() {
  // mock pressure 3 ตัว
  const pressure = Array.from({ length: 3 }, () => 3 + Math.random() * 5);
  // mock temp 6 ตัว
  const temperature = Array.from({ length: 6 }, () => 20 + Math.random() * 100);

  return NextResponse.json({
    pressure: pressure.map((p) => Number(p.toFixed(2))),
    temperature: temperature.map((t) => Number(t.toFixed(2))),
    timestamp: new Date().toISOString(),
  });
}
