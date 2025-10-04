"use client";

import { useEffect, useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Pencil,
  Download,
} from "lucide-react";
import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { motion } from "framer-motion";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { useSession } from "next-auth/react";
type GreasePoint = {
  id: string;
  pointNo: number;
  name: string;
  fittings: number;
  positions?: string;
  detail?: string;
  intervalHours: number;
  lastGreaseHour: number;
  nextDueHour: number;
  picture?: string;
  vehicleId: string;
};

const formatDate = (date?: Date | string | null) => {
  if (!date) return "-";

  const d = date instanceof Date ? date : new Date(date);
  return d.toLocaleString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false, // ✅ บังคับ 24 ชม.
  });
};

export default function GreasePage() {
  const [points, setPoints] = useState<GreasePoint[]>([]);
  const [currentHour, setCurrentHour] = useState<number>(0);
  const [currentUpdate, setCurrentUpdate] = useState<Date | null | undefined>();
  const [filter, setFilter] = useState<"ALL" | "DUE" | "WARN" | "OK">("ALL");

  // modal states
  const [showForm, setShowForm] = useState(false);
  const [editPoint, setEditPoint] = useState<GreasePoint | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [tempPicture, setTempPicture] = useState<string | null>(null);
  const [vehicles, setVehicles] = useState<
    { id: string; name: string; plateNo: string }[]
  >([]);

  const [form, setForm] = useState<Partial<GreasePoint>>({});
  const { data: session } = useSession();
  const role = session?.user?.role;

  const isAdmin = role === "admin" || role === "cdhw-wfh8ogfup"; // ✅ เช็ค role
  useEffect(() => {
    const fetchPoints = async () => {
      const res = await fetch("/api/grease");
      if (res.ok) {
        const data = await res.json();
        setPoints(data.points);
      }
    };
    fetchPoints();
  }, []);

  useEffect(() => {
    const fetchVehicles = async () => {
      const res = await fetch("/api/vehicle");
      if (res.ok) {
        const data = await res.json();
        setVehicles(data.vehicles);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const fetchVehicle = async () => {
      const res = await fetch(
        "/api/vehicle/23429582-fbfd-4c7b-95c1-10c17b3dfebb"
      ); // fix id
      if (res.ok) {
        const data = await res.json();
        setCurrentHour(data.vehicle?.lastHourAfterTest ?? 0);
        setCurrentUpdate(data.vehicle?.updatedAt ?? null);
      }
    };
    fetchVehicle();
  }, []);

  const handleGrease = async (pointId: string) => {
    const res = await fetch("/api/grease/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointId, currentHour }),
    });

    if (res.ok) {
      const { point } = await res.json();
      const updated = points.map((p) => (p.id === point.id ? point : p));
      setPoints(updated);
    }
  };

  const getStatus = (p: GreasePoint) => {
    if (currentHour >= p.nextDueHour) {
      return {
        label: "❌ เกินรอบ",
        color: "text-red-600",
        Icon: XCircle,
        key: "DUE",
      };
    } else if (currentHour >= p.nextDueHour - 1) {
      return {
        label: "⚠️ ใกล้ถึง",
        color: "text-yellow-600",
        Icon: AlertTriangle,
        key: "WARN",
      };
    } else {
      return {
        label: "✅ ปกติ",
        color: "text-green-600",
        Icon: CheckCircle2,
        key: "OK",
      };
    }
  };

  const filteredPoints =
    filter === "ALL"
      ? points
      : points.filter((p) => getStatus(p).key === filter);

  const openAdd = () => {
    setEditPoint(null);
    setForm({});
    setShowForm(true);
  };

  const openEdit = (p: GreasePoint) => {
    setEditPoint(p);
    setForm(p);
    setShowForm(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ สร้าง payload ใหม่แบบ clean
    const payload = {
      pointNo: form.pointNo,
      name: form.name,
      fittings: form.fittings,
      positions: form.positions,
      detail: form.detail,
      intervalHours: form.intervalHours,
      lastGreaseHour: form.lastGreaseHour,
      nextDueHour: form.nextDueHour,
      picture: tempPicture || form.picture,
      vehicleId: form.vehicleId, // ✅ ใช้ vehicleId อย่างเดียว
    };

    const method = editPoint ? "PATCH" : "POST";
    const url = editPoint
      ? `/api/grease/${editPoint.id}`
      : "/api/grease/create";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res.ok) {
      const updated = await res.json();
      if (editPoint) {
        setPoints(points.map((p) => (p.id === updated.id ? updated : p)));
      } else {
        setPoints([...points, updated]);
      }
      setShowForm(false);
      setTempPicture(null); // ✅ เคลียร์ state
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6">
      <Card className="shadow-lg rounded-xl">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Wrench className="w-5 h-5 text-blue-600" />
            ตารางอัดจารบี
          </CardTitle>
          {isAdmin && (
            <Button onClick={openAdd} className="bg-blue-600 text-white">
              <Plus className="w-4 h-4" /> เพิ่มจุดอัด
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <div className="mb-6 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* ชั่วโมงเครื่อง */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-white border rounded-xl shadow-sm p-3">
              <div className="flex items-center gap-2 text-gray-600">
                <span className="font-semibold flex items-center gap-1">
                  ⏱ ชั่วโมงเครื่อง
                </span>
              </div>
              <div className="text-blue-600 font-bold text-lg bg-blue-50 px-4 py-1.5 rounded-lg">
                {currentHour} ชม.
              </div>
            </div>

            {/* อัปเดตล่าสุด */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-white border rounded-xl shadow-sm p-3">
              <span className="font-semibold text-gray-600">
                📅 อัปเดตล่าสุด
              </span>
              <span className="text-gray-800 font-medium">
                {formatDate(currentUpdate)}
              </span>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-white border rounded-xl shadow-sm p-3">
              <span className="font-semibold text-gray-600">🎯 สถานะ</span>
              <select
                value={filter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilter(e.target.value as "ALL" | "DUE" | "WARN" | "OK")
                }
                className="border border-gray-300 rounded-lg px-3 py-1.5 text-sm font-medium focus:ring-2 focus:ring-blue-500 focus:outline-none"
              >
                <option value="ALL">🌐 ทั้งหมด</option>
                <option value="DUE">❌ เกินรอบ</option>
                <option value="WARN">⚠️ ใกล้ถึง</option>
                <option value="OK">✅ ปกติ</option>
              </select>
            </div>
          </div>

          {/* ✅ Table (PC) */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="bg-gray-100 text-gray-700">
                  <th className="p-2">จุดที่</th>
                  <th className="p-2">ตำแหน่ง</th>
                  <th className="p-2">รูป</th>
                  <th className="p-2">หัวอัด</th>
                  <th className="p-2">รอบ</th>
                  <th className="p-2">ล่าสุด</th>
                  <th className="p-2">ถึงรอบ</th>
                  <th className="p-2">สถานะ</th>
                  <th className="p-2">ความคืบหน้า</th>
                  <th className="p-2">รายละเอียด</th>
                  <th className="p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredPoints.map((p) => {
                  const { label, color, Icon, key } = getStatus(p);
                  const progress = Math.min(
                    100,
                    ((currentHour - p.lastGreaseHour) / p.intervalHours) * 100
                  );
                  return (
                    <tr
                      key={p.id}
                      className={`hover:bg-gray-50 ${
                        key === "DUE"
                          ? "bg-red-50"
                          : key === "WARN"
                          ? "bg-yellow-50"
                          : ""
                      }`}
                    >
                      <td className="p-2 text-center">{p.pointNo}</td>
                      <td className="p-2">
                        <div>
                          <div className="font-semibold">{p.name}</div>
                          {p.positions && (
                            <div className="text-xs text-gray-500">
                              {p.positions}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="p-2">
                        {p.picture ? (
                          <Image
                            src={p.picture}
                            alt={p.name}
                            width={56}
                            height={56}
                            className="rounded object-cover cursor-pointer"
                            onClick={() => setPreview(p.picture!)} // 👈 เพิ่ม
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2">{p.fittings}</td>
                      <td className="p-2">{p.intervalHours}</td>
                      <td className="p-2">{p.lastGreaseHour}</td>
                      <td className="p-2">{p.nextDueHour}</td>
                      <td className="p-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span
                                className={`font-bold flex items-center gap-1 cursor-help ${color}`}
                              >
                                <Icon className="w-4 h-4" /> {label}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>
                                {label === "❌ เกินรอบ"
                                  ? "ควรอัดทันที"
                                  : label === "⚠️ ใกล้ถึง"
                                  ? "ใกล้ครบ ควรเตรียมอัด"
                                  : "อยู่ในสภาพปกติ"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>

                      <td className="p-2">
                        <div className="w-24 h-2 bg-gray-200 rounded">
                          <div
                            className={`h-2 ${
                              key === "DUE"
                                ? "bg-red-600"
                                : key === "WARN"
                                ? "bg-yellow-500"
                                : "bg-green-500"
                            }`}
                            style={{ width: `${progress}%` }}
                          ></div>
                        </div>
                        <span className="text-xs">{progress.toFixed(0)}%</span>
                      </td>
                      <td className="p-2 max-w-[200px] truncate">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <span className="truncate cursor-help">
                                {p.detail ?? "-"}
                              </span>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="max-w-xs">
                                {p.detail ?? "ไม่มีรายละเอียด"}
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>

                      <td className="p-2 flex gap-1">
                        <Button
                          onClick={() => handleGrease(p.id)}
                          disabled={key !== "DUE"}
                          size="sm"
                          className={`${
                            key === "DUE"
                              ? "bg-green-600 text-white"
                              : "bg-gray-300 text-gray-500"
                          }`}
                        >
                          ✅ อัดแล้ว
                        </Button>
                        <Button
                          size="sm"
                          onClick={() => openEdit(p)}
                          className="bg-yellow-500 text-white"
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ✅ Mobile: Card */}
          <div className="sm:hidden space-y-3">
            {filteredPoints.map((p) => {
              const { label, color, Icon, key } = getStatus(p);
              const progress = Math.min(
                100,
                ((currentHour - p.lastGreaseHour) / p.intervalHours) * 100
              );
              return (
                <Card key={p.id} className="p-3 shadow-md">
                  <div className="flex justify-between items-start">
                    <div>
                      <div className="font-bold">{p.name}</div>
                      {p.positions && (
                        <div className="text-xs text-gray-500">
                          {p.positions}
                        </div>
                      )}
                      <div
                        className={`text-sm ${color} flex items-center gap-1`}
                      >
                        <Icon className="w-4 h-4" /> {label}
                      </div>
                    </div>
                    {p.picture && (
                      <div
                        className="relative w-16 h-16 cursor-pointer"
                        onClick={() => setPreview(p.picture!)}
                      >
                        <Image
                          src={p.picture}
                          alt={p.name}
                          fill
                          className="rounded object-cover"
                        />
                      </div>
                    )}
                  </div>
                  <div className="text-xs text-gray-500 mt-2">
                    รอบ: {p.intervalHours} ชม. • ล่าสุด {p.lastGreaseHour} •
                    ถึงรอบ {p.nextDueHour}
                  </div>
                  <div className="w-full h-2 bg-gray-200 rounded mt-2">
                    <div
                      className={`h-2 ${
                        key === "DUE"
                          ? "bg-red-600"
                          : key === "WARN"
                          ? "bg-yellow-500"
                          : "bg-green-500"
                      }`}
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <Button
                      onClick={() => handleGrease(p.id)}
                      disabled={key !== "DUE"}
                      size="sm"
                      className={`${
                        key === "DUE"
                          ? "bg-green-600 text-white"
                          : "bg-gray-300 text-gray-500"
                      }`}
                    >
                      ✅ อัดแล้ว
                    </Button>
                    {isAdmin && (
                      <Button
                        size="sm"
                        onClick={() => openEdit(p)}
                        className="bg-yellow-500 text-white"
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                    )}
                  </div>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Dialog Form */}
      <Dialog
        open={showForm}
        onOpenChange={(open) => {
          setShowForm(open);
          if (!open) {
            // เคลียร์รูปเมื่อ dialog ปิด
            if (form.picture) {
              fetch("/api/upload/delete", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ blobUrl: form.picture }),
              }).catch(console.error);
            }
            setForm({});
            setTempPicture(null);
          }
        }}
      >
        <DialogContent className="max-w-lg rounded-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-lg font-bold">
              {editPoint ? "✏️ แก้ไขข้อมูล" : "➕ เพิ่มจุดอัด"}
            </DialogTitle>
            <DialogDescription>
              {editPoint
                ? "อัปเดตรายละเอียดจุดอัด"
                : "กรอกรายละเอียดเพื่อเพิ่มจุดใหม่"}
            </DialogDescription>
          </DialogHeader>
          <motion.form
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            onSubmit={handleFormSubmit}
            className="space-y-3"
          >
            <input
              type="number"
              placeholder="จุดที่"
              value={form.pointNo || ""}
              onChange={(e) =>
                setForm({ ...form, pointNo: Number(e.target.value) })
              }
              className="border w-full px-3 py-2 rounded"
              required
            />

            <input
              type="text"
              placeholder="ตำแหน่ง"
              value={form.name || ""}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              className="border w-full px-3 py-2 rounded"
              required
            />

            <input
              type="number"
              placeholder="หัวอัด"
              value={form.fittings || ""}
              onChange={(e) =>
                setForm({ ...form, fittings: Number(e.target.value) })
              }
              className="border w-full px-3 py-2 rounded"
            />

            <input
              type="text"
              placeholder="ตำแหน่งย่อย (LH/RH)"
              value={form.positions || ""}
              onChange={(e) => setForm({ ...form, positions: e.target.value })}
              className="border w-full px-3 py-2 rounded"
            />
            <input
              type="number"
              placeholder="รอบ (ชม.)"
              value={form.intervalHours || ""}
              onChange={(e) =>
                setForm({
                  ...form,
                  intervalHours: Number(e.target.value),
                  nextDueHour:
                    (form.lastGreaseHour ?? currentHour) +
                    Number(e.target.value), // ✅ คำนวณทันที
                })
              }
              className="border w-full px-3 py-2 rounded"
              required
            />

            {/* ✅ ชั่วโมงล่าสุดที่อัด */}
            <div className="flex gap-2 items-center">
              <input
                type="number"
                placeholder="ชั่วโมงล่าสุดที่อัด"
                value={form.lastGreaseHour ?? currentHour}
                onChange={(e) => {
                  const newLast = Number(e.target.value);
                  setForm({
                    ...form,
                    lastGreaseHour: newLast,
                    nextDueHour: newLast + (form.intervalHours ?? 0), // ✅ คำนวณทันที
                  });
                }}
                className="border w-full px-3 py-2 rounded"
              />

              {/* ปุ่มออโต้ */}
              <button
                type="button"
                onClick={() => {
                  setForm({
                    ...form,
                    lastGreaseHour: currentHour, // ✅ ดึงค่าปัจจุบัน
                    nextDueHour: currentHour + (form.intervalHours ?? 0),
                  });
                }}
                className="px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded"
              >
                <Download className="w-5 h-5 cursor-pointer" />
              </button>
            </div>

            {/* ✅ ชั่วโมงครบกำหนดถัดไป (readonly) */}
            <div className="border w-full px-3 py-2 rounded bg-gray-100 text-gray-600">
              ชั่วโมงครบกำหนดถัดไป:{" "}
              {form.nextDueHour ??
                (form.lastGreaseHour ?? currentHour) +
                  (form.intervalHours ?? 0)}
            </div>

            {/* ✅ เลือกรถ */}
            <select
              value={form.vehicleId || ""}
              onChange={(e) => setForm({ ...form, vehicleId: e.target.value })}
              className="border w-full px-3 py-2 rounded"
              required
            >
              <option value="">เลือกรถ</option>
              {vehicles.length === 0 ? (
                <option disabled>กำลังโหลด...</option>
              ) : (
                vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name} - {v.plateNo}
                  </option>
                ))
              )}
            </select>

            <div className="space-y-3">
              {/* ปุ่มอัพโหลด */}
              <label className="inline-flex items-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg shadow hover:bg-blue-700 cursor-pointer">
                📤 อัพโหลดรูป
                <input
                  type="file"
                  accept="image/*"
                  hidden
                  onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;

                    // 🔥 ถ้ามีไฟล์เก่า → ลบทิ้งก่อน
                    if (form.picture) {
                      await fetch("/api/upload/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ blobUrl: form.picture }),
                      });
                    }

                    // ✅ ขอ SAS URL
                    const res = await fetch("/api/upload", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        fileName: file.name,
                        fileType: file.type,
                      }),
                    });
                    const { uploadUrl, publicUrl } = await res.json();

                    // ✅ PUT ขึ้น Azure Blob
                    await fetch(uploadUrl, {
                      method: "PUT",
                      headers: { "x-ms-blob-type": "BlockBlob" },
                      body: file,
                    });

                    // ✅ ตั้งค่ารูปใหม่
                    setTempPicture(publicUrl);
                    setForm({ ...form, picture: publicUrl });
                  }}
                />
              </label>

              {/* Preview + ปุ่มลบ */}
              {tempPicture && (
                <div className="relative w-32 h-32 border rounded-lg overflow-hidden shadow-md">
                  <Image
                    src={tempPicture}
                    alt="Preview"
                    fill
                    className="object-cover"
                  />
                  <button
                    type="button"
                    onClick={async () => {
                      // 🔥 ลบจาก Azure ด้วย
                      await fetch("/api/upload/delete", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ blobUrl: tempPicture }),
                      });
                      // reset state
                      setTempPicture(null);
                      setForm({ ...form, picture: undefined });
                    }}
                    className="absolute top-1 right-1 bg-red-600 text-white text-xs px-2 py-1 rounded shadow hover:bg-red-700"
                  >
                    ❌
                  </button>
                </div>
              )}
            </div>

            <textarea
              placeholder="รายละเอียด"
              value={form.detail || ""}
              onChange={(e) => setForm({ ...form, detail: e.target.value })}
              className="border w-full px-3 py-2 rounded"
            />

            <Button type="submit" className="bg-blue-600 text-white w-full">
              💾 บันทึก
            </Button>
          </motion.form>
        </DialogContent>
      </Dialog>

      <Dialog open={!!preview} onOpenChange={() => setPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogTitle className="sr-only">รูปภาพ</DialogTitle>{" "}
          {/* 👈 ใส่ไว้ให้ผ่าน */}
          {preview && (
            <motion.img
              src={preview}
              alt="Preview"
              className="w-full h-auto rounded-lg p-2 shadow"
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
