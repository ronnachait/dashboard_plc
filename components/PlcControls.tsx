"use client";

import { useSession } from "next-auth/react";
import { Loader2 } from "lucide-react";
import SettingsSync from "./SettingsSync";

interface PlcControlsProps {
  handleClick: (command: "SET" | "RST" | "RESET") => void;
  alarm: { active: boolean; reason?: string | null };
  plcStatus: boolean;
  loading: "SET" | "RST" | "RESET" | null;
  buttonsDisabled: boolean;
  setSettings: (settings: Record<string, number>) => void;
}

export default function PlcControls({
  handleClick,
  alarm,
  plcStatus,
  loading,
  buttonsDisabled,
  setSettings,
}: PlcControlsProps) {
  const { data: session } = useSession();
  const role = session?.user?.role ?? "user";

  // ✅ มีสิทธิ์ควบคุมเฉพาะ operator / admin
  const hasControlAccess = ["operator", "admin"].includes(role);

  return (
    <div className="p-3 rounded-lg shadow border bg-white flex flex-col gap-3">
      {/* 👤 แสดง Role ปัจจุบัน */}
      <div className="flex items-center justify-between border-b pb-2">
        <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">
          Controls
        </h3>

        <span
          className={`text-[12px] font-medium px-2 py-1 rounded-full ${
            hasControlAccess
              ? "bg-green-100 text-green-700 border border-green-400"
              : "bg-gray-100 text-gray-500 border border-gray-300"
          }`}
        >
          {hasControlAccess
            ? "👷 Operator mode (full control)"
            : "👤 User mode (read only)"}
        </span>
      </div>

      {/* 🔘 ปุ่มควบคุม */}
      <div className="grid grid-cols-3 gap-2">
        {/* START */}
        <button
          onClick={() => handleClick("SET")}
          disabled={
            !hasControlAccess ||
            buttonsDisabled ||
            alarm.active ||
            plcStatus === true ||
            loading !== null
          }
          className="px-2 py-2 rounded-md text-xs font-bold 
           bg-green-600 hover:bg-green-700 text-white 
           shadow-sm hover:shadow transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading === "SET" ? (
            <Loader2 className="animate-spin h-4 w-4 mx-auto" />
          ) : (
            <>
              <span className="md:hidden">▶</span>
              <span className="hidden md:inline">▶ START</span>
            </>
          )}
        </button>

        {/* STOP */}
        <button
          onClick={() => handleClick("RST")}
          disabled={!hasControlAccess || buttonsDisabled || loading !== null}
          className="px-2 py-2 rounded-md text-xs font-bold 
           bg-red-600 hover:bg-red-700 text-white 
           shadow-sm hover:shadow transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          {loading === "RST" ? (
            <Loader2 className="animate-spin h-4 w-4 mx-auto" />
          ) : (
            <>
              <span className="md:hidden">■</span>
              <span className="hidden md:inline">■ STOP</span>
            </>
          )}
        </button>

        {/* RESET */}
        <button
          onClick={() => handleClick("RESET")}
          disabled={!hasControlAccess || !alarm.active || buttonsDisabled}
          className="px-2 py-2 rounded-md text-xs font-bold 
           bg-yellow-500 hover:bg-yellow-600 text-white 
           shadow-sm hover:shadow transition disabled:bg-gray-300 disabled:cursor-not-allowed"
        >
          <span className="md:hidden">🔄</span>
          <span className="hidden md:inline">🔄 RESET</span>
        </button>
      </div>

      {/* ⚙️ SettingsSync */}
      <SettingsSync
        onSettingsChange={(newSettings) => setSettings(newSettings)}
        buttonsDisabled={!hasControlAccess || buttonsDisabled}
      />
    </div>
  );
}
