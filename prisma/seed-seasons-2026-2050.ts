import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const START_YEAR = 2026;
const END_YEAR = 2050;

// ----- TORNEIOS QUADRIENAIS (a cada 4 anos) -----
// Copa do Mundo: 2026, 2030, 2034, 2038, 2042, 2046
// Copa América + Eurocopa: 2028, 2032, 2036, 2040, 2044, 2048
// Copa da Ásia: 2027, 2031, 2035, 2039, 2043, 2047
// Finalíssima: 2029, 2033, 2037, 2041, 2045, 2049
// OFC Nations Cup: 2028, 2032, 2036, 2040, 2044, 2048
const QUADRIENNIAL: Record<string, number> = {
  "FIFA World Cup": 2026,
  "Copa América": 2028,
  "Eurocopa": 2028,
  "Copa da Ásia": 2027,
  "Finalíssima": 2029,
  "OFC Nations Cup": 2028,
};

// ----- TORNEIOS BIENAIS (a cada 2 anos) -----
// Gold Cup: 2025, 2027, 2029, 2031, 2033, 2035, 2037, 2039, 2041, 2043, 2045, 2047, 2049
// Copa Africana de Nações: 2025, 2027, 2029, 2031, 2033, 2035, 2037, 2039, 2041, 2043, 2045, 2047, 2049
// African Nations Championship: 2026, 2028, 2030, 2032, 2034, 2036, 2038, 2040, 2042, 2044, 2046, 2048, 2050
const BIENNIAL: Record<string, number> = {
  "Gold Cup": 2025,
  "Copa Africana de Nações": 2025,
  "African Nations Championship": 2026,
};

function shouldInclude(name: string, year: number): boolean {
  if (name in QUADRIENNIAL) return (year - QUADRIENNIAL[name]) % 4 === 0;
  if (name in BIENNIAL) return (year - BIENNIAL[name]) % 2 === 0;
  return true; // anual
}

async function main() {
  console.log("=== Seed Seasons 2026-2050 ===");

  // Verifica se já existem seasons no formato correto
  const existingCount = await prisma.season.count();
  const existingWithLeague = await prisma.season.count({ where: { leagueId: { not: null } } });

  if (existingCount === 25 && existingWithLeague === 0) {
    console.log("Seasons já estão no formato correto (25 seasons, sem leagueId). Pulando.");
    return;
  }

  // Se existem seasons no formato antigo, limpa tudo
  if (existingCount > 0) {
    console.log(`Limpando ${existingCount} seasons antigas...`);
    await prisma.competition.deleteMany({});
    await prisma.season.deleteMany({});
  }

  const leagues = await prisma.league.findMany({ select: { id: true, name: true } });
  console.log(`${leagues.length} ligas encontradas`);

  let totalSeasons = 0;
  let totalComps = 0;

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const season = await prisma.season.create({
      data: {
        name: String(year),
        year,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
      },
    });
    totalSeasons++;

    let compCount = 0;
    for (const league of leagues) {
      if (!shouldInclude(league.name, year)) continue;
      await prisma.competition.create({
        data: {
          name: league.name,
          type: "liga",
          seasonId: season.id,
          format: "round-robin",
          numTurns: 2,
        },
      });
      compCount++;
    }
    totalComps += compCount;
    console.log(`${year}: ${compCount} competições`);
  }

  console.log(`\nConcluído: ${totalSeasons} seasons, ${totalComps} competitions`);
}

main()
  .catch((e) => {
    console.error("Seed seasons falhou:", e);
  })
  .finally(() => prisma.$disconnect());
