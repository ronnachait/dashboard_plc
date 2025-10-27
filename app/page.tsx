"use client";

import { useSession } from "next-auth/react";
import { ShieldCheck, User, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

export default function Dashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [countdown, setCountdown] = useState(5);

  // ⏳ เริ่มนับถอยหลัง
  useEffect(() => {
    if (status === "authenticated" && session) {
      const timer = setInterval(() => {
        setCountdown((prev) => (prev > 0 ? prev - 1 : 0));
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [status, session]);

  // ✅ แยก useEffect คุม redirect ไม่ให้ชน render
  useEffect(() => {
    if (countdown === 0 && status === "authenticated" && session) {
      router.push("/plc");
    }
  }, [countdown, status, session, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        <span className="ml-2 text-gray-700 font-medium">กำลังโหลด...</span>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-100">
        <div className="bg-white shadow-lg rounded-lg p-6 max-w-sm text-center">
          <p className="text-gray-700 font-medium">❌ กรุณาเข้าสู่ระบบก่อน</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-slate-100 flex items-center justify-center p-6">
      <div className="bg-white shadow-2xl rounded-3xl p-10 w-full max-w-md text-center border border-slate-200 animate-scale-in">
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-3">
          👋 ยินดีต้อนรับ
        </h1>
        <p className="text-gray-600 mb-8 text-lg">
          คุณคือ <span className="font-bold text-blue-600">{session.user?.name}</span>
        </p>

        {session.user.role.toUpperCase() === "ADMIN" ? (
          <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-green-50 to-emerald-100 border-2 border-green-300 rounded-2xl shadow-lg">
            <ShieldCheck className="w-12 h-12 text-green-600" />
            <p className="font-bold text-green-800 text-lg">คุณคือ Admin</p>
            <p className="text-sm text-green-700">
              สามารถจัดการผู้ใช้งานและระบบได้ทั้งหมด
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 p-6 bg-gradient-to-br from-blue-50 to-sky-100 border-2 border-blue-300 rounded-2xl shadow-lg">
            <User className="w-12 h-12 text-blue-600" />
            <p className="font-bold text-blue-800 text-lg">คุณคือ User</p>
            <p className="text-sm text-blue-700">
              สามารถใช้งานระบบตามสิทธิ์ที่ได้รับ
            </p>
          </div>
        )}

        {/* Countdown + ปุ่มข้าม */}
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="relative w-20 h-20">
            <svg className="w-20 h-20 transform -rotate-90">
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="#e5e7eb"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="40"
                cy="40"
                r="36"
                stroke="url(#gradient)"
                strokeWidth="8"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 36}
                strokeDashoffset={(2 * Math.PI * 36 * (5 - countdown)) / 5}
                className="transition-all duration-1000 ease-linear"
              />
              <defs>
                <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-bold text-2xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              {countdown}
            </span>
          </div>

          <p className="text-sm text-gray-600">
            กำลังจะพาไปที่ <code className="px-2 py-1 bg-slate-100 rounded text-blue-600 font-mono">Dashboard</code>
          </p>
          <button
            onClick={() => router.push("/plc")}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl transition-all font-medium"
          >
            ไปเลยตอนนี้ 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
