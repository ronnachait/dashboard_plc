"use client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { useSession } from "next-auth/react";

type Setting = { sensor: string; maxValue: number };

type SettingsSyncProps = {
  onSettingsChange?: (settings: Record<string, number>) => void;
  buttonsDisabled?: boolean;
};

export default function SettingsSync({
  onSettingsChange,
  buttonsDisabled,
}: SettingsSyncProps) {
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const { data: session } = useSession();

  const isAdmin = session?.user?.role?.toUpperCase() === "ADMIN";

  // ✅ โหลดค่าจาก DB
  const loadSettings = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/plc/settings");
      const data = await res.json();
      const map: Record<string, number> = {};
      data.settings.forEach((s: Setting) => {
        map[s.sensor] = s.maxValue;
      });
      setSettings(map);
      onSettingsChange?.(map);
    } catch (err) {
      console.error("❌ Load error:", err);
      toast.error("โหลด settings ไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Save (เฉพาะ Admin)
  const saveSettings = async () => {
    if (!isAdmin) {
      toast.error("⛔ คุณไม่มีสิทธิ์แก้ไขค่า");
      return;
    }
    try {
      setLoading(true);
      const payload: Setting[] = Object.entries(settings).map(
        ([sensor, maxValue]) => ({ sensor, maxValue })
      );

      const res = await fetch("/api/plc/settings/bulk", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) throw new Error("Save failed");
      toast.success("💾 Saved to DB");
      onSettingsChange?.(settings);
      setOpen(false);
    } catch (err) {
      console.error("❌ Save error:", err);
      toast.error("❌ Save failed");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadSettings();
  }, []);

  const updateValue = (sensor: string, value: number) => {
    if (!isAdmin) return; // ❌ User ห้ามแก้
    setSettings((prev) => ({ ...prev, [sensor]: value }));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className="flex-1 px-3 py-2 rounded-md text-sm font-bold shadow transition disabled:bg-gray-300 disabled:text-gray-500
               bg-sky-600 hover:bg-sky-700 text-white"
          disabled={buttonsDisabled || loading}
        >
          ⚙️ SETTINGS
        </button>
      </DialogTrigger>

      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>⚙️ PLC Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-8">
          {/* 🟢 Cylinder Bench Test */}
          <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
            <h3 className="text-sm font-bold mb-3 text-blue-600">
              🟢 Cylinder Bench Test (Temperature T1–T3)
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              {["T1", "T2", "T3"].map((s) => (
                <div key={s} className="p-3 bg-white rounded border shadow-sm">
                  <label className="block text-xs font-medium text-gray-500 mb-1">
                    {s}
                  </label>
                  <input
                    type="number"
                    value={settings[s] ?? ""}
                    onChange={(e) => updateValue(s, Number(e.target.value))}
                    disabled={!isAdmin}
                    className="w-full rounded px-2 py-1 border text-center font-semibold text-gray-800 disabled:bg-gray-100 disabled:text-gray-500"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* 🔴 Chopper Bench Test */}
          <div className="p-4 border rounded-lg bg-gray-50 shadow-sm">
            <h3 className="text-sm font-bold mb-3 text-green-600">
              🔴 Chopper Bench Test (Pressure P1–P3 + Temperature T4–T9)
            </h3>

            {/* Pressure */}
            <div className="mb-4">
              <h4 className="text-xs font-semibold text-gray-500 mb-2">
                Pressure Sensors (bar)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                {["P1", "P2", "P3"].map((s) => (
                  <div
                    key={s}
                    className="p-3 bg-white rounded border shadow-sm"
                  >
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {s}
                    </label>
                    <input
                      type="number"
                      value={settings[s] ?? ""}
                      onChange={(e) => updateValue(s, Number(e.target.value))}
                      disabled={!isAdmin}
                      className="w-full rounded px-2 py-1 border text-center font-semibold text-gray-800 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <h4 className="text-xs font-semibold text-gray-500 mb-2">
                Temperature Sensors (°C)
              </h4>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {Array.from({ length: 6 }, (_, i) => `T${i + 4}`).map((s) => (
                  <div
                    key={s}
                    className="p-3 bg-white rounded border shadow-sm"
                  >
                    <label className="block text-xs font-medium text-gray-500 mb-1">
                      {s}
                    </label>
                    <input
                      type="number"
                      value={settings[s] ?? ""}
                      onChange={(e) => updateValue(s, Number(e.target.value))}
                      disabled={!isAdmin}
                      className="w-full rounded px-2 py-1 border text-center font-semibold text-gray-800 disabled:bg-gray-100 disabled:text-gray-500"
                    />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-3">
            {isAdmin ? (
              <Button
                className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
                disabled={loading}
                onClick={saveSettings}
              >
                {loading ? "⏳ Saving..." : "💾 Save & Sync"}
              </Button>
            ) : (
              <p className="text-sm text-gray-500 italic">
                🔒 เฉพาะ Admin เท่านั้นที่สามารถแก้ไขค่าได้
              </p>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
