"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import { motion, AnimatePresence, Reorder } from "framer-motion";
import { Loader2, Upload, X, MoveVertical, ZoomIn, ZoomOut, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
export default function ProblemFormPage() {
  const [hasGoogleAuth, setHasGoogleAuth] = useState(false);
  const [loading, setLoading] = useState(false);
  const [images, setImages] = useState<File[]>([]);
  const [userEmail, setUserEmail] = useState<string>("");
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [vehicleHour, setVehicleHour] = useState<number>(0);
  const dropRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const formRef = useRef<HTMLFormElement | null>(null);

  // ✅ ตรวจสอบว่ามี Google Token หรือยัง
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const res = await fetch("/api/google/token");
        if (res.ok) {
          setHasGoogleAuth(true);
          // ดึงข้อมูล user
          const userinfoRes = await fetch("/api/google/userinfo");
          if (userinfoRes.ok) {
            const data = await userinfoRes.json();
            if (data.email) setUserEmail(data.email);
          }
        } else {
          setHasGoogleAuth(false);
        }
      } catch {
        setHasGoogleAuth(false);
      }
    };
    checkAuth();
  }, []);

  // ✅ ดึงชั่วโมงรถอัตโนมัติ
  useEffect(() => {
    const fetchVehicleHour = async () => {
      try {
        // ดึงจาก vehicle ID ที่ใช้งานจริง (ตัวอย่างใช้ ID จาก daily-check)
        const res = await fetch("/api/vehicle/23429582-fbfd-4c7b-95c1-10c17b3dfebb");
        if (res.ok) {
          const data = await res.json();
          const hour = Number(data.vehicle?.lastHourAfterTest ?? 0);
          setVehicleHour(hour);
        }
      } catch (err) {
        console.error("❌ Failed to fetch vehicle hour:", err);
      }
    };
    fetchVehicleHour();
  }, []);

  const handleAuthorize = () => {
    const currentUrl = window.location.pathname;
    window.location.href = `/api/google/auth?redirect=${encodeURIComponent(
      currentUrl
    )}`;
  };

  // 🏷️ Helper: ระบุ label ของแต่ละรูป
  const getImageLabel = (index: number) => {
    if (index === 0) return { label: "Zoom In", icon: ZoomIn, color: "text-blue-600 bg-blue-50 border-blue-300" };
    if (index === 1) return { label: "Zoom Out", icon: ZoomOut, color: "text-green-600 bg-green-50 border-green-300" };
    return { label: `Other ${index - 1}`, icon: ImageIcon, color: "text-gray-600 bg-gray-50 border-gray-300" };
  };

  // 🔄 ย้ายรูปขึ้น
  const moveImageUp = (index: number) => {
    if (index === 0) return;
    const newImages = [...images];
    [newImages[index - 1], newImages[index]] = [newImages[index], newImages[index - 1]];
    setImages(newImages);
  };

  // 🔄 ย้ายรูปลง
  const moveImageDown = (index: number) => {
    if (index === images.length - 1) return;
    const newImages = [...images];
    [newImages[index], newImages[index + 1]] = [newImages[index + 1], newImages[index]];
    setImages(newImages);
  };

  // 🎯 ป้องกันการเปิดรูปเมื่อลากเข้าหน้า
  useEffect(() => {
    const preventDefaults = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
    };

    // ป้องกันทั้งหน้า
    window.addEventListener("dragover", preventDefaults);
    window.addEventListener("drop", preventDefaults);

    return () => {
      window.removeEventListener("dragover", preventDefaults);
      window.removeEventListener("drop", preventDefaults);
    };
  }, []);

  // 🎯 Drag & Drop Upload
  useEffect(() => {
    const dropZone = dropRef.current;
    if (!dropZone) return;

    const handleDrop = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = e.dataTransfer?.files;
      if (files && files.length > 0) {
        setImages((prev) => [...prev, ...Array.from(files)]);
      }

      dropZone.classList.remove("border-sky-500", "bg-sky-50");
    };

    const handleDragOver = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.add("border-sky-500", "bg-sky-50");
    };

    const handleDragLeave = (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dropZone.classList.remove("border-sky-500", "bg-sky-50");
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
    if (!hasGoogleAuth) return toast.error("กรุณาเชื่อมต่อ Google Account ก่อน");
    setLoading(true);
    setUploadProgress(10); // เริ่มต้น

    const formData = new FormData(e.currentTarget);
    // ไม่ต้องส่ง token แล้ว - server จะดึงเอง
    images.forEach((file, i) => formData.append(`file_${i + 1}`, file));

    try {
      setUploadProgress(30); // กำลังส่งข้อมูล
      
      const res = await fetch("/api/problem", {
        method: "POST",
        body: formData,
      });

      setUploadProgress(70); // ได้ response

      // ถ้า 401 = ต้อง re-auth
      if (res.status === 401) {
        const data = await res.json();
        if (data.needAuth) {
          toast.warning("🔒 กรุณาเชื่อมต่อ Google Account");
          handleAuthorize();
          return;
        }
      }

      const json = await res.json();
      setUploadProgress(90); // ได้ผลลัพธ์

      if (json.success) {
        setUploadProgress(100); // เสร็จสมบูรณ์
        toast.success("✅ บันทึกข้อมูลเรียบร้อย!");
        
        // ล้างข้อมูลทั้งหมด
        setImages([]);
        
        // รีเซ็ตฟอร์ม (ใช้ formRef แทน)
        if (formRef.current) {
          formRef.current.reset();
        }
        
        // รีเซ็ต states
        setUploadProgress(0);
        
        // ดึงชั่วโมงรถใหม่
        const vehicleRes = await fetch("/api/vehicle/23429582-fbfd-4c7b-95c1-10c17b3dfebb");
        if (vehicleRes.ok) {
          const data = await vehicleRes.json();
          const hour = Number(data.vehicle?.lastHourAfterTest ?? 0);
          setVehicleHour(hour);
        }
      } else {
        toast.error("❌ ไม่สามารถบันทึกข้อมูลได้: " + (json.error || "Unknown error"));
      }
    } catch (err) {
      console.error("Submit error:", err);
      toast.error("⚠️ เกิดข้อผิดพลาดขณะส่งข้อมูล");
    } finally {
      setLoading(false);
      // ล้าง progress หลังจาก 1 วิ
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  if (!hasGoogleAuth)
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gradient-to-br from-slate-50 via-sky-50 to-slate-100">
        <div className="bg-white p-10 rounded-3xl shadow-2xl border border-slate-200 text-center max-w-md animate-scale-in">
          <h1 className="text-3xl mb-4 font-bold bg-gradient-to-r from-sky-600 to-blue-600 bg-clip-text text-transparent">
            🔐 Problem Report
          </h1>
          <p className="text-gray-600 mb-6">
            ต้องเชื่อมต่อกับ Google Account เพื่อบันทึกข้อมูลไปยัง Google Sheet
          </p>
          <Button
            onClick={handleAuthorize}
            className="bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all"
          >
            🔗 Connect Google Account
          </Button>
        </div>
      </div>
    );

  // 🧾 Form UI
  return (
    <motion.div
      className="max-w-5xl mx-auto p-6 space-y-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center animate-fade-in mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl shadow-lg mb-4">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>
        <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
          Problem Report
        </h1>
        <p className="text-gray-600 text-sm">
          ฟอร์มรายงานปัญหา Cylinder Bench Test
        </p>
        <div className="w-24 h-1 bg-gradient-to-r from-sky-500 to-blue-600 mx-auto mt-4 rounded-full"></div>
      </div>

      <Card className="shadow-2xl border-slate-200 animate-slide-up">
        <CardContent className="p-6 md:p-8">
          <form
            ref={formRef}
            onSubmit={handleSubmit}
            className="space-y-6"
          >
            {/* SECTION 1: Basic Info */}
            <div className="border-l-4 border-sky-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-sky-600">ข้อมูลพื้นฐาน</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Reported By</Label>
                  <Input name="report_by" value={userEmail} readOnly className="bg-gray-100" />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    Hour (M/C)
                    {vehicleHour > 0 && (
                      <span className="text-xs text-green-600 font-normal">
                        ✓ Auto
                      </span>
                    )}
                  </Label>
                  <Input 
                    name="hour_M_C" 
                    type="number" 
                    step="0.001" 
                    value={vehicleHour} 
                    onChange={(e) => setVehicleHour(Number(e.target.value))}
                    required 
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <span className="text-red-600">*</span>
                    Section
                  </Label>
                  <select
                    name="dept"
                    required
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white hover:border-sky-400 cursor-pointer"
                  >
                    <option value="">เลือก...</option>
                    <option value="EG">EG</option>
                    <option value="AL">AL</option>
                    <option value="Cover/Step">Cover/Step</option>
                    <option value="Cabin">Cabin</option>
                    <option value="Chopper">Chopper</option>
                    <option value="Divider">Divider</option>
                    <option value="Feeder">Feeder</option>
                    <option value="Blower">Blower</option>
                    <option value="Base Cutter">Base Cutter</option>
                    <option value="Header">Header</option>
                    <option value="F-tire">F-tire</option>
                    <option value="R-tire">R-tire</option>
                    <option value="Operation">Operation</option>
                    <option value="Harness">Harness</option>
                    <option value="Fuel">Fuel</option>
                    <option value="Frame">Frame</option>
                    <option value="Hydraulic">Hydraulic</option>
                    <option value="Cooling">Cooling</option>
                    <option value="Topper">Topper</option>
                    <option value="Label">Label</option>
                    <option value="TM">TM</option>
                    <option value="EG-Cover">EG-Cover</option>
                    <option value="JIG">JIG</option>
                    <option value="Etc">Etc</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 2: Part Info */}
            <div className="border-l-4 border-sky-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <span className="text-sky-600">ข้อมูลชิ้นส่วน</span>
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Part No.</Label>
                  <Input 
                    name="part_num" 
                    placeholder="5T2166102W" 
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label>Part Name</Label>
                  <Input 
                    name="part_name" 
                    placeholder="CASE(UPPER,BLOWER)" 
                  />
                </div>

                <div>
                  <Label>New Part</Label>
                  <select
                    name="newp"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white hover:border-sky-400 cursor-pointer"
                  >
                    <option value="">เลือก...</option>
                    <option value="New">New (ใหม่)</option>
                    <option value="Old">Old (เก่า)</option>
                  </select>
                </div>

                <div>
                  <Label>Part Hour</Label>
                  <Input 
                    name="part_hr" 
                    type="number"
                    step="0.001"
                    placeholder="0.000"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label>Cycles</Label>
                  <Input 
                    name="Cycles" 
                    type="number"
                    step="1"
                    placeholder="0"
                    className="font-mono"
                  />
                </div>

                <div>
                  <Label>Classification</Label>
                  <select
                    name="Classification"
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white hover:border-sky-400 cursor-pointer"
                  >
                    <option value="">เลือก...</option>
                    <option value="Drawing error / แบบผิด">Drawing error</option>
                    <option value="Wrong part list / พาทลิสผิด">Wrong part list</option>
                    <option value="Part error / ชิ้นส่วนมีปัญหา">Part error</option>
                    <option value="Part not enough / ชิ้นส่วนไม่ครบ">Part not enough</option>
                    <option value="Improve workability / เพิ่มความสามารถในการทำงาน">Improve workability</option>
                    <option value="Improve Quality / เพิ่มคุณภาพ">Improve Quality</option>
                    <option value="Improve safety / เพิ่มความปลอดภัย">Improve safety</option>
                    <option value="Cost dawn / ลดต้นทุน">Cost dawn</option>
                    <option value="Etc / อื่นๆ">Etc</option>
                  </select>
                </div>

                <div className="md:col-span-2">
                  <Label className="flex items-center gap-2">
                    <span className="text-red-600">*</span>
                    Status
                  </Label>
                  <select
                    name="Status"
                    required
                    className="border border-gray-300 rounded-lg px-4 py-2.5 w-full focus:ring-2 focus:ring-sky-500 focus:border-transparent transition-all bg-white hover:border-sky-400 cursor-pointer"
                  >
                    <option value="">เลือกสถานะ...</option>
                    <option value="Done/Change part เปลี่ยนพาทใหม่">✅ Done/Change part</option>
                    <option value="Done/Modify part แก้ไขพาทเดิม">✅ Done/Modify part</option>
                    <option value="Done แก้ไขแล้ว">✅ Done</option>
                    <option value="Waiting part รอพาร์ทจัดส่ง">⏳ Waiting part</option>
                    <option value="Under checking อยู่ระหว่างการตรวจสอบ">🔍 Under checking</option>
                    <option value="Monitoring เฝ้าสังเกต">👁️ Monitoring</option>
                  </select>
                </div>
              </div>
            </div>

            {/* SECTION 3: Problem Detail */}
            <div className="border-l-4 border-sky-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-sky-600">รายละเอียดปัญหา</span>
              </h3>
              <div className="space-y-4">
                <div>
                  <Label className="flex items-center gap-2">
                    <span className="text-red-600">*</span>
                    Problem Detail (TH)
                  </Label>
                  <Textarea
                    name="Problems"
                    placeholder="ระบุรายละเอียดปัญหา เช่น Stopper blower ฝั่ง LH เริ่มงอ..."
                    className="h-32 resize-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>

                <div>
                  <Label className="flex items-center gap-2">
                    <span className="text-red-600">*</span>
                    Cause of Problem (TH)
                  </Label>
                  <Textarea
                    name="cause"
                    placeholder="ระบุสาเหตุ เช่น แรงลมตีกระแทกด้านเดียว..."
                    className="h-32 resize-none focus:ring-2 focus:ring-sky-500 focus:border-transparent"
                    required
                  />
                </div>
              </div>
            </div>

            {/* SECTION 4: Image Upload */}
            <div className="border-l-4 border-sky-500 pl-4 py-2">
              <h3 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <svg className="w-5 h-5 text-sky-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <span className="text-sky-600">รูปภาพประกอบ</span>
                <span className="text-xs text-gray-500 font-normal">(สูงสุด 5 รูป)</span>
              </h3>
              <div className="space-y-4">
              <div
                ref={dropRef}
                onClick={(e) => {
                  // ป้องกันไม่ให้ onClick ทำงานขณะลาก
                  if (e.currentTarget.classList.contains('border-sky-500')) {
                    return;
                  }
                  fileInputRef.current?.click();
                }}
                className="border-2 border-dashed border-gray-300 rounded-xl p-8 text-center hover:border-sky-500 hover:bg-sky-50 transition-all cursor-pointer group"
              >
                <Upload className="mx-auto text-gray-400 group-hover:text-sky-500 mb-3 transition-colors w-8 h-8" />
                <p className="text-gray-600 font-medium mb-1">
                  คลิกเพื่อเลือกไฟล์
                </p>
                <p className="text-gray-400 text-xs">
                  หรือลากไฟล์มาวางที่นี่
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files) {
                      setImages([...images, ...Array.from(e.target.files)]);
                      // Reset input เพื่อให้เลือกไฟล์เดิมได้อีก
                      e.target.value = '';
                    }
                  }}
                  className="hidden"
                />
              </div>

              {/* Preview Zone */}
              {images.length > 0 && (
                <div>
                  <p className="text-xs text-gray-500 mb-2">
                    💡 คลิกลากเพื่อเรียงลำดับรูป หรือใช้ปุ่มลูกศร
                  </p>
                  <Reorder.Group
                    axis="x"
                    values={images}
                    onReorder={setImages}
                    className="flex flex-wrap gap-3"
                  >
                    {images.map((file, i) => {
                      const { label, icon: Icon, color } = getImageLabel(i);
                      return (
                        <Reorder.Item
                          key={file.name + i}
                          value={file}
                          className="relative"
                        >
                          <motion.div
                            initial={{ opacity: 0, scale: 0.8 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.8 }}
                            className="relative w-32 h-32 border-2 rounded-xl overflow-hidden group shadow-md hover:shadow-lg transition-all cursor-move"
                          >
                            {/* Label Badge */}
                            <div className={`absolute top-2 left-2 px-2 py-1 rounded-md border text-xs font-medium flex items-center gap-1 shadow-sm z-10 ${color}`}>
                              <Icon size={12} />
                              <span>{label}</span>
                            </div>

                            {/* Image */}
                            <Image
                              src={URL.createObjectURL(file)}
                              alt={file.name}
                              fill
                              className="object-cover group-hover:opacity-90 transition"
                            />

                            {/* Overlay Controls */}
                            <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                              {/* Delete Button */}
                              <button
                                type="button"
                                onClick={() =>
                                  setImages((prev) =>
                                    prev.filter((_, idx) => idx !== i)
                                  )
                                }
                                className="absolute top-2 right-2 bg-red-500 hover:bg-red-600 text-white rounded-full w-7 h-7 flex items-center justify-center shadow-lg transition-all"
                                title="ลบรูป"
                              >
                                <X size={14} />
                              </button>

                              {/* Move Buttons */}
                              <div className="absolute bottom-2 right-2 flex gap-1">
                                {i > 0 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveImageUp(i);
                                    }}
                                    className="bg-white/90 hover:bg-white text-gray-700 rounded-md p-1.5 shadow-md transition-all"
                                    title="ย้ายไปซ้าย"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="15 18 9 12 15 6"></polyline>
                                    </svg>
                                  </button>
                                )}
                                {i < images.length - 1 && (
                                  <button
                                    type="button"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      moveImageDown(i);
                                    }}
                                    className="bg-white/90 hover:bg-white text-gray-700 rounded-md p-1.5 shadow-md transition-all"
                                    title="ย้ายไปขวา"
                                  >
                                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                      <polyline points="9 18 15 12 9 6"></polyline>
                                    </svg>
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Drag Handle Indicator */}
                            <div className="absolute bottom-2 left-2 text-white/70 opacity-0 group-hover:opacity-100 transition-opacity">
                              <MoveVertical size={16} />
                            </div>
                          </motion.div>
                        </Reorder.Item>
                      );
                    })}
                  </Reorder.Group>
                </div>
              )}

              {/* Progress Bar */}
                {uploadProgress > 0 && (
                  <div className="space-y-2 animate-fade-in">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600 font-medium">
                        {uploadProgress === 100 ? "✅ เสร็จสมบูรณ์!" : "กำลังอัพโหลด..."}
                      </span>
                      <span className="text-sky-600 font-bold">{uploadProgress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
                      <div
                        className={`h-3 rounded-full transition-all duration-500 ${
                          uploadProgress === 100 
                            ? 'bg-gradient-to-r from-green-500 to-emerald-500' 
                            : 'bg-gradient-to-r from-sky-500 to-blue-500'
                        }`}
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-700 hover:to-blue-700 text-white py-4 text-lg shadow-lg hover:shadow-xl transition-all font-semibold transform hover:scale-[1.02] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  กำลังบันทึก...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5 mr-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  💾 บันทึกข้อมูล
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </motion.div>
  );
}
