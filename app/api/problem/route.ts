import { NextResponse } from "next/server";
import { google } from "googleapis";
import { Readable } from "stream"; // 👈 เพิ่มตรงนี้

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const token = formData.get("token") as string | null;
    if (!token)
      return NextResponse.json(
        { error: "Missing Google token" },
        { status: 401 }
      );

    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: token });
    const drive = google.drive({ version: "v3", auth });
    const sheets = google.sheets({ version: "v4", auth });

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

    // ✅ อัปโหลดรูป
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

        // ✅ ฝังสูตร HYPERLINK + image ที่ใช้ ID จริง
        const formula = fileId
          ? `=HYPERLINK("${link}", image("https://lh3.google.com/u/0/d/${fileId}", 4, 100, 100))`
          : "No File";

        uploadedFiles.push(formula);
      }
    }

    // ✅ เขียนชีต
    const values = [
      [
        "",
        new Date().toLocaleDateString("th-TH"),
        new Date().toLocaleTimeString("th-TH"),
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
    return NextResponse.json(
      { success: false, error: (err as Error).message },
      { status: 500 }
    );
  }
}
