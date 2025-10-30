"use client";

import { useEffect, useMemo, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CheckCircle2,
  AlertTriangle,
  Clock,
  Gauge,
  Settings,
} from "lucide-react";
import { toast } from "sonner";
import { MaintenanceLogModal } from "./MaintenanceLogs";
import { useSession } from "next-auth/react";
import { useSearchParams, useRouter } from "next/navigation";
import { FileDown } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";

type Vehicle = {
  id: string;
  name: string;
  plateNo?: string;
  lastHourAfterTest?: number;
  updatedAt?: string;
};

type Plan = {
  id: string;
  nextDueHour: number;
  lastDoneHour?: number;
  status: "PENDING" | "DONE" | "OVERDUE";
  template: {
    category: string;
    item: string;
    action: string;
    intervalHr?: number;
  };
};

export default function MaintenanceTimeline() {
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [loading, setLoading] = useState(true);
  const [openLog, setOpenLog] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const { data: session } = useSession();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const selectedVehicleId = useMemo(() => searchParams.get("vehicleId"), [searchParams]);

  const [openAdd, setOpenAdd] = useState(false);
  const [newPlan, setNewPlan] = useState({
    category: "",
    item: "",
    action: "",
    intervalHr: "",
    lastDoneHour: "",
    nextDueHour: "",
  });
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState({
    category: "",
    item: "",
    action: "",
    intervalHr: "",
    lastDoneHour: "",
    nextDueHour: "",
  });

  // ✅ Filter & Search states
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "OVERDUE" | "DONE"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [dueWindow, setDueWindow] = useState<"ALL" | 24 | 48 | 100>("ALL");

  // 📦 Fetch maintenance plans when vehicleId changes
  useEffect(() => {
    const vid = selectedVehicleId;
    if (!vid) return;
    fetch(`/api/maintenance?vehicleId=${vid}`)
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch((err) => console.error("❌ โหลดแผนบำรุงล้มเหลว:", err));
  }, [selectedVehicleId]);

  // 🚗 Fetch vehicle list + selected vehicle detail
  useEffect(() => {
    const run = async () => {
      try {
        const listRes = await fetch("/api/vehicle");
        const listData = await listRes.json();
        const all: Vehicle[] = listData.vehicles ?? [];
        const sorted = [...all].sort((a, b) => {
          const hit = (v: Vehicle) => /2\.9/i.test(`${v.name} ${v.plateNo ?? ""}`);
          if (hit(a) && !hit(b)) return -1;
          if (!hit(a) && hit(b)) return 1;
          return (a.name || "").localeCompare(b.name || "");
        });
        setVehicles(sorted);
        const vid = selectedVehicleId || sorted[0]?.id;
        if (!selectedVehicleId && vid) {
          const url = new URL(window.location.href);
          url.searchParams.set("vehicleId", vid);
          router.replace(url.toString());
        }
        if (vid) {
          const res = await fetch(`/api/vehicle/${vid}`);
          const data = await res.json();
          if (data.vehicle) setVehicle(data.vehicle);
        }
      } catch (err) {
        console.error("❌ โหลดข้อมูลรถล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };
    run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId]);

  useEffect(() => {
    if (editPlan) {
      setEditForm({
        category: editPlan.template.category,
        item: editPlan.template.item,
        action: editPlan.template.action,
        intervalHr: String(editPlan.template.intervalHr ?? ""),
        lastDoneHour: String(editPlan.lastDoneHour ?? ""),
        nextDueHour: String(editPlan.nextDueHour ?? ""),
      });
    }
  }, [editPlan]);

  const handleConfirmAndSave = async (planId: string, hourOverride?: number) => {
    if (!vehicle) return;

    try {
      const res = await fetch(`/api/maintenance/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentHour: hourOverride ?? vehicle.lastHourAfterTest,
          doneBy: session?.user?.name ?? "Unknown",
        }),
      });

      const result = await res.json();
      if (res.ok) {
        toast.success("✅ บันทึกการบำรุงเรียบร้อย");
        setPlans((prev) =>
          prev.map((p) =>
            p.id === planId
              ? {
                  ...p,
                  status: "DONE",
                  lastDoneHour: result.plan.lastDoneHour,
                  nextDueHour: result.plan.nextDueHour,
                }
              : p
          )
        );
      } else {
        toast.error(`❌ บันทึกไม่สำเร็จ: ${result.error}`);
      }
    } catch (err) {
      toast.error("เกิดข้อผิดพลาดในการเชื่อมต่อ");
      console.error("❌ handleMarkDone error:", err);
    } finally {
      setConfirmId(null);
    }
  };

  const canEdit =
    session?.user?.role === "admin" || session?.user?.role === "operator";

  // 🧮 Filter + Search logic
  const filteredPlans = plans.filter((p) => {
    const isOverdue =
      vehicle?.lastHourAfterTest && vehicle.lastHourAfterTest >= p.nextDueHour;

    const matchesStatus =
      filterStatus === "ALL"
        ? true
        : filterStatus === "OVERDUE"
        ? isOverdue
        : p.status === filterStatus;

    const q = searchQuery.toLowerCase();
    const matchesSearch =
      p.template.category.toLowerCase().includes(q) ||
      p.template.item.toLowerCase().includes(q);

    const remaining = p.nextDueHour - (vehicle?.lastHourAfterTest ?? 0);
    const matchesWindow = dueWindow === "ALL" || (remaining <= dueWindow && remaining >= 0);

    return matchesStatus && matchesSearch && matchesWindow;
  });

  const plansByCategory = filteredPlans.reduce<Record<string, Plan[]>>((acc, p) => {
    const key = p.template.category || "อื่นๆ";
    (acc[key] ||= []).push(p);
    return acc;
  }, {});

  const exportCsv = () => {
    const header = [
      "category","item","action","status","lastDoneHour","nextDueHour","remaining","intervalHr","vehicle","plateNo"
    ];
    const rows = filteredPlans.map(p => [
      p.template.category,
      p.template.item,
      p.template.action,
      p.status,
      String(p.lastDoneHour ?? ""),
      String(p.nextDueHour ?? ""),
      String(Math.max(0, (p.nextDueHour - (vehicle?.lastHourAfterTest ?? 0))).toFixed(0)),
      String(p.template.intervalHr ?? ""),
      vehicle?.name ?? "",
      vehicle?.plateNo ?? "",
    ]);
    const csv = [header, ...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `maintenance-plans.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <p className="text-muted-foreground text-center py-10 animate-pulse">
        ⏳ กำลังโหลดข้อมูล...
      </p>
    );
  if (!vehicle)
    return <p className="text-red-500 text-center py-10">❌ ไม่พบข้อมูลรถ</p>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-8">
      {/* 🚗 Vehicle Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-600">รถ/เครื่อง:</span>
        <select
          className="border rounded-md px-3 py-1 text-sm bg-white/90 shadow-sm"
          value={selectedVehicleId ?? ""}
          onChange={(e)=>{
            const url = new URL(window.location.href);
            url.searchParams.set("vehicleId", e.target.value);
            router.push(url.toString());
          }}
        >
          {vehicles.map(v=> (
            <option key={v.id} value={v.id}>{v.name}{v.plateNo?` (${v.plateNo})`:''}</option>
          ))}
        </select>
      </div>
      {/* 🔹 Vehicle Summary */}
      <Card className="p-6 border-l-4 border-blue-600 shadow-sm bg-gradient-to-r from-blue-50 via-white to-white rounded-2xl">
        <div className="flex flex-col sm:flex-row justify-between gap-4 sm:items-center">
          <div>
            <h2 className="text-2xl font-bold text-blue-800">{vehicle.name}</h2>
            <p className="text-sm text-gray-600">
              ทะเบียน / รุ่น:{" "}
              <span className="font-medium">{vehicle.plateNo ?? "-"}</span>
            </p>
            <p className="text-xs text-gray-500 mt-1">
              อัปเดตล่าสุด:{" "}
              {new Date(vehicle.updatedAt ?? "").toLocaleString("th-TH", {
                hour12: false,
              })}
            </p>
          </div>

          <div className="flex items-center gap-2 bg-blue-100 px-5 py-3 rounded-lg shadow-inner">
            <Gauge className="text-blue-600 w-6 h-6" />
            <div>
              <p className="text-[13px] text-gray-600 leading-tight">
                ชั่วโมงสะสม
              </p>
              <p className="text-lg font-semibold text-blue-700">
                {vehicle.lastHourAfterTest ?? 0} ชม.
              </p>
            </div>
          </div>
        </div>
      </Card>

      {/* 🔸 Maintenance List */}
      <div className="space-y-6">
        <div className="flex justify-between items-center border-b pb-2">
          <h3 className="text-xl font-semibold text-gray-700">
            รายการบำรุงรักษา
          </h3>

          {canEdit && (
            <Dialog
              open={openAdd}
              onOpenChange={(isOpen) => {
                setOpenAdd(isOpen);
                if (isOpen && vehicle?.lastHourAfterTest) {
                  setNewPlan((prev) => ({
                    ...prev,
                    lastDoneHour: vehicle?.lastHourAfterTest?.toString() ?? "",
                  }));
                }
              }}
            >
              <DialogTrigger asChild>
                <Button className="bg-blue-500 hover:bg-blue-600 text-white text-sm px-3 py-1.5">
                  ➕ เพิ่มรายการ
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>เพิ่มรายการบำรุงรักษา</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-2">
                  <div>
                    <Label htmlFor="category">หมวดหมู่</Label>
                    <Input
                      id="category"
                      placeholder="เช่น เครื่องยนต์, ระบบไฮดรอลิก"
                      value={newPlan.category}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, category: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="item">รายการ</Label>
                    <Input
                      id="item"
                      placeholder="เช่น เปลี่ยนน้ำมันเครื่อง"
                      value={newPlan.item}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, item: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="action">งานที่ต้องทำ</Label>
                    <Input
                      id="action"
                      placeholder="เช่น ตรวจเช็ค / เปลี่ยน"
                      value={newPlan.action}
                      onChange={(e) =>
                        setNewPlan({ ...newPlan, action: e.target.value })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="intervalHr">รอบบำรุง (ชม.)</Label>
                    <Input
                      id="intervalHr"
                      type="number"
                      placeholder="เช่น 200"
                      value={newPlan.intervalHr}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          intervalHr: e.target.value,
                          nextDueHour: String(
                            (parseFloat(newPlan.lastDoneHour || "0") || 0) +
                              (parseFloat(e.target.value || "0") || 0)
                          ),
                        })
                      }
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastDoneHour">ชั่วโมงที่ทำล่าสุด</Label>
                    <Input
                      id="lastDoneHour"
                      type="number"
                      value={newPlan.lastDoneHour}
                      onChange={(e) =>
                        setNewPlan({
                          ...newPlan,
                          lastDoneHour: e.target.value,
                          nextDueHour: String(
                            (parseFloat(e.target.value || "0") || 0) +
                              (parseFloat(newPlan.intervalHr || "0") || 0)
                          ),
                        })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">ค่าเริ่มต้น: {vehicle?.lastHourAfterTest ?? 0} ชม.</p>
                  </div>
                  <div>
                    <Label htmlFor="nextDueHour">รอบถัดไป (ชม.)</Label>
                    <Input
                      id="nextDueHour"
                      type="number"
                      value={newPlan.nextDueHour}
                      readOnly
                    />
                    <p className="text-xs text-gray-500 mt-1">คำนวณอัตโนมัติ = ชั่วโมงล่าสุด + รอบบำรุง</p>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenAdd(false)}>
                    ยกเลิก
                  </Button>
                  <Button
                    onClick={async () => {
                      try {
                        const res = await fetch("/api/maintenance", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            ...newPlan,
                            vehicleId: vehicle?.id,
                            createdBy: session?.user?.name ?? "Unknown",
                            lastDoneHour: parseFloat(newPlan.lastDoneHour || "0"),
                            nextDueHour: parseFloat(newPlan.nextDueHour || "0"),
                          }),
                        });
                        if (!res.ok) throw new Error("Failed to add");
                        const data = await res.json();
                        toast.success("✅ เพิ่มรายการสำเร็จ");
                        setPlans((prev) => [...prev, data.plan]);
                        setOpenAdd(false);
                        setNewPlan({
                          category: "",
                          item: "",
                          action: "",
                          intervalHr: "",
                          lastDoneHour: "",
                          nextDueHour: "",
                        });
                      } catch (err) {
                        console.error(err);
                        toast.error("❌ เพิ่มรายการไม่สำเร็จ");
                      }
                    }}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    💾 บันทึก
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        {/* 🔍 Filter + Search */}
        <div className="flex flex-col gap-3 rounded-xl border bg-white/70 backdrop-blur px-3 py-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-2 flex-wrap">
            {["ALL", "PENDING", "OVERDUE", "DONE"].map((status) => (
              <Button
                key={status}
                variant={filterStatus === status ? "default" : "outline"}
                size="sm"
                onClick={() =>
                  setFilterStatus(
                    status as "ALL" | "PENDING" | "OVERDUE" | "DONE"
                  )
                }
              >
                {status === "ALL"
                  ? "ทั้งหมด"
                  : status === "PENDING"
                  ? "⏳ รอดำเนินการ"
                  : status === "OVERDUE"
                  ? "⚠️ เกินรอบ"
                  : "✅ ทำแล้ว"}
              </Button>
            ))}
            <div className="mx-2 h-6 w-px bg-gray-200 self-center" />
            {(["ALL", 24, 48, 100] as const).map((w) => (
              <Button
                key={`win-${w}`}
                variant={dueWindow === w ? "default" : "outline"}
                size="sm"
                onClick={() => setDueWindow(w)}
              >
                {w === "ALL" ? "ทั้งหมด" : `≤ ${w} ชม.`}
              </Button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <div className="relative w-full sm:w-64">
              <Input
                type="text"
                placeholder=" ค้นหาชื่อหรือหมวดหมู่..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-8 text-sm"
              />
              <span className="absolute left-2 top-2.5 text-gray-400">🔍</span>
            </div>
            <Button variant="outline" size="sm" onClick={exportCsv} className="shadow-sm">
              <FileDown className="w-4 h-4 mr-1" /> Export CSV
            </Button>
          </div>
        </div>

        {/* 🔧 Filtered list */}
        {filteredPlans.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            ไม่พบข้อมูลที่ตรงกับเงื่อนไข
          </p>
        ) : (
          <div className="space-y-6">
            {Object.entries(plansByCategory).map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-3 mb-3">
                  <div className="h-5 w-1.5 rounded bg-blue-500" />
                  <span className="text-sm font-semibold text-blue-900 tracking-wide">{category}</span>
                  <span className="text-xs text-gray-500">{items.length} รายการ</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {items.map((p) => {
              const isOverdue =
                vehicle.lastHourAfterTest &&
                vehicle.lastHourAfterTest >= p.nextDueHour;

              const progressPercent =
                p.lastDoneHour && p.template.intervalHr
                  ? Math.min(
                      ((vehicle.lastHourAfterTest! - p.lastDoneHour) /
                        p.template.intervalHr) *
                        100,
                      100
                    )
                  : 0;

              const icon =
                p.status === "DONE" ? (
                  <CheckCircle2 className="text-green-500" />
                ) : isOverdue ? (
                  <AlertTriangle className="text-red-500" />
                ) : (
                  <Clock className="text-yellow-500" />
                );

              const colorMap: Record<string, string> = {
                DONE: "border-green-500 bg-green-50",
                OVERDUE: "border-red-500 bg-red-50",
                PENDING: "border-yellow-400 bg-yellow-50",
              };

                    return (
                      <Card
                        key={p.id}
                        className={`p-5 flex flex-col justify-between gap-4 border-l-4 rounded-2xl shadow-sm
                    ${colorMap[p.status] ?? "border-gray-200 bg-white/90"}
                    transition-all duration-300 hover:shadow-lg hover:-translate-y-[2px]`}
                      >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-3">
                      {icon}
                      <div>
                              <h4 className="font-semibold text-gray-800 text-base leading-snug">
                          {p.template.category} - {p.template.item}
                        </h4>
                        <p className="text-sm text-gray-600">
                          งาน:{" "}
                          <span className="font-medium text-gray-800">
                            {p.template.action}
                          </span>
                        </p>
                        <p className="text-xs text-gray-500">
                          รอบ: {p.template.intervalHr ?? "-"} ชั่วโมง
                        </p>
                      </div>
                    </div>

                    <Badge
                      variant={
                        p.status === "DONE"
                          ? "default"
                          : isOverdue || p.status === "OVERDUE"
                          ? "destructive"
                          : "secondary"
                      }
                      className="text-[11px] tracking-wide"
                    >
                      {isOverdue
                        ? "เกินรอบ"
                        : p.status === "DONE"
                        ? "ทำแล้ว"
                        : "รอดำเนินการ"}
                    </Badge>
                  </div>

                  {/* Progress bar */}
                      <div className="w-full h-3 bg-gray-200/70 rounded-full overflow-hidden relative shadow-inner">
                    <div
                      className={`absolute left-0 top-0 h-full transition-all duration-700 ${
                        progressPercent >= 100
                          ? "bg-gradient-to-r from-green-400 to-green-600"
                          : progressPercent >= 80
                          ? "bg-gradient-to-r from-yellow-300 to-yellow-500"
                          : "bg-gradient-to-r from-blue-400 to-blue-600"
                      }`}
                      style={{ width: `${progressPercent}%` }}
                    />
                        <span className="absolute inset-0 flex justify-center items-center text-[11px] font-bold text-gray-700/80 drop-shadow">
                      {progressPercent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>ล่าสุด: {p.lastDoneHour ?? "-"} ชม.</span>
                    <span>รอบถัดไป: {p.nextDueHour} ชม. (เหลือ {Math.max(0, (p.nextDueHour - (vehicle.lastHourAfterTest ?? 0))).toFixed(0)} ชม.)</span>
                  </div>

                  {/* ✅ Buttons */}
                  <div className="flex justify-between items-center mt-2">
                    {canEdit && p.status !== "DONE" && (
                      <AlertDialog open={confirmId === p.id}>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            onClick={() => setConfirmId(p.id)}
                            className="bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 text-white text-xs font-medium shadow-sm"
                          >
                            ✅ บันทึกการบำรุง
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>ยืนยันการบำรุง?</AlertDialogTitle>
                            <AlertDialogDescription>
                              ต้องการบันทึกแผน <b>{p.template.item}</b> ใช่ไหม?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <div className="mt-2">
                            <Label htmlFor={`hour-${p.id}`}>ชั่วโมงเครื่องขณะทำ</Label>
                            <Input id={`hour-${p.id}`} type="number" defaultValue={vehicle.lastHourAfterTest ?? 0} />
                          </div>
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setConfirmId(null)}
                            >
                              ยกเลิก
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => {
                                const input = document.getElementById(`hour-${p.id}`) as HTMLInputElement | null;
                                const val = input ? parseFloat(input.value || '0') : undefined;
                                handleConfirmAndSave(p.id, val);
                              }}
                            >
                              ยืนยัน
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}

                    {/* ⚙️ Dropdown */}
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-7 w-7 border-gray-300 hover:bg-gray-100"
                        >
                          <Settings className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-36 text-sm">
                        <DropdownMenuItem onClick={() => setOpenLog(p.id)}>
                          📜 ดูประวัติ
                        </DropdownMenuItem>
                        {canEdit && (
                          <>
                            <DropdownMenuItem onClick={() => setEditPlan(p)}>
                              ✏️ แก้ไข
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600 focus:bg-red-50"
                              onClick={async () => {
                                try {
                                  const res = await fetch(
                                    `/api/maintenance/${p.id}`,
                                    { method: "DELETE" }
                                  );
                                  if (!res.ok) throw new Error("Delete failed");
                                  setPlans((prev) =>
                                    prev.filter((x) => x.id !== p.id)
                                  );
                                  toast.success("🗑️ ลบสำเร็จ");
                                } catch (err) {
                                  console.error(err);
                                  toast.error("❌ ลบไม่สำเร็จ");
                                }
                              }}
                            >
                              🗑️ ลบ
                            </DropdownMenuItem>
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>

                  {/* 🧾 Modal Log */}
                  {openLog === p.id && (
                    <MaintenanceLogModal
                      planId={p.id}
                      open={true}
                      onClose={() => setOpenLog(null)}
                    />
                  )}
                      </Card>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* ✏️ Modal แก้ไขรายการ */}
      {editPlan && (
        <Dialog open={!!editPlan} onOpenChange={() => setEditPlan(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>แก้ไขรายการบำรุง</DialogTitle>
            </DialogHeader>

            <div className="space-y-4 py-2">
              <div>
                <Label htmlFor="editCategory">หมวดหมู่</Label>
                <Input
                  id="editCategory"
                  placeholder="เช่น เครื่องยนต์"
                  value={editForm.category}
                  onChange={(e) =>
                    setEditForm({ ...editForm, category: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editItem">รายการ</Label>
                <Input
                  id="editItem"
                  placeholder="เช่น เปลี่ยนน้ำมันเครื่อง"
                  value={editForm.item}
                  onChange={(e) =>
                    setEditForm({ ...editForm, item: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editAction">งานที่ต้องทำ</Label>
                <Input
                  id="editAction"
                  placeholder="เช่น ตรวจเช็ค / เปลี่ยน"
                  value={editForm.action}
                  onChange={(e) =>
                    setEditForm({ ...editForm, action: e.target.value })
                  }
                />
              </div>
              <div>
                <Label htmlFor="editIntervalHr">รอบบำรุง (ชม.)</Label>
                <Input
                  id="editIntervalHr"
                  type="number"
                  placeholder="เช่น 200"
                  value={editForm.intervalHr}
                  onChange={(e) => {
                    const interval = e.target.value;
                    const next = String(
                      (parseFloat(editForm.lastDoneHour || "0") || 0) +
                        (parseFloat(interval || "0") || 0)
                    );
                    setEditForm({ ...editForm, intervalHr: interval, nextDueHour: next });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="editLastDoneHour">ชั่วโมงที่ทำล่าสุด</Label>
                <Input
                  id="editLastDoneHour"
                  type="number"
                  value={editForm.lastDoneHour}
                  onChange={(e) => {
                    const last = e.target.value;
                    const next = String(
                      (parseFloat(last || "0") || 0) +
                        (parseFloat(editForm.intervalHr || "0") || 0)
                    );
                    setEditForm({ ...editForm, lastDoneHour: last, nextDueHour: next });
                  }}
                />
              </div>
              <div>
                <Label htmlFor="editNextDueHour">รอบถัดไป (ชม.)</Label>
                <Input
                  id="editNextDueHour"
                  type="number"
                  value={editForm.nextDueHour}
                  readOnly
                />
                <p className="text-xs text-gray-500 mt-1">คำนวณอัตโนมัติ = ชั่วโมงล่าสุด + รอบบำรุง</p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setEditPlan(null)}>
                ยกเลิก
              </Button>
              <Button
                className="bg-blue-600 hover:bg-blue-700 text-white"
                onClick={async () => {
                  try {
                    const res = await fetch(`/api/maintenance/${editPlan.id}`, {
                      method: "PATCH",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        category: editForm.category,
                        item: editForm.item,
                        action: editForm.action,
                        intervalHr: parseFloat(editForm.intervalHr || "0"),
                        lastDoneHour: parseFloat(editForm.lastDoneHour || "0"),
                        nextDueHour: parseFloat(editForm.nextDueHour || "0"),
                      }),
                    });
                    if (!res.ok) throw new Error("Update failed");

                    const data = await res.json();

                    // ✅ อัปเดต state ให้เห็นทันที
                    setPlans((prev) =>
                      prev.map((p) =>
                        p.id === editPlan.id
                          ? {
                              ...p,
                              template: {
                                ...p.template,
                                category: data.plan.template.category,
                                item: data.plan.template.item,
                                action: data.plan.template.action,
                                intervalHr: data.plan.template.intervalHr,
                              },
                              lastDoneHour: data.plan.lastDoneHour,
                              nextDueHour: data.plan.nextDueHour,
                            }
                          : p
                      )
                    );

                    toast.success("💾 แก้ไขรายการสำเร็จ");
                    setEditPlan(null);
                  } catch (err) {
                    console.error(err);
                    toast.error("❌ แก้ไขไม่สำเร็จ");
                  }
                }}
              >
                💾 บันทึก
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
