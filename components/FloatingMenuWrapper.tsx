"use client";

import { useRouter } from "next/navigation";
import FloatingActionMenu from "./ui/floating-action-menu";
import { signOut } from "next-auth/react";
import { menuItems } from "@/lib/menuItems";
import type { LucideIcon } from "lucide-react";

// 💡 กำหนด type ชัดเจน
type MenuItem = {
  label: string;
  Icon: LucideIcon;
  path: string;
  isLogout?: boolean;
  children?: MenuItem[];
};

export default function FloatingMenuWrapper() {
  const router = useRouter();

  // ✅ flatten menu ทั้งหมด รวม children เข้าเป็น array เดียว
  const flatMenu: MenuItem[] = (menuItems as MenuItem[]).flatMap((item) =>
    item.children
      ? item.children.map((sub) => ({
          label: sub.label,
          Icon: sub.Icon,
          path: sub.path,
          isLogout: false,
        }))
      : [
          {
            label: item.label,
            Icon: item.Icon,
            path: item.path,
            isLogout: item.isLogout ?? false, // 🔹 ป้องกัน undefined
          },
        ]
  );

  return (
    <FloatingActionMenu
      options={flatMenu.map(({ label, Icon, path, isLogout }) => ({
        label,
        Icon: (
          <Icon
            className={`w-4 h-4 ${isLogout ? "text-red-500" : "text-blue-600"}`}
          />
        ),
        onClick: () =>
          isLogout
            ? signOut({ callbackUrl: "/auth/login" })
            : router.push(path),
      }))}
    />
  );
}
