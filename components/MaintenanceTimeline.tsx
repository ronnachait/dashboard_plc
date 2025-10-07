"use client";

import { useEffect, useState } from "react";
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

  const [openAdd, setOpenAdd] = useState(false);
  const [newPlan, setNewPlan] = useState({
    category: "",
    item: "",
    action: "",
    intervalHr: "",
    lastDoneHour: "",
  });
  const [editPlan, setEditPlan] = useState<Plan | null>(null);
  const [editForm, setEditForm] = useState({
    category: "",
    item: "",
    action: "",
    intervalHr: "",
  });

  // ✅ Filter & Search states
  const [filterStatus, setFilterStatus] = useState<
    "ALL" | "PENDING" | "OVERDUE" | "DONE"
  >("ALL");
  const [searchQuery, setSearchQuery] = useState("");

  // 📦 Fetch maintenance plans
  useEffect(() => {
    fetch("/api/maintenance")
      .then((res) => res.json())
      .then((data) => setPlans(data))
      .catch((err) => console.error("❌ โหลดแผนบำรุงล้มเหลว:", err));
  }, []);

  // 🚗 Fetch vehicle info
  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(
          "/api/vehicle/23429582-fbfd-4c7b-95c1-10c17b3dfebb"
        );
        if (!res.ok) throw new Error("Fetch failed");
        const data = await res.json();
        if (data.vehicle) setVehicle(data.vehicle);
      } catch (err) {
        console.error("❌ โหลดข้อมูลรถล้มเหลว:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchVehicle();
  }, []);

  useEffect(() => {
    if (editPlan) {
      setEditForm({
        category: editPlan.template.category,
        item: editPlan.template.item,
        action: editPlan.template.action,
        intervalHr: String(editPlan.template.intervalHr ?? ""),
      });
    }
  }, [editPlan]);

  const handleConfirmAndSave = async (planId: string) => {
    if (!vehicle) return;

    try {
      const res = await fetch(`/api/maintenance/${planId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentHour: vehicle.lastHourAfterTest,
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

    return matchesStatus && matchesSearch;
  });

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
      {/* 🔹 Vehicle Summary */}
      <Card className="p-6 border-l-4 border-blue-600 shadow-sm bg-gradient-to-r from-blue-50 via-white to-white rounded-xl">
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
                        setNewPlan({ ...newPlan, intervalHr: e.target.value })
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
                        setNewPlan({ ...newPlan, lastDoneHour: e.target.value })
                      }
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      ค่าเริ่มต้น: {vehicle?.lastHourAfterTest ?? 0} ชม.
                    </p>
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
                            lastDoneHour: parseFloat(
                              newPlan.lastDoneHour || "0"
                            ),
                            nextDueHour:
                              parseFloat(newPlan.lastDoneHour || "0") +
                              parseFloat(newPlan.intervalHr || "0"),
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
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
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
          </div>
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
        </div>

        {/* 🔧 Filtered list */}
        {filteredPlans.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            ไม่พบข้อมูลที่ตรงกับเงื่อนไข
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPlans.map((p) => {
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
                  className={`p-4 flex flex-col justify-between gap-4 border-l-4 rounded-xl shadow-sm
                    ${colorMap[p.status] ?? "border-gray-300 bg-white"}
                    transition-all duration-300 hover:shadow-lg hover:scale-[1.01]`}
                >
                  <div className="flex justify-between items-start gap-2">
                    <div className="flex items-start gap-3">
                      {icon}
                      <div>
                        <h4 className="font-semibold text-gray-800 text-base">
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
                  <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden relative shadow-inner">
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
                    <span className="absolute inset-0 flex justify-center items-center text-[11px] font-bold text-gray-700 drop-shadow">
                      {progressPercent.toFixed(0)}%
                    </span>
                  </div>

                  <div className="flex justify-between text-xs text-gray-600">
                    <span>ล่าสุด: {p.lastDoneHour ?? "-"} ชม.</span>
                    <span>รอบถัดไป: {p.nextDueHour} ชม.</span>
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
                          <AlertDialogFooter>
                            <AlertDialogCancel
                              onClick={() => setConfirmId(null)}
                            >
                              ยกเลิก
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={() => handleConfirmAndSave(p.id)}
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
                  onChange={(e) =>
                    setEditForm({ ...editForm, intervalHr: e.target.value })
                  }
                />
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
                      method: "PUT",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        category: editForm.category,
                        item: editForm.item,
                        action: editForm.action,
                        intervalHr: parseFloat(editForm.intervalHr || "0"),
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
