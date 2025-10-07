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
import { UploadCloud, Database, History } from "lucide-react";
import SensorHistoryTable from "./SensorHistoryTable";

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

  const [meta, setMeta] = useState({
    date: new Date().toISOString().slice(0, 10),
    shift: "Day",
    hourMeter: "",
  });

  // 🧩 Upload + Parse CSV
  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    const text = await file.text();
    const lines = text.split(/\r?\n/);

    const startIdx = lines.findIndex((l) => l.trim().startsWith("#EndHeader"));
    const endIdx = lines.findIndex((l) => l.trim().startsWith("#BeginMark"));
    if (startIdx === -1 || endIdx === -1) {
      toast.error("❌ ไม่พบ #EndHeader หรือ #BeginMark");
      return;
    }

    const section = lines.slice(startIdx, endIdx).join("\n");
    const parsed = Papa.parse(section, { header: true, skipEmptyLines: true });
    const rows = parsed.data as Record<string, string>[];
    const headers = Object.keys(rows[0]);
    const sensorList = headers.filter((h) => h.includes("Maximum"));

    const summaryData = sensorList.map((sensor) => {
      const vals = rows
        .map((r) => parseFloat(r[sensor] ?? "NaN"))
        .filter((v) => !isNaN(v));
      if (vals.length === 0) return { sensor, min: "-", avg: "-", max: "-" };
      const min = Math.min(...vals);
      const max = Math.max(...vals);
      const avg = vals.reduce((a, b) => a + b, 0) / vals.length;
      return { sensor, min, avg, max };
    });

    setSummary(summaryData);
    toast.success(`📊 ประมวลผล ${summaryData.length} sensors สำเร็จ`);
  };

  // 💾 Save to DB
  // 💾 Save to DB
  const saveToDB = async () => {
    // ✅ กันซ้ำ: วัน+กะ ห้ามซ้ำ
    const exists = records.some(
      (r) =>
        new Date(r.date).toISOString().slice(0, 10) === meta.date &&
        r.shift === meta.shift
    );

    if (exists) {
      toast.error(
        `❌ วันที่ ${meta.date} (${meta.shift}) มีอยู่แล้วในฐานข้อมูล`
      );
      return;
    }

    const summaries = Object.fromEntries(
      summary.map((s) => [s.sensor, { min: s.min, avg: s.avg, max: s.max }])
    );

    const res = await fetch("/api/sensor/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...meta, summaries }),
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
    setRecords(data.records ?? []);
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  return (
    <div className="p-6 space-y-6 mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <History className="text-blue-600 w-6 h-6" />
        <h1 className="text-2xl font-bold text-blue-700">Sensor Dashboard</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-blue-50 rounded-lg p-1 mb-4">
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

        {/* History View */}
        <TabsContent value="history">
          <SensorHistoryTable />
        </TabsContent>

        {/* Import View */}
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
                    <SelectItem value="OT">OT</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  ชั่วโมงเครื่อง (Hour Meter)
                </label>
                <Input
                  placeholder="เช่น 1160.9"
                  value={meta.hourMeter}
                  onChange={(e) =>
                    setMeta({ ...meta, hourMeter: e.target.value })
                  }
                />
              </div>
            </div>

            <label
              htmlFor="csvFile"
              className="border-2 border-dashed border-blue-400 rounded-xl flex flex-col items-center justify-center py-10 cursor-pointer hover:bg-blue-50 transition"
            >
              <UploadCloud className="w-8 h-8 text-blue-500 mb-2" />
              <span className="text-gray-600 text-sm">
                {fileName
                  ? fileName
                  : "ลากไฟล์ .CSV มาวาง หรือคลิกเพื่อเลือกไฟล์"}
              </span>
            </label>
            <Input
              id="csvFile"
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />

            {summary.length > 0 && (
              <div className="overflow-auto max-h-[400px] mt-4 rounded-lg border">
                <Table className="min-w-full text-xs">
                  <TableHeader>
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
                    {summary.map((s, i) => (
                      <TableRow key={i} className="hover:bg-blue-50 transition">
                        <TableCell>{s.sensor}</TableCell>
                        <TableCell className="text-right">{s.min}</TableCell>
                        <TableCell className="text-right">{s.avg}</TableCell>
                        <TableCell className="text-right">{s.max}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}

            {summary.length > 0 && (
              <div className="flex justify-end mt-4">
                <Button
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                  onClick={saveToDB}
                >
                  <Database className="w-4 h-4 mr-1" /> บันทึกลงฐานข้อมูล
                </Button>
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
