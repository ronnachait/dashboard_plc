import { NextResponse } from "next/server";
import { verifyGoogleToken } from "@/lib/googleAuth";
type GoogleUserInfo = {
  email?: string;
  name?: string;
  picture?: string;
  error?: string;
};

export async function GET(req: Request) {
  try {
    const url = new URL(req.url);
    const token = url.searchParams.get("token");
    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // ✅ ตรวจสอบ token ก่อน
    const verify = await verifyGoogleToken(token);
    if (!verify.valid) {
      return NextResponse.json(
        { error: "Token expired", reauth: true, loginUrl: "/api/google/auth" },
        { status: 401 }
      );
    }

    // 🔹 ดึงข้อมูล user จาก Google
    const res = await fetch("https://www.googleapis.com/oauth2/v3/userinfo", {
      headers: { Authorization: `Bearer ${token}` },
    });

    // 🔸 token หมดอายุหรือไม่ถูกต้อง
    if (!res.ok) {
      return NextResponse.json(
        { error: "Invalid or expired token" },
        { status: 401 }
      );
    }

    const data: GoogleUserInfo = await res.json();

    // 🔸 ไม่มี email แสดงว่า token ใช้ไม่ได้แน่ ๆ
    if (!data.email) {
      return NextResponse.json(
        { error: "Token invalid: missing email field" },
        { status: 401 }
      );
    }

    // ✅ ส่งข้อมูลกลับ
    return NextResponse.json({
      email: data.email,
      name: data.name ?? "Unknown",
      picture: data.picture ?? null,
    });
  } catch (err) {
    const message =
      err instanceof Error ? err.message : "Unknown error occurred";
    console.error("❌ userinfo error:", message);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
