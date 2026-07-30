#!/usr/bin/env node
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const schemaMain = path.join(projectRoot, "prisma", "schema.prisma");
const schemaPg = path.join(projectRoot, "prisma", "schema-postgres.prisma");
const prismaTsPath = path.join(projectRoot, "src", "lib", "prisma.ts");
const seedTsPath = path.join(projectRoot, "prisma", "seed.ts");

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

  // Atualizar prisma.ts e seed.ts para importar do @prisma/client (output padrão)
  console.log("Atualizando imports para @prisma/client...");
  let prismaTs = fs.readFileSync(prismaTsPath, "utf8");
  prismaTs = prismaTs.replace(/from "\.\.\/generated\/prisma\/client"/g, 'from "@prisma/client"');
  fs.writeFileSync(prismaTsPath, prismaTs);

  let seedTs = fs.readFileSync(seedTsPath, "utf8");
  seedTs = seedTs.replace(/from "\.\.\/src\/generated\/prisma\/client"/g, 'from "@prisma/client"');
  fs.writeFileSync(seedTsPath, seedTs);

  console.log("Imports atualizados.");
} else {
  console.log("DATABASE_URL nao e PostgreSQL, mantendo SQLite.");
}

// Limpar generated para garantir que vai ser gerado com o engine da plataforma
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

// Build
run("Next Build", "npx next build");

console.log("=== Build concluido! ===");
