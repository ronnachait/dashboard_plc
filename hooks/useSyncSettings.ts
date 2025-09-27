// app/hooks/useSyncSettings.ts
"use client";

import { useEffect } from "react";

export function useSyncSettings() {
  useEffect(() => {
    async function loadAndPushSettings() {
      try {
        // 1) ดึงค่าจาก DB ผ่าน Next API
        const res = await fetch("/api/plc/settings");
        const dbSettings = await res.json();

        // 2) แปลง array → object { P1:6, P2:7, T1:75, ... }
        const map: Record<string, number> = {};
        dbSettings.forEach((s: { sensor: string; maxValue: number }) => {
          map[s.sensor] = s.maxValue;
        });

        // 3) ยิงไป server.js
        await fetch("http://localhost:4000/plc/settings", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(map),
        });

        console.log("⚙️ Synced settings to backend:", map);
      } catch (err) {
        console.error("❌ Error syncing settings:", err);
      }
    }

    loadAndPushSettings();
  }, []);
}
