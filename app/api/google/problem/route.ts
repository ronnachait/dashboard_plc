import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const token = url.searchParams.get("token");
  const dateParam = url.searchParams.get("date"); // เช่น 19-10-25
  const shift = url.searchParams.get("shift") || "day"; // day / night

  if (!token || !dateParam)
    return NextResponse.json(
      { error: "Missing token or date" },
      { status: 400 }
    );

  const auth = new google.auth.OAuth2();
  auth.setCredentials({ access_token: token });
  const sheets = google.sheets({ version: "v4", auth });

  // ✅ ดึงข้อมูลจากชีต 4_Problem
  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.NEXT_PUBLIC_SHEET_ID!,
    range: "4_Problem!A9:P",
  });

  const rows = res.data.values;
  if (!rows || rows.length < 1)
    return NextResponse.json({ error: "No problem data" });

  // 🔧 Helper แปลงวันที่ 19-10-25 หรือ 10/19/2025 → YYYY-MM-DD
  const formatDate = (d: string) => {
    if (d.includes("/")) {
      const [month, day, year] = d.split("/");
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    } else if (d.includes("-")) {
      const [day, month, year] = d.split("-");
      return `20${year}-${month}-${day}`;
    }
    return d;
  };

  const targetDate = new Date(formatDate(dateParam));
  const dayStart = new Date(`${formatDate(dateParam)}T08:30:00`);
  const dayEnd = new Date(`${formatDate(dateParam)}T20:30:00`);
  const nightStart = dayEnd;
  const nightEnd = new Date(targetDate);
  nightEnd.setDate(targetDate.getDate() + 1);
  nightEnd.setHours(8, 30, 0, 0);

  // 🧮 กรองเฉพาะปัญหาที่อยู่ในช่วงเวลาของกะ
  const filtered = rows.filter((r) => {
    const dateCell = r[1]; // วันที่
    const timeCell = r[2]; // เวลา เช่น "17:40"
    if (!dateCell || !timeCell) return false;

    const dt = new Date(`${formatDate(dateCell)}T${timeCell}:00`);

    if (shift === "day") {
      return dt >= dayStart && dt < dayEnd;
    } else {
      return dt >= nightStart && dt < nightEnd;
    }
  });

  // 🧩 map ให้อ่านง่าย
  const problems = filtered.map((r) => ({
    date: r[1],
    time: r[2],
    hour: r[3],
    reporter: r[4],
    section: r[5],
    partNo: r[6],
    partName: r[7],
    status: r[8],
    problemType: r[11],
    action: r[12],
    detail: r[13],
    cause: r[14],
  }));

  return NextResponse.json({
    date: dateParam,
    shift,
    records: problems.length,
    problems,
  });
}
