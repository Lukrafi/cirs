import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { FIFA_CODE_TO_EN } from "../src/lib/countryNames";

const prisma = new PrismaClient();

const CONF_DIR = path.join(process.cwd(), "public", "confederacoes");
const LEAGUE_DIR = path.join(process.cwd(), "public", "ligas");
const UA = "CIRS-Site/1.0 (https://github.com/Lukrafi/cirs)";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function apiGet(url: string): Promise<any> {
  for (let attempt = 0; attempt < 5; attempt++) {
    try {
      const res = await fetch(url, { headers: { "User-Agent": UA } });
      if (res.status === 429) {
        await sleep(8000);
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

function norm(s: string): string {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9 ]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function stripCountryPrefix(name: string): string {
  const idx = name.indexOf(" - ");
  return idx > -1 ? name.slice(idx + 3).trim() : name.trim();
}

// Busca o logo de um título EXATO de página (usado para confederações e títulos curados).
async function logoFromExactTitle(title: string): Promise<string | null> {
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
    .filter((x) => x.score === 3 || x.score === 1) // exige "logo" no nome do arquivo
    .sort((a, b) => b.score - a.score);

  for (const cand of scored.slice(0, 5)) {
    const urlData = await apiGet(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(
        cand.f
      )}&prop=imageinfo&iiprop=url|mime&format=json&formatversion=2`
    );
    const info = urlData?.query?.pages?.[0]?.imageinfo?.[0];
    // evita .jpg/.jpeg (geralmente fotos de estádio, não o logo)
    if (info?.url && (info.mime || "").startsWith("image/") && !/\.jpe?g$/i.test(info.url)) {
      return String(info.url).split("?")[0];
    }
    await sleep(300);
  }
  return null;
}

// Busca o logo de uma liga por NOME + PAÍS (pesquisa + verificação de arquivo "logo").
async function logoBySearch(leagueName: string, countryEN: string): Promise<string | null> {
  const queries = [
    `"${leagueName}" ${countryEN} football`,
    `"${leagueName}" ${countryEN} league`,
    `"${leagueName}" association football`,
    `"${leagueName}" football`,
  ];
  const nLeague = norm(leagueName);
  const seen = new Set<string>();

  for (const q of queries) {
    const sd = await apiGet(
      `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(
        q
      )}&srlimit=8&format=json&formatversion=2`
    );
    const titles: string[] = (sd?.query?.search || []).map((h: { title: string }) => h.title);

    for (const t of titles) {
      if (/^\d{4}\s/.test(t) || /season|temporada/i.test(t)) continue;
      if (seen.has(t)) continue;
      seen.add(t);
      // o título da página precisa conter o nome da liga (filtra seleção/clube/etc.)
      if (nLeague.length > 3 && !norm(t).includes(nLeague)) continue;
      const url = await logoFromExactTitle(t);
      if (url) return url;
    }
    await sleep(300);
  }
  return null;
}

async function download(url: string, dest: string): Promise<boolean> {
  // nunca guarda jpg/gif (fotos de estádio / animações), só logos png/svg
  if (/\.(jpe?g|gif)$/i.test(url)) return false;
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

const CONF_TITLES: Record<string, string> = {
  AFC: "Asian Football Confederation",
  CAF: "Confederation of African Football",
  CONCACAF: "CONCACAF",
  CONMEBOL: "CONMEBOL",
  OFC: "Oceania Football Confederation",
  UEFA: "UEFA",
};

async function main() {
  fs.mkdirSync(CONF_DIR, { recursive: true });
  fs.mkdirSync(LEAGUE_DIR, { recursive: true });

  // ---- 1) Confederações ----
  const confeds = await prisma.confederation.findMany();
  let confOk = 0;
  for (const c of confeds) {
    const title = CONF_TITLES[c.code];
    if (!title || (c.logo && c.logo !== "")) continue;
    const url = await logoFromExactTitle(title);
    await sleep(400);
    if (!url) {
      console.log(`CONF SEM ${c.code}`);
      continue;
    }
    const ext = extFromUrl(url);
    const dest = path.join(CONF_DIR, `${c.code.toLowerCase()}.${ext}`);
    const logoPath = `/confederacoes/${c.code.toLowerCase()}.${ext}`;
    if (await download(url, dest)) {
      await prisma.confederation.update({ where: { id: c.id }, data: { logo: logoPath } });
      confOk++;
      console.log(`CONF OK ${c.code} (${logoPath})`);
    }
  }
  console.log(`Confederações com logo: ${confOk}/${confeds.length}`);

  // ---- 2) Todas as ligas e copas ----
  const leagues = await prisma.league.findMany({
    include: { country: { select: { code: true, name: true } } },
    orderBy: { name: "asc" },
  });
  let lgOk = 0;
  let lgSem = 0;
  for (const lg of leagues) {
    if (lg.logo && lg.logo !== "") continue;
    const countryEN = lg.country?.code ? FIFA_CODE_TO_EN[lg.country.code] : "";
    const name = stripCountryPrefix(lg.name);
    const url = await logoBySearch(name, countryEN);
    await sleep(450);
    if (!url) {
      lgSem++;
      if (lgSem <= 30) console.log(`LIGA SEM ${lg.name}`);
      continue;
    }
    const ext = extFromUrl(url);
    const dest = path.join(LEAGUE_DIR, `${lg.id}.${ext}`);
    const logoPath = `/ligas/${lg.id}.${ext}`;
    if (await download(url, dest)) {
      await prisma.league.update({ where: { id: lg.id }, data: { logo: logoPath } });
      lgOk++;
      if (lgOk % 20 === 0 || lgOk <= 5) console.log(`LIGA OK ${lg.name} (${logoPath})`);
    } else {
      lgSem++;
    }
  }
  console.log(`Ligas/copas com logo: ${lgOk}/${leagues.length} | sem logo: ${lgSem}`);

  // ---- 3) Sincroniza divisões cuja liga ganhou logo ----
  const divs = await prisma.division.findMany({
    include: { leagues: { select: { id: true, logo: true } } },
  });
  let sync = 0;
  for (const d of divs) {
    if (d.logo && d.logo !== "") continue;
    const lg = d.leagues.find((l) => l.logo && l.logo !== "");
    if (lg) {
      await prisma.division.update({ where: { id: d.id }, data: { logo: lg.logo } });
      sync++;
    }
  }
  console.log(`Divisões sincronizadas com logo da liga: ${sync}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
