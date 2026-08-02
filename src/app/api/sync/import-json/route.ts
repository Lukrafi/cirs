import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getDataSource } from "@/lib/dataSources";
import { createSyncLog } from "@/lib/syncService";
import conmebolData from "@/lib/conmebol-data.json";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

interface JsonCountry {
  name: string;
  code: string;
  competitions: JsonCompetition[];
}

interface JsonCompetition {
  name: string;
  type: string;
  division?: number;
  teams?: string[];
}

const COUNTRIES: JsonCountry[] = conmebolData.countries as JsonCountry[];
const CONFED_CODE: string = conmebolData.confederation;
const SEASON_YEAR: number = conmebolData.season || new Date().getFullYear();

export async function POST(_req: NextRequest) {
  const perms = await getPermissions();
  if (!perms.canSyncData) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const start = Date.now();
  let clubsCreated = 0;
  let clubsUpdated = 0;
  let competitionsCreated = 0;
  let competitionsUpdated = 0;
  let flagsDownloaded = 0;
  let emblemsDownloaded = 0;
  const errors: string[] = [];

  try {
    const flagSource = getDataSource("wikidata");

    let confederation = await prisma.confederation.findFirst({ where: { code: CONFED_CODE } });
    if (!confederation) {
      confederation = await prisma.confederation.create({
        data: { name: CONFED_CODE, code: CONFED_CODE, logo: "" },
      });
    }

    for (const cData of COUNTRIES) {
      try {
        let country = await prisma.country.findFirst({
          where: { OR: [{ name: cData.name }, { code: cData.code }] },
        });
        if (!country) {
          country = await prisma.country.create({
            data: { name: cData.name, code: cData.code, flag: "", confederationId: confederation.id },
          });
        } else if (!country.confederationId) {
          await prisma.country.update({
            where: { id: country.id },
            data: { confederationId: confederation.id },
          });
        }

        if (!country.flag) {
          const flagImg = await flagSource.fetchFlag(cData.code);
          if (flagImg) {
            const localPath = await downloadImage(flagImg.url, cData.code, "bandeiras");
            if (localPath) {
              await prisma.country.update({ where: { id: country.id }, data: { flag: localPath } });
              flagsDownloaded++;
            }
          }
        }

        const divisionCache: Record<number, string> = {};

        for (const compData of cData.competitions) {
          try {
            let divisionId: string | null = null;
            if (compData.division) {
              const divLevel = compData.division;
              if (!divisionCache[divLevel]) {
                let division = await prisma.division.findFirst({
                  where: { name: `Division ${divLevel}`, countryId: country.id },
                });
                if (!division) {
                  division = await prisma.division.create({
                    data: { name: `Division ${divLevel}`, countryId: country.id, level: divLevel },
                  });
                }
                divisionCache[divLevel] = division.id;
              }
              divisionId = divisionCache[divLevel];
            }

            let league = await prisma.league.findFirst({
              where: { name: compData.name },
            });
            if (!league) {
              league = await prisma.league.create({
                data: {
                  name: compData.name,
                  logo: "",
                  countryId: country.id,
                  confederationId: confederation.id,
                  divisionId: divisionId || null,
                  isInternational: false,
                },
              });
            } else {
              const u: any = {};
              if (!league.countryId) u.countryId = country.id;
              if (!league.confederationId) u.confederationId = confederation.id;
              if (!league.divisionId && divisionId) u.divisionId = divisionId;
              if (Object.keys(u).length > 0) {
                await prisma.league.update({ where: { id: league.id }, data: u });
              }
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
            const isKnockoutType = compData.type === "copa" || compData.type === "supercopa";
            const numTeams = compData.teams?.length || 0;

            if (!competition) {
              competition = await prisma.competition.create({
                data: {
                  name: compData.name,
                  type: compData.type,
                  seasonId: season.id,
                  numTeams,
                  numTurns: isKnockoutType ? 1 : 2,
                  format: isKnockoutType ? "knockout" : "round-robin",
                  isKnockout: isKnockoutType,
                },
              });
              competitionsCreated++;
            } else {
              await prisma.competition.update({
                where: { id: competition.id },
                data: {
                  numTeams,
                  format: isKnockoutType ? "knockout" : "round-robin",
                  isKnockout: isKnockoutType,
                },
              });
              competitionsUpdated++;
            }

            let group = await prisma.group.findFirst({ where: { competitionId: competition.id } });
            if (!group) {
              group = await prisma.group.create({
                data: {
                  name: isKnockoutType ? "Mata-mata" : "Grupo Unico",
                  competitionId: competition.id,
                },
              });
            }

            if (compData.teams && compData.teams.length > 0) {
              for (let i = 0; i < compData.teams.length; i++) {
                const teamName = compData.teams[i];
                try {
                  let club = await prisma.club.findFirst({
                    where: { name: teamName, countryId: country.id },
                  });
                  if (!club) {
                    club = await prisma.club.findFirst({ where: { name: teamName } });
                  }
                  if (!club) {
                    club = await prisma.club.create({
                      data: {
                        name: teamName,
                        shortName: teamName.split(" ").slice(0, 3).join(" "),
                        city: "",
                        countryId: country.id,
                        divisionId: divisionId || null,
                        founded: "",
                        strength: 5.0,
                      },
                    });
                    clubsCreated++;
                  } else {
                    const u: any = {};
                    if (!club.countryId) u.countryId = country.id;
                    if (!club.divisionId && divisionId) u.divisionId = divisionId;
                    if (Object.keys(u).length > 0) {
                      await prisma.club.update({ where: { id: club.id }, data: u });
                      clubsUpdated++;
                    }
                  }

                  const standing = await prisma.standing.findFirst({
                    where: { groupId: group.id, clubId: club.id },
                  });
                  if (!standing) {
                    await prisma.standing.create({
                      data: { groupId: group.id, clubId: club.id, position: i + 1 },
                    });
                  }

                  if (!club.emblem) {
                    const img = await flagSource.fetchEmblem(teamName, country.name);
                    if (img) {
                      const safe = sanitizeFilename(teamName);
                      const localPath = await downloadImage(img.url, safe, "escudos");
                      if (localPath) {
                        await prisma.club.update({ where: { id: club.id }, data: { emblem: localPath } });
                        emblemsDownloaded++;
                      }
                    }
                  }
                } catch (e: any) {
                  errors.push(`Club [${teamName}]: ${e.message}`);
                }
              }
            }
          } catch (e: any) {
            errors.push(`Competition [${compData.name}]: ${e.message}`);
          }
        }
      } catch (e: any) {
        errors.push(`Country [${cData.name}]: ${e.message}`);
      }
    }

    const result = {
      source: "conmebol-json",
      clubsCreated,
      clubsUpdated,
      competitionsCreated,
      competitionsUpdated,
      flagsDownloaded,
      emblemsDownloaded,
      stadiumsUpdated: 0,
      elapsedMs: Date.now() - start,
      errors,
    };

    await createSyncLog({
      ...result,
      level: "world",
      adminUsername: "admin",
      entity: "CONMEBOL Complete",
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json(
      { error: e.message, clubsCreated, clubsUpdated, competitionsCreated, competitionsUpdated, flagsDownloaded, emblemsDownloaded, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors: [...errors, e.message] },
      { status: 500 }
    );
  }
}

const PUBLIC_DIR = path.join(process.cwd(), "public");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFilename(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 80).toLowerCase();
}

async function downloadImage(imageUrl: string, filename: string, subdir: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 500) return null;
    const dir = path.join(PUBLIC_DIR, subdir);
    ensureDir(dir);
    const ext = imageUrl.endsWith(".svg") ? "svg" : "png";
    const filePath = path.join(dir, `${filename}.${ext}`);
    fs.writeFileSync(filePath, buffer);
    return `/${subdir}/${filename}.${ext}`;
  } catch {
    return null;
  }
}
