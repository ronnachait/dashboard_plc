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
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Fuel, StickyNote, Calendar, Truck, ArrowUp, ArrowDown } from "lucide-react";

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
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

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

  const paginatedLogs = logs.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <Card className="shadow-lg rounded-xl overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
          <Fuel className="w-5 h-5 text-green-600" />
          📜 ประวัติการใช้น้ำมันทั้งหมด
        </CardTitle>
        <div className="text-sm text-gray-600">
          ทั้งหมด {logs.length} รายการ
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50">
                <TableHead className="font-bold">
                  <Calendar className="inline w-4 h-4 mr-1" />
                  วันที่ / เวลา
                </TableHead>
                <TableHead className="font-bold">
                  <Truck className="inline w-4 h-4 mr-1" />
                  รถ
                </TableHead>
                <TableHead className="font-bold">ประเภท</TableHead>
                <TableHead className="text-green-700 font-bold text-right">
                  <ArrowUp className="inline w-4 h-4 mr-1" />
                  เติม (L)
                </TableHead>
                <TableHead className="text-red-700 font-bold text-right">
                  <ArrowDown className="inline w-4 h-4 mr-1" />
                  ใช้ (L)
                </TableHead>
                <TableHead className="text-blue-700 font-bold text-right">
                  คงเหลือ (L)
                </TableHead>
                <TableHead className="font-bold">
                  <StickyNote className="inline w-4 h-4 mr-1 text-gray-500" />
                  หมายเหตุ
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={7}
                    className="text-center text-gray-500 py-8"
                  >
                    <Fuel className="w-12 h-12 mx-auto mb-2 text-gray-300" />
                    <p className="font-medium">ยังไม่มีข้อมูลการใช้น้ำมัน</p>
                  </TableCell>
                </TableRow>
              ) : (
                paginatedLogs.map((log) => (
                  <TableRow
                    key={log.id}
                    className="hover:bg-blue-50 transition-colors"
                  >
                    <TableCell className="font-medium whitespace-nowrap">
                      {new Date(log.date).toLocaleString("th-TH", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </TableCell>
                    <TableCell>
                      <div className="font-medium text-gray-800">
                        {log.vehicle.name}
                      </div>
                      {log.vehicle.plateNo && (
                        <div className="text-xs text-gray-500">
                          {log.vehicle.plateNo}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.fuelIn > 0 ? (
                        <Badge variant="default" className="bg-green-600">
                          เติม
                        </Badge>
                      ) : (
                        <Badge variant="destructive">
                          ใช้
                        </Badge>
                      )}
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
                    <TableCell className="text-gray-700 max-w-xs truncate">
                      {log.note || <span className="text-gray-400">-</span>}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        {/* Pagination */}
        {logs.length > itemsPerPage && (
          <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
            <div className="text-sm text-gray-600">
              แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, logs.length)} จาก {logs.length} รายการ
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="disabled:opacity-50"
              >
                ← ก่อนหน้า
              </Button>
              <div className="flex items-center gap-1">
                {Array.from({ length: Math.ceil(logs.length / itemsPerPage) }).map((_, i) => {
                  const pageNum = i + 1;
                  const totalPages = Math.ceil(logs.length / itemsPerPage);
                  
                  if (
                    pageNum === 1 || 
                    pageNum === totalPages || 
                    (pageNum >= currentPage - 1 && pageNum <= currentPage + 1)
                  ) {
                    return (
                      <Button
                        key={pageNum}
                        variant={currentPage === pageNum ? "default" : "outline"}
                        size="sm"
                        onClick={() => setCurrentPage(pageNum)}
                        className="w-10"
                      >
                        {pageNum}
                      </Button>
                    );
                  } else if (
                    pageNum === currentPage - 2 || 
                    pageNum === currentPage + 2
                  ) {
                    return <span key={pageNum} className="px-2">...</span>;
                  }
                  return null;
                })}
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(p => Math.min(Math.ceil(logs.length / itemsPerPage), p + 1))}
                disabled={currentPage === Math.ceil(logs.length / itemsPerPage)}
                className="disabled:opacity-50"
              >
                ถัดไป →
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
