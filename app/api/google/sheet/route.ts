import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getValidAccessToken } from "@/lib/googleTokenManager";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date"); // เช่น 21-10-25
  const shift = url.searchParams.get("shift") || "day"; // day / night

  if (!dateParam) {
    return NextResponse.json(
      { error: "Missing date parameter" },
      { status: 400 }
    );
  }

  // ✅ ตรวจสอบ session
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.json(
      { error: "Not authenticated", needAuth: true },
      { status: 401 }
    );
  }

  try {
    // ✅ หา userId และดึง valid token
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }

    const accessToken = await getValidAccessToken(user.id);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });

  const res = await sheets.spreadsheets.values.get({
    spreadsheetId: process.env.NEXT_PUBLIC_SHEET_ID!,
    range: "2_Daily check!B7:AH",
  });

  const rows = res.data.values;
  console.log("rows:", rows);
  if (!rows || rows.length < 1) return NextResponse.json({ error: "No data" });

  // helper: แปลงวันที่ 21-10-25 → 2025-10-21
  const formatDate = (d: string) => {
    const trimmed = String(d).trim();
    const parts = trimmed.split("-");
    
    if (parts.length !== 3) {
      console.warn(`⚠️ Date format error: "${d}" has ${parts.length} parts, expected 3`);
      return ""; // return empty string for invalid format
    }
    
    const [day, month, year] = parts;
    
    // Validate parts
    if (!day || !month || !year) {
      console.warn(`⚠️ Missing date parts in: "${d}"`);
      return "";
    }
    
    // Pad with zeros if needed
    const paddedDay = day.padStart(2, "0");
    const paddedMonth = month.padStart(2, "0");
    const fullYear = year.length === 2 ? `20${year}` : year;
    
    return `${fullYear}-${paddedMonth}-${paddedDay}`;
  };

  const formattedDateParam = formatDate(dateParam);
  
  // ✅ ตรวจสอบว่า dateParam ถูกต้องก่อน
  if (!formattedDateParam) {
    return NextResponse.json(
      { error: `Invalid date format: "${dateParam}". Expected format: DD-MM-YY (e.g., 27-10-25)` },
      { status: 400 }
    );
  }
  
  const targetDate = new Date(formattedDateParam);
  
  if (isNaN(targetDate.getTime())) {
    return NextResponse.json(
      { error: `Cannot parse date: "${dateParam}" -> "${formattedDateParam}"` },
      { status: 400 }
    );
  }

  // สร้างช่วงเวลาแต่ละกะ
  const startDayShift = new Date(`${formattedDateParam}T08:30:00`);
  const endDayShift = new Date(`${formattedDateParam}T20:30:00`);
  const startNightShift = endDayShift;
  const endNightShift = new Date(targetDate);
  endNightShift.setDate(targetDate.getDate() + 1);
  endNightShift.setHours(8, 30, 0, 0);

  // กรองเฉพาะแถวที่อยู่ในช่วงเวลาของกะนั้น ๆ
  // 🕒 กรองเฉพาะแถวของกะที่ต้องการ
  const filtered = rows.filter((r) => {
    const [d, startTime, endTime] = r;
    if (!d || !startTime || !endTime) return false;

    // ✅ ตรวจสอบว่าวันที่และเวลาถูกต้องก่อน
    const dateStr = formatDate(d);
    const timeStr = String(startTime).trim();
    
    // ตรวจสอบว่า dateStr เป็นรูปแบบ YYYY-MM-DD
    if (!/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
      console.warn(`⚠️ Invalid date format: "${d}" -> "${dateStr}"`);
      return false;
    }
    
    // ตรวจสอบว่า timeStr เป็นรูปแบบ HH:MM หรือ H:MM
    if (!/^\d{1,2}:\d{2}$/.test(timeStr)) {
      console.warn(`⚠️ Invalid time format: "${startTime}" for date ${d}`);
      return false;
    }

    // ✅ Pad เวลาให้เป็น HH:MM (เติม 0 ข้างหน้าถ้าเป็นเลขหลักเดียว)
    const [hour, minute] = timeStr.split(":");
    const paddedTime = `${hour.padStart(2, "0")}:${minute}`;

    const start = new Date(`${dateStr}T${paddedTime}:00`);
    
    // ตรวจสอบว่า Date object ที่สร้างขึ้นมาถูกต้อง
    if (isNaN(start.getTime())) {
      console.warn(`⚠️ Invalid Date created: ${dateStr}T${paddedTime}:00 (original: ${timeStr})`);
      return false;
    }

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
      console.log("nightStart:", nightStart);
      console.log("nightEnd:", nightEnd);
      console.log("start:", start);
      return start >= nightStart && start < nightEnd;
    }
  });

  // รวมเวลาทำงานของกะนั้น
  const totalMin = filtered.reduce(
    (sum, r) => sum + parseFloat(r[3] || "0"),
    0
  );
  const totalHr = parseFloat((totalMin / 60).toFixed(2));

  // หาชุดแรกที่เจอในกะนั้นที่มีค่า HYD หรือ E/G
  let firstHyd = "";
  let firstEG = "";
  for (const row of filtered) {
    const hyd = row[31]; // AG = index 32 (เริ่มนับจาก B = 0)
    const eg = row[32]; // AH = index 33
    if (!firstHyd && hyd) firstHyd = hyd;
    if (!firstEG && eg) firstEG = eg;
    if (firstHyd && firstEG) break; // เจอครบแล้วหยุดเลย
  }

    return NextResponse.json({
      date: dateParam,
      shift,
      records: filtered.length,
      totalMinutes: totalMin,
      totalHours: totalHr,
      firstHYD: firstHyd || "-",
      firstEG: firstEG || "-",
    });
  } catch (error) {
    console.error("❌ Google Sheets API error:", error);

    // ถ้า error เกี่ยวกับ token
    if (
      error instanceof Error &&
      (error.message.includes("authenticate") ||
        error.message.includes("invalid_grant"))
    ) {
      return NextResponse.json(
        { error: "Google authentication required", needAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to fetch Google Sheets data" },
      { status: 500 }
    );
  }
}
