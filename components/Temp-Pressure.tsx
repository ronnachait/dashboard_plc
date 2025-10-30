"use client";

import { useState, useEffect } from "react";
import Papa from "papaparse";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableCell,
  TableBody,
} from "@/components/ui/table";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { UploadCloud, Database, History, RefreshCw, FileText } from "lucide-react";
import SensorHistoryTable from "./SensorHistoryTable";
import { Progress } from "@/components/ui/progress"; // ✅ ต้องมี Progress component จาก shadcn
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

type SensorSummary = {
  sensor: string;
  min: number | string;
  avg: number | string;
  max: number | string;
};

type SensorRecord = {
  id: string;
  date: string;
  shift: string;
  hourMeter: string;
  sensors: Record<string, { min: number; avg: number; max: number }>;
};

export default function SensorSummaryPage() {
  const [summary, setSummary] = useState<SensorSummary[]>([]);
  const [fileName, setFileName] = useState<string | null>(null);
  const [records, setRecords] = useState<SensorRecord[]>([]);
  const [activeTab, setActiveTab] = useState("history");
  const [progress, setProgress] = useState<number>(0);
  const [dragActive, setDragActive] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedSensor, setSelectedSensor] = useState<SensorSummary | null>(null);
  const [suggestedHour, setSuggestedHour] = useState<string>("");
  const [remark, setRemark] = useState<string>("");

  const [meta, setMeta] = useState({
    date: new Date().toISOString().slice(0, 10),
    shift: "Day",
    hourMeter: "",
  });

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 🧩 อ่านไฟล์เป็นข้อความ
    let text = await file.text();

    // 🧹 ล้าง BOM / อักขระแปลก / tab ท้าย
    text = text
      .replace(/\uFEFF/g, "") // remove BOM
      .replace(/#BeginMark.*/g, "") // ตัดส่วนท้ายถ้ามี
      .replace(/\t+/g, "") // ตัด tab ส่วนเกิน
      .replace(/�/g, ""); // ล้างอักขระเพี้ยน

    // 🔍 หา #EndHeader
    const lines = text.split(/\r?\n/);
    const start = lines.findIndex((l) => l.includes("#EndHeader"));
    if (start === -1) {
      toast.error("❌ ไม่พบ #EndHeader");
      return;
    }

    // ✅ ตัดเฉพาะคำ #EndHeader ออก แต่เก็บ header ไว้
    lines[start] = lines[start].replace("#EndHeader", "").trim();

    // ✅ รวมเนื้อหาหลังจาก header เป็นต้นไป
    const trimmed = lines.slice(start).join("\n");

    // ✅ แปลงเป็นไฟล์ใหม่ (ให้ PapaParse ใช้ได้)
    const blob = new Blob([trimmed], { type: "text/csv" });
    const processedFile = new File([blob], file.name, { type: "text/csv" });

    // 🌈 Reset state
    setFileName(file.name);
    setSummary([]);
    setProgress(0);

    const stats: Record<
      string,
      { min: number; max: number; sum: number; count: number }
    > = {};
    const totalSize = blob.size;
    let processedSize = 0;

    Papa.parse(processedFile, {
      header: true,
      worker: true,
      skipEmptyLines: true,
      delimiter: ",", // ✅ ใช้ comma เป็นหลัก
      chunkSize: 1024 * 1024,
      step: (results, parser) => {
        const row = results.data as Record<string, string>;

        if (!Object.keys(stats).length) {
          console.log("✅ Headers from CSV:", Object.keys(row));
        }

        // หยุดเมื่อเจอ tag สิ้นสุด
        const firstCell = Object.values(row)[0]?.toString().trim() ?? "";
        if (firstCell.startsWith("#BeginMark")) {
          parser.abort();
          return;
        }

        Object.entries(row).forEach(([key, value]) => {
          const cleanKey = key.trim();
          // ✅ กรองเฉพาะ sensor ชื่อแบบ Kubota เช่น (1)CAN-CH01
          if (!/\(?\d+\)?[A-Z-]*CH\d+/i.test(cleanKey)) return;
          const v = parseFloat(value as string);
          if (isNaN(v)) return;

          if (!stats[cleanKey])
            stats[cleanKey] = { min: v, max: v, sum: v, count: 1 };
          else {
            const s = stats[cleanKey];
            s.min = Math.min(s.min, v);
            s.max = Math.max(s.max, v);
            s.sum += v;
            s.count++;
          }
        });

        processedSize += results.meta.cursor;
        const percent = Math.min(
          Math.round((processedSize / totalSize) * 100),
          100
        );
        setProgress(percent);
      },
      complete: () => {
        const summaryData = Object.entries(stats).map(([sensor, s]) => ({
          sensor,
          min: s.min,
          avg: parseFloat((s.sum / s.count).toFixed(2)),
          max: s.max,
        }));
        setSummary(summaryData);
        setProgress(100);
        toast.success(`📊 ประมวลผล ${summaryData.length} sensors สำเร็จ`);
      },
      error: (err) => {
        console.error("Parse error:", err);
        toast.error("❌ เกิดข้อผิดพลาดระหว่างอ่าน CSV");
      },
    });
  };

  const resetImport = () => {
    setSummary([]);
    setFileName(null);
    setProgress(0);
    setSelectedSensor(null);
  };

  // 💾 Save to DB
  const saveToDB = async () => {
    const exists = records.some(
      (r) =>
        new Date(r.date).toISOString().slice(0, 10) === meta.date &&
        r.shift === meta.shift
    );

    if (exists) {
      toast.error(`❌ วันที่ ${meta.date} (${meta.shift}) มีอยู่แล้ว`);
      return;
    }

    const summaries = Object.fromEntries(
      summary.map((s) => [s.sensor, { min: s.min, avg: s.avg, max: s.max }])
    );

    const res = await fetch("/api/sensor/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meta, remark, fileName, sensorCount: summary.length, summaries }),
    });

    if (res.ok) {
      toast.success("💾 บันทึกลงฐานข้อมูลสำเร็จ");
      setSummary([]);
      setFileName(null);
      setActiveTab("history");
      fetchHistory();
    } else {
      toast.error("❌ บันทึกไม่สำเร็จ");
    }
  };

  // 📚 Fetch History
  const fetchHistory = async () => {
    const res = await fetch("/api/sensor/import");
    const data = await res.json();
    const recs: SensorRecord[] = data.records ?? [];
    setRecords(recs);
    if (recs.length > 0) {
      const sorted = [...recs].sort((a,b)=> new Date(b.date).getTime() - new Date(a.date).getTime());
      const latest = sorted[0];
      setSuggestedHour(latest.hourMeter || "");
      if (!meta.hourMeter) {
        setMeta((m)=> ({...m, hourMeter: latest.hourMeter || ""}));
      }
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-6 space-y-6 mx-auto">
      <div className="text-center mb-4">
        <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-lg">
          <History className="text-white w-7 h-7" />
        </div>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mt-3">Temperature / Pressure Analyzer</h1>
        <p className="text-gray-500 text-sm">อัปโหลดไฟล์ CSV เพื่อคำนวณค่า Min / Avg / Max ของแต่ละเซนเซอร์</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-blue-50 rounded-lg p-1 mb-4 sticky top-0 z-10">
          <TabsTrigger
            value="history"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-4 py-1"
          >
            📅 ประวัติการเก็บข้อมูล
          </TabsTrigger>
          <TabsTrigger
            value="import"
            className="data-[state=active]:bg-blue-600 data-[state=active]:text-white rounded-md px-4 py-1"
          >
            📥 นำเข้าไฟล์ CSV
          </TabsTrigger>
        </TabsList>

        {/* History */}
        <TabsContent value="history">
          <SensorHistoryTable />
        </TabsContent>

        {/* Import */}
        <TabsContent value="import">
          <Card className="p-6 space-y-5 shadow-md border border-gray-200 bg-white/80 backdrop-blur-sm rounded-2xl">
            <div className="grid sm:grid-cols-3 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  วันที่
                </label>
                <Input
                  type="date"
                  value={meta.date}
                  onChange={(e) => setMeta({ ...meta, date: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  กะทำงาน
                </label>
                <Select
                  value={meta.shift}
                  onValueChange={(v) => setMeta({ ...meta, shift: v })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Day">Day</SelectItem>
                    <SelectItem value="Night">Night</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  ชั่วโมงเครื่อง (Hour Meter)
                </label>
                <div className="flex gap-2">
                  <Input
                    placeholder={suggestedHour ? `เช่น ${suggestedHour}` : "เช่น 1160.9"}
                    value={meta.hourMeter}
                    onChange={(e) =>
                      setMeta({ ...meta, hourMeter: e.target.value })
                    }
                  />
                  <Button variant="outline" onClick={()=> setMeta(m=> ({...m, hourMeter: suggestedHour}))} disabled={!suggestedHour}>
                    ดึงอัตโนมัติ
                  </Button>
                </div>
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-gray-600">หมายเหตุ</label>
              <Input
                placeholder="บันทึกรายละเอียดเพิ่มเติม เช่น ไฟล์รุ่น / เครื่อง / ผู้บันทึก"
                value={remark}
                onChange={(e)=> setRemark(e.target.value)}
              />
            </div>

            <div
              onDragOver={(e)=>{e.preventDefault(); setDragActive(true);}}
              onDragLeave={()=>setDragActive(false)}
              onDrop={(e)=>{
                e.preventDefault();
                setDragActive(false);
                const f = e.dataTransfer.files?.[0];
                if (f) {
                  const input = document.getElementById("csvFile") as HTMLInputElement | null;
                  if (input) {
                    const dt = new DataTransfer();
                    dt.items.add(f);
                    input.files = dt.files;
                    input.dispatchEvent(new Event("change", { bubbles: true }));
                  }
                }
              }}
              className={`border-2 border-dashed ${dragActive?"border-sky-500 bg-sky-50":"border-blue-400"} rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-blue-50 transition`}
            >
              <label htmlFor="csvFile" className="flex flex-col items-center">
                <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
                <span className="text-gray-600 text-sm">
                  {fileName ? fileName : "ลากไฟล์ .CSV มาวาง หรือคลิกเพื่อเลือกไฟล์"}
                </span>
                <span className="text-xs text-gray-400 mt-1">รองรับไฟล์ .csv ขนาดไม่เกิน ~50MB</span>
              </label>
            </div>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />

            {progress > 0 && progress < 100 && (
              <div className="mt-2">
                <Progress value={progress} />
                <p className="text-xs text-gray-500 mt-1 text-right">
                  กำลังอ่านไฟล์... {progress}%
                </p>
              </div>
            )}

            {summary.length > 0 && (
              <>
                <div className="flex items-center justify-between gap-3 mt-2">
                  <div className="text-sm text-gray-600 flex items-center gap-2">
                    <FileText className="w-4 h-4" />
                    พบทั้งหมด <span className="font-semibold text-blue-700">{summary.length}</span> sensors
                  </div>
                  <div className="flex items-center gap-2">
                    <Input placeholder="ค้นหา sensor..." value={search} onChange={(e)=>setSearch(e.target.value)} className="h-9 w-56" />
                    <Button variant="outline" className="h-9" onClick={resetImport}>
                      <RefreshCw className="w-4 h-4 mr-1" /> รีเซ็ต
                    </Button>
                    <Button variant="outline" className="h-9" onClick={()=>{
                      const header = ["sensor","min","avg","max"];
                      const rows = summary
                        .filter(s=> s.sensor.toLowerCase().includes(search.toLowerCase()))
                        .map(s=>[s.sensor, s.min, s.avg, s.max]);
                      const csv = [header, ...rows].map(r=>r.join(",")).join("\n");
                      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement("a");
                      a.href = url;
                      a.download = `sensor-summary-${meta.date}-${meta.shift}.csv`;
                      a.click();
                      URL.revokeObjectURL(url);
                    }}>
                      ดาวน์โหลด CSV
                    </Button>
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white h-9" onClick={saveToDB}>
                      <Database className="w-4 h-4 mr-1" /> บันทึกลงฐานข้อมูล
                    </Button>
                  </div>
                </div>

                {/* Preview mini chart */}
                {selectedSensor && (
                  <Card className="mt-3 p-4 border-blue-100">
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-sm text-gray-700">
                        แสดงผล: <span className="font-semibold text-blue-700">{selectedSensor.sensor}</span>
                      </div>
                      <div className="text-xs text-gray-500">คลิกแถวอื่นเพื่อเปลี่ยน</div>
                    </div>
                    <div className="h-48">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={[{ name: "Min", value: Number(selectedSensor.min) }, { name: "Avg", value: Number(selectedSensor.avg) }, { name: "Max", value: Number(selectedSensor.max) }] }>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis dataKey="name" />
                          <YAxis />
                          <Tooltip />
                          <Bar dataKey="value" fill="#3b82f6" radius={[6,6,0,0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </Card>
                )}

                <div className="overflow-auto max-h-[420px] mt-3 rounded-lg border">
                  <Table className="min-w-full text-xs">
                    <TableHeader className="sticky top-0 z-10">
                      <TableRow className="bg-blue-100/80">
                        <TableCell className="font-semibold text-gray-700">
                          Sensor
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Min
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Avg
                        </TableCell>
                        <TableCell className="text-right font-semibold">
                          Max
                        </TableCell>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {summary
                        .filter(s=> s.sensor.toLowerCase().includes(search.toLowerCase()))
                        .map((s, i) => (
                        <TableRow
                          key={i}
                           onClick={()=> setSelectedSensor(s)}
                           className={`hover:bg-blue-50 transition cursor-pointer ${selectedSensor?.sensor===s.sensor?"bg-blue-50": ""}`}
                        >
                          <TableCell>{s.sensor}</TableCell>
                          <TableCell className="text-right">{s.min}</TableCell>
                          <TableCell className="text-right">{s.avg}</TableCell>
                          <TableCell className="text-right">{s.max}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </>
            )}

            {summary.length === 0 && (
              <div className="text-center py-14 text-gray-500 border rounded-xl">
                <UploadCloud className="w-10 h-10 mx-auto text-blue-400 mb-2" />
                <div className="font-medium">ยังไม่มีข้อมูลสรุป</div>
                <div className="text-sm">อัปโหลดไฟล์ .CSV เพื่อเริ่มประมวลผล</div>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
