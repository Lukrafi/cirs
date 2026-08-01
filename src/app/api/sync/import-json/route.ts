import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getDataSource } from "@/lib/dataSources";
import { createSyncLog } from "@/lib/syncService";
import fs from "fs";
import path from "path";
import { ExternalCompetition } from "@/lib/dataSources";

export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
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
    const dataPath = path.join(process.cwd(), "src", "lib", "conmebol-data.json");
    const raw = fs.readFileSync(dataPath, "utf-8");
    const data = JSON.parse(raw);
    const confedCode: string = data.confederation;
    const seasonYear: number = data.season || new Date().getFullYear();
    const countries: JsonCountry[] = data.countries;

    let confederation = await prisma.confederation.findFirst({ where: { code: confedCode } });
    if (!confederation) {
      confederation = await prisma.confederation.create({ data: { name: confedCode, code: confedCode, logo: "" } });
    }

    for (const cData of countries) {
      try {
        let country = await prisma.country.findFirst({
          where: { OR: [{ name: cData.name }, { code: cData.code }] },
        });
        if (!country) {
          country = await prisma.country.create({ data: { name: cData.name, code: cData.code, flag: "", confederationId: confederation.id } });
        } else if (!country.confederationId) {
          await prisma.country.update({ where: { id: country.id }, data: { confederationId: confederation.id } });
        }

        const flagSource = getDataSource("wikidata");
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

        let division = await prisma.division.findFirst({
          where: { name: "Division 1", countryId: country.id },
        });
        if (!division) {
          division = await prisma.division.create({ data: { name: "Division 1", countryId: country.id, level: 1 } });
        }

        for (const compData of cData.competitions) {
          try {
            let league = await prisma.league.findFirst({
              where: { name: { contains: compData.name } },
            });
            if (!league) {
              league = await prisma.league.create({
                data: {
                  name: compData.name,
                  logo: "",
                  countryId: country.id,
                  confederationId: confederation.id,
                  divisionId: division.id,
                  isInternational: false,
                },
              });
            } else {
              const u: any = {};
              if (!league.countryId) u.countryId = country.id;
              if (!league.confederationId) u.confederationId = confederation.id;
              if (!league.divisionId) u.divisionId = division.id;
              if (Object.keys(u).length > 0) await prisma.league.update({ where: { id: league.id }, data: u });
            }

            let season = await prisma.season.findFirst({
              where: { leagueId: league.id, year: seasonYear },
            });
            if (!season) {
              season = await prisma.season.create({
                data: {
                  name: `${seasonYear}`,
                  year: seasonYear,
                  leagueId: league.id,
                  startDate: new Date(`${seasonYear}-01-01`),
                  endDate: new Date(`${seasonYear}-12-31`),
                },
              });
            }

            let competition = await prisma.competition.findFirst({
              where: { seasonId: season.id, name: { contains: compData.name } },
            });
            if (!competition) {
              competition = await prisma.competition.create({
                data: {
                  name: compData.name,
                  type: compData.type,
                  seasonId: season.id,
                  numTeams: compData.teams ? compData.teams.length : 0,
                  numTurns: 2,
                  format: compData.type === "copa" ? "knockout" : "round-robin",
                  isKnockout: compData.type === "copa",
                },
              });
              competitionsCreated++;
            } else {
              await prisma.competition.update({
                where: { id: competition.id },
                data: {
                  numTeams: compData.teams ? compData.teams.length : 0,
                  format: compData.type === "copa" ? "knockout" : "round-robin",
                  isKnockout: compData.type === "copa",
                },
              });
              competitionsUpdated++;
            }

            let group = await prisma.group.findFirst({ where: { competitionId: competition.id } });
            if (!group) {
              group = await prisma.group.create({
                data: {
                  name: compData.type === "copa" ? "Mata-mata" : "Grupo Unico",
                  competitionId: competition.id,
                },
              });
            }

            if (compData.teams && compData.teams.length > 0) {
              for (const teamName of compData.teams) {
                try {
                  let club = await prisma.club.findFirst({
                    where: { name: { equals: teamName } },
                  });
                  if (!club) {
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
                  } else {
                    clubsUpdated++;
                  }

                  const standing = await prisma.standing.findFirst({
                    where: { groupId: group.id, clubId: club.id },
                  });
                  if (!standing) {
                    await prisma.standing.create({
                      data: { groupId: group.id, clubId: club.id, position: 0 },
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
    return NextResponse.json({ error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, competitionsUpdated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors: [e.message] }, { status: 500 });
  }
}
