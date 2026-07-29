import { PrismaClient } from "../src/generated/prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const username = process.env.ADMIN_USERNAME || "admin";
  const password = process.env.ADMIN_PASSWORD || "cirs2024";

  const existing = await prisma.admin.findUnique({ where: { username } });
  if (existing) {
    console.log(`Admin '${username}' already exists. Skipping seed.`);
    return;
  }

  const hash = await bcrypt.hash(password, 10);
  const admin = await prisma.admin.create({
    data: { username, password: hash },
  });

  console.log(`Admin created: ${admin.username}`);
  console.log(`Default password: ${password}`);
  console.log("Please change it after first login.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
