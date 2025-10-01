import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const hashed = await bcrypt.hash("123456", 10); // password

  const user = await prisma.user.create({
    data: {
      email: "user@example.com",
      name: "Test admin",
      password: hashed,
      role: "user", // หรือ user
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
