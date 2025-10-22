"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Upload, X } from "lucide-react";
import Image from "next/image";
export default function ProblemFormPage() {
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const dropRef = useRef<HTMLDivElement | null>(null);

  // ✅ โหลด token จาก URL หรือ localStorage
  useEffect(() => {
    const url = new URL(window.location.href);
    const tokenParam = url.searchParams.get("token");
    const stored = localStorage.getItem("google_token");

    const finalToken = tokenParam || stored;
    if (tokenParam) {
      localStorage.setItem("google_token", tokenParam);
      window.history.replaceState(null, "", "/problem");
    }

    if (finalToken) {
      setToken(finalToken);
      fetch(`/api/google/userinfo?token=${finalToken}`)
        .then(async (res) => {
          if (res.status === 401) {
            // ✅ Token หมดอายุ → ล้าง token แล้วให้ login ใหม่
            localStorage.removeItem("google_token");
            toast.warning("🔒 Token หมดอายุ กรุณาเข้าสู่ระบบใหม่");
            window.location.href = "/api/google/auth";
            return;
          }
          const data = await res.json();
          if (data.email) setUserEmail(data.email);
        })
        .catch(() => toast.error("ไม่สามารถดึงข้อมูลผู้ใช้ได้"));
    }
  }, []);

  const handleAuthorize = () => {
    const currentUrl = window.location.pathname; // เช่น /problem หรือ /daily-check
    window.location.href = `/api/google/auth?redirect=${encodeURIComponent(
      currentUrl
    )}`;
  };

  // 🎯 Drag & Drop Upload
  useEffect(() => {
    const dropZone = dropRef.current;
    if (!dropZone) return;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        setImages((prev) => [...prev, ...Array.from(files)]);
      }

      dropZone.classList.remove("border-sky-500");
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      dropZone.classList.add("border-sky-500");
    };

    const handleDragLeave = () => {
      dropZone.classList.remove("border-sky-500");
    };

    dropZone.addEventListener("drop", handleDrop);
    dropZone.addEventListener("dragover", handleDragOver);
    dropZone.addEventListener("dragleave", handleDragLeave);
    return () => {
      dropZone.removeEventListener("drop", handleDrop);
      dropZone.removeEventListener("dragover", handleDragOver);
      dropZone.removeEventListener("dragleave", handleDragLeave);
    };
  }, []);

  // 🔥 Submit
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!token) return toast.error("ไม่มี token กรุณา login ใหม่");
    setLoading(true);

    const formData = new FormData(e.currentTarget);
    formData.append("token", token);
    images.forEach((file, i) => formData.append(`file_${i + 1}`, file));

    try {
      const res = await fetch("/api/problem", {
        method: "POST",
        body: formData,
      });

      const json = await res.json();
      if (json.success) {
        toast.success("✅ บันทึกข้อมูลเรียบร้อย!");
        setImages([]);
        e.currentTarget.reset();
      } else {
        toast.error("❌ ไม่สามารถบันทึกข้อมูลได้");
      }
    } catch {
      toast.error("⚠️ เกิดข้อผิดพลาดขณะส่งข้อมูล");
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  if (!token)
    return (
      <div className="flex flex-col items-center justify-center h-screen space-y-4 text-center">
        <h1 className="text-2xl font-semibold text-sky-700">
          🔐 กรุณาเข้าสู่ระบบ Google ก่อน
        </h1>
        <p className="text-gray-600 text-sm">
          เพื่อเชื่อมต่อสิทธิ์บันทึกข้อมูลไปยัง Google Sheet
        </p>
        <Button
          onClick={handleAuthorize}
          className="bg-sky-600 hover:bg-sky-700 text-white"
        >
          Sign in with Google
        </Button>
      </div>
    );

  // 🧾 Form UI
  return (
    <motion.div
      className="max-w-5xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center">
        <h1 className="text-3xl font-bold text-sky-700">
          🧩 Cylinder Bench Test Problem
        </h1>
        <p className="text-gray-500 text-sm mt-1">
          ฟอร์มรายงานปัญหา – Bench Test
        </p>
      </div>

      <Card className="shadow-lg border border-gray-200">
        <CardContent className="p-6 space-y-6">
          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 md:grid-cols-2 gap-6"
          >
            {/* LEFT */}
            <div className="space-y-4">
              <Label>Reported By</Label>
              <Input value={userEmail} readOnly className="bg-gray-100" />

              <Label>Hour (M/C)</Label>
              <Input name="hour_M_C" type="number" step="0.001" required />

              <Label>Section</Label>
              <Input
                name="dept"
                placeholder="Feeder / Blower / Topper"
                required
              />

              <Label>Part No.</Label>
              <Input name="part_num" placeholder="5T2166102W" />

              <Label>Part Name</Label>
              <Input name="part_name" placeholder="CASE(UPPER,BLOWER)" />

              <Label>Status</Label>
              <select
                name="Status"
                className="border rounded-md px-2 py-2 w-full"
              >
                <option value="">เลือก / select..</option>
                <option value="Done">Done</option>
                <option value="Waiting">Waiting</option>
                <option value="Checking">Checking</option>
              </select>
            </div>

            {/* RIGHT */}
            <div className="space-y-4">
              <Label>Problem Detail (TH)</Label>
              <Textarea
                name="Problems"
                placeholder="Stopper blower ฝั่ง LH เริ่มงอ..."
                className="h-24"
              />

              <Label>Cause of Problem (TH)</Label>
              <Textarea
                name="cause"
                placeholder="แรงลมตีกระแทกด้านเดียว"
                className="h-24"
                required
              />

              <Label>แนบรูปภาพ (สูงสุด 5)</Label>
              <div
                ref={dropRef}
                className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-sky-400 transition cursor-pointer"
              >
                <Upload className="mx-auto text-gray-400 mb-2" />
                <p className="text-gray-500 text-sm">
                  Drag & Drop หรือคลิกเพื่อเลือกไฟล์
                </p>
                <Input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) =>
                    setImages([
                      ...images,
                      ...(e.target.files ? Array.from(e.target.files) : []),
                    ])
                  }
                  className="hidden"
                />
              </div>

              {/* Preview Zone */}
              <div className="flex flex-wrap gap-3 mt-3">
                <AnimatePresence>
                  {images.map((file, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.8 }}
                      className="relative w-24 h-24 border rounded-lg overflow-hidden group"
                    >
                      <Image
                        src={URL.createObjectURL(file)}
                        alt={file.name}
                        fill
                        className="object-cover group-hover:opacity-80 transition"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setImages((prev) =>
                            prev.filter((_, idx) => idx !== i)
                          )
                        }
                        className="absolute top-1 right-1 bg-black/60 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs"
                      >
                        <X size={12} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>

              {/* Progress Bar */}
              {loading && (
                <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-sky-600 h-2 rounded-full transition-all"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-sky-600 hover:bg-sky-700 text-white py-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />{" "}
                    กำลังบันทึก...
                  </>
                ) : (
                  "💾 บันทึกข้อมูล"
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
