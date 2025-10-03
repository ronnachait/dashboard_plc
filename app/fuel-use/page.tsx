"use client";

import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Fuel, TrendingUp, Droplet, Calendar, Sun, Moon } from "lucide-react";
import type { Shift } from "@prisma/client";
import FuelHistoryPage from "@/components/history-fuel-use";

type Vehicle = {
  id: string;
  name: string;
  plateNo?: string | null;
};

type FuelLog = {
  id: string;
  date: string; // เวลา log จริง
  shiftDate: string; // YYYY-MM-DD วันกะที่คำนวณแล้ว
  shift?: "MORNING" | "NIGHT" | null;
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
type DailySummary = {
  shiftDate: string;
  shift: Shift | null;
  fuelIn: number;
  fuelUsed: number;
  logs: (FuelLog & { vehicle: Vehicle })[];
};

export default function FuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [shift, setShift] = useState<"MORNING" | "NIGHT">("MORNING");

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [daily, setDaily] = useState<DailySummary[]>([]);
  const [summary, setSummary] = useState({
    balance: 0,
    totalIn: 0,
    totalUsed: 0,
  });

  // โหลดรถ
  useEffect(() => {
    fetch("/api/vehicle").then(async (res) => {
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles);
      }
    });
  }, []);

  // โหลดประวัติ + daily
  const fetchHistory = async () => {
    const res = await fetch("/api/fuel/history");
    if (res.ok) {
      const data = await res.json();
      setLogs(data.logs);

      // summary รวม
      let totalIn = 0,
        totalUsed = 0;
      data.logs.forEach((log: FuelLog) => {
        totalIn += log.fuelIn;
        totalUsed += log.fuelUsed;
      });
      setSummary({
        balance: totalIn - totalUsed,
        totalIn,
        totalUsed,
      });
    }

    // daily summary
    const dailyRes = await fetch("/api/fuel/daily");
    if (dailyRes.ok) {
      const data = await dailyRes.json();
      setDaily(data.summary);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSave = async (type: "IN" | "USED") => {
    if (!selectedVehicle) {
      alert("⚠️ กรุณาเลือกรถก่อน");
      return;
    }

    const res = await fetch("/api/fuel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        vehicleId: selectedVehicle,
        type,
        amount,
        note,
        shift: type === "IN" ? shift : null, // เติมต้องเลือกกะ
      }),
    });

    if (res.ok) {
      alert("✅ บันทึกสำเร็จ");
      setAmount(0);
      setNote("");
      fetchHistory();
    }
  };

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Summary */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Card className="bg-gradient-to-r from-green-100 to-green-200 shadow-md rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-green-700 text-base font-semibold">
              น้ำมันคงเหลือ
            </CardTitle>
            <Fuel className="text-green-600 w-6 h-6" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-900">
              {summary.balance.toFixed(2)} ลิตร
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-100 to-blue-200 shadow-md rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-blue-700 text-base font-semibold">
              เติมทั้งหมด
            </CardTitle>
            <Droplet className="text-blue-600 w-6 h-6" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-blue-900">
              {summary.totalIn.toFixed(2)} ลิตร
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-red-100 to-red-200 shadow-md rounded-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="text-red-700 text-base font-semibold">
              ใช้ไปแล้ว
            </CardTitle>
            <TrendingUp className="text-red-600 w-6 h-6" />
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-red-900">
              {summary.totalUsed.toFixed(2)} ลิตร
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Form */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            ✍️ บันทึกการใช้น้ำมัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="IN" className="w-full">
            <TabsList className="grid grid-cols-2 w-full mb-6">
              <TabsTrigger
                value="IN"
                className="data-[state=active]:bg-green-600 data-[state=active]:text-white"
              >
                ✅ เติมน้ำมัน
              </TabsTrigger>
              <TabsTrigger
                value="USED"
                className="data-[state=active]:bg-red-600 data-[state=active]:text-white"
              >
                📉 ใช้น้ำมัน
              </TabsTrigger>
            </TabsList>

            {/* เติมน้ำมัน */}
            <TabsContent value="IN">
              <div className="space-y-4">
                <Select onValueChange={(val) => setSelectedVehicle(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกรถ" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} {v.plateNo ? `(${v.plateNo})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="ปริมาณ (ลิตร)"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                />

                <Select
                  value={shift}
                  onValueChange={(val: Shift) => setShift(val)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกกะ" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="MORNING">🌞 กะเช้า</SelectItem>
                    <SelectItem value="NIGHT">🌙 กะดึก</SelectItem>
                  </SelectContent>
                </Select>

                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="หมายเหตุ เช่น เติมเต็มถัง"
                />

                <Button
                  onClick={() => handleSave("IN")}
                  className="w-full bg-green-600 hover:bg-green-700"
                >
                  ✅ บันทึกการเติม
                </Button>
              </div>
            </TabsContent>

            {/* ใช้น้ำมัน */}
            <TabsContent value="USED">
              <div className="space-y-4">
                <Select onValueChange={(val) => setSelectedVehicle(val)}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกรถ" />
                  </SelectTrigger>
                  <SelectContent>
                    {vehicles.map((v) => (
                      <SelectItem key={v.id} value={v.id}>
                        {v.name} {v.plateNo ? `(${v.plateNo})` : ""}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Input
                  type="number"
                  placeholder="ปริมาณ (ลิตร)"
                  value={amount}
                  onChange={(e) => setAmount(parseFloat(e.target.value))}
                />

                <Textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  placeholder="หมายเหตุ เช่น ใช้ในงาน"
                />

                <Button
                  onClick={() => handleSave("USED")}
                  className="w-full bg-red-600 hover:bg-red-700"
                >
                  📉 บันทึกการใช้
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Daily Summary */}
      <Card className="shadow-lg rounded-xl overflow-x-auto">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> 📆 สรุปน้ำมันรายวัน
            (แยกกะ)
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>วันที่</TableHead>
                <TableHead>กะ</TableHead>
                <TableHead className="text-green-600">เติมรวม</TableHead>
                <TableHead className="text-red-600">ใช้รวม</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {daily.map((d) => (
                <TableRow
                  key={`${d.shiftDate}-${d.shift}`}
                  className="hover:bg-gray-50"
                >
                  <TableCell>
                    {new Date(d.shiftDate).toLocaleDateString("th-TH")}
                  </TableCell>

                  <TableCell>
                    {d.shift === "MORNING" ? (
                      <span className="flex items-center gap-1 text-yellow-600 font-medium">
                        <Sun className="w-4 h-4" /> กะเช้า
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-indigo-600 font-medium">
                        <Moon className="w-4 h-4" /> กะดึก
                      </span>
                    )}
                  </TableCell>
                  <TableCell className="text-green-600 font-bold">
                    {d.fuelIn.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-red-600 font-bold">
                    {d.fuelUsed.toFixed(2)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Chart */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> 📈
            แนวโน้มคงเหลือน้ำมัน
          </CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={logs.slice().reverse()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis
                dataKey="shiftDate"
                tickFormatter={(val) =>
                  new Date(val).toLocaleDateString("th-TH")
                }
              />
              <YAxis />
              <Tooltip
                formatter={(value: number) => `${value.toFixed(2)} ลิตร`}
                labelFormatter={(label) =>
                  new Date(label).toLocaleDateString("th-TH")
                }
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="#2563eb"
                strokeWidth={3}
                dot={{ r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
      <FuelHistoryPage />
    </div>
  );
}
