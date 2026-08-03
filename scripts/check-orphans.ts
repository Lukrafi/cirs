import { PrismaClient } from "@prisma/client";

const p = new PrismaClient();

async function main() {
  const [noCountry, noDivision, total] = await Promise.all([
    p.$queryRawUnsafe<[{ total: number }]>(`SELECT COUNT(*) as total FROM Club WHERE countryId IS NULL`),
    p.$queryRawUnsafe<[{ total: number }]>(`SELECT COUNT(*) as total FROM Club WHERE divisionId IS NULL`),
    p.$queryRawUnsafe<[{ total: number }]>(`SELECT COUNT(*) as total FROM Club`),
  ]);

  console.log("=== Resumo de Clubes ===");
  console.log(`Total de clubes no banco: ${total[0].total}`);
  console.log(`Sem pais (countryId IS NULL): ${noCountry[0].total}`);
  console.log(`Sem divisao (divisionId IS NULL): ${noDivision[0].total}`);
  console.log("");

  const orphans = await p.$queryRawUnsafe<{ id: string; name: string; countryId: string | null; divisionId: string | null }[]>(
    `SELECT id, name, countryId, divisionId FROM Club WHERE countryId IS NULL OR divisionId IS NULL ORDER BY name`
  );

  if (orphans.length === 0) {
    console.log("Nenhum clube orfao encontrado!");
  } else {
    console.log(`Clubes orfaos (${orphans.length}):`);
    console.log("---");
    for (const club of orphans) {
      const issues: string[] = [];
      if (!club.countryId) issues.push("sem pais");
      if (!club.divisionId) issues.push("sem divisao");
      console.log(`  ${club.name.padEnd(40)} (${issues.join(", ")})`);
    }
  }
}

main().finally(() => p.$disconnect());