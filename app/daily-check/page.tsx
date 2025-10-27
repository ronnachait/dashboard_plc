"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader } from "@/components/ui/loader";
import { Clock, Fuel, Gauge, Copy } from "lucide-react";
import { toast } from "sonner";

type ProblemItem = {
  date?: string;
  time?: string;
  section?: string;
  partName?: string;
  detail?: string;
  action?: string;
  needSolution?: boolean; // ✅ เพิ่มบรรทัดนี้
};

type DailyData = {
  totalHours: number;
  fuelIn: number;
  fuelUsed: number;
  engineHour: string;
  engineHourTest: number;
  subtankLevel: string;
  firstHyd: string;
  firstEG: string;
  problems: ProblemItem[];
};

export default function DailyCheckPage() {
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
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

  // ✅ ตรวจสอบว่ามี Google Token หรือยัง
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/google/token");
        setHasGoogleAuth(res.ok);
      } catch {
        setHasGoogleAuth(false);
      }
    };
    checkAuth();
  }, []);

  const handleAuthorize = () => {
    const currentUrl = window.location.pathname;
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
    if (!date) return;
    setLoading(true);
    setError(null);
    let problemData: { problems?: ProblemItem[] } = { problems: [] };

    try {
      const sheetRes = await fetch(
        `/api/google/sheet?date=${formatDateForSheet(date)}&shift=${shift}`
      );

      // 👇 ถ้า token หมดอายุ (401) → ให้ authorize ใหม่
      if (sheetRes.status === 401) {
        const data = await sheetRes.json();
        if (data.needAuth) {
          toast.warning("🔒 กรุณาเชื่อมต่อ Google Account");
          handleAuthorize();
          return;
        }
      }

      if (!sheetRes.ok)
        throw new Error("ไม่สามารถดึงข้อมูลจาก Google Sheet ได้");
      const sheetData = await sheetRes.json();

      console.log("sheetData", sheetData);
      const dbRes = await fetch(`/api/fuel/log?date=${date}&shift=${shift}`);
      if (!dbRes.ok) throw new Error("ไม่สามารถดึงข้อมูลน้ำมันจากฐานข้อมูลได้");
      const db = await dbRes.json();

      const problemRes = await fetch(
        `/api/google/problem?date=${formatDateForSheet(date)}&shift=${shift}`
      );
      if (problemRes.ok) {
        const res = await problemRes.json();
        problemData = res;
      }

      const vehicleRes = await fetch(
        "/api/vehicle/23429582-fbfd-4c7b-95c1-10c17b3dfebb"
      );
      const vehicleData = vehicleRes.ok ? await vehicleRes.json() : null;
      const before = Number(vehicleData?.vehicle?.lastHourBeforeTest ?? 0);
      const after = Number(vehicleData?.vehicle?.lastHourAfterTest ?? 0);
      const engineHourTest = after - before;
      setData({
        totalHours: sheetData.totalHours ?? 0,
        fuelIn: db.fuelIn ?? 0,
        fuelUsed: db.fuelUsed ?? 0,
        engineHour: vehicleData?.vehicle?.lastHourAfterTest?.toString() ?? "-",
        engineHourTest: engineHourTest,
        subtankLevel: db.subtankLevel ?? "-",

        // ✅ เอามาจาก sheetData ไม่ใช่ db
        firstHyd: String(sheetData.firstHYD ?? ""), // normalize: HYD -> Hyd
        firstEG: String(sheetData.firstEG ?? ""),

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
*Daily Check*

📅 วันที่: ${date} (${shift === "day" ? "กะกลางวัน" : "กะกลางคืน"})
⏱ ชั่วโมงทดสอบ: ${data.totalHours.toFixed(
      1
    )} / ${targetHours} ชม. (${hourPercent}%)
⛽ ซื้อน้ำมัน: ${data.fuelIn} ลิตร
🔥 ใช้น้ำมัน: ${data.fuelUsed} ลิตร
⚙️ ชั่วโมงรถล่าสุด: ${data.engineHour} ชม.
⚙️ ชั่วโมงการทดสอบ: ${data.engineHourTest} ชม.

🛢 ระดับน้ำมันเครื่องยนต์: ${engineOil} - ${data?.firstEG || "-"} mm ${
      engineOilNote ? `(${engineOilNote})` : ""
    }
🧊 ระดับน้ำมันซับแทงค์: ${subTank} - ${data?.firstHyd || "-"} mm ${
      subTankNote ? `(${subTankNote})` : ""
    }
💨 ความดันทุกจุด: ${pressure} ${pressureNote ? `(${pressureNote})` : ""}
🌡 อุณหภูมิทุกจุด: ${temp} ${tempNote ? `(${tempNote})` : ""}

🔧 ปัญหาที่พบ:
${
  data.problems.length > 0
    ? data.problems
        .map(
          (p, i) =>
            `${i + 1}. ${p.section}: ${p.partName} - ${p.detail}${
              p.needSolution ? " (ต้องการแนวทางการแก้ไข)" : ""
            }`
        )
        .join("\n")
    : "ไม่มี"
}
    `.trim();

    navigator.clipboard.writeText(text);
    alert("✅ คัดลอกรายงานเรียบร้อย! พร้อมแปะใน LINE ได้เลย");
  };

  if (!hasGoogleAuth)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 text-center max-w-md animate-scale-in">
          <h1 className="text-3xl mb-4 font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            📋 Daily Check
          </h1>
          <p className="text-gray-600 mb-6">
            ต้องเชื่อมต่อกับ Google Account เพื่อดึงข้อมูลจาก Sheets
          </p>
          <Button 
            onClick={handleAuthorize} 
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            🔗 Connect Google Account
          </Button>
        </div>
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="text-center animate-fade-in">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent mb-2">
          🧭 Daily Check Dashboard
        </h1>
        <p className="text-gray-500">
          ข้อมูลจาก Google Sheet + ฐานข้อมูลภายใน
        </p>
      </div>

      {/* ฟอร์มเลือกวันที่และกะ */}
      <Card className="shadow-xl border-slate-200 animate-slide-up">
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-gray-700 font-medium">ผลทดสอบวันที่</Label>
              <Input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="mt-1 shadow-sm"
              />
            </div>
            <div>
              <Label className="text-gray-700 font-medium">กะ</Label>
              <select
                className="border border-gray-300 rounded-lg px-3 py-2 w-full mt-1 shadow-sm focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                value={shift}
                onChange={(e) => setShift(e.target.value as "day" | "night")}
              >
                <option value="day">กลางวัน ☀️</option>
                <option value="night">กลางคืน 🌙</option>
              </select>
            </div>
          </div>
          <Button
            onClick={fetchData}
            disabled={!date || loading}
            className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            {loading ? "กำลังดึงข้อมูล... ⏳" : "ดึงข้อมูลจาก Sheet & DB 📊"}
          </Button>
        </CardContent>
      </Card>

      {loading && <Loader />}
      {error && <p className="text-red-600 text-center font-medium">{error}</p>}

      {!loading && data && (
        <Card className="shadow-xl border-slate-200 animate-slide-up">
          <CardContent className="pt-6 space-y-4 text-sm sm:text-base">
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
              <Gauge className="w-5 h-5 text-red-600" /> ชั่วโมงรถล่าสุด:
              <b>{data.engineHour}</b> ชม
            </div>
            <div className="flex items-center gap-2">
              <Gauge className="w-5 h-5 text-green-600" />{" "}
              ชั่วโมงการทดสอบทั้งหมด:
              <b>{data.engineHourTest}</b> ชม
            </div>

            {/* dropdowns */}
            {[
              {
                label: "ระดับน้ำมันเครื่องยนต์",
                state: engineOil,
                setState: setEngineOil,
                note: engineOilNote,
                setNote: setEngineOilNote,
                level: data?.firstEG || "-", // 👈 เพิ่ม
              },
              {
                label: "ระดับน้ำมันซับแทงค์",
                state: subTank,
                setState: setSubTank,
                note: subTankNote,
                setNote: setSubTankNote,
                level: data?.firstHyd || "-", // 👈 เพิ่ม
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
                <div className="flex gap-2 mt-1 items-center">
                  <select
                    className="border rounded px-2 py-1"
                    value={item.state}
                    onChange={(e) => item.setState(e.target.value)}
                  >
                    <option>ปกติ</option>
                    <option>มีปัญหา</option>
                  </select>

                  {/* ✅ โชว์ระดับจริงจาก Sheet */}
                  {item.level && (
                    <span className="text-gray-500 text-sm">
                      ( {item.level} mm )
                    </span>
                  )}

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
            {/* problems */}
            <div>
              <Label className="font-semibold">ปัญหาที่เกิดขึ้น</Label>

              {data.problems.length > 0 ? (
                <ul className="pl-6 list-disc mt-2 text-gray-700 space-y-3">
                  {data.problems.map((p, i) => (
                    <li key={i} className="space-y-1">
                      <div className="flex flex-col">
                        <span>
                          <b>{p.section}</b>: {p.partName} — {p.detail}{" "}
                          {p.needSolution && (
                            <span className="text-sky-600 text-sm font-medium">
                              (ต้องการแนวทางการแก้ไข)
                            </span>
                          )}
                        </span>

                        {/* ✅ checkbox แยกแต่ละปัญหา */}
                        <label className="flex items-center gap-2 ml-1 mt-1 cursor-pointer select-none">
                          <input
                            type="checkbox"
                            checked={p.needSolution || false}
                            onChange={(e) => {
                              const updated = [...data.problems];
                              updated[i] = {
                                ...p,
                                needSolution: e.target.checked,
                              };
                              setData({ ...data, problems: updated });
                            }}
                            className="w-4 h-4 accent-sky-600 cursor-pointer"
                          />
                          <span className="text-sm text-gray-700">
                            ต้องการแนวทางการแก้ไข
                          </span>
                        </label>
                      </div>
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
