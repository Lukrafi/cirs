import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const START_YEAR = 2026;
const END_YEAR = 2050;

const QUADRIENNIAL: Record<string, number> = {
  "FIFA World Cup": 2026, "FIFA Club World Cup": 2029,
  "Copa América": 2028, "Eurocopa": 2028, "Copa da Ásia": 2027,
  "Finalíssima": 2029, "OFC Nations Cup": 2028,
};
const BIENNIAL: Record<string, number> = {
  "Gold Cup": 2025, "Copa Africana de Nações": 2025,
  "African Nations Championship": 2026,
};

function shouldInclude(name: string, year: number): boolean {
  if (name in QUADRIENNIAL) return (year - QUADRIENNIAL[name]) % 4 === 0;
  if (name in BIENNIAL) return (year - BIENNIAL[name]) % 2 === 0;
  return true;
}

function cuid(): string {
  return "c" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

async function main() {
  console.log("=== Seed Seasons 2026-2050 (batch) ===");

  // Verifica anos já criados
  const existing = await prisma.season.groupBy({ by: ["year"], _count: true });
  const doneYears = new Set(existing.filter((s) => s._count >= 600).map((s) => s.year));
  const pending = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i).filter((y) => !doneYears.has(y));

  if (pending.length === 0) {
    console.log("Todos os anos já criados. Pulando.");
    return;
  }

  console.log(`Anos pendentes: ${pending.join(", ")}`);

  // Só limpa se nada existir
  if (doneYears.size === 0) {
    console.log("Limpando...");
    await prisma.matchStat.deleteMany({});
    await prisma.match.deleteMany({});
    await prisma.standing.deleteMany({});
    await prisma.group.deleteMany({});
    await prisma.competition.deleteMany({});
    await prisma.season.deleteMany({});
  }

  const leagues = await prisma.league.findMany({
    where: { countryId: { not: null } },
    select: { id: true, name: true, countryId: true },
  });
  console.log(`${leagues.length} ligas`);

  let totalS = 0, totalC = 0;

  for (const year of pending) {
    const dateStart = new Date(`${year}-01-01`);
    const dateEnd = new Date(`${year}-12-31`);

    // Batch seasons
    const seasonData = leagues.map((l) => ({
      id: cuid(), name: String(year), year, leagueId: l.id,
      startDate: dateStart, endDate: dateEnd,
    }));
    await prisma.season.createMany({ data: seasonData });
    const seasonMap: Record<string, string> = {};
    leagues.forEach((l, i) => { seasonMap[l.id] = seasonData[i].id; });

    // Batch competições
    const eligible = leagues.filter((l) => shouldInclude(l.name, year));
    const compData = eligible.map((l) => ({
      id: cuid(), name: l.name, type: "liga", seasonId: seasonMap[l.id],
      format: "round-robin", numTurns: 2, isSimulated: false,
    }));
    if (compData.length > 0) await prisma.competition.createMany({ data: compData });

    totalS += seasonData.length;
    totalC += compData.length;
    console.log(`${year}: ${seasonData.length} seasons, ${compData.length} comps`);
  }

  console.log(`\nTotal: ${totalS} seasons, ${totalC} competitions`);
}

main()
  .catch((e) => { console.error("Seed falhou:", e); })
  .finally(() => prisma.$disconnect());
