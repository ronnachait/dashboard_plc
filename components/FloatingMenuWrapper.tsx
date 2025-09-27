// components/FloatingMenuWrapper.tsx
"use client";

import { useRouter } from "next/navigation";
import { DatabaseBackup, Gauge, History } from "lucide-react";
import FloatingActionMenu from "./ui/floating-action-menu";

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
          label: "backup",
          Icon: <DatabaseBackup className="w-4 h-4" />,
          onClick: () => router.push("/backup"),
        },
      ]}
    />
  );
}
