import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { CURATED_LEAGUE_LOGOS } from "../src/lib/curatedLeagueLogos";

const prisma = new PrismaClient();

const OUT_DIR = path.join(process.cwd(), "public", "divisoes");
const UA = "CIRS-Site/1.0 (https://github.com/Lukrafi/cirs)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiGet(url: string): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) {
        await sleep(7000);
        continue;
      }
      if (!res.ok) return null;
      return await res.json();
    } catch {
      await sleep(1500);
    }
  }
  return null;
}

async function getLogoFromTitle(title: string): Promise<string | null> {
  // 1) procura o arquivo com "logo"/nome da liga na lista de imagens da página
  //    (mais confiável que o summary — evita fotos de estádio como "logo")
  const imgData = await apiGet(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      title
    )}&prop=images&imlimit=200&format=json&formatversion=2`
  );
  const files: string[] = (imgData?.query?.pages?.[0]?.images || []).map((i: { title: string }) => i.title);

  const nTitle = norm(title);
  const scored = files
    .map((f) => {
      const n = norm(f);
      const hasLogo = n.includes("logo");
      const hasName = nTitle.length > 3 && n.includes(nTitle);
      const bad = /commons|wikimedia|soccer.?ball|star\b|flag\b|map|icon/.test(n);
      let score = -1;
      if (hasName && hasLogo) score = 3;
      else if (hasName) score = 2;
      else if (hasLogo && !bad) score = 1;
      return { f, score };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score);

  for (const cand of scored.slice(0, 5)) {
    const urlData = await apiGet(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        cand.f
      )}&prop=imageinfo&iiprop=url|mime&format=json&formatversion=2`
    );
    const info = urlData?.query?.pages?.[0]?.imageinfo?.[0];
    if (info?.url && (info.mime || "").startsWith("image/") && !/\.jpe?g$/i.test(info.url)) {
      return String(info.url).split("?")[0];
    }
    await sleep(250);
  }
  await sleep(200);

  // 2) fallback: summary (imagem principal da página)
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(`https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
        headers: { "User-Agent": UA },
      });
      if (res.status === 429) {
        await sleep(6000);
        continue;
      }
      if (!res.ok) break;
      const d = await res.json();
      const src = d?.originalimage?.source || d?.thumbnail?.source;
      // evita .jpg/.jpeg (geralmente fotos de estádio, não o logo)
      if (src && !/\.jpe?g$/i.test(String(src))) return String(src).split("?")[0];
      break;
    } catch {
      break;
    }
  }
  return null;
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(30000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 100) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

function extFromUrl(url: string): string {
  const m = url.split("?")[0].match(/\.([a-z0-9]{2,4})$/i);
  return m ? m[1].toLowerCase() : "png";
}

async function main() {
  fs.mkdirSync(OUT_DIR, { recursive: true });

  const divisions = await prisma.division.findMany({
    include: {
      country: { select: { code: true } },
      leagues: { select: { id: true, name: true } },
    },
  });

  let ok = 0;
  let sem = 0;
  const semList: string[] = [];

  for (const div of divisions) {
    const code3 = div.country?.code || "";
    const title = CURATED_LEAGUE_LOGOS[code3]?.[String(div.level)];
    if (!title) {
      sem++;
      semList.push(`${code3}/${div.level}`);
      continue;
    }

    const codeLower = code3.toLowerCase();
    const url = await getLogoFromTitle(title);
    await sleep(400);

    if (!url) {
      sem++;
      semList.push(`${code3}/${div.level} (${title})`);
      console.log(`SEM ${code3}-${div.level} <- ${title}`);
      continue;
    }

    const ext = extFromUrl(url);
    const dest = path.join(OUT_DIR, `${codeLower}-${div.level}.${ext}`);
    const logoPath = `/divisoes/${codeLower}-${div.level}.${ext}`;
    const saved = await download(url, dest);

    if (!saved) {
      sem++;
      semList.push(`${code3}/${div.level} (${title})`);
      console.log(`FALHOU download ${code3}-${div.level} <- ${title}`);
      continue;
    }

    await prisma.division.update({ where: { id: div.id }, data: { logo: logoPath } });
    const league = div.leagues[0];
    if (league) await prisma.league.update({ where: { id: league.id }, data: { logo: logoPath } });
    ok++;
    console.log(`OK  ${code3}-${div.level} <- ${title} (${logoPath})`);
  }

  console.log(`\nTotal divisões: ${divisions.length} | com logo real: ${ok} | sem logo (não curado): ${sem}`);
  if (semList.length > 0) console.log(`Sem logo (${semList.length}): ${semList.slice(0, 60).join("; ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
