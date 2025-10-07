"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
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

  if (records.length === 0)
    return (
      <p className="text-center text-gray-500 py-10">
        ยังไม่มีข้อมูลในฐานข้อมูล
      </p>
    );

  return (
    <div className="p-4 max-w-full overflow-x-auto">
      <Card className="shadow-md rounded-2xl p-4 border border-gray-200 bg-white">
        <h2 className="text-lg font-semibold text-blue-700 mb-4">
          📊 Sensor Comparison by Day
        </h2>

        <div className="overflow-x-auto relative">
          <table className="border-collapse w-full text-xs min-w-[1400px]">
            {/* Header */}
            <thead>
              <tr className="bg-gradient-to-r from-blue-50 to-blue-100 text-gray-800 font-semibold border-b-2 border-blue-300">
                <th
                  className="sticky left-0 z-20 bg-blue-100 border-r border-blue-200 p-2 text-left shadow-md"
                  style={{ minWidth: "120px" }}
                >
                  Date
                </th>
                <th
                  className="sticky left-[120px] z-20 bg-blue-100 border-r border-blue-200 p-2 text-left shadow-md"
                  style={{ minWidth: "100px" }}
                >
                  Shift
                </th>
                <th
                  className="sticky left-[220px] z-20 bg-blue-100 border-r border-blue-200 p-2 text-left shadow-md"
                  style={{ minWidth: "120px" }}
                >
                  HourMeter
                </th>
                <th
                  className="sticky left-[340px] z-20 bg-blue-100 border-r border-blue-200 p-2 text-left shadow-md"
                  style={{ minWidth: "180px" }}
                >
                  Remark
                </th>

                {sensorKeys.map((k) => (
                  <th
                    key={k}
                    className="border-r border-gray-200 p-2 text-center min-w-[110px] bg-blue-50"
                  >
                    {k}
                  </th>
                ))}
              </tr>
            </thead>

            {/* Body */}
            <tbody>
              {records.map((r, idx) => {
                const isNewDay =
                  idx === 0 ||
                  new Date(records[idx - 1].date).toDateString() !==
                    new Date(r.date).toDateString();

                return (
                  <tr
                    key={r.id}
                    className={`transition ${
                      isNewDay
                        ? "border-t-4 border-blue-400 bg-blue-50/70"
                        : idx % 2 === 0
                        ? "bg-white"
                        : "bg-gray-50"
                    } hover:bg-blue-100/50`}
                  >
                    {/* Date */}
                    {/* Date */}
                    <td
                      className={`sticky left-0 z-10 border-r border-gray-200 p-2 text-center font-semibold bg-gradient-to-r from-blue-100 to-white text-blue-900 ${
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
                      className={`sticky left-[120px] z-10 border-r border-gray-200 p-2 text-center font-semibold rounded-sm shadow-inner ${
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
                      className={`sticky left-[220px] z-10 border-r border-gray-200 p-2 text-center font-medium bg-blue-50 text-blue-800 ${
                        isNewDay ? "border-t-2 border-blue-400" : ""
                      }`}
                      style={{ minWidth: "120px" }}
                    >
                      {r.hourMeter}
                    </td>

                    {/* Remark */}
                    <td
                      className={`sticky left-[340px] z-10 border-r border-gray-200 p-2 text-sm bg-white text-gray-700 ${
                        isNewDay ? "border-t-2 border-blue-300" : ""
                      }`}
                      style={{ minWidth: "180px" }}
                    >
                      {r.remark ?? "-"}
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
                          className="border text-center text-gray-700 align-middle p-0"
                        >
                          <div className="flex flex-col text-[11px] font-medium leading-tight">
                            <div className="bg-red-100 text-red-800 py-[2px] font-semibold">
                              Max {s.max.toFixed(1)}
                            </div>
                            <div className="bg-yellow-100 text-yellow-800 py-[2px] border-y border-white">
                              Avg {s.avg.toFixed(1)}
                            </div>
                            <div className="bg-green-100 text-green-800 py-[2px]">
                              Min {s.min.toFixed(1)}
                            </div>
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
