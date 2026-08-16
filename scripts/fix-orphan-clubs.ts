import { PrismaClient, Prisma } from "@prisma/client";
import worldData from "../src/lib/world-data.json";

const p = new PrismaClient();

interface JsonCompetition {
  name: string;
  type: string;
  division?: number;
  teams?: string[];
}

interface JsonCountry {
  name: string;
  code: string;
  competitions: JsonCompetition[];
}

interface JsonConfederation {
  name: string;
  countries: JsonCountry[];
}

const confederations = (worldData as { confederations: JsonConfederation[] }).confederations;

function buildClubMap(): Map<string, { countryName: string; countryCode: string; divisionLevel: number | null }> {
  const map = new Map<string, { countryName: string; countryCode: string; divisionLevel: number | null }>();

  for (const confed of confederations) {
    for (const country of confed.countries) {
      for (const comp of country.competitions) {
        if (!comp.teams || comp.teams.length === 0) continue;
        const divLevel = comp.division ?? null;

        for (const teamName of comp.teams) {
          const lower = teamName.toLowerCase().trim();

          if (!map.has(lower)) {
            map.set(lower, {
              countryName: country.name,
              countryCode: country.code,
              divisionLevel: divLevel,
            });
          }
        }
      }
    }
  }

  return map;
}

async function main() {
  console.log("=== Reparo Massivo de Clubes Orfaos ===\n");

  console.log("1. Construindo mapa clube -> pais + divisao a partir do world-data.json...");
  const clubToCountry = buildClubMap();
  console.log(`   ${clubToCountry.size} clubes mapeados no world-data.json.\n`);

  console.log("2. Buscando clubes orfaos no banco...");
  const orphans = await p.club.findMany({
    where: {
      OR: [{ countryId: null }, { divisionId: null }],
    },
    select: { id: true, name: true, countryId: true, divisionId: true },
    orderBy: { name: "asc" },
  });
  console.log(`   ${orphans.length} clubes orfaos encontrados.\n`);

  console.log("3. Buscando todos os paises...");
  const allCountries = await p.country.findMany({
    select: { id: true, name: true, code: true },
  });
  const countryByName = new Map<string, string>();
  const countryByCode = new Map<string, string>();
  for (const c of allCountries) {
    countryByName.set(c.name.toLowerCase(), c.id);
    countryByCode.set(c.code.toLowerCase(), c.id);
  }
  console.log(`   ${allCountries.length} paises no banco.\n`);

  console.log("4. Buscando todas as divisoes...");
  const allDivisions = await p.division.findMany({
    select: { id: true, name: true, level: true, countryId: true },
  });
  console.log(`   ${allDivisions.length} divisoes no banco.\n`);

  let fixed = 0;
  let skipped = 0;
  const notFound: string[] = [];

  for (const club of orphans) {
    const lower = club.name.toLowerCase().trim();
    const info = clubToCountry.get(lower);

    if (!info) {
      notFound.push(club.name);
      skipped++;
      continue;
    }

    const countryId = countryByName.get(info.countryName.toLowerCase())
      || countryByCode.get(info.countryCode.toLowerCase());

    if (!countryId) {
      notFound.push(`${club.name} (pais ${info.countryName} nao encontrado no banco)`);
      skipped++;
      continue;
    }

    let divisionId: string | null = null;
    if (info.divisionLevel !== null) {
      const div = allDivisions.find(
        (d) => d.countryId === countryId && d.level === info.divisionLevel
      );
      if (div) {
        divisionId = div.id;
      }
    }

    const updateData: Prisma.ClubUncheckedUpdateInput = { countryId };
    if (divisionId) {
      updateData.divisionId = divisionId;
    }

    try {
      await p.club.update({
        where: { id: club.id },
        data: updateData,
      });
      fixed++;

      if (fixed % 200 === 0) {
        console.log(`   ${fixed} corrigidos...`);
      }
    } catch {
      notFound.push(`${club.name} (erro ao atualizar)`);
      skipped++;
    }
  }

  console.log(`\n=== RESULTADO ===`);
  console.log(`   Clubes corrigidos: ${fixed}`);
  console.log(`   Clubes nao encontrados no mapa: ${skipped}`);

  if (notFound.length > 0) {
    console.log(`\nNao encontrados no world-data.json (${notFound.length}):`);
    for (const name of notFound.slice(0, 30)) {
      console.log(`   - ${name}`);
    }
    if (notFound.length > 30) {
      console.log(`   ... e mais ${notFound.length - 30} clubes`);
    }
  }

  const afterOrphans = await p.$queryRawUnsafe<[{ total: number }]>(
    `SELECT COUNT(*) as total FROM Club WHERE countryId IS NULL OR divisionId IS NULL`
  );
  console.log(`\n   Orfaos restantes: ${afterOrphans[0].total}`);
}

main()
  .catch(console.error)
  .finally(() => p.$disconnect());