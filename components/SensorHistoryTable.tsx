"use client";

import { useEffect, useRef, useState } from "react";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";
import { toast } from "sonner";

type RecordType = {
  id: string;
  date: string;
  shift: string;
  hourMeter: string;
  remark?: string;
  sensors: Record<string, { min: number; avg: number; max: number }>;
};

export default function SensorHistoryTable() {
  const [records, setRecords] = useState<RecordType[]>([]);
  const [sensorKeys, setSensorKeys] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [shift, setShift] = useState<string>("all");
  const [date, setDate] = useState<string>("");
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const topScrollRef = useRef<HTMLDivElement | null>(null);
  const [contentWidth, setContentWidth] = useState<number>(1200);
  const isDraggingRef = useRef<boolean>(false);
  const dragStartXRef = useRef<number>(0);
  const dragStartScrollLeftRef = useRef<number>(0);

  const fetchHistory = async () => {
    try {
      const res = await fetch("/api/sensor/import");
      const data = await res.json();
      const recs = data.records ?? [];
      setRecords(recs);

      if (recs.length > 0) {
        const keys = Object.keys(recs[0].sensors);
        setSensorKeys(keys);
      }
    } catch {
      toast.error("❌ โหลดข้อมูลไม่สำเร็จ");
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    setContentWidth(el.scrollWidth);
  }, [records, sensorKeys]);

  const filtered = records.filter(r => {
    const matchShift = shift === "all" || r.shift === shift;
    const matchDate = !date || new Date(r.date).toISOString().slice(0,10) === date;
    const matchQuery = !query || Object.keys(r.sensors).some(k => k.toLowerCase().includes(query.toLowerCase()));
    return matchShift && matchDate && matchQuery;
  });

  const exportCsv = () => {
    if (filtered.length === 0) return;
    const header = ["date","shift","hourMeter","remark", ...sensorKeys.flatMap(k=>[`${k}_min`,`${k}_avg`,`${k}_max`])];
    const rows = filtered.map(r => [
      new Date(r.date).toISOString().slice(0,10),
      r.shift,
      r.hourMeter,
      r.remark ?? "",
      ...sensorKeys.flatMap(k=>{
        const s = r.sensors[k];
        return s
          ? [
              typeof s.min === "number" ? s.min.toFixed(1) : String(s.min),
              typeof s.avg === "number" ? s.avg.toFixed(1) : String(s.avg),
              typeof s.max === "number" ? s.max.toFixed(1) : String(s.max),
            ]
          : ["", "", ""];
      })
    ]);
    const csv = [header, ...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `sensor-history.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const onTopScroll = () => {
    if (!topScrollRef.current || !scrollerRef.current) return;
    scrollerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
  };

  const onMainScroll = () => {
    if (!topScrollRef.current || !scrollerRef.current) return;
    topScrollRef.current.scrollLeft = scrollerRef.current.scrollLeft;
  };

  const onWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX)) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  };

  const onMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el) return;
    isDraggingRef.current = true;
    dragStartXRef.current = e.pageX - el.offsetLeft;
    dragStartScrollLeftRef.current = el.scrollLeft;
    el.style.cursor = "grabbing";
  };

  const onMouseLeaveOrUp = () => {
    const el = scrollerRef.current;
    if (!el) return;
    isDraggingRef.current = false;
    el.style.cursor = "grab";
  };

  const onMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const el = scrollerRef.current;
    if (!el || !isDraggingRef.current) return;
    const x = e.pageX - el.offsetLeft;
    const walk = (x - dragStartXRef.current) * 1; // multiplier speed
    el.scrollLeft = dragStartScrollLeftRef.current - walk;
  };

  if (records.length === 0)
    return (
      <div className="text-center text-gray-500 py-14 border rounded-xl">
        <div className="font-medium">ยังไม่มีข้อมูลในฐานข้อมูล</div>
        <div className="text-sm">อัปโหลดไฟล์ในแท็บนำเข้าเพื่อเริ่มบันทึก</div>
      </div>
    );

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      <Card className="shadow-md rounded-2xl p-4 border border-gray-200 bg-white/90 backdrop-blur-sm">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between mb-3">
          <div>
            <h2 className="text-lg font-semibold text-blue-700">📊 Sensor History</h2>
            <p className="text-xs text-gray-500">รวม {filtered.length} รายการ</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Input placeholder="ค้นหา sensor key" value={query} onChange={(e)=>setQuery(e.target.value)} className="h-9 w-44" />
            <Input type="date" value={date} onChange={(e)=>setDate(e.target.value)} className="h-9" />
            <Select value={shift} onValueChange={setShift}>
              <SelectTrigger className="h-9 w-[140px]"><SelectValue placeholder="Shift" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                <SelectItem value="Day">Day</SelectItem>
                <SelectItem value="Night">Night</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="h-9" onClick={exportCsv}><FileDown className="w-4 h-4 mr-1"/>Export CSV</Button>
          </div>
        </div>

        {/* Top synced scrollbar for easy horizontal scroll */}
        <div className="overflow-x-auto h-3 mb-2" ref={topScrollRef} onScroll={onTopScroll}>
          <div style={{ width: contentWidth }} className="h-3 bg-gradient-to-r from-blue-100 to-blue-50 rounded" />
        </div>

        <div
          className="overflow-x-auto relative cursor-grab"
          ref={scrollerRef}
          onScroll={onMainScroll}
          onWheel={onWheel}
          onMouseDown={onMouseDown}
          onMouseUp={onMouseLeaveOrUp}
          onMouseLeave={onMouseLeaveOrUp}
          onMouseMove={onMouseMove}
        >
          <table className="w-full text-xs min-w-[1200px]">
            {/* Header */}
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800 font-semibold border-b border-blue-200">
                <th className="sticky left-0 z-20 bg-blue-100/90 p-2 text-left shadow-md border-r border-blue-200" style={{ minWidth: "120px" }}>Date</th>
                <th className="sticky left-[120px] z-20 bg-blue-100/90 p-2 text-left shadow-md border-r border-blue-200" style={{ minWidth: "100px" }}>Shift</th>
                <th className="sticky left-[220px] z-20 bg-blue-100/90 p-2 text-left shadow-md border-r border-blue-200" style={{ minWidth: "120px" }}>HourMeter</th>
                <th className="sticky left-[340px] z-20 bg-blue-100/90 p-2 text-left shadow-md border-r border-blue-200" style={{ minWidth: "180px" }}>Remark</th>
                {sensorKeys.map((k) => (
                  <th key={k} className="p-2 text-center min-w-[140px] bg-blue-50 border-r border-blue-100">
                    <div className="flex flex-col items-center gap-1">
                      <span className="font-medium text-gray-800">{k}</span>
                      <div className="flex items-center gap-2 text-[10px] text-gray-600">
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500"></span>Min</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500"></span>Avg</span>
                        <span className="inline-flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500"></span>Max</span>
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {filtered.map((r, idx) => {
                const isNewDay =
                  idx === 0 ||
                  new Date(filtered[idx - 1].date).toDateString() !==
                    new Date(r.date).toDateString();

                return (
                  <tr
                    key={r.id}
                    className={`transition ${
                      isNewDay
                        ? "border-t-4 border-blue-400 bg-blue-50/60"
                        : idx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    } hover:bg-blue-100/50`}
                  >
                    {/* Date */}
                    <td
                      className={`sticky left-0 z-10 border-r border-blue-100 p-2 text-center font-semibold bg-gradient-to-r from-blue-100 to-white text-blue-900 ${
                        isNewDay
                          ? "border-t-2 border-blue-400 shadow-inner"
                          : ""
                      }`}
                      style={{ minWidth: "120px" }}
                    >
                      {new Date(r.date).toLocaleDateString("th-TH")}
                    </td>

                    {/* Shift */}
                    <td
                      className={`sticky left-[120px] z-10 border-r border-blue-100 p-2 text-center font-semibold rounded-sm shadow-inner ${
                        r.shift === "Day"
                          ? "bg-yellow-100 text-yellow-800"
                          : r.shift === "Night"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-purple-100 text-purple-800"
                      }`}
                      style={{ minWidth: "100px" }}
                    >
                      {r.shift}
                    </td>

                    {/* HourMeter */}
                    <td
                      className={`sticky left-[220px] z-10 border-r border-blue-100 p-2 text-center font-medium bg-blue-50 text-blue-800 ${
                        isNewDay ? "border-t-2 border-blue-400" : ""
                      }`}
                      style={{ minWidth: "120px" }}
                    >
                      <span className="inline-flex items-center px-2 py-[2px] rounded-full bg-blue-100 text-blue-800 font-mono text-[11px]">{r.hourMeter}</span>
                    </td>

                    {/* Remark */}
                    <td
                      className={`sticky left-[340px] z-10 border-r border-blue-100 p-2 text-sm bg-white text-gray-700 ${
                        isNewDay ? "border-t-2 border-blue-300" : ""
                      }`}
                      style={{ minWidth: "180px" }}
                    >
                      <span className="line-clamp-2">{r.remark ?? "-"}</span>
                    </td>

                    {/* Sensors */}
                    {sensorKeys.map((key) => {
                      const s = r.sensors[key];
                      if (!s)
                        return (
                          <td
                            key={key}
                            className="border text-center text-gray-400 bg-gray-50"
                          >
                            -
                          </td>
                        );

                      return (
                        <td
                          key={key}
                          className="border text-center text-gray-700 align-middle p-1"
                        >
                          <div className="flex items-center justify-center gap-1 text-[11px] font-mono">
                            <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-green-50 text-green-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span>{s.min.toFixed(1)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-yellow-50 text-yellow-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-yellow-500"></span>{s.avg.toFixed(1)}
                            </span>
                            <span className="inline-flex items-center gap-1 px-1.5 py-[2px] rounded-md bg-red-50 text-red-700">
                              <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span>{s.max.toFixed(1)}
                            </span>
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
