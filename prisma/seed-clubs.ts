import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

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

const worldData = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), "src", "lib", "world-data.json"), "utf-8")
) as { confederations: JsonConfederation[]; season: number };

const SEASON_YEAR: number = worldData.season || new Date().getFullYear();

async function main() {
  console.log("=== SEED DE CLUBES CIRS ===");
  console.log(`Ano: ${SEASON_YEAR}`);
  console.log(`Confederacoes: ${worldData.confederations.length}`);

  let clubsCreated = 0;
  let clubsUpdated = 0;
  let clubsSkipped = 0;
  let leaguesCreated = 0;
  let competitionsCreated = 0;
  let standingsCreated = 0;
  const errors: string[] = [];

  for (const confedData of worldData.confederations) {
    const confed = await prisma.confederation.findFirst({ where: { code: confedData.name } });
    if (!confed) {
      errors.push(`Confederacao ${confedData.name} nao encontrada no banco`);
      continue;
    }

    for (const cData of confedData.countries) {
      const country = await prisma.country.findFirst({
        where: { OR: [{ name: cData.name }, { code: cData.code }] },
      });
      if (!country) {
        errors.push(`Pais ${cData.name} (${cData.code}) nao encontrado`);
        continue;
      }

      for (const compData of cData.competitions) {
        if (compData.type !== "liga") continue;
        if (!compData.teams || compData.teams.length === 0) continue;

        const divLevel = compData.division || 1;
        let division = await prisma.division.findFirst({
          where: { level: divLevel, countryId: country.id },
        });
        if (!division) {
          division = await prisma.division.create({
            data: { name: `${cData.name} Division ${divLevel}`, countryId: country.id, level: divLevel },
          });
        }

        const leagueName = compData.name;
        let league = await prisma.league.findFirst({
          where: {
            OR: [
              { name: leagueName, countryId: country.id, confederationId: confed.id },
              { name: { contains: leagueName }, countryId: country.id, confederationId: confed.id },
              { name: { endsWith: leagueName }, countryId: country.id },
            ],
          },
        });
        if (!league) {
          league = await prisma.league.findFirst({
            where: { name: { contains: leagueName }, confederationId: confed.id },
          });
        }
        if (!league) {
          const existingByName = await prisma.league.findFirst({ where: { name: leagueName } });
          if (!existingByName) {
            league = await prisma.league.create({
              data: {
                name: leagueName,
                logo: "",
                countryId: country.id,
                confederationId: confed.id,
                divisionId: division.id,
                isInternational: false,
                rating: 0,
              },
            });
            leaguesCreated++;
          } else {
            league = existingByName;
            if (!league.divisionId) {
              await prisma.league.update({ where: { id: league.id }, data: { divisionId: division.id, countryId: country.id, confederationId: confed.id } });
            }
          }
        } else if (!league.divisionId) {
          await prisma.league.update({ where: { id: league.id }, data: { divisionId: division.id } });
        }

        let season = await prisma.season.findFirst({
          where: { leagueId: league.id, year: SEASON_YEAR },
        });
        if (!season) {
          season = await prisma.season.create({
            data: {
              name: `${SEASON_YEAR}`,
              year: SEASON_YEAR,
              leagueId: league.id,
              startDate: new Date(`${SEASON_YEAR}-01-01`),
              endDate: new Date(`${SEASON_YEAR}-12-31`),
            },
          });
        }

        let competition = await prisma.competition.findFirst({
          where: { seasonId: season.id, name: compData.name },
        });
        if (!competition) {
          competition = await prisma.competition.create({
            data: {
              name: compData.name,
              type: compData.type,
              seasonId: season.id,
              numTeams: compData.teams.length,
              numTurns: 2,
              format: "round-robin",
              isKnockout: false,
            },
          });
          competitionsCreated++;
        }

        let group = await prisma.group.findFirst({ where: { competitionId: competition.id } });
        if (!group) {
          group = await prisma.group.create({
            data: { name: "Grupo Unico", competitionId: competition.id },
          });
        }

        for (let i = 0; i < compData.teams.length; i++) {
          const teamName = compData.teams[i];
          try {
            let club = await prisma.club.findFirst({
              where: { name: teamName, countryId: country.id },
            });

            if (!club) {
              const orphan = await prisma.club.findFirst({
                where: { name: teamName, countryId: null },
              });
              if (orphan) {
                club = orphan;
                await prisma.club.update({
                  where: { id: club.id },
                  data: { countryId: country.id, divisionId: division.id },
                });
                clubsUpdated++;
              } else {
                const existingOther = await prisma.club.findFirst({
                  where: { name: teamName },
                });
                if (existingOther) {
                  club = existingOther;
                  if (!club.divisionId) {
                    await prisma.club.update({ where: { id: club.id }, data: { divisionId: division.id } });
                  }
                  clubsSkipped++;
                } else {
                  club = await prisma.club.create({
                    data: {
                      name: teamName,
                      shortName: teamName.split(" ").slice(0, 3).join(" "),
                      city: "",
                      countryId: country.id,
                      divisionId: division.id,
                      founded: "",
                      strength: 5.0,
                    },
                  });
                  clubsCreated++;
                }
              }
            } else {
              const u: Record<string, string> = {};
              if (!club.divisionId) u.divisionId = division.id;
              if (!club.countryId) u.countryId = country.id;
              if (Object.keys(u).length > 0) {
                await prisma.club.update({ where: { id: club.id }, data: u });
              }
              clubsSkipped++;
            }

            const exStanding = await prisma.standing.findFirst({
              where: { groupId: group.id, clubId: club.id },
            });
            if (!exStanding) {
              await prisma.standing.create({
                data: { groupId: group.id, clubId: club.id, position: i + 1 },
              });
              standingsCreated++;
            }
          } catch (e: any) {
            errors.push(`Club [${teamName}]: ${e.message}`);
          }
        }
      }
    }
  }

  console.log(`\n=== SEED DE CLUBES CONCLUIDO ===`);
  console.log(`  Clubes criados: ${clubsCreated}`);
  console.log(`  Clubes atualizados (orfãos adotados): ${clubsUpdated}`);
  console.log(`  Clubes já existentes (verificados): ${clubsSkipped}`);
  console.log(`  Ligas criadas: ${leaguesCreated}`);
  console.log(`  Competicoes criadas: ${competitionsCreated}`);
  console.log(`  Standings criados: ${standingsCreated}`);
  console.log(`  Erros: ${errors.length}`);
  if (errors.length > 0) {
    console.log("  Primeiros erros:");
    errors.slice(0, 20).forEach((e) => console.log(`    - ${e}`));
  }

  const totalClubs = await prisma.club.count();
  console.log(`\n  Total de clubes no banco: ${totalClubs}`);
}

main()
  .catch((e) => {
    console.error("ERRO CRITICO:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });