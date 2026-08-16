import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { FIFA_CODE_TO_FLAG } from "../src/lib/fifaCountryCodes";

const prisma = new PrismaClient();

const PUBLIC_DIR = path.join(process.cwd(), "public", "bandeiras-fifa");

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 50) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const countries = await prisma.country.findMany({ select: { id: true, code: true, name: true } });
  let ok = 0;
  let semMapa = 0;
  const semMapaList: string[] = [];

  for (const c of countries) {
    const fileBase = FIFA_CODE_TO_FLAG[c.code];
    if (!fileBase) {
      semMapa++;
      semMapaList.push(`${c.name} (${c.code})`);
      continue;
    }

    const dest = path.join(PUBLIC_DIR, `${fileBase}.svg`);
    const flagPath = `/bandeiras-fifa/${fileBase}.svg`;

    if (!fs.existsSync(dest)) {
      await download(`https://flagcdn.com/${fileBase}.svg`, dest);
    }

    if (!fs.existsSync(dest)) {
      console.log(`SEM BANDEIRA ${c.name} (${c.code}) -> ${fileBase}`);
      continue;
    }

    await prisma.country.update({ where: { id: c.id }, data: { flag: flagPath } });
    ok++;
  }

  console.log(`Total países: ${countries.length} | com bandeira: ${ok} | sem mapeamento: ${semMapa}`);
  if (semMapaList.length > 0) console.log("Sem mapeamento:", semMapaList.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
