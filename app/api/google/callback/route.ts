import { google } from "googleapis";
import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { saveGoogleToken } from "@/lib/googleTokenManager";

const BASE_URL = process.env.NEXTAUTH_URL!;

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  const redirectState = url.searchParams.get("state") || "/";

  if (!code) {
    return NextResponse.json({ error: "Missing code" }, { status: 400 });
  }

  // ✅ ต้อง login ก่อน
  const session = await getServerSession();
  if (!session?.user?.email) {
    return NextResponse.redirect(`${BASE_URL}/auth/login?error=NotAuthenticated`);
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    `${BASE_URL}/api/google/callback`
  );

  try {
    const { tokens } = await oauth2Client.getToken(code);

    if (!tokens.access_token) {
      throw new Error("No access token received");
    }

    // ✅ หา userId จาก email
    const { prisma } = await import("@/lib/prisma");
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.redirect(`${BASE_URL}/auth/login?error=UserNotFound`);
    }

    // ✅ บันทึก token ลง database
    await saveGoogleToken(
      user.id,
      tokens.access_token,
      tokens.refresh_token || null,
      tokens.expiry_date
        ? Math.floor((tokens.expiry_date - Date.now()) / 1000)
        : 3600,
      tokens.scope
    );

    console.log("✅ Google token saved for user:", session.user.email);

    // ✅ กลับไปหน้าเดิม (ไม่ต้องส่ง token ใน URL แล้ว)
    return NextResponse.redirect(`${BASE_URL}${redirectState}`);
  } catch (error) {
    console.error("❌ Google OAuth failed:", error);
    return NextResponse.redirect(
      `${BASE_URL}/auth/login?error=GoogleAuthFailed`
    );
  }
}
