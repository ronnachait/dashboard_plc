// scripts/clean-duplicates.js
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 เริ่มตรวจสอบข้อมูลซ้ำใน SensorSummaryBatch...");

  const duplicates = await prisma.$queryRaw`
    SELECT date, shift, COUNT(*) as count
    FROM "SensorSummaryBatch"
    GROUP BY date, shift
    HAVING COUNT(*) > 1;
  `;

  if (duplicates.length === 0) {
    console.log("✅ ไม่พบข้อมูลซ้ำ (date + shift)");
    await prisma.$disconnect();
    return;
  }

  console.log(`⚠️ พบข้อมูลซ้ำ ${duplicates.length} ชุด`);
  for (const dup of duplicates) {
    const { date, shift } = dup;

    const records = await prisma.sensorSummaryBatch.findMany({
      where: { date: new Date(date), shift },
      orderBy: { createdAt: "desc" }, // เก็บแถวล่าสุดไว้
    });

    const toDelete = records.slice(1); // ลบแถวอื่น
    if (toDelete.length > 0) {
      const ids = toDelete.map((r) => r.id);
      await prisma.sensorSummaryBatch.deleteMany({
        where: { id: { in: ids } },
      });
      console.log(`🗑️ ลบ ${toDelete.length} รายการซ้ำ: ${shift} (${date})`);
    }
  }

  console.log("✅ ลบ duplicates เสร็จสิ้น พร้อม migrate ต่อได้เลย");
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error("❌ Error:", err);
  prisma.$disconnect();
});
