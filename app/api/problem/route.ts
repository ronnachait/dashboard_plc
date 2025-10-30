import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream";
import { getServerSession } from "next-auth";
import { getValidAccessToken } from "@/lib/googleTokenManager";
import { prisma } from "@/lib/prisma";

export async function POST(req: Request) {
  try {
    // ✅ ตรวจสอบ session
    const session = await getServerSession();
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated", needAuth: true },
        { status: 401 }
      );
    }

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
    const drive = google.drive({ version: "v3", auth });
    const sheets = google.sheets({ version: "v4", auth });

    const formData = await req.formData();

    const sheetId = process.env.NEXT_PUBLIC_SHEET_ID!;
    const folderId = process.env.NEXT_PUBLIC_DRIVE_FOLDER_ID!;

    // ✅ สร้างโฟลเดอร์ย่อย
    const folderMeta = {
      name: `Problem-${Date.now()}`,
      mimeType: "application/vnd.google-apps.folder",
      parents: [folderId],
    };
    const folder = await drive.files.create({
      requestBody: folderMeta,
      fields: "id, webViewLink",
    });

    const problemFolderId = folder.data.id!;
    console.log("📁 Created folder:", problemFolderId);

    // ✅ อัปโหลดไฟล์ (รูปภาพและวิดีโอ)
    const uploadedFiles: string[] = [];

    for (const [key, value] of formData.entries()) {
      if (key.startsWith("file_") && value instanceof File) {
        const arrayBuffer = await value.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const fileMeta = {
          name: value.name,
          parents: [problemFolderId],
        };

        const res = await drive.files.create({
          requestBody: fileMeta,
          media: {
            mimeType: value.type,
            body: Readable.from(buffer),
          },
          fields: "id, webViewLink",
        });

        // ✅ ดึง ID ของไฟล์ที่อัปโหลดได้
        const fileId = res.data.id ?? "";
        const link = res.data.webViewLink ?? "";

        // ✅ ตรวจสอบว่าเป็นวิดีโอหรือรูป
        const isVideo = value.type.startsWith('video/');
        
        // ✅ ฝังสูตร - วิดีโอใช้ HYPERLINK อย่างเดียว, รูปใช้ image() + HYPERLINK
        const formula = fileId
          ? isVideo
            ? `=HYPERLINK("${link}", "🎬 ${value.name}")`
            : `=HYPERLINK("${link}", image("https://lh3.google.com/u/0/d/${fileId}", 4, 100, 100))`
          : "No File";

        uploadedFiles.push(formula);
      }
    }

    // ✅ เขียนชีต
    const now = new Date();
    const dateStr = now.toLocaleDateString("en-US"); // MM/DD/YYYY (ค.ศ.)
    const timeStr = now.toLocaleTimeString("en-US", { hour12: false }); // HH:MM:SS (24hr)
    
    const values = [
      [
        "",
        dateStr,
        timeStr,
        formData.get("hour_M_C"),
        formData.get("report_by"),
        formData.get("dept"),
        formData.get("part_num"),
        formData.get("part_name"),
        formData.get("newp"),
        formData.get("part_hr"),
        formData.get("Cycles"),
        formData.get("Classification"),
        formData.get("Status"),
        formData.get("Problems"),
        formData.get("cause"),
        "",
        "",
        ...uploadedFiles,
      ],
    ];

    await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: "4_Problem!A:Z",
      valueInputOption: "USER_ENTERED",
      requestBody: { values },
    });

    return NextResponse.json({
      success: true,
      folder: folder.data.webViewLink,
    });
  } catch (err) {
    console.error("❌ Problem upload error:", err);

    // ถ้า error เกี่ยวกับ token
    if (
      err instanceof Error &&
      (err.message.includes("authenticate") ||
        err.message.includes("invalid_grant"))
    ) {
      return NextResponse.json(
        { success: false, error: "Google authentication required", needAuth: true },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
