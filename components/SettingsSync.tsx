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
  const [open, setOpen] = useState(false); // 👈 state คุม Dialog

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
      setLoading(false);
    } catch (err) {
      console.error("❌ Load error:", err);
      toast.error("โหลด settings ไม่สำเร็จ");
      setLoading(false);
    }
  };

  // ✅ Save (DB + Sync ไป Pi)
  const saveSettings = async () => {
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

      // ✅ ปิด Dialog หลัง save เสร็จ
      setOpen(false);
    } catch (err) {
      console.error("❌ Save error:", err);
      toast.error("❌ Save failed");
    } finally {
      setLoading(false);
    }
  };

  // ✅ auto load + sync ตอน mount
  useEffect(() => {
    loadSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateValue = (sensor: string, value: number) => {
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
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>⚙️ PLC Settings</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* PRESSURE */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Pressure Sensors (bar)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {["P1", "P2", "P3"].map((s) => (
                <div key={s} className="p-3 bg-gray-50 rounded border">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {s}
                  </label>
                  <input
                    type="number"
                    value={settings[s] ?? ""}
                    onChange={(e) => updateValue(s, Number(e.target.value))}
                    className="w-full rounded px-2 py-1 border text-center font-semibold text-gray-800"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* TEMPERATURE */}
          <div>
            <h3 className="text-sm font-semibold mb-2 text-gray-700">
              Temperature Sensors (°C)
            </h3>
            <div className="grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }, (_, i) => `T${i + 1}`).map((s) => (
                <div key={s} className="p-3 bg-gray-50 rounded border">
                  <label className="block text-xs font-medium text-gray-600 mb-1">
                    {s}
                  </label>
                  <input
                    type="number"
                    value={settings[s] ?? ""}
                    onChange={(e) => updateValue(s, Number(e.target.value))}
                    className="w-full rounded px-2 py-1 border text-center font-semibold text-gray-800"
                  />
                </div>
              ))}
            </div>
          </div>

          {/* BUTTONS */}
          <div className="flex justify-end gap-2">
            <Button
              className="bg-green-600 hover:bg-green-700 disabled:bg-gray-300 disabled:text-gray-500"
              disabled={loading}
              onClick={saveSettings}
            >
              {loading ? "⏳ Saving..." : "💾 Save & Sync"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
