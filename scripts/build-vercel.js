#!/usr/bin/env node
/**
 * Script de build para Vercel (produção).
 * - Troca o schema para PostgreSQL
 * - Roda prisma generate (gera o Prisma Client com engine Linux)
 * - Roda prisma db push (cria as tabelas)
 * - Roda o seed (cria admin padrão)
 * - Roda o next build
 */
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

// 1. Se for PostgreSQL, copia o schema-postgres.prisma para o schema principal ANTES de qualquer prisma generate
const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

if (isPostgres) {
  console.log("Detectado PostgreSQL. Trocando schema...");
  fs.copyFileSync(schemaPg, schemaMain);
  console.log("Schema trocado para PostgreSQL.");
} else {
  console.log("DATABASE_URL nao e PostgreSQL, mantendo SQLite.");
}

// 2. Limpar generated para garantir que vai ser gerado com o engine da plataforma
const generatedPath = path.join(projectRoot, "src", "generated", "prisma");
if (fs.existsSync(generatedPath)) {
  console.log("Limpando generated antigo...");
  fs.rmSync(generatedPath, { recursive: true, force: true });
}

// 3. Gerar Prisma Client (com o schema correto e engine da plataforma)
run("Prisma Generate", "npx prisma generate");

// 4. Sincronizar tabelas
try {
  run("Prisma DB Push", "npx prisma db push --accept-data-loss");
} catch (e) {
  console.log("DB push falhou (banco offline?), continuando...");
}

// 5. Seed
try {
  run("Seed", "npx tsx prisma/seed.ts");
} catch (e) {
  console.log("Seed ja existe ou nao foi necessario.");
}

// 6. Build do Next.js
run("Next Build", "npx next build");

console.log("=== Build concluido! ===");
