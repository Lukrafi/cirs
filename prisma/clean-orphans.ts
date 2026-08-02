import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const orphanClubs = await prisma.club.findMany({
    where: { countryId: null },
  });

  console.log(`Clubes sem país (órfãos): ${orphanClubs.length}`);
  for (const c of orphanClubs) {
    await prisma.club.delete({ where: { id: c.id } });
    console.log(`  Deletado: ${c.name}`);
  }

  const orphanDivisions = await prisma.division.findMany({
    where: { countryId: null },
  });
  console.log(`Divisões sem país: ${orphanDivisions.length}`);
  for (const d of orphanDivisions) {
    await prisma.division.delete({ where: { id: d.id } });
  }

  const orphanLeagues = await prisma.league.findMany({
    where: { countryId: null, confederationId: null },
  });
  console.log(`Ligas órfãs (sem país nem confed): ${orphanLeagues.length}`);
  for (const l of orphanLeagues) {
    await prisma.league.delete({ where: { id: l.id } });
  }

  console.log("Limpeza concluída.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });