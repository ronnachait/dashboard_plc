import { google } from "googleapis";
import { prisma } from "./prisma";

const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_CLIENT_ID!,
  process.env.GOOGLE_CLIENT_SECRET!,
  `${process.env.NEXTAUTH_URL}/api/google/callback`
);

/**
 * บันทึก/อัพเดท Google Token ในฐานข้อมูล
 */
export async function saveGoogleToken(
  userId: string,
  accessToken: string,
  refreshToken: string | null,
  expiresIn: number, // seconds
  scope?: string
) {
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  await prisma.googleToken.upsert({
    where: { userId },
    create: {
      userId,
      accessToken,
      refreshToken,
      expiresAt,
      scope: scope || null,
    },
    update: {
      accessToken,
      ...(refreshToken && { refreshToken }),
      expiresAt,
      scope: scope || null,
    },
  });
}

/**
 * ดึง Token ของ User
 */
export async function getGoogleToken(userId: string) {
  return await prisma.googleToken.findUnique({
    where: { userId },
  });
}

/**
 * ตรวจสอบว่า Token หมดอายุหรือยัง (เผื่อไว้ 5 นาที)
 */
export function isTokenExpired(expiresAt: Date): boolean {
  const bufferMs = 5 * 60 * 1000; // 5 minutes
  return new Date(expiresAt).getTime() - bufferMs < Date.now();
}

/**
 * Refresh Access Token โดยใช้ Refresh Token
 */
export async function refreshAccessToken(userId: string) {
  const tokenData = await getGoogleToken(userId);
  
  if (!tokenData?.refreshToken) {
    throw new Error("No refresh token available");
  }

  oauth2Client.setCredentials({
    refresh_token: tokenData.refreshToken,
  });

  try {
    const { credentials } = await oauth2Client.refreshAccessToken();
    
    if (!credentials.access_token) {
      throw new Error("Failed to refresh access token");
    }

    // บันทึก token ใหม่
    await saveGoogleToken(
      userId,
      credentials.access_token,
      credentials.refresh_token || tokenData.refreshToken,
      credentials.expiry_date
        ? Math.floor((credentials.expiry_date - Date.now()) / 1000)
        : 3600,
      credentials.scope
    );

    return credentials.access_token;
  } catch (error) {
    console.error("❌ Failed to refresh token:", error);
    // ถ้า refresh ไม่ได้ → ลบ token เก่าออก
    await prisma.googleToken.delete({
      where: { userId },
    }).catch(() => {});
    
    throw new Error("Token refresh failed - please re-authenticate");
  }
}

/**
 * ดึง Access Token ที่ใช้งานได้ (auto-refresh ถ้าหมดอายุ)
 */
export async function getValidAccessToken(userId: string): Promise<string> {
  const tokenData = await getGoogleToken(userId);

  if (!tokenData) {
    throw new Error("No Google token found - please authenticate");
  }

  // ถ้ายังไม่หมดอายุ → ใช้ได้เลย
  if (!isTokenExpired(tokenData.expiresAt)) {
    return tokenData.accessToken;
  }

  // ถ้าหมดอายุแล้ว → refresh
  console.log("🔄 Token expired, refreshing...");
  return await refreshAccessToken(userId);
}

/**
 * ลบ Token ของ User (สำหรับ logout)
 */
export async function deleteGoogleToken(userId: string) {
  await prisma.googleToken.delete({
    where: { userId },
  }).catch(() => {});
}

/**
 * ตรวจสอบ Token โดยเรียก Google API
 */
export async function verifyGoogleToken(accessToken: string) {
  try {
    oauth2Client.setCredentials({ access_token: accessToken });
    const oauth2 = google.oauth2({ auth: oauth2Client, version: "v2" });
    const { data } = await oauth2.userinfo.get();

    if (!data?.email) {
      return { valid: false, error: "Invalid token" };
    }

    return {
      valid: true,
      email: data.email,
      name: data.name || undefined,
    };
  } catch (error) {
    console.warn("⚠️ Token verification failed:", error);
    return {
      valid: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}

