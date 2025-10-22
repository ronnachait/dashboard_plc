"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Clock, Fuel, Gauge, Copy } from "lucide-react";

type ProblemItem = {
  date?: string;
  time?: string;
  section?: string;
  partName?: string;
  detail?: string;
  action?: string;
};

type DailyData = {
  totalHours: number;
  fuelIn: number;
  fuelUsed: number;
  engineHour: string;
  subtankLevel: string;
  problems: ProblemItem[];
};

export default function DailyCheckPage() {
  const [token, setToken] = useState<string | null>(null);
  const [date, setDate] = useState("");
  const [shift, setShift] = useState<"day" | "night">("day");
  const [data, setData] = useState<DailyData | null>(null);
  const [pressure, setPressure] = useState("ปกติ");
  const [pressureNote, setPressureNote] = useState("");
  const [temp, setTemp] = useState("ปกติ");
  const [tempNote, setTempNote] = useState("");
  const [engineOil, setEngineOil] = useState("ปกติ");
  const [engineOilNote, setEngineOilNote] = useState("");
  const [subTank, setSubTank] = useState("ปกติ");
  const [subTankNote, setSubTankNote] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ✅ โหลด token จาก URL หรือ localStorage
  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenParam = url.searchParams.get("token");
    if (tokenParam) {
      localStorage.setItem("google_token", tokenParam);
      setToken(tokenParam);
      window.history.replaceState(null, "", "/daily-check");
    } else {
      const stored = localStorage.getItem("google_token");
      if (stored) setToken(stored);
    }
  }, []);

  const handleAuthorize = () => {
    const currentUrl = window.location.pathname; // เช่น /problem หรือ /daily-check
    window.location.href = `/api/google/auth?redirect=${encodeURIComponent(
      currentUrl
    )}`;
  };

  const formatDateForSheet = (isoDate: string) => {
    const [y, m, d] = isoDate.split("-");
    return `${d}-${m}-${y.slice(-2)}`;
  };

  // ✅ ดึงข้อมูลทั้งหมด
  const fetchData = async () => {
    if (!token || !date) return;
    setLoading(true);
    setError(null);
    let problemData: { problems?: ProblemItem[] } = { problems: [] };

    try {
      const sheetRes = await fetch(
        `/api/google/sheet?token=${token}&date=${formatDateForSheet(
          date
        )}&shift=${shift}`
      );

      // 👇 ถ้า token หมดอายุ (401) → ล้าง token แล้วให้ login ใหม่
      if (sheetRes.status === 401) {
        const data = await sheetRes.json();
        alert("🔑 Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
        window.location.href = data.loginUrl;
        return;
      }

      if (!sheetRes.ok)
        throw new Error("ไม่สามารถดึงข้อมูลจาก Google Sheet ได้");
      const sheetData = await sheetRes.json();

      const dbRes = await fetch(`/api/fuel/log?date=${date}&shift=${shift}`);
      if (!dbRes.ok) throw new Error("ไม่สามารถดึงข้อมูลน้ำมันจากฐานข้อมูลได้");
      const db = await dbRes.json();

      const problemRes = await fetch(
        `/api/google/problem?token=${token}&date=${formatDateForSheet(
          date
        )}&shift=${shift}`
      );
      if (problemRes.ok) {
        const res = await problemRes.json();
        problemData = res;
      }

      const vehicleRes = await fetch(
        "/api/vehicle/23429582-fbfd-4c7b-95c1-10c17b3dfebb"
      );
      const vehicleData = vehicleRes.ok ? await vehicleRes.json() : null;

      setData({
        totalHours: sheetData.totalHours ?? 0,
        fuelIn: db.fuelIn ?? 0,
        fuelUsed: db.fuelUsed ?? 0,
        engineHour: vehicleData?.vehicle?.lastHourAfterTest?.toString() ?? "-",
        subtankLevel: db.subtankLevel ?? "-",
        problems:
          Array.isArray(problemData.problems) && problemData.problems.length > 0
            ? problemData.problems
            : [],
      });
    } catch (err) {
      console.error("❌ Fetch error:", err);
      setError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  };

  // ✅ ปุ่ม Copy รายงาน
  const handleCopy = () => {
    if (!data) return;

    const targetHours = 8;

    const hourPercent = ((data.totalHours / targetHours) * 100).toFixed(0);

    const text = `
📅 วันที่: ${date} (${shift === "day" ? "กะกลางวัน" : "กะกลางคืน"})
⏱ ชั่วโมงทดสอบ: ${data.totalHours.toFixed(
      1
    )} / ${targetHours} ชม. (${hourPercent}%)
⛽ ซื้อน้ำมัน: ${data.fuelIn} ลิตร
🔥 ใช้น้ำมัน: ${data.fuelUsed} ลิตร
⚙️ ชั่วโมงรถล่าสุด: ${data.engineHour} ชม.

🛢 ระดับน้ำมันเครื่องยนต์: ${engineOil} ${
      engineOilNote ? `(${engineOilNote})` : ""
    }
🧊 ระดับน้ำมันซับแทงค์: ${subTank} ${subTankNote ? `(${subTankNote})` : ""}
💨 ความดันทุกจุด: ${pressure} ${pressureNote ? `(${pressureNote})` : ""}
🌡 อุณหภูมิทุกจุด: ${temp} ${tempNote ? `(${tempNote})` : ""}

🔧 ปัญหาที่พบ:
${
  data.problems.length > 0
    ? data.problems
        .map((p, i) => `${i + 1}. ${p.section}: ${p.partName} - ${p.detail}`)
        .join("\n")
    : "ไม่มี"
}
    `.trim();

    navigator.clipboard.writeText(text);
    alert("✅ คัดลอกรายงานเรียบร้อย! พร้อมแปะใน LINE ได้เลย");
  };

  if (!token)
    return (
      <div className="flex flex-col items-center justify-center h-screen">
        <h1 className="text-2xl mb-4 font-semibold">📋 Daily Check</h1>
        <Button onClick={handleAuthorize} className="bg-sky-600 text-white">
          Sign in with Google
        </Button>
      </div>
    );

  return (
    <div className="max-w-3xl mx-auto p-6 space-y-6">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-sky-700">
          🧭 Daily Check Dashboard
        </h1>
        <p className="text-gray-500 text-sm">
          ข้อมูลจาก Google Sheet + ฐานข้อมูลภายใน
        </p>
      </div>

      {/* ฟอร์มเลือกวันที่และกะ */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>ผลทดสอบวันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
              />
            </div>
            <div>
              <Label>กะ</Label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={shift}
                onChange={(e) => setShift(e.target.value as "day" | "night")}
              >
                <option value="day">กลางวัน</option>
                <option value="night">กลางคืน</option>
              </select>
            </div>
          </div>
          <Button
            onClick={fetchData}
            disabled={!date || loading}
            className="w-full bg-sky-600 text-white"
          >
            {loading ? "กำลังดึงข้อมูล..." : "ดึงข้อมูลจาก Sheet & DB"}
          </Button>
        </CardContent>
      </Card>

      {loading && <Loader />}
      {error && <p className="text-red-600 text-center font-medium">{error}</p>}

      {!loading && data && (
        <Card>
          <CardContent className="pt-4 space-y-3 text-sm sm:text-base">
            {/* summary */}
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-sky-600" /> ชั่วโมงการทดสอบกะนี้:
              <b>{data.totalHours.toFixed(1)}</b> ชม
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-green-600" /> ซื้อน้ำมัน:{" "}
              <b>{data.fuelIn}</b> ลิตร
            </div>
            <div className="flex items-center gap-2">
              <Fuel className="w-5 h-5 text-orange-600" /> ใช้น้ำมัน:{" "}
              <b>{data.fuelUsed}</b> ลิตร
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-green-600" /> ชั่วโมงรถล่าสุด:
              <b>{data.engineHour}</b> ชม
            </div>

            {/* dropdowns */}
            {[
              {
                label: "ระดับน้ำมันเครื่องยนต์",
                state: engineOil,
                setState: setEngineOil,
                note: engineOilNote,
                setNote: setEngineOilNote,
              },
              {
                label: "ระดับน้ำมันซับแทงค์",
                state: subTank,
                setState: setSubTank,
                note: subTankNote,
                setNote: setSubTankNote,
              },
              {
                label: "ความดันทุกจุด",
                state: pressure,
                setState: setPressure,
                note: pressureNote,
                setNote: setPressureNote,
              },
              {
                label: "อุณหภูมิทุกจุด",
                state: temp,
                setState: setTemp,
                note: tempNote,
                setNote: setTempNote,
              },
            ].map((item, i) => (
              <div key={i}>
                <Label>{item.label}</Label>
                <div className="flex gap-2 mt-1">
                  <select
                    className="border rounded px-2 py-1"
                    value={item.state}
                    onChange={(e) => item.setState(e.target.value)}
                  >
                    <option>ปกติ</option>
                    <option>มีปัญหา</option>
                  </select>
                  {item.state === "มีปัญหา" && (
                    <Input
                      placeholder="ระบุสาเหตุ..."
                      value={item.note}
                      onChange={(e) => item.setNote(e.target.value)}
                    />
                  )}
                </div>
              </div>
            ))}

            {/* problems */}
            <div>
              <Label className="font-semibold">ปัญหาที่เกิดขึ้น</Label>
              {data.problems.length > 0 ? (
                <ul className="pl-6 list-disc mt-2 text-gray-700 space-y-1">
                  {data.problems.map((p, i) => (
                    <li key={i}>
                      <b>{p.section}</b>: {p.partName} — {p.detail}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-gray-600">ไม่มี</p>
              )}
            </div>

            <div className="pt-4 flex justify-end">
              <Button
                onClick={handleCopy}
                className="bg-sky-500 hover:bg-sky-600 text-white"
              >
                <Copy className="w-4 h-4 mr-2 inline" /> Copy รายงาน
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
