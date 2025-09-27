import PlcWrapper from "@/components/PlcWrapper";

// 🚫 บังคับว่า runtime เท่านั้น ไม่ prerender
export const dynamic = "force-dynamic";

export default function Page() {
  return <PlcWrapper />;
}
