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

type GreasePointAlert = {
  id: string;
  pointNo: number;
  name: string;
  nextDueHour: number;
  vehicle: {
    id: string;
    name: string;
    plateNo?: string | null;
    lastHourAfterTest?: number | null;
  };
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
  const [plcNoResponse, setPlcNoResponse] = useState(false);
  const [greaseAlerts, setGreaseAlerts] = useState<GreasePointAlert[]>([]);

  const [alarm, setAlarm] = useState<{ active: boolean; reason: string }>({
    active: false,
    reason: "",
  });

  // ✅ handle click
  const handleClick = async (cmd: "SET" | "RST" | "RESET") => {
    setLoading(cmd === "RESET" ? null : cmd);
    try {
      const res = await fetch("/api/plc/command", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ command: cmd, source: "WEB" }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error(`❌ Command failed: ${data.error || "Unknown"}`);
        return;
      }
      setLoading(null);
    } catch (err) {
      console.error("❌ Error:", err);
      toast.error("Request failed");
    }
  };

  useEffect(() => {
    const fetchGrease = async () => {
      try {
        const res = await fetch("/api/grease");
        if (!res.ok) return;
        const data = await res.json();
        console.log("Grease Alerts", data);
        const alerts: GreasePointAlert[] = data.points.filter(
          (p: GreasePointAlert) =>
            (p.vehicle.lastHourAfterTest ?? 0) >= p.nextDueHour
        );

        setGreaseAlerts(alerts);
        if (alerts.length > 0) {
          toast.error(`🚨 มีจุดอัดจารบีเกินรอบ ${alerts.length} จุด`);
        }
      } catch (err) {
        console.error("⚠️ Grease fetch failed:", err);
      }
    };

    fetchGrease();
    const interval = setInterval(fetchGrease, 60000); // 🔄 เช็คทุก 1 นาที
    return () => clearInterval(interval);
  }, []);

  // ✅ โหลด history ครั้งแรก
  useEffect(() => {
    const loadHistory = async () => {
      try {
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
        setLogs(
          mapped.sort(
            (a, b) => b.createdAtRaw.getTime() - a.createdAtRaw.getTime()
          )
        );
        if (mapped.length > 0) {
          lastIdRef.current = mapped[0].id;
        }
      } catch (err) {
        console.error("⚠️ Load history failed:", err);
      }
    };
    loadHistory();
  }, []);
  // ✅ subscribe SSE (with auto-retry)
  useEffect(() => {
    let retryTimeout: NodeJS.Timeout | null = null;
    let es: EventSource | null = null;

    const connectSSE = () => {
      console.log("🔌 Connecting SSE...");
      es = new EventSource("/api/plc/events");

      es.onopen = () => {
        console.log("✅ SSE connected");
        setPlcNoResponse(false); // ต่อสำเร็จ → clear error
      };

      es.onmessage = (event) => {
        const data = JSON.parse(event.data);

        switch (data.type) {
          case "PLC_SENSOR": {
            const raw = new Date(data.payload.ts);
            const newLog: LogType = {
              id: raw.getTime().toString(),
              pressure: data.payload.pressure,
              temperature: data.payload.temperature,
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
            break;
          }

          case "PLC_STATUS": {
            setPlcStatus(data.payload.isRunning);
            setAlarm(data.payload.alarm);
            setButtonsDisabled(false);
            break;
          }

          default:
            console.log("ℹ️ Unknown event:", data);
        }
      };

      es.onerror = (err) => {
        console.error("⚠️ SSE disconnected:", err);
        setPlcNoResponse(true); // แสดงว่า offline
        es?.close();

        // ลองใหม่หลัง 5 วิ
        if (retryTimeout) clearTimeout(retryTimeout);
        retryTimeout = setTimeout(connectSSE, 5000);
      };
    };

    connectSSE();

    return () => {
      console.log("🧹 Cleaning up SSE...");
      es?.close();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, []);

  const latest = logs[0];

  // ✅ CSV Export
  const exportToCSV = () => {
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
      "T7",
      "T8",
      "T9",
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

  let systemStatus: "running" | "stopped" | "idle" | "offline";

  if (plcNoResponse) {
    systemStatus = "offline"; // ❌ connection lost
  } else if (alarm.active) {
    systemStatus = "stopped"; // 🚨 alarm stop
  } else if (plcStatus === true) {
    systemStatus = "running";
  } else if (plcStatus === false) {
    systemStatus = "stopped";
  } else {
    systemStatus = "idle"; // ไม่มีข้อมูล ยังไม่เริ่ม
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
      {greaseAlerts.length > 0 && (
        <div className="p-3 rounded-lg border border-red-400 bg-red-50 text-red-700 shadow">
          <h2 className="font-bold flex items-center gap-2">🛢️ Alarm จารบี</h2>
          <ul className="list-disc ml-6 mt-2">
            {greaseAlerts.map((g) => (
              <li key={g.id}>
                จุด {g.pointNo}: {g.name} — ถึงรอบที่ {g.nextDueHour} ชม.
              </li>
            ))}
          </ul>
        </div>
      )}

      {alarm.active && (
        <div className="p-3 rounded-lg border border-yellow-500 bg-yellow-50 text-yellow-800 shadow">
          ⚠️ Alarm ยังไม่ถูก Reset → {alarm.reason}
        </div>
      )}

      {/* Status + Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* System Status */}
        <div
          className={`p-3 rounded-lg shadow border flex items-center gap-3 ${
            systemStatus === "running"
              ? "bg-green-50 border-green-400"
              : systemStatus === "offline"
              ? "bg-gray-200 border-gray-400"
              : "bg-red-50 border-red-400"
          }`}
        >
          <Activity
            className={`h-5 w-5 ${
              systemStatus === "running"
                ? "text-green-600"
                : systemStatus === "offline"
                ? "text-gray-500"
                : "text-red-600"
            } animate-pulse-slow`}
          />
          <div>
            <p className="text-xs text-gray-600">System</p>
            <p className="font-bold text-sm">{systemStatus}</p>
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

        {/* Alarm Card */}
        <AlarmCard
          active={alarm.active}
          reasons={alarm.reason ? alarm.reason.split(", ") : []}
        />

        {/* Controls */}
        <div className="p-3 rounded-lg shadow border bg-white flex flex-col gap-2">
          <h3 className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide mb-1">
            Controls
          </h3>

          <div className="grid grid-cols-3 gap-2">
            {/* START */}
            <button
              onClick={() => handleClick("SET")}
              disabled={
                buttonsDisabled ||
                alarm.active ||
                plcStatus === true ||
                loading !== null
              }
              className="px-2 py-2 rounded-md text-xs font-bold 
               bg-green-600 hover:bg-green-700 text-white 
               shadow-sm hover:shadow transition disabled:bg-gray-300"
            >
              {loading === "SET" ? (
                <Loader2 className="animate-spin h-4 w-4 mx-auto" />
              ) : (
                <>
                  <span className="md:hidden">▶</span> {/* Mobile: แค่ icon */}
                  <span className="hidden md:inline">▶ START</span>{" "}
                  {/* Desktop: text */}
                </>
              )}
            </button>

            {/* STOP */}
            <button
              onClick={() => handleClick("RST")}
              disabled={buttonsDisabled || loading !== null}
              className="px-2 py-2 rounded-md text-xs font-bold 
               bg-red-600 hover:bg-red-700 text-white 
               shadow-sm hover:shadow transition disabled:bg-gray-300"
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
              disabled={!alarm.active || buttonsDisabled}
              className="px-2 py-2 rounded-md text-xs font-bold 
               bg-yellow-500 hover:bg-yellow-600 text-white 
               shadow-sm hover:shadow transition disabled:bg-gray-300"
            >
              <span className="md:hidden">🔄</span>
              <span className="hidden md:inline">🔄 RESET</span>
            </button>
          </div>

          <SettingsSync
            onSettingsChange={(newSettings) => setSettings(newSettings)}
            buttonsDisabled={buttonsDisabled}
          />
        </div>
      </div>
      {/* Sensor Zones */}
      <div className="space-y-8">
        {/* 🔵 Cylinder Bench Test */}
        <div className="p-4 rounded-lg shadow border bg-white">
          <h2 className="text-lg font-bold text-blue-600 mb-3">
            🔵 Cylinder Bench Test
          </h2>
          <SensorChart
            title="Cylinder Temperature (3 จุด)"
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
            ]}
            maxY={120}
            threshold={{ value: 80, color: "orange", label: "Max Temp 80°C" }}
          />
          <div className="grid grid-cols-3 gap-2 mt-2">
            {latest &&
              latest.temperature
                .slice(0, 3)
                .map((t, i) => (
                  <SensorGauge
                    key={`T${i + 1}`}
                    label={`T${i + 1}`}
                    value={t}
                    unit="°C"
                    maxValue={settings[`T${i + 1}`] ?? 80}
                  />
                ))}
          </div>
        </div>

        {/* 🟢 Chopper Bench Test */}
        <div className="p-4 rounded-lg shadow border bg-white">
          <h2 className="text-lg font-bold text-green-600 mb-3">
            🟢 Chopper Bench Test
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pressure */}
            <div>
              <SensorChart
                title="Chopper Pressure (3 จุด)"
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
              <div className="grid grid-cols-3 gap-2 mt-2">
                {latest &&
                  latest.pressure.map((p, i) => (
                    <SensorGauge
                      key={`P${i + 1}`}
                      label={`P${i + 1}`}
                      value={p}
                      unit="bar"
                      maxValue={settings[`P${i + 1}`] ?? 12}
                    />
                  ))}
              </div>
            </div>

            {/* Temperature */}
            <div>
              <SensorChart
                title="Chopper Temperature (6 จุด)"
                labels={logs.map((l) => l.createdAt)}
                datasets={Array.from({ length: 6 }, (_, i) => ({
                  label: `T${i + 4}`,
                  data: logs.map((l) => l.temperature[i + 3]),
                  color: [
                    "#22c55e",
                    "#84cc16",
                    "#0d9488",
                    "#f59e0b",
                    "#d946ef",
                    "#ef4444",
                  ][i],
                }))}
                maxY={120}
                threshold={{
                  value: 80,
                  color: "orange",
                  label: "Max Temp 80°C",
                }}
              />
              <div className="grid grid-cols-3 md:grid-cols-6 gap-2 mt-2">
                {latest &&
                  latest.temperature
                    .slice(3, 9)
                    .map((t, i) => (
                      <SensorGauge
                        key={`T${i + 4}`}
                        label={`T${i + 4}`}
                        value={t}
                        unit="°C"
                        maxValue={settings[`T${i + 4}`] ?? 80}
                      />
                    ))}
              </div>
            </div>
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
                {Array.from({ length: 9 }, (_, i) => (
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
                    {l.pressure.map((p, j) => {
                      const limit = settings[`P${j + 1}`] ?? 6;
                      return (
                        <td
                          key={j}
                          className={`px-3 py-2 text-center font-medium ${
                            p > limit
                              ? "bg-red-50 text-red-600"
                              : "text-gray-800"
                          }`}
                        >
                          {p > limit ? `🚨 ${p}` : p}
                        </td>
                      );
                    })}
                    {l.temperature.map((t, j) => {
                      const limit = settings[`T${j + 1}`] ?? 80;
                      return (
                        <td
                          key={j}
                          className={`px-3 py-2 text-center font-medium ${
                            t > limit
                              ? "bg-orange-50 text-orange-600"
                              : "text-gray-800"
                          }`}
                        >
                          {t > limit ? `🔥 ${t}` : t}
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
