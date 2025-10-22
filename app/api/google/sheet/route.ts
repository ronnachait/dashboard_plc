import { google } from "googleapis";
import { NextResponse } from "next/server";
import { verifyGoogleToken } from "@/lib/googleAuth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const dateParam = url.searchParams.get("date"); // เช่น 21-10-25
  const shift = url.searchParams.get("shift") || "day"; // day / night

  if (!token || !dateParam)
    return NextResponse.json(
      { error: "Missing token or date" },
      { status: 400 }
    );

  // ✅ ตรวจสอบ token ก่อน
  const verify = await verifyGoogleToken(token);
  if (!verify.valid) {
    return NextResponse.json(
      { error: "Token expired", reauth: true, loginUrl: "/api/google/auth" },
      { status: 401 }
    );
  }

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });
  const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.NEXT_PUBLIC_SHEET_ID!,
    range: "2_Daily check!B7:AC",
  });

  const rows = res.data.values;
  console.log("rows:", rows);
  if (!rows || rows.length < 1) return NextResponse.json({ error: "No data" });

  // helper: แปลงวันที่ 21-10-25 → 2025-10-21
  const formatDate = (d: string) => {
    const [day, month, year] = d.split("-");
    return `20${year}-${month}-${day}`;
  };

  const targetDate = new Date(formatDate(dateParam));

  // สร้างช่วงเวลาแต่ละกะ
  const startDayShift = new Date(`${formatDate(dateParam)}T08:30:00`);
  const endDayShift = new Date(`${formatDate(dateParam)}T20:30:00`);
  const startNightShift = endDayShift;
  const endNightShift = new Date(targetDate);
  endNightShift.setDate(targetDate.getDate() + 1);
  endNightShift.setHours(8, 30, 0, 0);

  // กรองเฉพาะแถวที่อยู่ในช่วงเวลาของกะนั้น ๆ
  // 🕒 กรองเฉพาะแถวของกะที่ต้องการ
  const filtered = rows.filter((r) => {
    const [d, startTime, endTime] = r;
    if (!d || !startTime || !endTime) return false;

    const start = new Date(`${formatDate(d)}T${startTime}:00`);

    if (shift === "day") {
      // กะเช้า: 08:30 - 20:30 ของวันนั้น
      return start >= startDayShift && start < endDayShift;
    } else {
      // กะกลางคืน: 20:30 (วันนั้น) - 08:30 (วันถัดไป)
      const nightStart = new Date(`${formatDate(dateParam)}T20:30:00`);
      const nextDay = new Date(targetDate);
      nextDay.setDate(targetDate.getDate() + 1);
      const nightEnd = new Date(
        `${nextDay.toISOString().split("T")[0]}T08:30:00`
      );
      return start >= nightStart && start < nightEnd;
    }
  });

  // รวมเวลาทำงานของกะนั้น
  const totalMin = filtered.reduce(
    (sum, r) => sum + parseFloat(r[3] || "0"),
    0
  );
  const totalHr = parseFloat((totalMin / 60).toFixed(2));

  return NextResponse.json({
    date: dateParam,
    shift,
    records: filtered.length,
    totalMinutes: totalMin,
    totalHours: totalHr,
  });
}
