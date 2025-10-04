"use client";

import { useRouter } from "next/navigation";
import FloatingActionMenu from "./ui/floating-action-menu";
import { signOut } from "next-auth/react";
import { menuItems } from "@/lib/menuItems";

export default function FloatingMenuWrapper() {
  const router = useRouter();

  return (
    <FloatingActionMenu
      options={menuItems.map(({ label, Icon, path, isLogout }) => ({
        label,
        Icon: <Icon className={`w-4 h-4 ${isLogout ? "text-red-500" : ""}`} />,
        onClick: () =>
          isLogout
            ? signOut({ callbackUrl: "/auth/login" })
            : router.push(path),
      }))}
    />
  );
}
