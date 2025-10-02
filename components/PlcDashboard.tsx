// PlcDashboard.tsx
"use client";

import { useEffect, useRef, useState } from "react";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import zoomPlugin from "chartjs-plugin-zoom";
import { Wifi, Activity, Loader2, AlertTriangle } from "lucide-react";
import SettingsSync from "./SettingsSync";
import AlarmCard from "./AlarmCard";
import SensorGauge from "./SensorGauge";
import SensorChart from "./SensorChart";
import { toast } from "sonner";

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  zoomPlugin
);

type LogType = {
  id: string;
  createdAtRaw: Date;
  createdAt: string;
  pressure: number[];
  temperature: number[];
};

type ApiLog = {
  id: string;
  pressure: number[];
  temperature: number[];
  createdAt: string;
};

type SortOrder = "asc" | "desc";

export default function PlcDashboard() {
  const [logs, setLogs] = useState<LogType[]>([]);
  const [lastUpdate, setLastUpdate] = useState<string>("—");
  const lastIdRef = useRef<string | null>(null);
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");
  const [settings, setSettings] = useState<Record<string, number>>({});
  const [plcStatus, setPlcStatus] = useState<boolean | null>(null);
  const [buttonsDisabled, setButtonsDisabled] = useState(true);
  const [loading, setLoading] = useState<"SET" | "RST" | null>(null);
  const [plcNoResponse, setPlcNoResponse] = useState(false); // API ไม่ตอบ

  const [alarm, setAlarm] = useState<{ active: boolean; reason: string }>({
    active: false,
    reason: "",
  });

  // ✅ listen event จาก server
  useEffect(() => {
    const evtSource = new EventSource("/api/plc/events");

    evtSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      if (data.type === "PLC_STATUS") {
        setPlcStatus(data.payload.isRunning);
        setLoading(null);
        toast.success(
          data.payload.isRunning ? "✅ PLC Started" : "🛑 PLC Stopped"
        );
      }
    };

    return () => evtSource.close();
  }, []);

  const handleClick = async (cmd: "SET" | "RST" | "RESET") => {
    setLoading(cmd === "RESET" ? null : cmd); // RESET ไม่ต้องโชว์ loader
    await sendCommand(cmd);
  };

  const sendCommand = async (command: "SET" | "RST" | "RESET") => {
    try {
      const res = await fetch("/api/plc/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command, source: "WEB" }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(`❌ Command failed: ${data.error || "Unknown"}`);
        return;
      }

      const result = await res.json();
      console.log("✅ Command result:", result);

      await checkStatus();
      setLoading(null);
    } catch (err) {
      console.error("❌ Error:", err);
      toast.error("Request failed");
    }
  };

  // ✅ check สถานะ PLC
  const checkStatus = async () => {
    try {
      const res = await fetch("/api/plc/status");
      if (!res.ok) throw new Error("API error");
      const data = await res.json();
      console.log("PLC Status : ", data.isRunning);
      setPlcStatus(data.isRunning);
      setAlarm({ active: data.alarm, reason: data.reason });

      setButtonsDisabled(false);
    } catch (err) {
      console.error("⚠️ Failed to fetch PLC status:", err);
      setAlarm((prev) => ({
        ...prev,
        reason: "DB temporarily unavailable",
      }));
    }
  };

  useEffect(() => {
    if (alarm.active) {
      toast.warning(`🚨 Alarm Active: ${alarm.reason}`);
    }
  }, [alarm]);

  // ✅ โหลด history + ดึงข้อมูลล่าสุด
  useEffect(() => {
    let isMounted = true;
    const intervalRef = { current: null as NodeJS.Timeout | null };

    const loadHistory = async () => {
      const res = await fetch("/api/plc/history?limit=50");
      const json = await res.json();
      const mapped: LogType[] = json.map((item: ApiLog) => {
        const raw = new Date(item.createdAt);
        return {
          id: String(item.id),
          pressure: item.pressure,
          temperature: item.temperature,
          createdAtRaw: raw,
          createdAt: raw.toLocaleTimeString("th-TH", { hour12: false }),
        };
      });
      const ordered = mapped.sort(
        (a, b) => b.createdAtRaw.getTime() - a.createdAtRaw.getTime()
      );
      if (isMounted) {
        setLogs(ordered);
        lastIdRef.current = ordered.length > 0 ? ordered[0].id : null;
      }
    };

    const fetchData = async () => {
      try {
        const res = await fetch("/api/plc/latest");
        if (!res.ok) {
          setPlcNoResponse(true);
          return;
        }

        const json = await res.json();
        const raw = new Date(json.timestamp);

        const newLog: LogType = {
          id: String(json.id),
          pressure: json.pressure,
          temperature: json.temperature,
          createdAtRaw: raw,
          createdAt: raw.toLocaleTimeString("th-TH", { hour12: false }),
        };

        if (lastIdRef.current !== newLog.id) {
          lastIdRef.current = newLog.id;
          setLogs((prev) => [newLog, ...prev].slice(0, 50));
        }

        setLastUpdate(
          new Date().toLocaleTimeString("th-TH", { hour12: false })
        );
        await checkStatus();
      } catch (err) {
        console.error("PLC fetch error:", err);
        setPlcNoResponse(true);
      }
    };
    // โหลด history ก่อน
    loadHistory().then(fetchData);

    // ตั้ง interval
    const id = setInterval(fetchData, 2000);
    intervalRef.current = id;

    return () => {
      isMounted = false;
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  const latest = logs[0];

  // ✅ Export CSV
  const exportToCSV = () => {
    if (typeof window === "undefined") return;
    if (!logs.length) return;

    const header = [
      "Time",
      "P1",
      "P2",
      "P3",
      "T1",
      "T2",
      "T3",
      "T4",
      "T5",
      "T6",
    ];
    const rows = logs.map((l) =>
      [l.createdAt, ...l.pressure, ...l.temperature].join(",")
    );
    const csvContent = [header.join(","), ...rows].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sensor_logs.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  let systemStatus: "running" | "stopped" | "idle";
  if (plcNoResponse) {
    systemStatus = "idle";
  } else if (alarm.active) {
    systemStatus = "stopped";
  } else if (plcStatus === true) {
    systemStatus = "running";
  } else if (plcStatus === false) {
    systemStatus = "stopped";
  } else {
    systemStatus = "idle";
  }

  return (
    <div className="p-6 space-y-6 bg-gray-100 min-h-screen">
      {/* แจ้งเตือน error */}
      {plcNoResponse && (
        <div className="p-3 rounded-lg border border-red-400 bg-red-50 text-red-700 flex items-center gap-2 shadow">
          <AlertTriangle className="h-5 w-5 text-red-600" />
          <span className="font-semibold">❌ ไม่สามารถเชื่อมต่อ PLC ได้</span>
        </div>
      )}

      {alarm.active && (
        <div className="p-3 rounded-lg border border-yellow-500 bg-yellow-50 text-yellow-800 shadow">
          ⚠️ Alarm ยังไม่ถูก Reset → {alarm.reason}
        </div>
      )}

      {/* Status Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* System Status */}
        <div
          className={`p-3 rounded-lg shadow border flex items-center gap-3 ${
            systemStatus === "running"
              ? "bg-green-50 border-green-400"
              : "bg-red-50 border-red-400"
          }`}
        >
          <Activity
            className={`h-5 w-5 ${
              systemStatus === "running"
                ? "text-green-600 animate-pulse-slow"
                : "text-red-600 animate-pulse-slow"
            }`}
          />
          <div>
            <p className="text-xs text-gray-600">System</p>
            <p
              className={`font-bold text-sm ${
                systemStatus === "running" ? "text-green-700" : "text-red-700"
              }`}
            >
              {systemStatus}
            </p>
          </div>
        </div>

        {/* Last Update */}
        <div className="p-3 rounded-lg shadow border bg-white flex items-center gap-3">
          <Wifi className="h-5 w-5 text-sky-500 animate-pulse-slow" />
          <div>
            <p className="text-xs text-gray-600">Last Update</p>
            <p className="font-bold text-sm text-gray-800">{lastUpdate}</p>
          </div>
        </div>

        <AlarmCard
          active={alarm.active}
          reasons={alarm.reason ? alarm.reason.split(", ") : []}
        />

        {/* Controls */}
        <div className="p-3 rounded-lg shadow border bg-white flex flex-col gap-2">
          <p className="text-xs text-gray-600 font-semibold">Controls</p>
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={() => handleClick("SET")}
              disabled={
                buttonsDisabled ||
                alarm?.active ||
                plcStatus === true ||
                loading !== null
              }
              className="flex-1 px-3 py-2 rounded-md text-sm font-bold shadow bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300"
            >
              {loading === "SET" ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  กำลังเริ่ม...
                </>
              ) : (
                "▶ START"
              )}
            </button>

            <button
              onClick={() => handleClick("RST")}
              disabled={buttonsDisabled || loading !== null}
              className="flex-1 px-3 py-2 rounded-md text-sm font-bold shadow bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300"
            >
              {loading === "RST" ? (
                <>
                  <Loader2 className="animate-spin h-4 w-4" />
                  กำลังหยุด...
                </>
              ) : (
                "■ STOP"
              )}
            </button>
            <button
              onClick={() => handleClick("RESET")}
              disabled={!alarm?.active || buttonsDisabled}
              className="flex-1 px-3 py-2 rounded-md text-sm font-bold shadow 
             bg-yellow-500 hover:bg-yellow-600 text-white 
             disabled:bg-gray-300"
            >
              🔄 RESET
            </button>

            <SettingsSync
              onSettingsChange={(newSettings) => setSettings(newSettings)}
              buttonsDisabled={buttonsDisabled}
            />
          </div>
        </div>
      </div>
      {/* Two Column Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Left: Pressure */}
        <div className="space-y-2">
          <SensorChart
            title="Pressure Sensors / ความดัน"
            labels={logs.map((l) => l.createdAt)}
            datasets={[
              {
                label: "P1",
                data: logs.map((l) => l.pressure[0]),
                color: "#ef4444",
              },
              {
                label: "P2",
                data: logs.map((l) => l.pressure[1]),
                color: "#f97316",
              },
              {
                label: "P3",
                data: logs.map((l) => l.pressure[2]),
                color: "#a855f7",
              },
            ]}
            maxY={12}
            threshold={{
              value: 6,
              color: "red",
              label: "Max Pressure 6 bar",
            }}
          />

          <div className="grid grid-cols-3 gap-2">
            {latest &&
              latest.pressure.map((p, i) => {
                const sensor = `P${i + 1}`;
                const maxValue = settings[sensor] ?? 12;
                return (
                  <SensorGauge
                    key={sensor}
                    label={sensor}
                    value={p}
                    unit="bar"
                    maxValue={maxValue}
                  />
                );
              })}
          </div>
        </div>

        {/* Right: Temperature */}
        <div className="space-y-2">
          <SensorChart
            title="Temperature Sensors / อุณหภูมิ"
            labels={logs.map((l) => l.createdAt)}
            datasets={[
              {
                label: "T1",
                data: logs.map((l) => l.temperature[0]),
                color: "#3b82f6",
              },
              {
                label: "T2",
                data: logs.map((l) => l.temperature[1]),
                color: "#06b6d4",
              },
              {
                label: "T3",
                data: logs.map((l) => l.temperature[2]),
                color: "#1e40af",
              },
              {
                label: "T4",
                data: logs.map((l) => l.temperature[3]),
                color: "#22c55e",
              },
              {
                label: "T5",
                data: logs.map((l) => l.temperature[4]),
                color: "#84cc16",
              },
              {
                label: "T6",
                data: logs.map((l) => l.temperature[5]),
                color: "#0d9488",
              },
            ]}
            maxY={120}
            threshold={{ value: 80, color: "orange", label: "Max Temp 80°C" }}
          />

          <div className="grid grid-cols-3 gap-2">
            {latest &&
              latest.temperature.map((t, i) => {
                const sensor = `T${i + 1}`;
                const maxTemp = settings[sensor] ?? 80;
                return (
                  <SensorGauge
                    key={sensor}
                    label={sensor}
                    value={t}
                    unit="°C"
                    maxValue={maxTemp}
                  />
                );
              })}
          </div>
        </div>
      </div>

      {/* Log Table */}

      <div className="p-4 rounded-lg border bg-white shadow">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-semibold text-gray-700 text-sm">
            📜 Recent Logs / บันทึกล่าสุด
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-3 py-1.5 rounded bg-gray-600 text-white text-sm hover:bg-gray-700 shadow"
            >
              {sortOrder === "asc" ? "⬆️ เก่าก่อน" : "⬇️ ใหม่ก่อน"}
            </button>
            <button
              onClick={exportToCSV}
              className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm hover:bg-blue-700 shadow"
            >
              📥 Export CSV
            </button>
          </div>
        </div>

        <div className="max-h-80 overflow-y-auto rounded border">
          <table className="text-xs w-full border-collapse">
            <thead className="sticky top-0 bg-sky-600 text-white text-[13px] shadow z-0">
              <tr>
                <th className="px-3 py-2 text-left font-semibold">Time</th>
                {Array.from({ length: 3 }, (_, i) => (
                  <th key={i} className="px-3 py-2 text-center font-semibold">
                    P{i + 1} (bar)
                  </th>
                ))}
                {Array.from({ length: 6 }, (_, i) => (
                  <th key={i} className="px-3 py-2 text-center font-semibold">
                    T{i + 1} (°C)
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(sortOrder === "asc" ? [...logs].reverse() : logs).map(
                (l, i) => (
                  <tr
                    key={i}
                    className={`border-b transition ${
                      i % 2 === 0 ? "bg-gray-50" : "bg-white"
                    } hover:bg-yellow-50`}
                  >
                    <td className="px-3 py-2 font-mono text-gray-700">
                      {l.createdAt}
                    </td>

                    {/* Pressure */}
                    {l.pressure.map((p, j) => {
                      const sensor = `P${j + 1}`;
                      const limit = settings[sensor] ?? 6; // ถ้าไม่มีค่าใช้ 6 เป็น default
                      const isHigh = p > limit;

                      return (
                        <td
                          key={j}
                          className={`px-3 py-2 text-center font-medium ${
                            isHigh ? "bg-red-50 text-red-600" : "text-gray-800"
                          }`}
                        >
                          {isHigh ? `🚨 ${p}` : p}
                        </td>
                      );
                    })}

                    {/* Temperature */}
                    {l.temperature.map((t, j) => {
                      const sensor = `T${j + 1}`;
                      const limit = settings[sensor] ?? 80;
                      const isHot = t > limit;

                      return (
                        <td
                          key={j}
                          className={`px-3 py-2 text-center font-medium ${
                            isHot
                              ? "bg-orange-50 text-orange-600"
                              : "text-gray-800"
                          }`}
                        >
                          {isHot ? `🔥 ${t}` : t}
                        </td>
                      );
                    })}
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
