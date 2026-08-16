import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const seasons = await p.season.findMany({
    include: { league: true, competitions: true },
    orderBy: { createdAt: "asc" },
  });
  console.log(`Total de temporadas: ${seasons.length}\n`);
  for (const s of seasons) {
    console.log(`- ${s.name} (${s.year}) | Liga: ${s.league?.name || "NENHUMA"} | Comps: ${s.competitions.length} | Criada: ${s.createdAt.toISOString()}`);
  }
}

main().finally(() => p.$disconnect());