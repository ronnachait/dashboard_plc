#!/usr/bin/env node
import { execSync } from "child_process";
import readline from "readline";

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question("📌 ใส่ชื่อ migration: ", (name) => {
  execSync(`npx prisma migrate dev --name ${name}`, { stdio: "inherit" });
  rl.close();
});
