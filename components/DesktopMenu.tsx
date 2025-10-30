"use client";

import { useRouter } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { menuItems } from "@/lib/menuItems";
import { ChevronDown } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";

export default function DesktopMenu() {
  const router = useRouter();
  const { data: session, status } = useSession();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  if (status !== "authenticated" || !session?.user) return null;

  const getRoleColor = (role?: string) => {
    switch (role) {
      case "dev":
        return "bg-purple-100 text-purple-700 border border-purple-300";
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
                 bg-gradient-to-r from-indigo-500/95 via-blue-500/95 to-cyan-500/95
                 backdrop-blur-md shadow-lg text-white"
    >
      {/* 🔹 เมนูหลัก */}
      <div className="flex items-center gap-6 relative">
        {menuItems.map((item) =>
          item.children ? (
            <div
              key={item.label}
              className="relative group"
              onMouseEnter={() => setOpenDropdown(item.label)}
              onMouseLeave={() => setOpenDropdown(null)}
            >
              <button className="flex items-center gap-1 font-medium text-white/90 hover:text-yellow-200 transition">
                <item.Icon className="w-5 h-5" />
                {item.label}
                <ChevronDown className="w-4 h-4 ml-0.5" />
              </button>

              {/* Dropdown animation */}
              <AnimatePresence>
                {openDropdown === item.label && (
                  <motion.div
                    initial={{ opacity: 0, y: -5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    transition={{ duration: 0.15, ease: "easeOut" }}
                    className="absolute left-0 mt-2 w-52 bg-white text-gray-800 shadow-xl 
                               rounded-lg overflow-hidden ring-1 ring-black/10"
                  >
                    {item.children.filter((sub) => {
                      const role = session.user?.role;
                      if (sub.path === "/users") {
                        return role === "admin" || role === "dev";
                      }
                      return true;
                    }).map((sub) => (
                      <button
                        key={sub.label}
                        onClick={() => router.push(sub.path)}
                        className="flex items-center gap-2 w-full px-4 py-2 text-sm hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                      >
                        <sub.Icon className="w-4 h-4 text-blue-500" />
                        {sub.label}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : item.isLogout ? (
            <button
              key={item.label}
              onClick={() => signOut({ callbackUrl: "/auth/login" })}
              className="flex items-center gap-2 text-red-200 hover:text-red-400 font-medium transition cursor-pointer"
            >
              <item.Icon className="w-5 h-5" />
              {item.label}
            </button>
          ) : (
            <button
              key={item.label}
              onClick={() => router.push(item.path)}
              className="flex items-center gap-2 text-white/90 hover:text-yellow-200 font-medium transition cursor-pointer"
            >
              <item.Icon className="w-5 h-5" />
              {item.label}
            </button>
          )
        )}
      </div>

      {/* 🔸 User Info */}
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
