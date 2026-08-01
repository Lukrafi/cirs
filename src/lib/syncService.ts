import { prisma } from "./prisma";
import { getDataSource, listAvailableSources, ExternalImage } from "./dataSources";
import fs from "fs";
import path from "path";

export interface SyncResult {
  source: string;
  clubsCreated: number;
  clubsUpdated: number;
  competitionsCreated: number;
  competitionsUpdated: number;
  flagsDownloaded: number;
  emblemsDownloaded: number;
  stadiumsUpdated: number;
  errors: string[];
  elapsedMs: number;
}

const PUBLIC_DIR = path.join(process.cwd(), "public");
const CACHE_FILE = path.join(process.cwd(), "_cache", "sync-cache.json");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function loadCache(): Record<string, string> {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      return JSON.parse(fs.readFileSync(CACHE_FILE, "utf-8"));
    }
  } catch { /* */ }
  return {};
}

function saveCache(cache: Record<string, string>) {
  ensureDir(path.dirname(CACHE_FILE));
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
}

function sanitizeFilename(name: string): string {
  return name
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-zA-Z0-9_-]/g, "_")
    .substring(0, 80)
    .toLowerCase();
}

async function downloadImage(
  imageUrl: string,
  filename: string,
  subdir: string
): Promise<string | null> {
  const cache = loadCache();
  const cacheKey = `${subdir}/${filename}`;
  if (cache[cacheKey]) {
    return cache[cacheKey];
  }

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

    const relativePath = `/${subdir}/${filename}.${ext}`;
    cache[cacheKey] = relativePath;
    saveCache(cache);
    return relativePath;
  } catch {
    return null;
  }
}

export async function syncFlags(sourceName?: string): Promise<SyncResult> {
  const start = Date.now();
  const source = getDataSource(sourceName);
  const result: SyncResult = makeResult(sourceName || "wikidata");

  const countries = await prisma.country.findMany();
  for (const c of countries) {
    try {
      const img = await source.fetchFlag(c.code);
      if (!img) continue;

      const localPath = await downloadImage(img.url, c.code, "bandeiras");
      if (localPath) {
        await prisma.country.update({
          where: { id: c.id },
          data: { flag: localPath },
        });
        result.flagsDownloaded++;
      }
    } catch (e: any) {
      result.errors.push(`Flag [${c.code}]: ${e.message}`);
    }
  }

  result.elapsedMs = Date.now() - start;
  return result;
}

export async function syncEmblems(confederationCode?: string): Promise<SyncResult> {
  const start = Date.now();
  const source = getDataSource();
  const result = makeResult("wikidata");

  const where: any = {};
  if (confederationCode) {
    where.country = { confederation: { code: confederationCode } };
  }

  const clubs = await prisma.club.findMany({
    where,
    include: { country: true },
    take: confederationCode ? 9999 : 500,
  });

  for (const club of clubs) {
    try {
      const img = await source.fetchEmblem(club.name, club.country?.name);
      if (!img) continue;

      const safe = sanitizeFilename(club.name);
      const localPath = await downloadImage(img.url, safe, "escudos");
      if (localPath) {
        await prisma.club.update({
          where: { id: club.id },
          data: { emblem: localPath },
        });
        result.emblemsDownloaded++;
      }
    } catch (e: any) {
      result.errors.push(`Emblem [${club.name}]: ${e.message}`);
    }
  }

  result.elapsedMs = Date.now() - start;
  return result;
}

