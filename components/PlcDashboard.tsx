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
import { Wifi, Activity, AlertTriangle } from "lucide-react";
import AlarmCard from "./AlarmCard";
import SensorGauge from "./SensorGauge";
import SensorChart from "./SensorChart";
import { toast } from "sonner";
import PlcControls from "@/components/PlcControls";

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
  const [maintenanceAlerts, setMaintenanceAlerts] = useState<
    {
      id: string;
      item: string;
      nextDueHour: number;
      vehicleName: string;
      plateNo: string;
    }[]
  >([]);

  useEffect(() => {
    const fetchMaintenanceAlerts = async () => {
      try {
        const res = await fetch("/api/maintenance/alerts");
        if (!res.ok) return;
        const data = await res.json();

        // ✅ filter เฉพาะที่เกินรอบ
        const alerts = data.alerts ?? [];
        setMaintenanceAlerts(alerts);

        if (alerts.length > 0) {
          toast.warning(`⚠️ มี ${alerts.length} รายการบำรุงถึงรอบแล้ว`);
        }
      } catch (err) {
        console.error("⚠️ Maintenance fetch failed:", err);
      }
    };

    fetchMaintenanceAlerts();
    const interval = setInterval(fetchMaintenanceAlerts, 60000); // 🔄 ทุก 1 นาที
    return () => clearInterval(interval);
  }, []);

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
  useEffect(() => {
    if (latest) {
      console.log("📡 Latest data:", {
        pressure: latest.pressure,
        temperature: latest.temperature,
      });
    }
  }, [latest]);
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
    <div className="p-6 space-y-6 bg-gradient-to-br from-slate-50 to-slate-100 min-h-screen">
      {/* แจ้งเตือน error */}
      {plcNoResponse && (
        <div className="p-3 rounded-lg border border-red-400 bg-red-50 text-red-700 flex items-center gap-2 shadow-lg animate-slide-in">
          <AlertTriangle className="h-5 w-5 text-red-600 animate-pulse" />
          <span className="font-semibold">❌ ไม่สามารถเชื่อมต่อ PLC ได้</span>
        </div>
      )}
      {greaseAlerts.length > 0 && (
        <div className="p-3 rounded-lg border border-red-400 bg-gradient-to-r from-red-50 to-red-100 text-red-700 shadow-lg text-xs animate-slide-in">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-1 text-sm">
              🛢️ จารบีครบ {greaseAlerts.length} จุด
            </h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {greaseAlerts.map((g) => (
              <span
                key={g.id}
                className="px-3 py-1 bg-red-100 border border-red-300 rounded-full text-xs font-medium text-red-800 whitespace-nowrap shadow-sm hover:shadow-md transition-shadow"
              >
                จุด {g.pointNo}: {g.name}
              </span>
            ))}
          </div>
        </div>
      )}

      {alarm.active && (
        <div className="p-3 rounded-lg border border-yellow-500 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 shadow-lg animate-slide-in">
          ⚠️ Alarm ยังไม่ถูก Reset → {alarm.reason}
        </div>
      )}

      {maintenanceAlerts.length > 0 && (
        <div className="p-3 rounded-lg border border-yellow-400 bg-gradient-to-r from-yellow-50 to-yellow-100 text-yellow-800 shadow-lg text-xs animate-slide-in">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold flex items-center gap-1 text-sm">
              ⚙️ รอบบำรุงครบ {maintenanceAlerts.length} รายการ
            </h2>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {maintenanceAlerts.map((m) => (
              <span
                key={m.id}
                className="px-3 py-1 bg-yellow-100 border border-yellow-300 rounded-full text-xs font-medium text-yellow-800 whitespace-nowrap shadow-sm hover:shadow-md transition-shadow"
              >
                {m.vehicleName} ({m.plateNo}) : {m.item}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Status + Controls */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 animate-fade-in">
        {/* System Status */}
        <div
          className={`p-4 rounded-xl shadow-lg border flex items-center gap-3 card-hover ${
            systemStatus === "running"
              ? "bg-gradient-to-br from-green-50 to-green-100 border-green-400"
              : systemStatus === "offline"
              ? "bg-gradient-to-br from-gray-100 to-gray-200 border-gray-400"
              : "bg-gradient-to-br from-red-50 to-red-100 border-red-400"
          }`}
        >
          <Activity
            className={`h-6 w-6 ${
              systemStatus === "running"
                ? "text-green-600"
                : systemStatus === "offline"
                ? "text-gray-500"
                : "text-red-600"
            } animate-pulse-slow`}
          />
          <div>
            <p className="text-xs text-gray-600 font-medium">System</p>
            <p className="font-bold text-sm capitalize">{systemStatus}</p>
          </div>
        </div>

        {/* Last Update */}
        <div className="p-4 rounded-xl shadow-lg border bg-gradient-to-br from-white to-slate-50 flex items-center gap-3 card-hover">
          <Wifi className="h-6 w-6 text-sky-500 animate-pulse-slow" />
          <div>
            <p className="text-xs text-gray-600 font-medium">Last Update</p>
            <p className="font-bold text-sm text-gray-800">{lastUpdate}</p>
          </div>
        </div>

        {/* Alarm Card */}
        <AlarmCard
          active={alarm.active}
          reasons={alarm.reason ? alarm.reason.split(", ") : []}
        />
        <PlcControls
          handleClick={handleClick}
          alarm={alarm}
          plcStatus={plcStatus ?? false}
          loading={loading}
          buttonsDisabled={buttonsDisabled}
          setSettings={setSettings}
        />
      </div>
      {/* Sensor Zones */}
      <div className="space-y-8 animate-slide-up">
        {/* 🔵 Cylinder Bench Test */}
        <div className="p-6 rounded-2xl shadow-xl border border-blue-200 bg-gradient-to-br from-white to-blue-50 card-hover">
          <h2 className="text-xl font-bold bg-gradient-to-r from-blue-600 to-blue-800 bg-clip-text text-transparent mb-4 flex items-center gap-2">
            <span className="text-2xl">🔵</span> Cylinder Bench Test
          </h2>
          {/* Cylinder Temp (3 จุด) */}
          <SensorChart
            title="Cylinder Temperature (3 จุด)"
            labels={logs.map((l) => l.createdAt)}
            datasets={[
              {
                label: "T1",
                data: logs.map((l) => l.temperature?.[0] ?? 0),
                color: "#3b82f6",
              },
              {
                label: "T2",
                data: logs.map((l) => l.temperature?.[1] ?? 0),
                color: "#06b6d4",
              },
              {
                label: "T3",
                data: logs.map((l) => l.temperature?.[2] ?? 0),
                color: "#1e40af",
              },
            ]}
            maxY={120}
            threshold={{ value: 80, color: "orange", label: "Max Temp 80°C" }}
          />

          <div className="grid grid-cols-3 gap-2 mt-2">
            {(latest?.temperature ?? []).slice(0, 3).map((t, i) => (
              <SensorGauge
                key={`T${i + 1}`}
                label={`T${i + 1}`}
                value={t ?? 0}
                unit="°C"
                maxValue={settings[`T${i + 1}`] ?? 80}
              />
            ))}
          </div>
        </div>

        {/* 🟢 Chopper Bench Test */}
        <div className="p-6 rounded-2xl shadow-xl border border-green-200 bg-gradient-to-br from-white to-green-50 card-hover">
          <h2 className="text-xl font-bold bg-gradient-to-r from-green-600 to-green-800 bg-clip-text text-transparent mb-4 flex items-center gap-2">
            <span className="text-2xl">🟢</span> Chopper Bench Test
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Pressure */}
            <div>
              {/* Chopper Pressure (3 จุด) */}
              <SensorChart
                title="Chopper Pressure (3 จุด)"
                labels={logs.map((l) => l.createdAt)}
                datasets={[
                  {
                    label: "P1",
                    data: logs.map((l) => l.pressure?.[0] ?? 0),
                    color: "#ef4444",
                  },
                  {
                    label: "P2",
                    data: logs.map((l) => l.pressure?.[1] ?? 0),
                    color: "#f97316",
                  },
                  {
                    label: "P3",
                    data: logs.map((l) => l.pressure?.[2] ?? 0),
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
                {(latest?.pressure ?? []).map((p, i) => (
                  <SensorGauge
                    key={`P${i + 1}`}
                    label={`P${i + 1}`}
                    value={p ?? 0}
                    unit="bar"
                    maxValue={settings[`P${i + 1}`] ?? 12}
                  />
                ))}
              </div>
            </div>

            {/* Temperature */}
            <div>
              {/* Chopper Temperature (6 จุด) */}
              <SensorChart
                title="Chopper Temperature (6 จุด)"
                labels={logs.map((l) => l.createdAt)}
                datasets={Array.from({ length: 6 }, (_, i) => ({
                  label: `T${i + 4}`,
                  data: logs.map((l) => l.temperature?.[i + 3] ?? 0),
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
                {(latest?.temperature ?? []).slice(3, 9).map((t, i) => (
                  <SensorGauge
                    key={`T${i + 4}`}
                    label={`T${i + 4}`}
                    value={t ?? 0}
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
      <div className="p-6 rounded-2xl border border-slate-200 bg-gradient-to-br from-white to-slate-50 shadow-xl card-hover">
        <div className="flex justify-between items-center mb-4">
          <h3 className="font-bold text-gray-800 text-lg flex items-center gap-2">
            <span className="text-xl">📜</span> Recent Logs / บันทึกล่าสุด
          </h3>
          <div className="flex gap-2">
            <button
              onClick={() => setSortOrder(sortOrder === "asc" ? "desc" : "asc")}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-gray-600 to-gray-700 text-white text-sm font-medium hover:from-gray-700 hover:to-gray-800 shadow-md hover:shadow-lg transition-all"
            >
              {sortOrder === "asc" ? "⬆️ เก่าก่อน" : "⬇️ ใหม่ก่อน"}
            </button>
            <button
              onClick={exportToCSV}
              className="px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 text-white text-sm font-medium hover:from-blue-700 hover:to-blue-800 shadow-md hover:shadow-lg transition-all"
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
                    {(l.pressure ?? []).map((p, j) => {
                      const limit = settings[`P${j + 1}`] ?? 6;
                      if (p == null) {
                        return (
                          <td
                            key={j}
                            className="px-3 py-2 text-center text-gray-400 italic"
                          >
                            N/A
                          </td>
                        );
                      }
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
                    {(l.temperature ?? []).map((t, j) => {
                      const limit = settings[`T${j + 1}`] ?? 80;
                      if (t == null) {
                        return (
                          <td
                            key={j}
                            className="px-3 py-2 text-center text-gray-400 italic"
                          >
                            N/A
                          </td>
                        );
                      }
                      return (
                        <td
                          key={j}
                          className={`px-3 py-2 text-center font-medium ${
                            t > limit
                              ? "bg-red-50 text-red-600"
                              : "text-gray-800"
                          }`}
                        >
                          {t > limit ? `🚨 ${t}` : t}
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
