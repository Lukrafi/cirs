#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const schemaMain = path.join(projectRoot, "prisma", "schema.prisma");
const schemaPg = path.join(projectRoot, "prisma", "schema-postgres.prisma");

function run(label, command) {
  console.log(`\n> ${label}: ${command}`);
  execSync(command, { stdio: "inherit", cwd: projectRoot, env: process.env });
}

console.log("=== CIRS Build para Producao (Vercel) ===");

const dbUrl = process.env.DATABASE_URL || "";
if (dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://")) {
  console.log("Detectado PostgreSQL. Trocando schema...");
  fs.copyFileSync(schemaPg, schemaMain);
  console.log("Schema trocado para PostgreSQL.");
} else {
  console.log("DATABASE_URL nao e PostgreSQL, mantendo SQLite.");
}

run("Prisma Generate", "npx prisma generate");

try {
  run("Prisma DB Push", "npx prisma db push --accept-data-loss");
} catch (e) {
  console.log("DB push falhou (banco offline?), continuando...");
}

try {
  run("Seed", "npx tsx prisma/seed.ts");
} catch (e) {
  console.log("Seed ja existe ou nao foi necessario.");
}

run("Next Build", "npx next build");
console.log("=== Build concluido! ===");