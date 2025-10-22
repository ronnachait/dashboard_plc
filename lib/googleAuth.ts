import { google } from "googleapis";

type VerifyResult =
  | { valid: true; email: string; name?: string }
  | { valid: false; error: string };

export async function verifyGoogleToken(token: string): Promise<VerifyResult> {
  if (!token) {
    return { valid: false, error: "Missing Google token" };
  }

  const oauth2Client = new google.auth.OAuth2();
  oauth2Client.setCredentials({ access_token: token });

  try {
    // 🔹 ตรวจสอบ token โดยเรียก userinfo endpoint
    const oauth2 = google.oauth2({
      auth: oauth2Client,
      version: "v2",
    });

    const { data } = await oauth2.userinfo.get();

    if (!data?.email) {
      return { valid: false, error: "Invalid Google credentials" };
    }

    // ✅ token ใช้ได้
    const safeName =
      typeof data.name === "string" && data.name.trim() !== ""
        ? data.name
        : undefined;

    return { valid: true, email: data.email, name: safeName };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown Google auth error";

    console.warn("⚠️ Invalid or expired token:", message);
    return { valid: false, error: message };
  }
}
