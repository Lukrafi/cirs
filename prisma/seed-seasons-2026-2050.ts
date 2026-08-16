import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const START_YEAR = 2026;
const END_YEAR = 2050;

const QUADRIENNIAL = new Set(["Copa América", "Eurocopa", "Copa da Ásia", "Finalíssima", "OFC Nations Cup"]);
const QUAD_START: Record<string, number> = { "Copa América": 2024, "Eurocopa": 2024, "Copa da Ásia": 2023, "Finalíssima": 2025, "OFC Nations Cup": 2024 };

const BIENNIAL = new Set(["Gold Cup", "Copa Africana de Nações", "African Nations Championship"]);
const BI_START: Record<string, number> = { "Gold Cup": 2025, "Copa Africana de Nações": 2024, "African Nations Championship": 2026 };

function shouldInclude(name: string, year: number): boolean {
  if (QUADRIENNIAL.has(name)) return (year - (QUAD_START[name] ?? 2024)) % 4 === 0;
  if (BIENNIAL.has(name)) return (year - (BI_START[name] ?? 2025)) % 2 === 0;
  return true;
}

async function main() {
  console.log("=== Seed Seasons 2026-2050 ===");

  // Verifica se já existem seasons
  const existing = await prisma.season.count();
  if (existing > 0) {
    console.log(`Já existem ${existing} seasons. Pulando.`);
    return;
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
