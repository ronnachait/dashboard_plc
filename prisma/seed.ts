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
      {
        pointNo: 7,
        name: "ลิงค์ยึดดีไวเดอร์ (LH, RH)",
        fittings: 8,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "อัดจารบี ก่อนเริ่มตัดทำงานทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 8,
        name: "ฟีเดอร์และหัวตัด (ลูกปืนลูกกลิ้ง)",
        fittings: 8,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "ซ้าย 6 จุด / ขวา 2 จุด, อัดทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 9,
        name: "บัตลิฟเตอร์ (ลูกปืนลูกกลิ้ง)",
        fittings: 1,
        intervalHours: 250,
        lastGreaseHour: 1000,
        nextDueHour: 1250,
        detail: "ถอดฝาปิดและเติมน้ำมันทุก 250 ชั่วโมง",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 10,
        name: "ส่วนบนของโบลเวอร์",
        fittings: 1,
        intervalHours: 250,
        lastGreaseHour: 1000,
        nextDueHour: 1250,
        detail: "อัดจารบี ทุก 250 ชั่วโมง",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 11,
        name: "โซ่ประคองโบลเวอร์หมุน (LH, RH)",
        fittings: 12,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "อัดจารบี ก่อนเริ่มตัดทำงานทุกวัน",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 12,
        name: "โซ่ประคองออโต้โหลดหมุน",
        fittings: 1,
        intervalHours: 25,
        lastGreaseHour: 1175,
        nextDueHour: 1200,
        detail: "ใช้แปรงทาลงไปที่ลูกกลิ้งโซ่โดยตรง ทุก 25 ชั่วโมง",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 13,
        name: "จุดหมุนออโต้โหลด",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "LH / RH",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 14,
        name: "จุดหมุนกระบอกออโต้โหลด (ฝั่งเฟรม)",
        fittings: 4,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "LH-RH, Holder upper/lower",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 15,
        name: "จุดหมุนกระบอกออโต้โหลด (ฝั่งออโต้โหลด)",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "LH, RH",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 16,
        name: "จุดหมุนกระบอกยกขึ้นลงออโต้โหลด (End)",
        fittings: 4,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "LH, RH (Upper cyl. End)",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 17,
        name: "จุดหมุนกระบอกยกขึ้นลงออโต้โหลด",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "LH, RH (Upper cyl.)",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
      {
        pointNo: 18,
        name: "จุดหมุน Divider",
        fittings: 2,
        intervalHours: 10,
        lastGreaseHour: 1190,
        nextDueHour: 1200,
        detail: "LH/RH Inner-Outer",
        vehicleId: "23429582-fbfd-4c7b-95c1-10c17b3dfebb",
      },
    ],
    skipDuplicates: true,
  });
  console.log("✅ GreasePoints seeded");

  console.log("🌱 All seeding completed");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
