import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getToken } from "next-auth/jwt";

const PUBLIC_FILE = /\.(.*)$/;

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // ✅ allow static files และ auth routes
  if (
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon.ico") ||
    PUBLIC_FILE.test(pathname)
  ) {
    return NextResponse.next();
  }

  // ✅ ถ้ามี API key (จาก Pi)
  const apiKey = req.headers.get("x-api-key");
  if (apiKey && apiKey === process.env.PLC_SECRET_KEY) {
    return NextResponse.next();
  }

  // ✅ ถ้าไม่ใช่ Pi → ต้อง login
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  if (!token) {
    const appUrl = process.env.NEXTAUTH_URL || "http://localhost:3000";

    // ใช้ path เดิมจาก req ไม่ใช้ host มั่ว
    const signInUrl = new URL("/auth/login", appUrl);
    signInUrl.searchParams.set("callbackUrl", `${appUrl}${pathname}`);
    return NextResponse.redirect(signInUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"], // ครอบคลุมทุกหน้า
};
