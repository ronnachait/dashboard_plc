import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Start seeding...");

  // ---------- 1) Vehicle ----------
  await prisma.vehicle.createMany({
    data: [
      {
        id: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
        name: "รถตัดอ้อยต้นแบบ 2.9",
        plateNo: "2.9",
      },
      { id: "tractor-02", name: "รถตัดอ้อยต้นแบบ 3.6", plateNo: "3.6" },
    ],
    skipDuplicates: true,
  });
  console.log("✅ Vehicles seeded");

  // ---------- 2) PlcSetting ----------
  await prisma.plcSetting.createMany({
    data: [
      { sensor: "P1", maxValue: 6 },
      { sensor: "P2", maxValue: 6 },
      { sensor: "P3", maxValue: 6 },
      { sensor: "T1", maxValue: 80 },
      { sensor: "T2", maxValue: 80 },
      { sensor: "T3", maxValue: 80 },
      { sensor: "T4", maxValue: 80 },
      { sensor: "T5", maxValue: 80 },
      { sensor: "T6", maxValue: 80 },
    ],
    skipDuplicates: true,
  });
  console.log("✅ PlcSettings seeded");

  // ---------- 3) GreasePoint ----------
  await prisma.greasePoint.createMany({
    data: [
      {
        pointNo: 1,
        name: "ปลาย ROD กระบอกเลี้ยว (LH, RH)",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "อัดจารบี ก่อนเริ่มตัดทำงานทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 2,
        name: "จุดหมุน กระบอกเลี้ยว (LH, RH)",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "อัดจารบี ก่อนเริ่มตัดทำงานทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 3,
        name: "แขนยึดล้อหน้า (LH, RH)",
        fittings: 10,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "อัดจารบี ก่อนเริ่มตัดทำงานทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 4,
        name: "โคนของทอปเปอร์",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "อัดจารบี ก่อนเริ่มตัดทำงานทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 5,
        name: "ปลายของทอปเปอร์",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "อัดจารบี ก่อนเริ่มตัดทำงานทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 6,
        name: "Pin ยึดกระบอกทอปเปอร์",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "อัดจารบี ก่อนเริ่มตัดทำงานทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ GreasePoints seeded");

  // ---------- 4) MaintenanceTemplate ----------
  const templates = await prisma.maintenanceTemplate.createMany({
    data: [
      {
        category: "Engine",
        item: "Engine Oil",
        action: "Change",
        intervalHr: 100,
        note: "เปลี่ยนน้ำมันเครื่องทุก 100 ชั่วโมง",
      },
      {
        category: "Engine",
        item: "Oil Filter",
        action: "Change",
        intervalHr: 100,
        note: "เปลี่ยนกรองน้ำมันเครื่องพร้อมน้ำมันเครื่อง",
      },
      {
        category: "Fuel",
        item: "Fuel Filter",
        action: "Change",
        intervalHr: 200,
        note: "เปลี่ยนกรองน้ำมันเชื้อเพลิงทุก 200 ชั่วโมง",
      },
      {
        category: "Hydraulic",
        item: "Hydraulic Filter",
        action: "Change",
        intervalHr: 250,
        note: "เปลี่ยนกรองน้ำมันไฮดรอลิกทุก 250 ชั่วโมง",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ MaintenanceTemplates seeded");

  // ---------- 5) MaintenancePlan ----------
  const vehicle = await prisma.vehicle.findUnique({
    where: { id: "23429582-fbfd-4c7b-95c1-10c17b3dfebb" },
  });

  const allTemplates = await prisma.maintenanceTemplate.findMany();

  for (const t of allTemplates) {
    await prisma.maintenancePlan.upsert({
      where: {
        vehicleId_templateId: {
          vehicleId: vehicle!.id,
          templateId: t.id,
        },
      },
      update: {},
      create: {
        vehicleId: vehicle!.id,
        templateId: t.id,
        nextDueHour: 1300 + (t.intervalHr ?? 100),
        lastDoneHour: 1200,
      },
    });
  }

  console.log("✅ MaintenancePlans seeded");
  console.log("🌱 All seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
