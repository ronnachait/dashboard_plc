"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import Image from "next/image";
import { Upload, Plus } from "lucide-react";

type Problem = {
  id: string;
  classification: string;
  status: string;
  detailTH: string;
  causeTH: string;
  detailEN: string;
  images: string[];
};

export default function ProblemReportPage() {
  const [problems, setProblems] = useState<Problem[]>([]);
  const [newProblem, setNewProblem] = useState<Omit<Problem, "id">>({
    classification: "",
    status: "",
    detailTH: "",
    causeTH: "",
    detailEN: "",
    images: [],
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    const urls = Array.from(files).map((f) => URL.createObjectURL(f));
    setNewProblem((p) => ({ ...p, images: [...p.images, ...urls] }));
  };

  const addProblem = () => {
    setProblems((prev) => [
      ...prev,
      { id: Date.now().toString(), ...newProblem },
    ]);
    setNewProblem({
      classification: "",
      status: "",
      detailTH: "",
      causeTH: "",
      detailEN: "",
      images: [],
    });
  };

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>🧾 เพิ่มรายงานปัญหา</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input
            placeholder="หมวดหมู่ของปัญหา (Classification)"
            value={newProblem.classification}
            onChange={(e) =>
              setNewProblem({ ...newProblem, classification: e.target.value })
            }
          />
          <Input
            placeholder="สถานะ (Status)"
            value={newProblem.status}
            onChange={(e) =>
              setNewProblem({ ...newProblem, status: e.target.value })
            }
          />
          <Textarea
            placeholder="รายละเอียดของปัญหา (ภาษาไทย)"
            value={newProblem.detailTH}
            onChange={(e) =>
              setNewProblem({ ...newProblem, detailTH: e.target.value })
            }
          />
          <Textarea
            placeholder="สาเหตุของปัญหา (ภาษาไทย)"
            value={newProblem.causeTH}
            onChange={(e) =>
              setNewProblem({ ...newProblem, causeTH: e.target.value })
            }
          />
          <Textarea
            placeholder="รายละเอียดของปัญหา (English)"
            value={newProblem.detailEN}
            onChange={(e) =>
              setNewProblem({ ...newProblem, detailEN: e.target.value })
            }
          />

          <div className="space-y-2">
            <label className="text-sm font-medium">
              แนบรูปภาพหลายไฟล์ (ไม่จำกัด)
            </label>
            <Input
              type="file"
              multiple
              accept="image/*"
              onChange={handleFileChange}
            />
            <div className="flex flex-wrap gap-2">
              {newProblem.images.map((src, i) => (
                <div
                  key={i}
                  className="w-24 h-24 relative border rounded-md overflow-hidden"
                >
                  <Image
                    src={src}
                    alt={`upload-${i}`}
                    fill
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>

          <Button className="w-full" onClick={addProblem}>
            <Plus className="w-4 h-4 mr-2" /> เพิ่มปัญหาใหม่
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📊 รายการปัญหาที่บันทึก</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>No.</TableHead>
                  <TableHead>หมวดหมู่</TableHead>
                  <TableHead>สถานะ</TableHead>
                  <TableHead>รายละเอียด (TH)</TableHead>
                  <TableHead>สาเหตุ (TH)</TableHead>
                  <TableHead>รายละเอียด (EN)</TableHead>
                  <TableHead>รูปภาพ</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {problems.map((p, i) => (
                  <TableRow key={p.id}>
                    <TableCell>{i + 1}</TableCell>
                    <TableCell>{p.classification}</TableCell>
                    <TableCell>{p.status}</TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {p.detailTH}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {p.causeTH}
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">
                      {p.detailEN}
                    </TableCell>
                    <TableCell>
                      <div className="flex gap-2 flex-wrap">
                        {p.images.map((img, idx) => (
                          <Image
                            key={idx}
                            src={img}
                            alt="problem"
                            width={60}
                            height={60}
                            className="rounded-md border object-cover"
                          />
                        ))}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
