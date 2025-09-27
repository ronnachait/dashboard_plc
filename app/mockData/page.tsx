"use client";
import { useEffect, useState, useRef } from "react";

type MockData = {
  pressure: number[];
  temperature: number[];
  timestamp: string;
};

export default function MockSender() {
  const [lastData, setLastData] = useState<MockData | null>(null);
  const [count, setCount] = useState(0);
  const [running, setRunning] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // ฟังก์ชัน mock data
  const sendData = async () => {
    try {
      const payload = {
        pressure: Array.from({ length: 3 }, () =>
          Number((Math.random() * 5 + 1).toFixed(2))
        ),
        temperature: Array.from({ length: 6 }, () =>
          Number((Math.random() * 30 + 25).toFixed(1))
        ),
      };

      const res = await fetch("/api/plc/log", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      await res.json();
      setLastData({ ...payload, timestamp: new Date().toLocaleTimeString() });
      setCount((c) => c + 1);
    } catch (err) {
      console.error("❌ error sending mock:", err);
    }
  };

  // เริ่มส่งข้อมูลทุก 2 วิ
  const startSending = () => {
    if (intervalRef.current) return; // กันซ้ำ
    sendData(); // ยิงทันที 1 รอบ
    intervalRef.current = setInterval(sendData, 2000);
    setRunning(true);
  };

  // หยุดส่งข้อมูล
  const stopSending = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setRunning(false);
  };

  // cleanup ตอน unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return (
    <div className="p-6 bg-white rounded-lg shadow border max-w-lg mx-auto space-y-4">
      <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
        🚀 Mock Sender
        <span
          className={`text-xs px-2 py-1 rounded ${
            running
              ? "bg-green-100 text-green-700"
              : "bg-gray-200 text-gray-600"
          }`}
        >
          {running ? "Running" : "Stopped"}
        </span>
      </h2>

      <div className="flex gap-3">
        <button
          onClick={startSending}
          disabled={running}
          className={`px-4 py-2 rounded-md text-white text-sm font-semibold shadow ${
            running
              ? "bg-green-300 cursor-not-allowed"
              : "bg-green-600 hover:bg-green-700"
          }`}
        >
          ▶ START
        </button>
        <button
          onClick={stopSending}
          disabled={!running}
          className={`px-4 py-2 rounded-md text-white text-sm font-semibold shadow ${
            !running
              ? "bg-red-300 cursor-not-allowed"
              : "bg-red-600 hover:bg-red-700"
          }`}
        >
          ■ STOP
        </button>
      </div>

      <div className="text-sm text-gray-600">
        จำนวนรอบที่ส่งแล้ว:{" "}
        <span className="font-semibold text-blue-600">{count}</span>
      </div>

      {lastData && (
        <div className="space-y-2">
          <p className="text-xs text-gray-500">
            อัปเดตล่าสุด: {lastData.timestamp}
          </p>

          <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
            <h3 className="font-semibold text-blue-700 text-sm mb-1">
              Pressure (bar)
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {lastData.pressure.map((p, i) => (
                <div
                  key={i}
                  className="p-2 bg-white rounded border shadow-sm text-gray-700"
                >
                  <p className="text-xs">P{i + 1}</p>
                  <p className="font-bold">{p}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="p-3 rounded-lg bg-green-50 border border-green-200">
            <h3 className="font-semibold text-green-700 text-sm mb-1">
              Temperature (°C)
            </h3>
            <div className="grid grid-cols-3 gap-2 text-center">
              {lastData.temperature.map((t, i) => (
                <div
                  key={i}
                  className="p-2 bg-white rounded border shadow-sm text-gray-700"
                >
                  <p className="text-xs">T{i + 1}</p>
                  <p className="font-bold">{t}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
