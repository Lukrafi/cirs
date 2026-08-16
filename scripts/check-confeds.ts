import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();

async function main() {
  const confeds = await p.confederation.findMany({
    include: { countries: { include: { clubs: true } } },
  });
  for (const c of confeds) {
    const total = c.countries.reduce((s, co) => s + co.clubs.length, 0);
    const withClubs = c.countries.filter((co) => co.clubs.length > 0).length;
    console.log(`${c.code}: ${total} clubes em ${withClubs} paises (de ${c.countries.length} paises)`);
  }
}

main().finally(() => p.$disconnect());