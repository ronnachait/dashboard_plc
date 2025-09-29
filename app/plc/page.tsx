"use client";

import dynamic from "next/dynamic";

const PlcWrapper = dynamic(() => import("@/components/PlcWrapper"), {
  ssr: false, // ปิด SSR ได้แล้ว
});

export default function Page() {
  return <PlcWrapper />;
}
