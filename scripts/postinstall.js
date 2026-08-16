/* eslint-disable @typescript-eslint/no-require-imports */
const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const schemaPg = path.join(projectRoot, "prisma", "schema-postgres.prisma");
const schemaMain = path.join(projectRoot, "prisma", "schema.prisma");

const dbUrl = process.env.DATABASE_URL || "";
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

if (isPostgres) {
  console.log("PostgreSQL detectado no postinstall. Trocando schema...");
  fs.copyFileSync(schemaPg, schemaMain);
} else {
  console.log("PostgreSQL nao detectado. Mantendo schema atual.");
}

try {
  console.log("Rodando prisma generate...");
  execSync("npx prisma generate", { stdio: "inherit", cwd: projectRoot, env: process.env });
} catch (e) {
  console.log("prisma generate falhou, continuando...");
}