export async function syncStadiums(): Promise<SyncResult> {
  const start = Date.now();
  const source = getDataSource("thesportsdb");
  const result = makeResult("thesportsdb");

  const clubs = await prisma.club.findMany({
    where: { stadiumRel: null },
    take: 200,
    orderBy: { strength: "desc" },
  });

  for (const club of clubs) {
    try {
      const ext = await source.fetchStadium(club.name);
      if (!ext) continue;

      const existing = await prisma.stadium.findFirst({
        where: { name: ext.name },
      });
      if (existing) {
        await prisma.club.update({
          where: { id: club.id },
          data: { stadiumRel: { connect: { id: existing.id } } },
        });
      } else {
        await prisma.stadium.create({
          data: {
            name: ext.name,
            city: ext.city || club.city,
            country: club.countryId ? (await prisma.country.findUnique({ where: { id: club.countryId } }))?.name || "" : "",
            capacity: ext.capacity,
            coordinates: ext.coordinates,
            club: { connect: { id: club.id } },
          },
        });
      }
      result.stadiumsUpdated++;
    } catch (e: any) {
      result.errors.push(`Stadium [${club.name}]: ${e.message}`);
    }
  }

  result.elapsedMs = Date.now() - start;
  return result;
}

export async function syncCompetition(competitionId: string, sourceName?: string): Promise<SyncResult> {
  const start = Date.now();
  const source = getDataSource(sourceName);
  const result = makeResult(sourceName || source.name);

  const comp = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      season: { include: { league: true } },
      groups: { include: { standings: true } },
    },
  });

  if (!comp) {
    result.errors.push("Competição não encontrada");
    result.elapsedMs = Date.now() - start;
    return result;
  }

  const league = comp.season?.league;

  try {
    if (league) {
      let extComp = null;
      if (comp.sourceUrl) {
        extComp = await source.fetchCompetitionDataByUrl(comp.sourceUrl);
      }
      if (!extComp) {
        extComp = await source.fetchCompetitionData(league.name);
      }
      if (extComp && extComp.numTeams > 0) {
        await prisma.competition.update({
          where: { id: comp.id },
          data: {
            numTeams: extComp.numTeams,
            numTurns: extComp.numRounds > 0 ? Math.ceil(extComp.numRounds / extComp.numTeams) : comp.numTurns,
            promoted: extComp.promoted,
            relegated: extComp.relegated,
            format: extComp.format,
            isKnockout: extComp.isKnockout,
            continentalSpots: extComp.continentalSpots,
            lastSyncAt: new Date(),
          },
        });
        result.competitionsUpdated++;
      }
    }

    const clubIds = comp.groups.flatMap((g) => g.standings.map((s) => s.clubId).filter(Boolean)) as string[];
    const uniqueIds = [...new Set(clubIds)];

    for (const clubId of uniqueIds) {
      try {
        const club = await prisma.club.findUnique({
          where: { id: clubId },
          include: { country: true },
        });
        if (!club) continue;

        const img = await source.fetchEmblem(club.name, club.country?.name);
        if (img) {
          const safe = sanitizeFilename(club.name);
          const localPath = await downloadImage(img.url, safe, "escudos");
          if (localPath) {
            await prisma.club.update({
              where: { id: club.id },
              data: { emblem: localPath },
            });
            result.emblemsDownloaded++;
          }
        }
      } catch (e: any) {
        result.errors.push(`Club sync [${clubId}]: ${e.message}`);
      }
    }
  } catch (e: any) {
    result.errors.push(`Sync error: ${e.message}`);
  }

  result.elapsedMs = Date.now() - start;
  return result;
}

export async function syncConfederation(confederationId: string, sourceName?: string): Promise<SyncResult> {
  const start = Date.now();
  const result = makeResult(sourceName || "wikidata");

  const confed = await prisma.confederation.findUnique({
    where: { id: confederationId },
    include: {
      countries: true,
    },
  });

  if (!confed) {
    result.errors.push("Confederação não encontrada");
    result.elapsedMs = Date.now() - start;
    return result;
  }

  for (const country of confed.countries) {
    try {
      const img = await getDataSource(sourceName).fetchFlag(country.code);
      if (img) {
        const localPath = await downloadImage(img.url, `flag-${country.code}`, "bandeiras");
        if (localPath) {
          await prisma.country.update({
            where: { id: country.id },
            data: { flag: localPath },
          });
          result.flagsDownloaded++;
        }
      }
    } catch (e: any) {
      result.errors.push(`[${country.name}]: ${e.message}`);
    }
  }

  const emblemsResult = await syncEmblems(undefined);
  result.emblemsDownloaded += emblemsResult.emblemsDownloaded;
  result.errors.push(...emblemsResult.errors);

  result.elapsedMs = Date.now() - start;
  return result;
}

