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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { Fuel, TrendingUp, Droplet, Calendar, Sun, Moon, Truck, Clock, Activity, Info } from "lucide-react";
import type { Shift } from "@prisma/client";
import FuelHistoryPage from "@/components/history-fuel-use";
import { toast } from "sonner";
import { motion } from "framer-motion";

type Vehicle = {
  id: string;
  name: string;
  plateNo?: string | null;
};

type FuelLog = {
  id: string;
  date: string;
  shiftDate: string;
  shift?: "MORNING" | "NIGHT" | null;
  fuelIn: number;
  fuelUsed: number;
  balance: number;
  note?: string;
  vehicle: Vehicle;
};

type DailySummary = {
  shiftDate: string;
  shift: Shift | null;
  fuelIn: number;
  fuelUsed: number;
  logs: (FuelLog & { vehicle: Vehicle })[];
};

type VehicleStats = {
  vehicleId: string;
  vehicleName: string;
  totalIn: number;
  totalUsed: number;
  lastRefuelDate: string | null;
  efficiency: number; // totalUsed / entries count
};

export default function FuelPage() {
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [selectedVehicle, setSelectedVehicle] = useState<string>("");
  const [amount, setAmount] = useState<number>(0);
  const [note, setNote] = useState<string>("");
  const [shift, setShift] = useState<"MORNING" | "NIGHT">("MORNING");

  const [logs, setLogs] = useState<FuelLog[]>([]);
  const [daily, setDaily] = useState<DailySummary[]>([]);
  const [vehicleStats, setVehicleStats] = useState<VehicleStats[]>([]);
  const [recentActivity, setRecentActivity] = useState<FuelLog[]>([]);
  const [summary, setSummary] = useState({
    balance: 0,
    totalIn: 0,
    totalUsed: 0,
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

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
    setLoading(true);
    try {
      const res = await fetch("/api/fuel/history");
      if (res.ok) {
        const data = await res.json();
        setLogs(data.logs);

        // คำนวณ summary
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

        // คำนวณสถิติแต่ละรถ
        const vehicleMap = new Map<string, VehicleStats>();
        data.logs.forEach((log: FuelLog) => {
          const existing = vehicleMap.get(log.vehicle.id);
          if (existing) {
            existing.totalIn += log.fuelIn;
            existing.totalUsed += log.fuelUsed;
            if (log.fuelIn > 0 && (!existing.lastRefuelDate || new Date(log.date) > new Date(existing.lastRefuelDate))) {
              existing.lastRefuelDate = log.date;
            }
          } else {
            vehicleMap.set(log.vehicle.id, {
              vehicleId: log.vehicle.id,
              vehicleName: log.vehicle.name,
              totalIn: log.fuelIn,
              totalUsed: log.fuelUsed,
              lastRefuelDate: log.fuelIn > 0 ? log.date : null,
              efficiency: 0,
            });
          }
        });

        // คำนวณ efficiency
        vehicleMap.forEach((stats) => {
          const vehicleLogs = data.logs.filter((l: FuelLog) => l.vehicle.id === stats.vehicleId);
          stats.efficiency = vehicleLogs.length > 0 ? stats.totalUsed / vehicleLogs.length : 0;
        });

        setVehicleStats(Array.from(vehicleMap.values()));

        // เอา 5 รายการล่าสุด
        setRecentActivity(data.logs.slice(0, 5));
      }

      const dailyRes = await fetch("/api/fuel/daily");
      if (dailyRes.ok) {
        const data = await dailyRes.json();
        setDaily(data.summary);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const handleSave = async (type: "IN" | "USED") => {
    // Validation
    if (!selectedVehicle) {
      toast.error("⚠️ กรุณาเลือกรถก่อน");
      return;
    }
    if (!amount || amount <= 0) {
      toast.error("⚠️ กรุณาระบุปริมาณที่ถูกต้อง");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/fuel", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          vehicleId: selectedVehicle,
          type,
          amount,
          note,
          shift: type === "IN" ? shift : null,
        }),
      });

      if (res.ok) {
        const vehicleName = vehicles.find(v => v.id === selectedVehicle)?.name || "รถ";
        toast.success(
          type === "IN" 
            ? `✅ บันทึกการเติมน้ำมัน ${amount} ลิตร (${vehicleName}) สำเร็จ!`
            : `✅ บันทึกการใช้น้ำมัน ${amount} ลิตร (${vehicleName}) สำเร็จ!`
        );
        setAmount(0);
        setNote("");
        setSelectedVehicle("");
        setDialogOpen(false); // ปิด dialog
        await fetchHistory();
      } else {
        toast.error("❌ บันทึกล้มเหลว กรุณาลองใหม่อีกครั้ง");
      }
    } catch (error) {
      toast.error("⚠️ เกิดข้อผิดพลาด: " + (error as Error).message);
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Loading Skeleton
  if (loading) {
    return (
      <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto animate-pulse">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="h-28 bg-gray-200 rounded-xl shadow-inner" />
          ))}
        </div>
        <div className="h-[500px] bg-gray-200 rounded-xl shadow-inner" />
        <div className="h-[300px] bg-gray-200 rounded-xl shadow-inner" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-7xl mx-auto pb-28">
      {/* Page Header */}
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-6"
      >
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl shadow-lg mb-4">
          <Fuel className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Fuel Management
        </h1>
        <p className="text-gray-600 text-sm">
          ระบบจัดการน้ำมันและเชื้อเพลิง
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-blue-500 to-cyan-600 mx-auto mt-4 rounded-full"></div>
      </motion.div>

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

      {/* Vehicle Stats */}
      {vehicleStats.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Truck className="w-5 h-5 text-blue-600" /> 🚗 สถิติแยกตามรถ
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {vehicleStats.map((stats) => (
                  <Card key={stats.vehicleId} className="border-2 border-gray-200 hover:border-blue-400 transition-all">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold text-gray-800">
                          {stats.vehicleName}
                        </CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {(stats.totalIn - stats.totalUsed).toFixed(1)}L
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-2 text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">เติมทั้งหมด:</span>
                        <span className="font-semibold text-green-600">{stats.totalIn.toFixed(1)} L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">ใช้ทั้งหมด:</span>
                        <span className="font-semibold text-red-600">{stats.totalUsed.toFixed(1)} L</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600">เติมครั้งล่าสุด:</span>
                        <span className="font-semibold text-blue-600">
                          {stats.lastRefuelDate
                            ? new Date(stats.lastRefuelDate).toLocaleDateString("th-TH")
                            : "ไม่มีข้อมูล"}
                        </span>
                      </div>
                      <div className="flex justify-between items-center pt-2 border-t">
                        <span className="text-gray-600 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          เฉลี่ย/รายการ:
                        </span>
                        <span className="font-semibold text-purple-600">{stats.efficiency.toFixed(2)} L</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Recent Activity */}
      {recentActivity.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-lg rounded-xl">
            <CardHeader>
              <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
                <Activity className="w-5 h-5 text-blue-600" /> ⚡ กิจกรรมล่าสุด
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        log.fuelIn > 0 ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {log.fuelIn > 0 ? (
                          <Droplet className="w-5 h-5 text-green-600" />
                        ) : (
                          <TrendingUp className="w-5 h-5 text-red-600" />
                        )}
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">
                          {log.vehicle.name}
                          {log.vehicle.plateNo && (
                            <span className="text-gray-500 text-sm ml-1">({log.vehicle.plateNo})</span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(log.date).toLocaleString("th-TH")}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant={log.fuelIn > 0 ? "default" : "destructive"} className="mb-1">
                        {log.fuelIn > 0 ? "เติม" : "ใช้"} {(log.fuelIn || log.fuelUsed).toFixed(1)} L
                      </Badge>
                      {log.note && (
                        <p className="text-xs text-gray-500 max-w-[150px] truncate">{log.note}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Form Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold flex items-center gap-2">
              <Fuel className="w-6 h-6 text-green-600" />
              บันทึกการใช้น้ำมัน
            </DialogTitle>
            <DialogDescription>
              เลือกประเภทการบันทึก และกรอกข้อมูลให้ครบถ้วน
            </DialogDescription>
          </DialogHeader>
          <div>
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
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    เลือกรถ <span className="text-red-500">*</span>
                  </label>
                  <Select value={selectedVehicle} onValueChange={(val) => setSelectedVehicle(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- เลือกรถที่ต้องการเติมน้ำมัน --" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          🚗 {v.name} {v.plateNo ? `(${v.plateNo})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    ปริมาณน้ำมัน <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="ระบุปริมาณ (ลิตร)"
                    value={amount || ""}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 กรอกจำนวนลิตรที่เติม</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    กะการทำงาน
                  </label>
                  <Select
                    value={shift}
                    onValueChange={(val: Shift) => setShift(val)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="เลือกกะ" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="MORNING">🌞 กะเช้า (Morning)</SelectItem>
                      <SelectItem value="NIGHT">🌙 กะดึก (Night)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    หมายเหตุ
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น เติมเต็มถัง, เติมที่ปั๊ม PTT"
                    className="resize-none h-20"
                  />
                </div>

                <Button
                  onClick={() => handleSave("IN")}
                  disabled={saving || !selectedVehicle || !amount}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:opacity-50 h-12 text-base font-semibold"
                >
                  {saving ? "⏳ กำลังบันทึก..." : "✅ บันทึกการเติมน้ำมัน"}
                </Button>
              </div>
            </TabsContent>

            {/* ใช้น้ำมัน */}
            <TabsContent value="USED">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    เลือกรถ <span className="text-red-500">*</span>
                  </label>
                  <Select value={selectedVehicle} onValueChange={(val) => setSelectedVehicle(val)}>
                    <SelectTrigger>
                      <SelectValue placeholder="-- เลือกรถที่ใช้น้ำมัน --" />
                    </SelectTrigger>
                    <SelectContent>
                      {vehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>
                          🚗 {v.name} {v.plateNo ? `(${v.plateNo})` : ""}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    ปริมาณน้ำมัน <span className="text-red-500">*</span>
                  </label>
                  <Input
                    type="number"
                    placeholder="ระบุปริมาณ (ลิตร)"
                    value={amount || ""}
                    onChange={(e) => setAmount(parseFloat(e.target.value) || 0)}
                    min="0"
                    step="0.01"
                    className="font-mono"
                  />
                  <p className="text-xs text-gray-500 mt-1">💡 กรอกจำนวนลิตรที่ใช้ไป</p>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1 block">
                    หมายเหตุ
                  </label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="เช่น ใช้ในการทำงาน, ทดสอบเครื่อง"
                    className="resize-none h-20"
                  />
                </div>

                <Button
                  onClick={() => handleSave("USED")}
                  disabled={saving || !selectedVehicle || !amount}
                  className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 h-12 text-base font-semibold"
                >
                  {saving ? "⏳ กำลังบันทึก..." : "📉 บันทึกการใช้น้ำมัน"}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
          </div>
        </DialogContent>
      </Dialog>

      {/* Floating Action Button */}
      <div className="fixed right-8 bottom-20 md:right-6 md:bottom-6 z-40">
        <Button
          onClick={() => setDialogOpen(true)}
          className="rounded-full w-14 h-14 p-0 bg-gradient-to-br from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white shadow-xl hover:shadow-2xl cursor-pointer"
          aria-label="บันทึกการใช้น้ำมัน"
        >
          <Fuel className="w-6 h-6" />
        </Button>
      </div>

      {/* Daily Summary */}
      <Card className="shadow-lg rounded-xl overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            <Calendar className="w-5 h-5 text-blue-600" /> 📆 สรุปน้ำมันรายวัน (แยกกะ)
          </CardTitle>
          <div className="text-sm text-gray-600">
            ทั้งหมด {daily.length} รายการ
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-bold">วันที่</TableHead>
                  <TableHead className="font-bold">กะ</TableHead>
                  <TableHead className="text-green-700 font-bold">เติมรวม (L)</TableHead>
                  <TableHead className="text-red-700 font-bold">ใช้รวม (L)</TableHead>
                  <TableHead className="text-blue-700 font-bold">คงเหลือ (L)</TableHead>
                  <TableHead className="font-bold">รถที่ใช้</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {[...daily]
                  .sort((a, b) => new Date(b.shiftDate).getTime() - new Date(a.shiftDate).getTime())
                  .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                  .map((d, idx) => (
                    <TableRow
                      key={`${d.shiftDate}-${d.shift}`}
                      className="hover:bg-blue-50 transition-colors"
                    >
                      <TableCell className="font-medium">
                        {new Date(d.shiftDate).toLocaleDateString("th-TH", {
                          timeZone: "Asia/Bangkok",
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })}
                      </TableCell>

                      <TableCell>
                        {d.shift === "MORNING" ? (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit bg-yellow-50 text-yellow-700 border-yellow-300">
                            <Sun className="w-3 h-3" /> กะเช้า
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="flex items-center gap-1 w-fit bg-indigo-50 text-indigo-700 border-indigo-300">
                            <Moon className="w-3 h-3" /> กะดึก
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-green-600 font-bold text-right">
                        {d.fuelIn.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-red-600 font-bold text-right">
                        {d.fuelUsed.toFixed(2)}
                      </TableCell>
                      <TableCell className="text-blue-600 font-bold text-right">
                        {(d.fuelIn - d.fuelUsed).toFixed(2)}
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {Array.from(new Set(d.logs.map(l => `${l.vehicle.name}${l.vehicle.plateNo ? ` (${l.vehicle.plateNo})` : ""}`))).map((vInfo, i) => (
                            <Badge key={i} variant="secondary" className="text-xs">
                              {vInfo}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {daily.length > itemsPerPage && (
            <div className="p-4 border-t bg-gray-50 flex items-center justify-between">
              <div className="text-sm text-gray-600">
                แสดง {((currentPage - 1) * itemsPerPage) + 1} - {Math.min(currentPage * itemsPerPage, daily.length)} จาก {daily.length} รายการ
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
                  {Array.from({ length: Math.ceil(daily.length / itemsPerPage) }).map((_, i) => {
                    const pageNum = i + 1;
                    const totalPages = Math.ceil(daily.length / itemsPerPage);
                    
                    // แสดงเฉพาะบางหน้า
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
                  onClick={() => setCurrentPage(p => Math.min(Math.ceil(daily.length / itemsPerPage), p + 1))}
                  disabled={currentPage === Math.ceil(daily.length / itemsPerPage)}
                  className="disabled:opacity-50"
                >
                  ถัดไป →
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chart: การใช้น้ำมันต่อกะ */}
      <Card className="shadow-lg rounded-xl">
        <CardHeader>
          <CardTitle className="text-lg md:text-xl font-bold flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-blue-600" /> 📊 การใช้น้ำมันต่อกะ (MORNING vs NIGHT)
          </CardTitle>
        </CardHeader>
        <CardContent>
          {(() => {
            // สร้างข้อมูลเทียบการใช้ต่อกะในแต่ละวัน
            const map: Record<string, { date: string; MORNING: number; NIGHT: number }> = {};
            daily.forEach((d) => {
              const day = new Date(d.shiftDate).toLocaleDateString("th-TH", {
                timeZone: "Asia/Bangkok",
                day: "2-digit",
                month: "short",
              });
              if (!map[day]) map[day] = { date: day, MORNING: 0, NIGHT: 0 };
              const used = Number(d.fuelUsed || 0);
              if (d.shift === "MORNING") map[day].MORNING += used;
              if (d.shift === "NIGHT") map[day].NIGHT += used;
            });
            const chartData = Object.values(map);

            return (
              <ResponsiveContainer width="100%" height={320}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip formatter={(v: number) => `${v.toFixed(2)} ลิตร`} />
                  <Legend />
                  <Bar dataKey="MORNING" name="กะเช้า" fill="#22c55e" radius={[6,6,0,0]} />
                  <Bar dataKey="NIGHT" name="กะดึก" fill="#3b82f6" radius={[6,6,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            );
          })()}
        </CardContent>
      </Card>

      <FuelHistoryPage />
    </div>
  );
}
