"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { menuItems } from "@/lib/menuItems";

export default function DesktopMenu() {
  const router = useRouter();
  const { data: session, status } = useSession();

  if (status !== "authenticated" || !session?.user) return null;

  // ฟังก์ชันเลือกสี role
  const getRoleColor = (role?: string) => {
    switch (role) {
      case "admin":
        return "bg-red-100 text-red-700 border border-red-300";
      case "manager":
        return "bg-blue-100 text-blue-700 border border-blue-300";
      case "user":
        return "bg-green-100 text-green-700 border border-green-300";
      default:
        return "bg-gray-100 text-gray-700 border border-gray-300";
    }
  };

  return (
    <div
      className="hidden md:flex fixed top-0 left-0 w-full z-50 
                 items-center justify-between px-8 py-3
                 bg-gradient-to-r from-indigo-500/90 via-blue-500/90 to-cyan-500/90
                 backdrop-blur-md shadow-lg text-white"
    >
      {/* เมนู */}
      <div className="flex items-center gap-8">
        {menuItems.map(({ label, Icon, path, isLogout }) =>
          isLogout ? (
            <button
              key={label}
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="flex items-center gap-2 text-red-200 hover:text-red-400 font-medium cursor-pointer transition"
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          ) : (
            <button
              key={label}
              onClick={() => router.push(path)}
              className="flex items-center gap-2 hover:text-yellow-200 font-medium cursor-pointer transition"
            >
              <Icon className="w-5 h-5" />
              {label}
            </button>
          )
        )}
      </div>

      {/* ขวา: User Info */}
      <div className="flex items-center gap-3 border-l border-white/30 pl-4 text-sm">
        <span className="font-medium">{session.user?.name}</span>
        {session.user?.role && (
          <span
            className={`px-2 py-1 text-xs rounded-md ${getRoleColor(
              session.user.role
            )}`}
          >
            {session.user.role}
          </span>
        )}
      </div>
    </div>
  );
}
