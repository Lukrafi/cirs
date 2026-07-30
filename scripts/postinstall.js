const { execSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "..");
const schemaPg = path.join(projectRoot, "prisma", "schema-postgres.prisma");
const schemaMain = path.join(projectRoot, "prisma", "schema.prisma");

const dbUrl = process.env.DATABASE_URL || "";
const isVercel = !!process.env.VERCEL || !!process.env.CI || !!process.env.NOW_BUILDER;
const isPostgres = dbUrl.startsWith("postgresql://") || dbUrl.startsWith("postgres://");

console.log("postinstall debug:", { isVercel, isPostgres, dbUrlStart: dbUrl.substring(0, 20) });

if (isPostgres) {
  console.log("PostgreSQL detectado no postinstall. Gerando com schema-postgres...");
  fs.copyFileSync(schemaPg, schemaMain);
  try {
    execSync("npx prisma generate", { stdio: "inherit", cwd: projectRoot, env: process.env });
  } catch (e) {
    console.log("prisma generate falhou no postinstall, continuando...");
  }
} else {
  console.log("postinstall: gerando Prisma Client com schema local (SQLite)...");
  try {
    execSync("npx prisma generate", { stdio: "inherit", cwd: projectRoot, env: process.env });
  } catch (e) {
    console.log("prisma generate falhou, continuando...");
  }
}
