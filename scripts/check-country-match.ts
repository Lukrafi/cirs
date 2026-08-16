import { PrismaClient } from "@prisma/client";
import worldData from "../src/lib/world-data.json";

const p = new PrismaClient();

type WorldCompetition = { name: string; type: string; teams?: string[] };
type WorldCountry = { name: string; code: string; competitions?: WorldCompetition[] };
type WorldConfederation = { name: string; countries: WorldCountry[] };

async function main() {
  const confeds = await p.confederation.findMany({
    include: { countries: { include: { clubs: true } } },
  });

  const wConfeds = (worldData as { confederations: WorldConfederation[] }).confederations;

  for (const conf of confeds) {
    const wConf = wConfeds.find((c) => c.name === conf.code);
    if (!wConf) {
      console.log(`${conf.code}: nao encontrado no world-data.json`);
      continue;
    }

    const dbCountryNames = conf.countries.map((c) => c.name);
    const wCountryNames = wConf.countries.map((c) => c.name);
    const wCountryCodes = wConf.countries.map((c) => c.code);

    const missing = conf.countries.filter((c) => {
      const wMatch = wConf.countries.find(
        (w) => w.name === c.name || w.code === c.code
      );
      return !wMatch;
    });

    const noClubs = conf.countries.filter((c) => c.clubs.length === 0);
    const totalClubs = conf.countries.reduce((s, c) => s + c.clubs.length, 0);

    console.log(`\n${conf.code}: ${totalClubs} clubes, ${noClubs.length} paises sem clubes (de ${conf.countries.length})`);

    if (missing.length > 0) {
      console.log(`  Paises do DB sem match no world-data.json (${missing.length}):`);
      for (const m of missing.slice(0, 5)) {
        console.log(`    DB: "${m.name}" (code:"${m.code}")`);
      }
    }

    if (noClubs.length > 0 && noClubs.length <= 10) {
      console.log(`  Paises sem clubes:`);
      for (const c of noClubs) {
        const wMatch = wConf.countries.find(
          (w) => w.name === c.name || w.code === c.code
        );
        if (wMatch) {
          const teams = wMatch.competitions?.reduce(
            (s: number, comp: WorldCompetition) => s + (comp.teams?.length || 0), 0
          ) || 0;
          console.log(`    "${c.name}" (code:"${c.code}") - world-data tem ${teams} clubes`);
        } else {
          console.log(`    "${c.name}" (code:"${c.code}") - SEM match no world-data`);
        }
      }
    } else if (noClubs.length > 10) {
      console.log(`  ${noClubs.length} paises sem clubes (mostrando os 10 primeiros):`);
      for (const c of noClubs.slice(0, 10)) {
        const wMatch = wConf.countries.find(
          (w) => w.name === c.name || w.code === c.code
        );
        if (wMatch) {
          const teams = wMatch.competitions?.reduce(
            (s: number, comp: WorldCompetition) => s + (comp.teams?.length || 0), 0
          ) || 0;
          console.log(`    "${c.name}" (code:"${c.code}") - world-data tem ${teams} clubes`);
        } else {
          console.log(`    "${c.name}" (code:"${c.code}") - SEM match no world-data`);
        }
      }
    }
  }
}

main().finally(() => p.$disconnect());
