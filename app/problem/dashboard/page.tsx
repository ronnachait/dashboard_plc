"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";

type Problem = {
  id: string;
  classification: string;
  status: string;
  detailTH: string;
  causeTH: string;
  detailEN: string;
  images: string[];
};

export default function ProblemDashboard() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [problems] = useState<Problem[]>([
    {
      id: "125",
      classification: "Part damage",
      status: "Done",
      detailTH: "สายไฟโดน Autoload ชน ทำให้สายไฟขาด",
      causeTH: "สายไฟหลุดจากเกลียวไทร์ แล้วชนกับ Autoload หมุนมาชน",
      detailEN: "Power cable hit by Autoload and broke.",
      images: ["/img/problem1.jpg", "/img/problem2.jpg", "/img/problem3.jpg"],
    },
    {
      id: "126",
      classification: "Abnormal working",
      status: "Modified",
      detailTH: "Bracket guide chain AL broken",
      causeTH: "สั่นระหว่างการทดสอบ A/L Twisted",
      detailEN: "AL Bracket chain broke during twisted test.",
      images: ["/img/problem4.jpg", "/img/problem5.jpg"],
    },
  ]);

  const filtered = problems.filter((p) =>
    [p.classification, p.detailTH, p.detailEN].some((v) =>
      v.toLowerCase().includes(search.toLowerCase())
    )
  );

  return (
    <div className="p-6 space-y-6">
      <Card>
        <CardHeader className="flex justify-between items-center">
          <CardTitle>📊 Dashboard ปัญหา (Problem Dashboard)</CardTitle>
          <Button onClick={() => router.push("/problem/report")}>
            ➕ เพิ่มปัญหาใหม่
          </Button>
        </CardHeader>
        <CardContent>
          <Input
            placeholder="🔍 ค้นหาปัญหา / หมวดหมู่ / รายละเอียด..."
            className="mb-4 max-w-md"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          <div className="overflow-x-auto border rounded-md">
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
                {filtered.map((p, i) => (
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
