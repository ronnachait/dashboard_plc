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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
      <div className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-md text-center border border-gray-200">
        <h1 className="text-2xl font-bold text-gray-800 mb-2">
          👋 ยินดีต้อนรับ
        </h1>
        <p className="text-gray-600 mb-6">
          คุณคือ <span className="font-semibold">{session.user?.name}</span>
        </p>

        {session.user.role.toUpperCase() === "ADMIN" ? (
          <div className="flex flex-col items-center gap-2 p-4 bg-green-50 border border-green-200 rounded-xl shadow-inner">
            <ShieldCheck className="w-10 h-10 text-green-600" />
            <p className="font-semibold text-green-700">คุณคือ Admin</p>
            <p className="text-sm text-green-600">
              สามารถจัดการผู้ใช้งานและระบบได้ทั้งหมด
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 p-4 bg-blue-50 border border-blue-200 rounded-xl shadow-inner">
            <User className="w-10 h-10 text-blue-600" />
            <p className="font-semibold text-blue-700">คุณคือ User</p>
            <p className="text-sm text-blue-600">
              สามารถใช้งานระบบตามสิทธิ์ที่ได้รับ
            </p>
          </div>
        )}

        {/* Countdown + ปุ่มข้าม */}
        <div className="mt-6 flex flex-col items-center gap-3">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 transform -rotate-90">
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#e5e7eb"
                strokeWidth="6"
                fill="transparent"
              />
              <circle
                cx="32"
                cy="32"
                r="28"
                stroke="#3b82f6"
                strokeWidth="6"
                fill="transparent"
                strokeDasharray={2 * Math.PI * 28}
                strokeDashoffset={(2 * Math.PI * 28 * (5 - countdown)) / 5}
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className="absolute inset-0 flex items-center justify-center font-bold text-blue-600">
              {countdown}
            </span>
          </div>

          <p className="text-sm text-gray-500">
            กำลังจะพาไปที่ <code>Dashboard</code>
          </p>
          <button
            onClick={() => router.push("/plc")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg shadow transition"
          >
            ไปเลยตอนนี้ 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
