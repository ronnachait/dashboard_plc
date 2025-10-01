// components/FloatingMenuWrapper.tsx
"use client";

import { useRouter } from "next/navigation";
import { DatabaseBackup, Gauge, History, LogOut } from "lucide-react";
import FloatingActionMenu from "./ui/floating-action-menu";
import { signOut } from "next-auth/react";

export default function FloatingMenuWrapper() {
  const router = useRouter();

  return (
    <FloatingActionMenu
      options={[
        {
          label: "Dashboard",
          Icon: <Gauge className="w-4 h-4" />,
          onClick: () => router.push("/plc"),
        },
        {
          label: "History",
          Icon: <History className="w-4 h-4" />,
          onClick: () => router.push("/history"),
        },
        {
          label: "Backup",
          Icon: <DatabaseBackup className="w-4 h-4" />,
          onClick: () => router.push("/backup"),
        },
        {
          label: "Logout",
          Icon: <LogOut className="w-4 h-4 text-red-500" />,
          onClick: () =>
            signOut({
              callbackUrl: "/auth/login", // ✅ ออกจากระบบแล้วกลับไปหน้า login
            }),
        },
      ]}
    />
  );
}
