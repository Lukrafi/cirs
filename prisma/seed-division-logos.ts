import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";
import { FIFA_CODE_TO_EN } from "../src/lib/countryNames";

const prisma = new PrismaClient();

const OUT_DIR = path.join(process.cwd(), "public", "divisoes");
const UA = "CIRS-Site/1.0 (https://github.com/Lukrafi/cirs)";

type TsdLeague = {
  strCountry?: string;
  strDivision?: string;
  strBadge?: string;
  strLogo?: string;
  strLeague?: string;
};

async function main() {
  const key = process.env.THESPORTSDB_KEY || process.env.npm_config_thesportsdb_key || "";
  if (!key || key === "3") {
    console.log(
      "AVISO: THESPORTSDB_KEY não definida (ou é a chave pública '3'). " +
        "Crie uma conta gratuita em https://www.thesportsdb.com e configure a chave para ter os logos reais."
    );
    if (!key) return;
  }

  const base = `https://www.thesportsdb.com/api/v1/json/${key}`;

  let leagues: TsdLeague[] = [];
  try {
    const res = await fetch(`${base}/all_leagues.php`, {
      headers: { "User-Agent": UA },
      signal: AbortSignal.timeout(60000),
    });
    const data = await res.json();
    leagues = data?.leagues || [];
  } catch (e) {
    console.error("Falha ao buscar all_leagues:", e instanceof Error ? e.message : String(e));
    return;
  }

  console.log(`Ligas retornadas pelo TheSportsDB: ${leagues.length}`);

  // Mapa: "País|divisão" -> badge
  const badgeByCountryDiv = new Map<string, string>();
  const leaguesByCountryDiv = new Map<string, string>();
  for (const l of leagues) {
    const c = (l.strCountry || "").trim();
    const d = (l.strDivision || "").trim();
    const badge = l.strBadge || l.strLogo || "";
    if (!c || !d || !badge) continue;
    const key2 = `${c.toLowerCase()}|${d}`;
    if (!badgeByCountryDiv.has(key2)) {
      badgeByCountryDiv.set(key2, badge);
      leaguesByCountryDiv.set(key2, l.strLeague || "");
    }
  }
  console.log(`Entradas com badge por país+divisão: ${badgeByCountryDiv.size}`);

  fs.mkdirSync(OUT_DIR, { recursive: true });

  const divisions = await prisma.division.findMany({
    include: { country: { select: { code: true } }, leagues: { select: { id: true, name: true } } },
  });

  let ok = 0;
  let semLogo = 0;
  const semLogoList: string[] = [];

  for (const div of divisions) {
    if (div.logo && div.logo !== "") continue;
    const code3 = div.country?.code?.toLowerCase() || "x";
    const level = div.level;
    const enCountry = div.country?.code ? FIFA_CODE_TO_EN[div.country.code] : "";

    let badge = enCountry ? badgeByCountryDiv.get(`${enCountry.toLowerCase()}|${level}`) : undefined;

    if (!badge && enCountry) {
      // tenta divisão como string ou sem divisão informada (ligas únicas)
      badge = badgeByCountryDiv.get(`${enCountry.toLowerCase()}|0`) || undefined;
    }

    if (!badge) {
      semLogo++;
      semLogoList.push(div.name);
      console.log(`SEM ${code3}-${level} ${div.name}`);
      continue;
    }

    const ext = badge.split("?")[0].match(/\.([a-z0-9]{2,4})$/i)?.[1]?.toLowerCase() || "png";
    const dest = path.join(OUT_DIR, `${code3}-${level}.${ext}`);
    const logoPath = `/divisoes/${code3}-${level}.${ext}`;

    try {
      const res = await fetch(badge, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(30000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 100) throw new Error("arquivo pequeno");
      fs.writeFileSync(dest, buf);

      await prisma.division.update({ where: { id: div.id }, data: { logo: logoPath } });
      const league = div.leagues[0];
      if (league) await prisma.league.update({ where: { id: league.id }, data: { logo: logoPath } });
      ok++;
      console.log(`OK  ${code3}-${level} <- ${leaguesByCountryDiv.get(`${enCountry.toLowerCase()}|${level}`) || ""} (${logoPath})`);
    } catch (e) {
      semLogo++;
      semLogoList.push(div.name);
      console.log(`ERRO ${code3}-${level} ${div.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  console.log(`\nTotal: ${divisions.length} | com logo real: ${ok} | sem logo: ${semLogo}`);
  if (semLogoList.length > 0) console.log(`Sem logo (${semLogoList.length}): ${semLogoList.join("; ")}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
