import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("hOeoS70v4f", 10); // password

  const user = await prisma.user.create({
    data: {
      email: "admin@crbt.com",
      name: "admin",
      password: hashed,
      role: "admin", // หรือ user
    },
  });

  console.log("✅ Created user:", user);
}

main()
  .catch((e) => console.error(e))
  .finally(async () => {
    await prisma.$disconnect();
  });

//npx tsx scripts/create-user.ts
