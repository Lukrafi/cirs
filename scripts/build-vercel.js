#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const schemaMain = path.join(projectRoot, "prisma", "schema.prisma");
const schemaPg = path.join(projectRoot, "prisma", "schema-postgres.prisma");

function run(label, command, opts = {}) {
  console.log(`\n> ${label}: ${command}`);
  execSync(command, { stdio: "inherit", cwd: projectRoot, env: process.env, ...opts });
}

console.log("=== CIRS Build para Producao (Vercel) ===");

const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

if (isPostgres) {
  console.log("Detectado PostgreSQL. Trocando schema...");
  fs.copyFileSync(schemaPg, schemaMain);
  console.log("Schema trocado para PostgreSQL.");
} else {
  console.log("DATABASE_URL nao e PostgreSQL, mantendo SQLite.");
}

// Limpar generated
const generatedPath = path.join(projectRoot, "src", "generated", "prisma");
if (fs.existsSync(generatedPath)) {
  console.log("Limpando generated antigo...");
  fs.rmSync(generatedPath, { recursive: true, force: true });
}

// Gerar Prisma Client
run("Prisma Generate", "npx prisma generate");

// Sincronizar tabelas
try {
  run("Prisma DB Push", "npx prisma db push --accept-data-loss");
} catch (e) {
  console.log("DB push falhou (banco offline?), continuando...");
}

// Seed
try {
  run("Seed", "npx tsx prisma/seed.ts");
} catch (e) {
  console.log("Seed ja existe ou nao foi necessario.");
}

// Seed Mundial
try {
  run("Seed Mundial", "npx tsx prisma/seed-world.ts");
} catch (e) {
  console.log("Seed mundial ja executado ou falhou.");
}

// Build
run("Next Build", "npx next build");

console.log("=== Build concluido! ===");
