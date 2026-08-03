import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const before = await p.season.count();
  console.log(`Temporadas antes: ${before}`);

  const deleted = await p.season.deleteMany({
    where: {
      OR: [
        { leagueId: null },
        { competitions: { none: {} } },
      ],
    },
  });
  console.log(`Temporadas vazias removidas: ${deleted.count}`);

  const after = await p.season.count();
  console.log(`Temporadas restantes: ${after}`);
}

main().finally(() => p.$disconnect());