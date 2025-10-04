"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Fuel, StickyNote } from "lucide-react";

type FuelLog = {
  id: string;
  date: string;
  fuelIn: number;
  fuelUsed: number;
  balance: number;
  note?: string;
  vehicle: {
    id: string;
    name: string;
    plateNo?: string | null;
  };
};

export default function FuelHistoryPage() {
  const [logs, setLogs] = useState<FuelLog[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("/api/fuel/history");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-4 md:p-6 max-w-6xl mx-auto">
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            <Fuel className="w-5 h-5 text-green-600" />
            ประวัติการใช้น้ำมัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-100">
                  <TableHead>📅 วันที่</TableHead>
                  <TableHead>🚜 รถ</TableHead>
                  <TableHead className="text-green-600">เติม (ลิตร)</TableHead>
                  <TableHead className="text-red-600">ใช้ (ลิตร)</TableHead>
                  <TableHead className="text-blue-600">
                    คงเหลือ (ลิตร)
                  </TableHead>
                  <TableHead>
                    <StickyNote className="inline w-4 h-4 mr-1 text-gray-500" />
                    หมายเหตุ
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell
                      colSpan={6}
                      className="text-center text-gray-500 py-6"
                    >
                      ⛽ ยังไม่มีข้อมูลการใช้น้ำมัน
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map((log, idx) => (
                    <TableRow
                      key={log.id}
                      className={idx % 2 === 0 ? "bg-white" : "bg-gray-50"}
                    >
                      <TableCell>
                        {new Date(log.date).toLocaleString("th-TH", {
                          dateStyle: "short",
                          timeStyle: "short",
                        })}
                      </TableCell>
                      <TableCell>
                        {log.vehicle.name}{" "}
                        {log.vehicle.plateNo ? `(${log.vehicle.plateNo})` : ""}
                      </TableCell>
                      <TableCell className="text-green-600 font-bold text-right">
                        {log.fuelIn > 0 ? `+${log.fuelIn.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-red-600 font-bold text-right">
                        {log.fuelUsed > 0 ? `-${log.fuelUsed.toFixed(2)}` : "-"}
                      </TableCell>
                      <TableCell className="text-blue-700 font-bold text-right">
                        {log.balance.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {log.note ?? "-"}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
