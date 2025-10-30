"use client";

import { useEffect, useMemo, useRef, useState, Suspense } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Wrench,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Plus,
  Download,
} from "lucide-react";
import Image from "next/image";
import { useSearchParams, useRouter } from "next/navigation";
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

function GreasePageInner() {
  const [points, setPoints] = useState<GreasePoint[]>([]);
  const [currentHour, setCurrentHour] = useState<number>(0);
  const [currentUpdate, setCurrentUpdate] = useState<Date | null | undefined>();
  const [filter, setFilter] = useState<"ALL" | "DUE" | "WARN" | "OK">("ALL");
  // context menu state
  const [ctxMenu, setCtxMenu] = useState<{ open: boolean; x: number; y: number; point: GreasePoint | null }>({ open: false, x: 0, y: 0, point: null });
  const menuRef = useRef<HTMLDivElement | null>(null);

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

  const isAdmin = role === "admin" || role === "dev" || role === "cdhw-wfh8ogfup"; // ✅ เช็ค role
  const searchParams = useSearchParams();
  const router = useRouter();
  const selectedVehicleId = useMemo(() => searchParams.get("vehicleId"), [searchParams]);
  const counts = useMemo(() => {
    const base = points.filter(p => !selectedVehicleId || p.vehicleId === selectedVehicleId);
    const calcKey = (p: GreasePoint) => (currentHour >= p.nextDueHour ? "DUE" : currentHour >= p.nextDueHour - 1 ? "WARN" : "OK");
    return base.reduce(
      (acc, p) => {
        acc.ALL += 1;
        acc[calcKey(p)] += 1;
        return acc;
      },
      { ALL: 0, DUE: 0, WARN: 0, OK: 0 } as Record<"ALL"|"DUE"|"WARN"|"OK", number>
    );
  }, [points, selectedVehicleId, currentHour]);
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
        const sorted = [...data.vehicles].sort((a: {id:string; name:string; plateNo:string}, b: {id:string; name:string; plateNo:string}) => {
          const sa = `${a.name ?? ""} ${a.plateNo ?? ""}`.toLowerCase();
          const sb = `${b.name ?? ""} ${b.plateNo ?? ""}`.toLowerCase();
          const pa = sa.includes("2.9") ? 0 : 1;
          const pb = sb.includes("2.9") ? 0 : 1;
          if (pa !== pb) return pa - pb;
          return (a.name ?? "").localeCompare(b.name ?? "");
        });
        setVehicles(sorted);
      }
    };
    fetchVehicles();
  }, []);

  useEffect(() => {
    const fetchVehicle = async () => {
      const vid = selectedVehicleId || vehicles[0]?.id;
      if (!selectedVehicleId && vid) {
        const url = new URL(window.location.href);
        url.searchParams.set("vehicleId", vid);
        router.replace(url.toString());
      }
      if (!vid) return;
      const res = await fetch(`/api/vehicle/${vid}`);
      if (res.ok) {
        const data = await res.json();
        setCurrentHour(data.vehicle?.lastHourAfterTest ?? 0);
        setCurrentUpdate(data.vehicle?.updatedAt ?? null);
      }
    };
    fetchVehicle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedVehicleId, vehicles]);

  const refreshVehicleHour = async () => {
    const vid = selectedVehicleId || vehicles[0]?.id;
    if (!vid) return;
    const res = await fetch(`/api/vehicle/${vid}`);
    if (res.ok) {
      const data = await res.json();
      setCurrentHour(data.vehicle?.lastHourAfterTest ?? 0);
      setCurrentUpdate(data.vehicle?.updatedAt ?? null);
    }
  };
  // Auto refresh hour meter every 30s
  useEffect(() => {
    const id = setInterval(() => {
      refreshVehicleHour().catch(() => {});
    }, 30000);
    return () => clearInterval(id);
  }, [selectedVehicleId]);

  useEffect(() => {
    const handleMouseDown = (e: MouseEvent) => {
      if (e.button !== 0) return; // close only on left-click
      if (!ctxMenu.open) return;
      const el = menuRef.current;
      if (el && el.contains(e.target as Node)) return;
      setCtxMenu((m) => ({ ...m, open: false }));
    };
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") setCtxMenu((m) => ({ ...m, open: false }));
    };
    window.addEventListener("mousedown", handleMouseDown);
    window.addEventListener("keydown", handleEsc);
    return () => {
      window.removeEventListener("mousedown", handleMouseDown);
      window.removeEventListener("keydown", handleEsc);
    };
  }, [ctxMenu.open]);

  const handleGrease = async (pointId: string, hour?: number) => {
    const res = await fetch("/api/grease/update", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pointId, currentHour: hour ?? currentHour }),
    });

    if (res.ok) {
      const { point } = await res.json();
      const updated = points.map((p) => (p.id === point.id ? point : p));
      setPoints(updated);
    }
  };

  const handleGreaseBulk = async () => {
    // choose targets: only DUE
    const targets = filteredPoints.filter((p) => getStatus(p).key === "DUE");
    if (targets.length === 0) {
      alert("ไม่มีรายการ DUE/WARN ให้ทำรายการ");
      return;
    }
    const hrStr = window.prompt(`ชั่วโมงที่อัดจริง (ใช้กับ ${targets.length} จุด)`, String(currentHour));
    const hr = hrStr ? parseFloat(hrStr) : currentHour;
    if (Number.isNaN(hr)) return;
    const updates = await Promise.all(
      targets.map((t) =>
        fetch("/api/grease/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ pointId: t.id, currentHour: hr }),
        }).then((r) => (r.ok ? r.json() : null))
      )
    );
    const updatedMap = new Map<string, GreasePoint>();
    updates.forEach((u) => {
      if (u && u.point) updatedMap.set(u.point.id, u.point as GreasePoint);
    });
    if (updatedMap.size > 0) {
      setPoints((prev) => prev.map((p) => updatedMap.get(p.id) ?? p));
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

  const filteredPoints = (filter === "ALL" ? points : points.filter((p) => getStatus(p).key === filter))
    .filter(p => !selectedVehicleId || p.vehicleId === selectedVehicleId)
    .sort((a, b) => {
      const rank = (p: GreasePoint) => (currentHour >= p.nextDueHour ? 0 : currentHour >= p.nextDueHour - 1 ? 1 : 2);
      const r = rank(a) - rank(b);
      if (r !== 0) return r;
      const remA = a.nextDueHour - currentHour;
      const remB = b.nextDueHour - currentHour;
      return remA - remB;
    });

  const exportCsv = () => {
    const header = ["pointNo","name","positions","fittings","intervalHours","lastGreaseHour","nextDueHour","status","vehicleId"];
    const rows = filteredPoints.map(p => [
      p.pointNo,
      p.name,
      p.positions ?? "",
      p.fittings,
      p.intervalHours,
      p.lastGreaseHour,
      p.nextDueHour,
      getStatus(p).key,
      p.vehicleId,
    ]);
    const csv = [header, ...rows].map(r=>r.join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `grease-points.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

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
      <Card className="shadow-lg rounded-2xl">
        <CardHeader className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <CardTitle className="flex items-center gap-2 text-lg font-bold text-gray-800">
            <Wrench className="w-5 h-5 text-blue-600" />
            ตารางอัดจารบี
          </CardTitle>
          <div className="flex gap-2">
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
            <Button variant="outline" onClick={exportCsv}>
              <Download className="w-4 h-4 mr-1"/> Export CSV
            </Button>
            {isAdmin && (
              <Button variant="outline" onClick={handleGreaseBulk} className="border-green-600 text-green-700 hover:bg-green-50">
                ✅ All อัดแล้ว
              </Button>
            )}
            {isAdmin && (
              <Button onClick={openAdd} className="bg-blue-600 text-white">
                <Plus className="w-4 h-4" /> เพิ่มจุดอัด
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-2 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {/* ชั่วโมงเครื่อง */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/90 backdrop-blur rounded-xl shadow-md ring-1 ring-slate-200 p-4 transition-all">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-100 text-blue-700">⏱</span>
                <span className="font-semibold">ชั่วโมงเครื่อง</span>
              </div>
              <div className="px-4 py-1.5 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-extrabold text-lg shadow">
                {currentHour} ชม.
              </div>
            </div>

            {/* อัปเดตล่าสุด */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/90 backdrop-blur rounded-xl shadow-md ring-1 ring-slate-200 p-4 transition-all">
              <div className="flex items-center gap-2 text-gray-700">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-amber-100 text-amber-700">📅</span>
                <span className="font-semibold">อัปเดตล่าสุด</span>
              </div>
              <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-800 font-medium">
                {formatDate(currentUpdate)}
              </span>
            </div>

            {/* Filter */}
            <div className="flex items-center justify-between sm:justify-start gap-3 bg-white/90 backdrop-blur rounded-xl shadow-md ring-1 ring-slate-200 p-4 transition-all">
              <span className="font-semibold text-gray-700 flex items-center gap-2">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-fuchsia-100 text-fuchsia-700">🎯</span>
                สถานะ
              </span>
              <select
                value={filter}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) =>
                  setFilter(e.target.value as "ALL" | "DUE" | "WARN" | "OK")
                }
                className="rounded-full border border-gray-300 px-4 py-2 text-sm font-medium shadow-inner focus:ring-2 focus:ring-blue-500 focus:outline-none bg-white"
              >
                <option value="ALL">🌐 ทั้งหมด</option>
                <option value="DUE">❌ เกินรอบ</option>
                <option value="WARN">⚠️ ใกล้ถึง</option>
                <option value="OK">✅ ปกติ</option>
              </select>
            </div>
          </div>

          {/* Summary chips */}
          <div className="mb-4 flex flex-wrap gap-2">
            <span className="px-2.5 py-1 rounded-full text-xs bg-gray-100 text-gray-700">ทั้งหมด {counts.ALL}</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-red-100 text-red-700">เกินรอบ {counts.DUE}</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-yellow-100 text-yellow-700">ใกล้ถึง {counts.WARN}</span>
            <span className="px-2.5 py-1 rounded-full text-xs bg-green-100 text-green-700">ปกติ {counts.OK}</span>
          </div>

          {/* ✅ Table (PC) */}
          <div className="hidden sm:block">

            <div className="overflow-x-auto rounded-xl border ">
            <table className="min-w-full w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-gray-700 sticky top-0">
                  <th className="p-2">จุดที่</th>
                  <th className="p-2">ตำแหน่ง</th>
                  <th className="p-2">รูป</th>
                  <th className="p-2">หัวอัด</th>
                  <th className="p-2">รอบ</th>
                  <th className="p-2">ล่าสุด</th>
                  <th className="p-2">ถึงรอบ</th>
                  <th className="p-2">เหลือ</th>
                  <th className="p-2">สถานะ</th>
                  <th className="p-2">ความคืบหน้า</th>
                  <th className="p-2">รายละเอียด</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {filteredPoints.map((p) => {
                  const { label, color, Icon, key } = getStatus(p);
                  const progress = Math.min(
                    100,
                    ((currentHour - p.lastGreaseHour) / p.intervalHours) * 100
                  );
                  return (
                    <tr
                      key={p.id}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        setCtxMenu({ open: true, x: e.clientX, y: e.clientY, point: p });
                      }}
                      className={`hover:bg-gray-50 transition-colors ${
                        key === "DUE"
                          ? "bg-red-50 border-l-4 border-red-500"
                          : key === "WARN"
                          ? "bg-yellow-50 border-l-4 border-yellow-500"
                          : ""
                      }`}
                    >
                      <td className="p-2 text-center font-mono text-sm">{p.pointNo}</td>
                      <td className="p-2 max-w-[120px]">
                        <div>
                          <div className="font-semibold text-sm truncate">{p.name}</div>
                          {p.positions && (
                            <div className="text-xs text-gray-500 truncate">
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
                            width={40}
                            height={40}
                            className="rounded object-cover cursor-pointer"
                            onClick={() => setPreview(p.picture!)} // 👈 เพิ่ม
                          />
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="p-2 text-center font-mono text-sm">{p.fittings}</td>
                      <td className="p-2 text-center font-mono text-sm">{p.intervalHours}</td>
                      <td className="p-2 text-center font-mono text-sm">{p.lastGreaseHour}</td>
                      <td className="p-2 text-center font-mono text-sm">{p.nextDueHour}</td>
                      <td className="p-2">
                        {(() => {
                          const remain = p.nextDueHour - currentHour;
                          const cls = remain <= 0 ? "text-red-600 font-semibold" : remain <= 1 ? "text-yellow-600 font-semibold" : "text-gray-700";
                          const val = Math.max(0, remain).toFixed(2);
                          return <span className={`${cls} text-center font-mono text-sm`}>{val}</span>;
                        })()}
                      </td>
                      <td className="p-2">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div className={`font-bold flex items-center gap-1 cursor-help ${color} max-w-[120px] whitespace-nowrap truncate`}
                              >
                                <Icon className="w-4 h-4 min-w-4" />
                                <span className="truncate">{label}</span>
                              </div>
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
                        <span className="text-xs font-mono text-gray-600">{progress.toFixed(0)}%</span>
                      </td>
                      <td className="p-2 max-w-[150px] truncate">
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
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          </div>

          {ctxMenu.open && ctxMenu.point && (
            <div
              ref={menuRef}
              className="fixed z-50 bg-white border rounded-md shadow-lg overflow-hidden"
              style={{
                left: typeof window !== "undefined" ? Math.min(ctxMenu.x + 2, window.innerWidth - 200) : ctxMenu.x + 2,
                top: typeof window !== "undefined" ? Math.min(ctxMenu.y + 2, window.innerHeight - 140) : ctxMenu.y + 2,
                minWidth: 180,
              }}
              onClick={(e) => e.stopPropagation()}
            >
              {(() => {
                const k = getStatus(ctxMenu.point!).key;
                const disabled = k === "OK";
                return (
                  <button
                    className={`w-full text-left px-3 py-2 text-sm flex items-center gap-2 ${disabled ? "text-gray-400 cursor-not-allowed" : "hover:bg-gray-100"}`}
                    onClick={() => {
                      if (disabled) return;
                      const hrStr = window.prompt("ชั่วโมงที่อัดจริง", String(currentHour));
                      const hr = hrStr ? parseFloat(hrStr) : currentHour;
                      if (ctxMenu.point) handleGrease(ctxMenu.point.id, hr);
                      setCtxMenu((m) => ({ ...m, open: false }));
                    }}
                  >
                    <span>✅</span> <span>อัดแล้ว</span>
                  </button>
                );
              })()}
              {isAdmin && (
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={() => {
                    if (ctxMenu.point) openEdit(ctxMenu.point);
                    setCtxMenu((m) => ({ ...m, open: false }));
                  }}
                >
                  ✏️ แก้ไข
                </button>
              )}
              {ctxMenu.point?.picture && (
                <button
                  className="w-full text-left px-3 py-2 text-sm hover:bg-gray-100"
                  onClick={() => {
                    if (ctxMenu.point?.picture) setPreview(ctxMenu.point.picture);
                    setCtxMenu((m) => ({ ...m, open: false }));
                  }}
                >
                  🖼️ ดูรูป
                </button>
              )}
            </div>
          )}

          {/* ✅ Mobile: Card */}
          <div className="sm:hidden space-y-3">
            {filteredPoints.map((p) => {
              const { label, color, Icon, key } = getStatus(p);
              const progress = Math.min(
                100,
                ((currentHour - p.lastGreaseHour) / p.intervalHours) * 100
              );
              return (
                <Card key={p.id} className="p-3 shadow-md rounded-2xl">
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
                  {/* actions removed on mobile */}
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

export default function GreasePage() {
  return (
    <Suspense fallback={<div className="p-6">กำลังโหลด...</div>}>
      <GreasePageInner />
    </Suspense>
  );
}
