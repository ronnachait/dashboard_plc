"use client";

import { useEffect, useState, Suspense } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Card, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";

interface UserItem { id: string; name: string | null; email: string; role: string; }

function UsersPageInner() {
  const { data: session } = useSession();
  const router = useRouter();
  const isAdmin = session?.user?.role === "admin" || session?.user?.role === "cdhw-wfh8ogfup";
  const isDev = session?.user?.role === "dev";

  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get("q") || "");
  const [page, setPage] = useState(Number(searchParams.get("page") || 1));
  const pageSize = 10;

  const [items, setItems] = useState<UserItem[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  const [openForm, setOpenForm] = useState(false);
  const [editing, setEditing] = useState<UserItem | null>(null);
  const [form, setForm] = useState<{ name?: string; email: string; role: string; password?: string }>({ email: "", role: "operator" });
  const [deleting, setDeleting] = useState<UserItem | null>(null);

  useEffect(() => {
    if (!isAdmin && !isDev) {
      router.replace("/");
    }
  }, [isAdmin, isDev, router]);

  const fetchUsers = async () => {
    setLoading(true);
    const res = await fetch(`/api/users?query=${encodeURIComponent(query)}&page=${page}&pageSize=${pageSize}`);
    if (res.ok) {
      const data = await res.json();
      setItems(data.items);
      setTotal(data.total);
    }
    setLoading(false);
  };

  useEffect(() => {
    const id = setTimeout(() => fetchUsers(), 200); // small debounce
    return () => clearTimeout(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, page]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  const openCreate = () => {
    setEditing(null);
    setForm({ email: "", role: "operator" });
    setOpenForm(true);
  };

  const openEdit = (u: UserItem) => {
    setEditing(u);
    setForm({ email: u.email, name: u.name ?? "", role: u.role });
    setOpenForm(true);
  };

  const saveUser = async () => {
    const body = JSON.stringify(form);
    const res = await fetch(editing ? `/api/users/${editing.id}` : "/api/users", {
      method: editing ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body,
    });
    if (res.ok) {
      setOpenForm(false);
      setForm({ email: "", role: "operator" });
      fetchUsers();
    }
  };

  const deleteUser = async () => {
    if (!deleting) return;
    const res = await fetch(`/api/users/${deleting.id}`, { method: "DELETE" });
    if (res.ok) {
      setDeleting(null);
      fetchUsers();
    }
  };

  const roleBadge = (role: string) => {
    if (role === "dev") return "bg-purple-100 text-purple-700";
    if (role === "admin") return "bg-red-100 text-red-700";
    return "bg-gray-100 text-gray-700";
  };

  const initials = (name?: string | null, email?: string) => {
    const base = name && name.trim().length > 0 ? name : (email || "");
    const parts = base.split(/\s|@/).filter(Boolean);
    return (parts[0]?.[0] || "U").toUpperCase();
  };

  return (
    <div className="p-4 sm:p-6 max-w-6xl mx-auto space-y-6">
      <Card className="rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white p-5">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-3 text-xl font-bold">
              <span className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-white/20">
                <Users className="w-6 h-6" />
              </span>
              ผู้ใช้งาน
            </CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="w-4 h-4 text-white/70 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  className="pl-9 pr-3 py-2 text-sm rounded-full bg-white/20 placeholder-white/70 text-white outline-none focus:ring-2 ring-white/60"
                  placeholder="ค้นหา ชื่อ/อีเมล/บทบาท"
                  value={query}
                  onChange={(e)=>{ setQuery(e.target.value); setPage(1); }}
                />
              </div>
              <Button onClick={openCreate} className="bg-white text-blue-700 hover:bg-white/90 rounded-full">
                <Plus className="w-4 h-4" /> เพิ่มผู้ใช้
              </Button>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <div className="overflow-x-auto rounded-b-2xl">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="bg-blue-50 text-gray-700 sticky top-0">
                  <th className="p-3 text-left">ผู้ใช้</th>
                  <th className="p-3 text-left">อีเมล</th>
                  <th className="p-3 text-left">บทบาท</th>
                  <th className="p-3 text-right">การจัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {loading && Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    <td className="p-3"><div className="h-4 w-40 bg-gray-200 rounded animate-pulse"/></td>
                    <td className="p-3"><div className="h-4 w-64 bg-gray-200 rounded animate-pulse"/></td>
                    <td className="p-3"><div className="h-4 w-20 bg-gray-200 rounded animate-pulse"/></td>
                    <td className="p-3 text-right"><div className="h-8 w-24 bg-gray-200 rounded animate-pulse ml-auto"/></td>
                  </tr>
                ))}

                {!loading && items.length === 0 && (
                  <tr>
                    <td colSpan={4} className="p-10 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Users className="w-10 h-10 text-blue-400" />
                        <div>ยังไม่มีผู้ใช้</div>
                      </div>
                    </td>
                  </tr>
                )}

                {!loading && items.map(u => (
                  <tr key={u.id} className="hover:bg-gray-50">
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center font-semibold">
                          {initials(u.name, u.email)}
                        </div>
                        <div className="flex flex-col">
                          <span className="font-medium text-gray-900">{u.name ?? "-"}</span>
                          <span className="text-xs text-gray-500">ID: {u.id.slice(0,8)}...</span>
                        </div>
                      </div>
                    </td>
                    <td className="p-3">{u.email}</td>
                    <td className="p-3"><span className={`px-2.5 py-1 rounded-full text-xs ${roleBadge(u.role)}`}>{u.role}</span></td>
                    <td className="p-3 text-right">
                      <TooltipProvider>
                        <div className="inline-flex gap-2">
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" className="bg-yellow-500 text-white" onClick={()=>openEdit(u)}>
                                <Pencil className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>แก้ไข</TooltipContent>
                          </Tooltip>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button size="sm" className="bg-red-600 text-white" onClick={()=>setDeleting(u)}>
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>ลบ</TooltipContent>
                          </Tooltip>
                        </div>
                      </TooltipProvider>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {/* Pagination */}
          <div className="flex justify-end items-center gap-2 p-3">
            <span className="text-sm text-gray-500">หน้า {page}/{totalPages}</span>
            <Button variant="outline" className="rounded-full" onClick={()=> setPage(p=> Math.max(1, p-1))} disabled={page<=1}>ก่อนหน้า</Button>
            <Button variant="outline" className="rounded-full" onClick={()=> setPage(p=> Math.min(totalPages, p+1))} disabled={page>=totalPages}>ถัดไป</Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={openForm} onOpenChange={setOpenForm}>
        <DialogContent className="max-w-lg rounded-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? "แก้ไขผู้ใช้" : "เพิ่มผู้ใช้"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <input className="border w-full rounded px-3 py-2" placeholder="ชื่อ" value={form.name ?? ""} onChange={(e)=> setForm({...form, name: e.target.value})} />
            <input className="border w-full rounded px-3 py-2" placeholder="อีเมล" value={form.email} onChange={(e)=> setForm({...form, email: e.target.value})} />
            <select className="border w-full rounded px-3 py-2" value={form.role} onChange={(e)=> setForm({...form, role: e.target.value})}>
              <option value="operator">operator</option>
              {isDev && <option value="admin">admin</option>}
              {isDev && <option value="dev">dev</option>}
            </select>
            <input className="border w-full rounded px-3 py-2" type="password" placeholder={editing ? "รหัสผ่านใหม่ (เว้นว่างได้)" : "รหัสผ่าน"} value={form.password ?? ""} onChange={(e)=> setForm({...form, password: e.target.value})} />
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={()=> setOpenForm(false)}>ยกเลิก</Button>
              <Button className="bg-blue-600 text-white" onClick={saveUser}>บันทึก</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!deleting} onOpenChange={()=> setDeleting(null)}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle>ลบผู้ใช้</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-gray-600">ต้องการลบ &quot;{deleting?.email}&quot; ใช่หรือไม่? การกระทำนี้ไม่สามารถย้อนกลับได้</p>
          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={()=> setDeleting(null)}>ยกเลิก</Button>
            <Button className="bg-red-600 text-white" onClick={deleteUser}>ลบ</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function UsersPage() {
  return (
    <Suspense fallback={<div className="p-6">กำลังโหลด...</div>}>
      <UsersPageInner />
    </Suspense>
  );
}
