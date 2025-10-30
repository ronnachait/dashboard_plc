"use client";
import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

type PlcStats = {
  count: number;
  size: number;
};

function formatSize(size?: number | null): string {
  if (size == null) return "-"; // null/undefined เท่านั้น
  if (isNaN(size)) return "-"; // NaN
  if (size >= 1024 ** 3) return (size / 1024 ** 3).toFixed(2) + " GB";
  if (size >= 1024 ** 2) return (size / 1024 ** 2).toFixed(2) + " MB";
  if (size >= 1024) return (size / 1024).toFixed(2) + " KB";
  return size + " B"; // 0 → "0 B" ได้แล้ว
}

export default function BackupDeletePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [loading, setLoading] = useState(false);
  const [logs, setLogs] = useState<string[]>([]);
  const [stats, setStats] = useState<PlcStats | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // ✅ Helper: add log
  const addLog = (msg: string) => {
    setLogs((prev) => [`${new Date().toLocaleTimeString()} - ${msg}`, ...prev]);
  };

  // ✅ โหลด state จาก API
  const fetchStats = useCallback(async (isAuto = false) => {
    try {
      if (!isAuto) setRefreshing(true);
      const res = await fetch("/api/plc/state");
      if (!res.ok) throw new Error("ไม่สามารถโหลด State ได้");
      const data: PlcStats = await res.json();
      setStats(data);

      addLog(
        `${isAuto ? "🤖 Auto Refresh" : "🔄 Manual Refresh"} → Rows: ${
          data.count
        }, Size: ${data.size}`
      );
    } catch (err: unknown) {
      console.error(err);
      addLog(`❌ Refresh Stats ล้มเหลว`);
    } finally {
      if (!isAuto) setRefreshing(false);
    }
  }, []);

  // ✅ ตรวจสอบสิทธิ์ Admin/Dev
  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/auth/login");
    } else {
      const role = (session.user.role || "").toLowerCase();
      const allowed = role === "admin" || role === "dev" || role === "cdhw-wfh8ogfup";
      if (!allowed) {
        toast.error("🚫 คุณไม่มีสิทธิ์เข้าใช้งานหน้านี้");
        router.replace("/plc");
      }
    }
  }, [session, status, router]);

  // ✅ Auto refresh ทุก 10 วิ
  useEffect(() => {
    fetchStats();
    const interval = setInterval(() => fetchStats(true), 10000);
    return () => clearInterval(interval);
  }, [fetchStats]);

  // 🚧 ถ้ายังไม่ได้ login หรือไม่ใช่ admin/dev → แสดงข้อความ
  if (!session || !["admin","dev","cdhw-wfh8ogfup"].includes((session.user.role||"").toLowerCase())) {
    return (
      <p className="text-center text-red-600 mt-10">⏳ Checking access...</p>
    );
  }

  // ✅ ฟังก์ชัน Backup
  const handleBackup = async () => {
    try {
      setLoading(true);
      addLog("⏳ เริ่ม backup ...");
      const res = await fetch("/api/plc/backup");
      if (!res.ok) throw new Error("Backup failed");

      const blob = await res.blob();
      const cd = res.headers.get("Content-Disposition");
      let filename = "plclog-backup.csv";
      if (cd) {
        const match = cd.match(/filename="(.+)"/);
        if (match) filename = match[1];
      }

      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      a.click();

      addLog(`✅ Backup สำเร็จ → ${filename}`);
      fetchStats();
    } catch (err: unknown) {
      console.error(err);
      addLog(`❌ Backup ล้มเหลว`);
    } finally {
      setLoading(false);
    }
  };

  // ✅ ฟังก์ชัน Delete
  const handleDelete = async () => {
    if (!confirm("⚠️ ต้องการลบข้อมูล PlcLog ทั้งหมดจริงหรือไม่?")) return;
    try {
      setLoading(true);
      addLog("⏳ เริ่มลบข้อมูล PlcLog ...");
      const res = await fetch("/api/plc/delete-all", { method: "POST" });
      if (!res.ok) throw new Error("Delete failed");

      addLog("🗑 ลบข้อมูล PlcLog เรียบร้อย");
      fetchStats();
    } catch (err: unknown) {
      console.error(err);
      addLog(`❌ ลบข้อมูลล้มเหลว`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-extrabold text-sky-700">
          PlcLog Backup & Delete
        </h1>
        <p className="text-gray-600">สำหรับ Admin เท่านั้น</p>
      </div>

      {/* Stats + Refresh */}
      <div className="bg-white border rounded-lg shadow p-4 flex items-center justify-between text-gray-700 font-medium">
        <div className="flex gap-6">
          <div>
            📊 Rows:{" "}
            <span className="font-bold text-sky-600">
              {stats ? stats.count : "-"}
            </span>
          </div>
          <div>
            💾 Size:{" "}
            <span className="font-bold text-sky-600">
              {stats ? formatSize(stats.size) : "-"}
            </span>
          </div>
        </div>
        <button
          onClick={() => fetchStats()}
          disabled={refreshing}
          className="bg-gray-200 px-3 py-1 rounded hover:bg-gray-300 disabled:opacity-50"
        >
          🔄 Refresh
        </button>
      </div>

      {/* Action buttons */}
      <div className="flex gap-4 justify-center">
        <button
          onClick={handleBackup}
          disabled={loading}
          className="bg-sky-600 text-white px-5 py-2 rounded-lg shadow hover:bg-sky-700 disabled:opacity-50"
        >
          📦 Backup PlcLog
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          className="bg-red-600 text-white px-5 py-2 rounded-lg shadow hover:bg-red-700 disabled:opacity-50"
        >
          🗑 Delete All PlcLog
        </button>
      </div>

      {/* Logs */}
      <div className="bg-gray-900 text-green-300 rounded-lg p-4 h-64 overflow-y-auto font-mono text-sm shadow-inner">
        {logs.length === 0 ? (
          <p className="text-gray-500">ไม่มี log</p>
        ) : (
          <ul className="space-y-1">
            {logs.map((l, i) => (
              <li key={i}>{l}</li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
