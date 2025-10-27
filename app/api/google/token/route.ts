import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { getValidAccessToken } from "@/lib/googleTokenManager";
import { prisma } from "@/lib/prisma";

/**
 * ✅ API สำหรับดึง Google Access Token ของ User ที่ล็อกอิน
 * - ตรวจสอบ session
 * - ดึง token จาก DB
 * - Auto-refresh ถ้าหมดอายุ
 */
export async function GET() {
  try {
    const session = await getServerSession();

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: "Not authenticated", needAuth: true },
        { status: 401 }
      );
    }

    // หา userId
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

    // ดึง valid token (auto-refresh ถ้าจำเป็น)
    const accessToken = await getValidAccessToken(user.id);

    return NextResponse.json({
      accessToken,
      success: true,
    });
  } catch (error) {
    console.error("❌ Token fetch failed:", error);

    // ถ้า error เป็นเรื่อง authentication
    if (
      error instanceof Error &&
      error.message.includes("authenticate")
    ) {
      return NextResponse.json(
        {
          error: "Google authentication required",
          needAuth: true,
        },
        { status: 401 }
      );
    }

    return NextResponse.json(
      { error: "Failed to get token" },
      { status: 500 }
    );
  }
}

