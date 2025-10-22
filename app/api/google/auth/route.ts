import { NextResponse } from "next/server";

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const BASE_URL = process.env.NEXTAUTH_URL!;
const REDIRECT_URI = `${BASE_URL}/api/google/callback`;
const SCOPE = [
  "https://www.googleapis.com/auth/spreadsheets",
  "https://www.googleapis.com/auth/drive.file",
  "https://www.googleapis.com/auth/userinfo.email",
].join(" ");

export async function GET(req: Request) {
  const url = new URL(req.url);
  const redirectPath = url.searchParams.get("redirect") || "/";

  const oauthUrl = `https://accounts.google.com/o/oauth2/v2/auth?response_type=code&client_id=${CLIENT_ID}&redirect_uri=${encodeURIComponent(
    REDIRECT_URI
  )}&scope=${encodeURIComponent(
    SCOPE
  )}&access_type=offline&prompt=consent&state=${encodeURIComponent(
    redirectPath
  )}`;

  console.log("🔗 Redirecting to:", oauthUrl);
  return NextResponse.redirect(oauthUrl);
}
