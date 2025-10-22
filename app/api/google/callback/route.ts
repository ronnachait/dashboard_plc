import { google } from "googleapis";
import { NextResponse } from "next/server";
const BASE_URL = process.env.NEXTAUTH_URL!;
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectState = url.searchParams.get("state") || "/"; // path เดิมที่แนบมา

  if (!code)
    return NextResponse.json({ error: "Missing code" }, { status: 400 });

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${BASE_URL}/api/google/callback` // ✅ ใช้ BASE_URL
  );

  const { tokens } = await oauth2Client.getToken(code);
  oauth2Client.setCredentials(tokens);

  // ✅ กลับไปหน้าเดิมพร้อม token
  const redirectUrl = new URL(`${BASE_URL}${redirectState}`);
  redirectUrl.searchParams.set("token", tokens.access_token || "");

  return NextResponse.redirect(redirectUrl.toString());
}
