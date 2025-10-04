import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FloatingMenuWrapper from "@/components/FloatingMenuWrapper";
import { Toaster } from "sonner";
import Providers from "./providers";
import DesktopMenu from "@/components/DesktopMenu";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Dashboard Bench Test",
  description: "Real-time PLC & Fuel Monitoring System",
  metadataBase: new URL("https://dashboard-benchtest.azurewebsites.net"), // ✅ base URL ของ production
  icons: {
    icon: "/favicon.ico", // ✅ วางไฟล์ favicon.ico ไว้ใน public/
    shortcut: "/favicon.ico",
    apple: "/apple-touch-icon.png", // ✅ ใส่ icon สำหรับ iOS
  },
  openGraph: {
    title: "Dashboard Bench Test",
    description: "ระบบแสดงผล Bench Test พร้อม Fuel Usage",
    url: "https://dashboard-benchtest.azurewebsites.net",
    siteName: "Dashboard Bench Test",
    images: [
      {
        url: "/og-image.png", // ✅ ใส่รูป preview ไว้ใน public/
        width: 1200,
        height: 630,
        alt: "Dashboard Bench Test",
      },
    ],
    locale: "th_TH",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="th">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="hidden md:block">
            <DesktopMenu />
          </div>

          {/* Mobile menu: โชว์เมื่อจอ < md */}
          <div className="md:hidden">
            <FloatingMenuWrapper />
          </div>
          <main className="flex-1 mt-10 px-4">{children}</main>
          <Toaster richColors position="bottom-right" />
        </Providers>
      </body>
    </html>
  );
}
