"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useSession } from "next-auth/react";
import { sectionList } from "@/lib/section";

type ProblemForm = {
  reporter: string;
  hour: string;
  section: string;
  partNo: string;
  partName: string;
  newPart: string;
  operatingHours: string;
  cycles: string;
  classification: string;
  status: string;
  detailTH: string;
  causeTH: string;
  images: string[];
};

export default function ProblemReportPage() {
  const [currentHour, setCurrentHour] = useState<number>(0);

  useEffect(() => {
    const fetchVehicle = async () => {
      try {
        const res = await fetch(
          "/api/vehicle/23429582-fbfd-4c7b-95c1-10c17b3dfebb"
        );
        if (res.ok) {
          const data = await res.json();
          setCurrentHour(data.vehicle?.lastHourAfterTest ?? 0);
        }
      } catch (err) {
        console.error("❌ Fetch vehicle error:", err);
      }
    };
    fetchVehicle();
  }, []);

  // ดึงข้อมูลผู้ใช้
  const { data: session, status } = useSession();
  // const role = session?.user?.role;
  const email = session?.user?.email ?? "";

  const [form, setForm] = useState<ProblemForm>({
    reporter: "",
    hour: "",
    section: "",
    partNo: "",
    partName: "",
    newPart: "",
    operatingHours: "",
    cycles: "",
    classification: "",
    status: "",
    detailTH: "",
    causeTH: "",
    images: [],
  });

  useEffect(() => {
    if (status === "authenticated" && email) {
      setForm((prev) => ({ ...prev, reporter: email }));
    }
  }, [status, email]);

  const handleChange = (key: keyof ProblemForm, value: string) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setForm((prev) => ({ ...prev, images: [...prev.images, ...urls] }));
  };

  const handleSubmit = () => {
    console.log("📤 ส่งข้อมูล:", form);
    alert("✅ บันทึกข้อมูลเรียบร้อย");
  };

  return (
    <div className="flex flex-col items-center bg-gray-50 min-h-screen py-6 px-3 overflow-y-auto">
      <div className="w-full max-w-4xl bg-white shadow-lg rounded-2xl border border-gray-200 p-5 sm:p-8 space-y-6">
        {/* โลโก้ + หัวเรื่อง */}
        <div className="flex flex-col items-center text-center">
          <div className="relative w-28 h-10 sm:w-36 sm:h-12">
            <Image
              src="/kubota-logo.png"
              alt="Kubota"
              fill
              sizes="(max-width: 640px) 100px, 140px"
              className="object-contain"
              onError={(e) => (e.currentTarget.style.display = "none")}
            />
          </div>
          <h1 className="text-lg sm:text-xl md:text-2xl font-semibold mt-2 text-gray-800">
            CYLINDER BENCH TEST PROBLEM
          </h1>
        </div>

        {/* ฟอร์ม */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
          <div className="sm:col-span-2">
            <Label>Report By</Label>
            <Input value={form.reporter} disabled className="bg-gray-100" />
          </div>

          <div>
            <Label>Hour (M/C) ชั่วโมงรถ</Label>
            <Input
              value={currentHour}
              onChange={(e) => {
                handleChange("hour", e.target.value);
                setCurrentHour(Number(e.target.value));
              }}
            />
          </div>

          <select
            className="block w-full border rounded-md p-2 text-sm sm:text-base bg-white"
            value={form.section}
            onChange={(e) => handleChange("section", e.target.value)}
          >
            <option value="">เลือก / select...</option>
            {sectionList.map((item) => (
              <option key={item} value={item}>
                {item}
              </option>
            ))}
          </select>
          <div>
            <Label>Part No. / หมายเลขชิ้นส่วน</Label>
            <Input
              value={form.partNo}
              onChange={(e) => handleChange("partNo", e.target.value)}
            />
          </div>

          <div>
            <Label>Part Name / ชื่อชิ้นส่วน</Label>
            <Input
              value={form.partName}
              onChange={(e) => handleChange("partName", e.target.value)}
            />
          </div>

          <div>
            <Label>New part / ชิ้นส่วนใหม่</Label>
            <select
              className="block w-full border rounded-md p-2 text-sm sm:text-base bg-white"
              value={form.newPart}
              onChange={(e) => handleChange("newPart", e.target.value)}
            >
              <option value="">เลือก / select...</option>
              <option value="Old">Old / เก่า</option>
              <option value="New">New / ใหม่</option>
            </select>
          </div>

          <div>
            <Label>Operating hours of part / ชั่วโมงใช้งานของชิ้นส่วน</Label>
            <Input
              value={form.operatingHours}
              onChange={(e) => handleChange("operatingHours", e.target.value)}
            />
          </div>

          <div>
            <Label>Cycles / จำนวนรอบทดสอบ</Label>
            <Input
              value={form.cycles}
              onChange={(e) => handleChange("cycles", e.target.value)}
            />
          </div>

          <div>
            <Label>Classification / หมวดหมู่ของปัญหา</Label>
            <select
              className="block w-full border rounded-md p-2 text-sm sm:text-base bg-white"
              value={form.classification}
              onChange={(e) => handleChange("classification", e.target.value)}
            >
              <option value="">เลือก / select...</option>
              <option value="Leakage">Leakage</option>
              <option value="Abnormal working">Abnormal working</option>
              <option value="Design error">Design error</option>
              <option value="Part damage">Part damage</option>
            </select>
          </div>

          <div>
            <Label>Status / สถานะ</Label>
            <select
              className="block w-full border rounded-md p-2 text-sm sm:text-base bg-white"
              value={form.status}
              onChange={(e) => handleChange("status", e.target.value)}
            >
              <option value="">เลือก / select...</option>
              <option value="Monitoring">Monitoring</option>
              <option value="Done">Done</option>
              <option value="Modify">Modify</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <Label>Problems content (TH) / รายละเอียดของปัญหา ภาษาไทย</Label>
            <Textarea
              value={form.detailTH}
              onChange={(e) => handleChange("detailTH", e.target.value)}
              className="resize-y min-h-[100px]"
            />
          </div>

          <div className="sm:col-span-2">
            <Label>Cause of problem (TH) / สาเหตุของปัญหา ภาษาไทย</Label>
            <Textarea
              value={form.causeTH}
              onChange={(e) => handleChange("causeTH", e.target.value)}
              className="resize-y min-h-[100px]"
            />
          </div>

          {/* Upload */}
          <div className="sm:col-span-2">
            <Label className="block text-gray-700 font-medium mb-2">
              แนบรูปภาพหลายไฟล์{" "}
              <span className="text-gray-500 text-sm">
                (ZoomIn / ZoomOut / รูปปัญหา 1–5)
              </span>
            </Label>

            <div className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-sky-300 rounded-xl bg-sky-50 hover:bg-sky-100 transition">
              <div className="flex flex-col items-center justify-center pointer-events-none">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="w-8 h-8 mb-2 text-sky-500"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 16v1a2 2 0 002 2h12a2 2 0 002-2v-1M12 12v8m0-8l-3 3m3-3l3 3M12 4v8"
                  />
                </svg>
                <p className="text-sm text-gray-600 font-semibold">
                  คลิกเพื่ออัปโหลด หรือ ลากไฟล์มาวาง
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  รองรับ .JPG .PNG (หลายไฟล์พร้อมกัน)
                </p>
              </div>
              <input
                id="file-upload"
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileChange}
                className="absolute inset-0 opacity-0 cursor-pointer"
              />
            </div>

            {/* Preview */}
            {form.images.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3 mt-4">
                {form.images.map((src, i) => (
                  <div
                    key={i}
                    className="relative aspect-square w-full overflow-hidden rounded-lg border group"
                  >
                    <Image
                      src={src}
                      alt={`upload-${i}`}
                      fill
                      unoptimized
                      className="object-cover group-hover:opacity-90"
                    />
                    <button
                      onClick={() =>
                        setForm((prev) => ({
                          ...prev,
                          images: prev.images.filter((_, idx) => idx !== i),
                        }))
                      }
                      className="absolute top-1 right-1 bg-black/50 hover:bg-black/70 text-white text-xs rounded-full p-1 sm:p-1.5 transition"
                      title="ลบรูปนี้"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        <div className="pt-4">
          <Button
            className="w-full py-3 text-base sm:text-lg font-medium"
            onClick={handleSubmit}
          >
            บันทึกข้อมูล
          </Button>
        </div>
      </div>
    </div>
  );
}
