"use client";
import { useEffect, useState } from "react";
import {
  Server,
  Cpu,
  MemoryStick,
  Network,
  Activity,
  AlertTriangle,
  CheckCircle,
  Clock,
} from "lucide-react";
import { Line } from "react-chartjs-2";
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

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

type PiStatus = {
  pi: {
    hostname: string;
    type: string;
    platform: string;
    arch: string;
    release: string;
    version: string | null;
    uptime: number;
    load: number[];
    memory: { free: number; total: number };
    cpus: { model: string; speed: number }[];
    network: Record<
      string,
      { address: string; family: string; internal: boolean }[]
    >;
    user: { username: string; homedir: string };
    time: string;
  };
  services: {
    name: string;
    status: string;
    uptime: number;
    restarts: number;
  }[];
};

function formatDuration(seconds: number) {
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);

  if (days > 0) return `${days}d ${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

export default function PiDashboard() {
  const [status, setStatus] = useState<PiStatus | null>(null);
  const [cpuHistory, setCpuHistory] = useState<number[]>([]);
  const [memHistory, setMemHistory] = useState<number[]>([]);
  const [labels, setLabels] = useState<string[]>([]);

  const load = async () => {
    try {
      const res = await fetch("/api/pi/status");
      if (!res.ok) throw new Error("API failed");
      const data = await res.json();
      setStatus(data);

      // ⏳ เก็บค่า history 20 จุด
      setCpuHistory((prev) => [...prev.slice(-19), data.pi.load[0]]);
      const usedMem =
        ((data.pi.memory.total - data.pi.memory.free) / data.pi.memory.total) *
        100;
      setMemHistory((prev) => [...prev.slice(-19), usedMem]);
      setLabels((prev) => [
        ...prev.slice(-19),
        new Date().toLocaleTimeString("th-TH", {
          minute: "2-digit",
          second: "2-digit",
        }),
      ]);
    } catch (err) {
      console.error("❌ Load failed:", err);
    }
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 5000);
    return () => clearInterval(interval);
  }, []);

  if (!status)
    return <div className="p-4 rounded bg-white shadow">⏳ Loading...</div>;

  const { pi, services } = status;

  return (
    <div className="p-6 space-y-6 bg-gray-50 min-h-screen">
      <h2 className="text-xl font-bold flex items-center gap-2 text-sky-700">
        <Server className="h-6 w-6" /> Raspberry Pi Monitoring
      </h2>

      {/* ✅ Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card
          icon={<Server className="h-6 w-6 text-sky-600" />}
          title="Host"
          value={pi.hostname}
        />
        <Card
          icon={<Clock className="h-6 w-6 text-purple-600" />}
          title="Uptime"
          value={formatDuration(pi.uptime)}
        />
        <Card
          icon={<MemoryStick className="h-6 w-6 text-green-600" />}
          title="Memory"
          value={`${Math.round(pi.memory.free / 1024 / 1024)}MB free`}
        />
        <Card
          icon={<Activity className="h-6 w-6 text-orange-600" />}
          title="Load"
          value={pi.load.map((n) => n.toFixed(2)).join(", ")}
        />
      </div>

      {/* ✅ Extra Info */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 bg-white rounded-lg shadow space-y-2">
          <h3 className="font-semibold text-gray-700">🖥 Host Details</h3>
          <p className="text-sm text-gray-600">
            OS: {pi.type} {pi.release}
          </p>
          <p className="text-sm text-gray-600">Platform: {pi.platform}</p>
          <p className="text-sm text-gray-600">Arch: {pi.arch}</p>
          <p className="text-sm text-gray-600">Version: {pi.version}</p>
          <p className="text-sm text-gray-600">User: {pi.user.username}</p>
        </div>

        <div className="p-4 bg-white rounded-lg shadow space-y-2">
          <h3 className="font-semibold text-gray-700 flex gap-2 items-center">
            <Cpu className="h-5 w-5" /> CPU Info
          </h3>
          <ul className="text-sm text-gray-600">
            {pi.cpus.slice(0, 3).map((c, i) => (
              <li key={i}>
                {c.model} @ {c.speed}MHz
              </li>
            ))}
          </ul>
        </div>

        <div className="p-4 bg-white rounded-lg shadow space-y-2 md:col-span-2">
          <h3 className="font-semibold text-gray-700 flex gap-2 items-center">
            <Network className="h-5 w-5" /> Network Interfaces
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {Object.entries(pi.network).map(([iface, addrs]) => (
              <div key={iface} className="p-2 border rounded bg-gray-50">
                <p className="font-medium text-gray-700">{iface}</p>
                {addrs.map((a, j) => (
                  <p key={j} className="text-xs text-gray-600">
                    {a.address} ({a.family}) {a.internal ? "(internal)" : ""}
                  </p>
                ))}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ✅ Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <ChartCard title="CPU Load (%)">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "CPU Load",
                  data: cpuHistory,
                  borderColor: "rgb(59,130,246)",
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
          />
        </ChartCard>
        <ChartCard title="Memory Usage (%)">
          <Line
            data={{
              labels,
              datasets: [
                {
                  label: "Memory Usage",
                  data: memHistory,
                  borderColor: "rgb(34,197,94)",
                  tension: 0.3,
                },
              ],
            }}
            options={{
              responsive: true,
              plugins: { legend: { display: false } },
            }}
          />
        </ChartCard>
      </div>

      {/* ✅ PM2 Services */}
      <div className="p-4 bg-white rounded-lg shadow">
        <h3 className="font-semibold text-gray-700 flex items-center gap-2 mb-3">
          <Activity className="h-5 w-5" /> PM2 Services
        </h3>
        <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
          {services.map((s, i) => (
            <li
              key={i}
              className="p-3 rounded border bg-gray-50 flex justify-between items-center"
            >
              <div>
                <p className="font-medium">{s.name}</p>
                <p className="text-xs text-gray-500">
                  ⏳ {formatDuration(s.uptime)} • 🔄 {s.restarts} restarts
                </p>
              </div>
              <span
                className={`flex items-center gap-1 ${
                  s.status === "online" ? "text-green-600" : "text-red-600"
                }`}
              >
                {s.status === "online" ? (
                  <CheckCircle className="h-4 w-4" />
                ) : (
                  <AlertTriangle className="h-4 w-4" />
                )}
                {s.status}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function Card({
  icon,
  title,
  value,
}: {
  icon: React.ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="p-4 rounded-lg border bg-white shadow flex flex-col gap-1">
      <div className="flex items-center gap-2 text-gray-600 text-sm">
        {icon}
        {title}
      </div>
      <div className="font-bold text-gray-800">{value}</div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="p-4 bg-white rounded-lg shadow">
      <h3 className="font-semibold text-gray-700 mb-2">{title}</h3>
      {children}
    </div>
  );
}