export async function syncWorld(sourceName?: string): Promise<SyncResult> {
  const start = Date.now();
  const result = makeResult(sourceName || "wikidata");

  const flagsResult = await syncFlags(sourceName);
  result.flagsDownloaded += flagsResult.flagsDownloaded;
  result.errors.push(...flagsResult.errors);

  const emblemsResult = await syncEmblems();
  result.emblemsDownloaded += emblemsResult.emblemsDownloaded;
  result.errors.push(...emblemsResult.errors);

  const stadiumsResult = await syncStadiums();
  result.stadiumsUpdated += stadiumsResult.stadiumsUpdated;
  result.errors.push(...stadiumsResult.errors);

  const competitions = await prisma.competition.findMany({ select: { id: true } });
  for (const ccom of competitions) {
    const compc = await syncCompetition(ccom.id, sourceName);
    result.competitionsUpdated += compc.competitionsUpdated;
    result.errors.push(...compc.errors);
  }

  result.elapsedMs = Date.now() - start;
  return result;
}

export async function syncByLink(url: string, sourceName?: string): Promise<SyncResult> {
  const start = Date.now();
  const source = getDataSource(sourceName);
  const result = makeResult(sourceName || source.name);

  try {
    const extComp = await source.fetchCompetitionDataByUrl(url);
    if (!extComp) {
      result.errors.push("Não foi possível identificar a competição pela URL");
      result.elapsedMs = Date.now() - start;
      return result;
    }

    const existingLeague = await prisma.league.findFirst({
      where: { name: { contains: extComp.name } },
    });

    if (existingLeague) {
      const season = await prisma.season.findFirst({
        where: { leagueId: existingLeague.id },
        orderBy: { year: "desc" },
      });

      if (season) {
        const comp = await prisma.competition.findFirst({
          where: { seasonId: season.id },
          orderBy: { createdAt: "desc" },
        });
        if (comp) {
          await prisma.competition.update({
            where: { id: comp.id },
            data: {
              numTeams: extComp.numTeams,
              format: extComp.format,
              promoted: extComp.promoted,
              relegated: extComp.relegated,
              continentalSpots: extComp.continentalSpots,
              sourceUrl: url,
              lastSyncAt: new Date(),
            },
          });
          result.competitionsUpdated++;
        }
      }
    }
  } catch (e: any) {
    result.errors.push(`Erro na sincronização por link: ${e.message}`);
  }

  result.elapsedMs = Date.now() - start;
  return result;
}

export async function createSyncLog(
  data: Omit<SyncResult, "errors"> & { adminUsername: string; level: string; entity: string; entityId?: string; errors: string[] }
) {
  await prisma.syncLog.create({
    data: {
      level: data.level,
      sourceName: data.source,
      adminUsername: data.adminUsername,
      entity: data.entity,
      entityId: data.entityId,
      clubsCreated: data.clubsCreated,
      clubsUpdated: data.clubsUpdated,
      competitionsCreated: data.competitionsCreated,
      competitionsUpdated: data.competitionsUpdated,
      flagsDownloaded: data.flagsDownloaded,
      emblemsDownloaded: data.emblemsDownloaded,
      stadiumsUpdated: data.stadiumsUpdated,
      errors: JSON.stringify(data.errors),
      elapsedMs: data.elapsedMs,
    },
  });
}

function makeResult(source: string): SyncResult {
  return {
    source,
    clubsCreated: 0,
    clubsUpdated: 0,
    competitionsCreated: 0,
    competitionsUpdated: 0,
    flagsDownloaded: 0,
    emblemsDownloaded: 0,
    stadiumsUpdated: 0,
    errors: [],
    elapsedMs: 0,
  };
}