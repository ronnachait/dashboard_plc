import { Suspense } from "react";
import MaintenanceTimeline from "@/components/MaintenanceTimeline";

function MaintenanceTimelineWrapper() {
  return (
    <main className=" mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Maintenance Timeline</h1>
      <p className="text-muted-foreground">
        แสดงรอบบำรุงของรถแต่ละคัน พร้อมสถานะและรอบถัดไป
      </p>
      <MaintenanceTimeline />
    </main>
  );
}

export default function MaintenancePage() {
  return (
    <Suspense fallback={<div className="p-6">กำลังโหลด...</div>}>
      <MaintenanceTimelineWrapper />
    </Suspense>
  );
}
