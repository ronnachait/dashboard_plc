import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  //   console.log("🌱 Start seeding PlcSetting...");

  //   // ลบของเก่าออกก่อน
  //   await prisma.plcSetting.deleteMany();

  //   const defaults = [
  //     { sensor: "P1", maxValue: 6 },
  //     { sensor: "P2", maxValue: 6 },
  //     { sensor: "P3", maxValue: 6 },
  //     { sensor: "T1", maxValue: 80 },
  //     { sensor: "T2", maxValue: 80 },
  //     { sensor: "T3", maxValue: 80 },
  //     { sensor: "T4", maxValue: 80 },
  //     { sensor: "T5", maxValue: 80 },
  //     { sensor: "T6", maxValue: 80 },
  //   ];

  //   await prisma.plcSetting.createMany({
  //     data: defaults,
  //     skipDuplicates: true,
  //   });
  // ;
  //   console.log("✅ Seeding finished.");

  await prisma.vehicle.createMany({
    data: [{ name: "รถตัดอ้อย", plateNo: "2.9" }],
    skipDuplicates: true, // กัน insert ซ้ำ
  });

  console.log("✅ Seed vehicles completed");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
