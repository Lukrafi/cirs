import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { FIFA_CODE_TO_FLAG } from "../src/lib/fifaCountryCodes";

const prisma = new PrismaClient();

const FLAGS_DIR = path.join(process.cwd(), "public", "bandeiras-fifa");
const OUT_DIR = path.join(process.cwd(), "public", "divisoes");

function extractFlag(flagPath: string): { inner: string; viewBox: string } | null {
  try {
    const svg = fs.readFileSync(flagPath, "utf-8");
    const m = svg.match(/<svg[^>]*>([\s\S]*?)<\/svg>/i);
    const vb = svg.match(/viewBox="([^"]+)"/i)?.[1] || "0 0 600 400";
    if (!m) return null;
    return { inner: m[1], viewBox: vb };
  } catch {
    return null;
  }
}

function namespaceIds(svgInner: string, prefix: string): string {
  return svgInner
    .replace(/id="([^"]+)"/g, (_, id: string) => `id="${prefix}${id}"`)
    .replace(/url\(#([^)]+)\)/g, (_, id: string) => `url(#${prefix}${id})`)
    .replace(/xlink:href="#([^"]+)"/g, (_, id: string) => `xlink:href="#${prefix}${id}"`)
    .replace(/href="#([^"]+)"/g, (_, id: string) => `href="#${prefix}${id}"`);
}

function escapeXml(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function buildBadge(code3: string, flag: { inner: string; viewBox: string } | null, level: number): string {
  const label = `${level}ª Divisão`;
  const prefix = `${code3.toLowerCase()}_`;
  const flagSvg = flag
    ? `<svg x="0" y="0" width="200" height="200" viewBox="${flag.viewBox}" preserveAspectRatio="xMidYMid slice">
      ${namespaceIds(flag.inner, prefix)}
    </svg>`
    : `<text x="100" y="112" text-anchor="middle" font-family="Arial, sans-serif" font-size="26" font-weight="bold" fill="#d4af37">${escapeXml(code3)}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <clipPath id="c"><rect x="0" y="0" width="200" height="200" rx="32"/></clipPath>
  </defs>
  <rect width="200" height="200" rx="32" fill="#0b1220"/>
  <g clip-path="url(#c)">${flagSvg}</g>
  <rect x="0" y="126" width="200" height="74" fill="rgba(8,12,24,0.8)"/>
  <rect x="0" y="126" width="200" height="2.5" fill="#d4af37"/>
  <text x="100" y="160" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="30" font-weight="bold" fill="#d4af37">${escapeXml(code3)}</text>
  <text x="100" y="185" text-anchor="middle" font-family="Arial, Helvetica, sans-serif" font-size="15" font-weight="600" fill="#ffffff">${label}</text>
</svg>`;
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const divisions = await prisma.division.findMany({
    include: { country: { select: { code: true } } },
  });

  let ok = 0;
  let semPais = 0;
  const semPaisList: string[] = [];

  for (const div of divisions) {
    if (!div.country) {
      semPais++;
      semPaisList.push(`${div.name} (sem país)`);
      continue;
    }

    const flagName = FIFA_CODE_TO_FLAG[div.country.code];
    const flag = flagName ? extractFlag(path.join(FLAGS_DIR, `${flagName}.svg`)) : null;
    const code3 = div.country.code.toLowerCase();
    const filePath = path.join(OUT_DIR, `${code3}-${div.level}.svg`);
    const logoPath = `/divisoes/${code3}-${div.level}.svg`;

    if (!fs.existsSync(filePath)) {
      fs.writeFileSync(filePath, buildBadge(div.country.code, flag, div.level), "utf-8");
    }

    await prisma.division.update({ where: { id: div.id }, data: { logo: logoPath } });
    ok++;
  }

  console.log(`Total divisões: ${divisions.length} | com logo: ${ok} | sem país: ${semPais}`);
  if (semPaisList.length > 0) console.log("Sem país:", semPaisList.join(", "));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
