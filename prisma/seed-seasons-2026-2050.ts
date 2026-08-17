import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function shouldInclude(name: string, year: number): boolean {
  const QUADRIENNIAL: Record<string, number> = {
    "FIFA World Cup": 2026, "FIFA Club World Cup": 2029,
    "Copa América": 2028, "Eurocopa": 2028, "Copa da Ásia": 2027,
    "Finalíssima": 2029, "OFC Nations Cup": 2028,
  };
  const BIENNIAL: Record<string, number> = {
    "Gold Cup": 2025, "Copa Africana de Nações": 2025,
    "African Nations Championship": 2026,
  };
  if (name in QUADRIENNIAL) return (year - QUADRIENNIAL[name]) % 4 === 0;
  if (name in BIENNIAL) return (year - BIENNIAL[name]) % 2 === 0;
  return true;
}

function cuid(): string {
  return "c" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

async function main() {
  const year = new Date().getFullYear();
  console.log(`=== Seed Season ${year} ===`);

  // Verifica se já existe
  const existing = await prisma.season.count({ where: { year } });
  if (existing > 0) {
    console.log(`${existing} seasons para ${year} já existem. Pulando.`);
    return;
  }

  const leagues = await prisma.league.findMany({
    where: { countryId: { not: null } },
    select: { id: true, name: true },
  });
  console.log(`${leagues.length} ligas`);

  const dateStart = new Date(`${year}-01-01`);
  const dateEnd = new Date(`${year}-12-31`);

  const seasonData = leagues.map((l) => ({
    id: cuid(), name: String(year), year, leagueId: l.id,
    startDate: dateStart, endDate: dateEnd,
  }));
  await prisma.season.createMany({ data: seasonData });

  const eligible = leagues.filter((l) => shouldInclude(l.name, year));
  const seasonMap: Record<string, string> = {};
  leagues.forEach((l, i) => { seasonMap[l.id] = seasonData[i].id; });

  const compData = eligible.map((l) => ({
    id: cuid(), name: l.name, type: "liga", seasonId: seasonMap[l.id],
    format: "round-robin", numTurns: 2, isSimulated: false,
  }));
  if (compData.length > 0) await prisma.competition.createMany({ data: compData });

  console.log(`${seasonData.length} seasons, ${compData.length} competitions`);
}

main()
  .catch((e) => { console.error("Seed falhou:", e); })
  .finally(() => prisma.$disconnect());
