import MaintenanceTimeline from "@/components/MaintenanceTimeline";

export default function MaintenancePage() {
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
