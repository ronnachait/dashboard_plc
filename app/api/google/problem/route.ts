import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getValidAccessToken } from "@/lib/googleTokenManager";
import { prisma } from "@/lib/prisma";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const dateParam = url.searchParams.get("date");
  const shift = url.searchParams.get("shift") || "day";

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
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const accessToken = await getValidAccessToken(user.id);

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    const sheets = google.sheets({ version: "v4", auth });

    // ✅ เริ่มที่ B9 (ข้อมูลจริง)
    const res = await sheets.spreadsheets.values.get({
      spreadsheetId: process.env.NEXT_PUBLIC_SHEET_ID!,
      range: "4_Problem!B9:P",
    });

    const rows = res.data.values;
    console.log("📄 Total rows fetched:", rows?.length || 0);

    if (!rows || rows.length === 0)
      return NextResponse.json({ error: "No problem data" });

    function formatDate(d: string): string {
      if (d.includes("/")) {
        const parts = d.split("/");
        if (parseInt(parts[0]) > 12) {
          // DD/MM/YYYY
          const [day, month, year] = parts;
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        } else {
          // MM/DD/YYYY
          const [month, day, year] = parts;
          return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
        }
      } else if (d.includes("-")) {
        const [day, month, year] = d.split("-");
        return `20${year}-${month}-${day}`;
      }
      return d;
    }

    const dayStart = new Date(`${formatDate(dateParam)}T08:30:00`);
    const dayEnd = new Date(`${formatDate(dateParam)}T21:00:00`);
    const nightStart = dayEnd;
    const nightEnd = new Date(dayStart);
    nightEnd.setDate(dayStart.getDate() + 1);
    nightEnd.setHours(8, 30, 0, 0);
    const filtered = rows.filter((r, i) => {
      const dateCell = r[0];
      const timeCell = r[1];

      // ❌ ข้ามแถวว่างหรือหัวตาราง
      if (
        !dateCell ||
        !timeCell ||
        dateCell === "วันที่เจอปัญหา" ||
        dateCell === "Registration Date" ||
        String(timeCell).trim() === "-" ||
        String(timeCell).trim() === "--"
      ) {
        console.warn(`⚠️ Skipped row ${i}: invalid or header data ->`, r);
        return false;
      }

      // ✅ แปลงวันที่
      const dateStr = formatDate(dateCell);

      // ✅ แปลงเวลา (รองรับทั้ง text และ number)
      let timeStr = "";
      if (typeof timeCell === "number") {
        // Excel serial (เช่น 0.25 = 06:00)
        const d = new Date((timeCell - 25569) * 86400 * 1000);
        timeStr = d.toISOString().substring(11, 16);
      } else {
        // Text เช่น "6:7", "06:07", "13:42"
        const t = String(timeCell).trim();
        const match = t.match(/^(\d{1,2}):(\d{1,2})/);
        if (!match) {
          console.warn(`⚠️ Invalid time format at row ${i}:`, timeCell);
          return false;
        }
        timeStr = `${match[1].padStart(2, "0")}:${match[2].padStart(2, "0")}`;
      }

      // ✅ สร้าง datetime ปลอดภัย
      const dt = new Date(`${dateStr}T${timeStr}:00`);
      if (isNaN(dt.getTime())) {
        console.warn(`⚠️ Invalid date/time at row ${i}:`, dateCell, timeCell);
        return false;
      }

      console.log(`🧩 Parsed ${dateCell} ${timeCell} -> ${dt.toISOString()}`);

      // ✅ กรองตาม shift
      return shift === "day"
        ? dt >= dayStart && dt < dayEnd
        : dt >= nightStart && dt < nightEnd;
    });

    const problems = filtered.map((r) => ({
      date: r[0],
      time: r[1],
      hour: r[2],
      reporter: r[3],
      section: r[4],
      partNo: r[5],
      partName: r[6],
      status: r[7],
      problemType: r[10],
      action: r[11],
      detail: r[12],
      cause: r[13],
    }));

    console.log("✅ Problems found:", problems.length);

    return NextResponse.json({
      date: dateParam,
      shift,
      records: problems.length,
      problems,
    });
  } catch (error) {
    console.error("❌ Google Problem API error:", error);

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
      { error: "Failed to fetch problem data" },
      { status: 500 }
    );
  }
}
