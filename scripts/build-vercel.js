#!/usr/bin/env node
/* eslint-disable @typescript-eslint/no-require-imports */
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

// Seed Mundial — executa apenas se SKIP_SEED_WORLD nao estiver definido
if (process.env.SKIP_SEED_WORLD === "1" || process.env.SKIP_SEED === "1") {
  console.log("> Seed Mundial: PULADO (SKIP_SEED_WORLD=1)");
} else {
  try {
    run("Seed Mundial", "npx tsx prisma/seed-world.ts");
  } catch (e) {
    console.log("Seed mundial ja executado ou falhou.");
  }
}

// Seed de Clubes — executado via API /api/sync/seed-clubs (uma confederação por vez)
// Não rodar no build para evitar timeout

// Seed de Seleções FIFA — bandeiras já estão commitadas em public/bandeiras-fifa,
// então aqui só criam/atualizam os registros no banco (idempotente).
try {
  run("Seed Seleções FIFA", "npx tsx prisma/seed-national-teams.ts");
} catch {
  console.log("Seed de seleções FIFA falhou, continuando...");
}

// Seed de bandeiras dos Países — reaproveita o mesmo pack local.
try {
  run("Seed Bandeiras Países", "npx tsx prisma/seed-country-flags.ts");
} catch {
  console.log("Seed de bandeiras dos países falhou, continuando...");
}

// Seed de logos das Divisões — gera/atualiza os emblemas das divisões principais.
try {
  run("Seed Logos Divisões", "npx tsx prisma/seed-division-logos.ts");
} catch {
  console.log("Seed de logos das divisões falhou, continuando...");
}

// Seed de logos de TODAS as ligas, copas e confederações (Wikipedia, png/svg apenas).
try {
  run("Seed Logos Ligas/Copas/Confederações", "npx tsx prisma/seed-all-logos.ts");
} catch {
  console.log("Seed de logos de ligas falhou, continuando...");
}

// Seed de Season do Ano Atual
try {
  run("Seed Season Atual", "npx tsx prisma/seed-seasons-2026-2050.ts");
} catch {
  console.log("Seed de season falhou, continuando...");
}

// Build
run("Next Build", "npx next build");

console.log("=== Build concluido! ===");
