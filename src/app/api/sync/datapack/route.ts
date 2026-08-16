import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { LEAGUE_DATAPACKS, Datapack } from "@/lib/datapacks";
import { createSyncLog } from "@/lib/syncService";
import { getDataSource, ExternalCompetition } from "@/lib/dataSources";
import fs from "fs";
import path from "path";

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

export async function POST(req: NextRequest) {
  const adminUser = await getUserSession();
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const datapackId = body.datapackId as string;

  if (!datapackId) {
    return NextResponse.json({ error: "datapackId e obrigatorio" }, { status: 400 });
  }

  const dp = LEAGUE_DATAPACKS.find((d) => d.id === datapackId);
  if (!dp) {
    return NextResponse.json({ error: "Datapack nao encontrado" }, { status: 404 });
  }

  const start = Date.now();
  let clubsCreated = 0;
  let clubsUpdated = 0;
  let competitionsCreated = 0;
  let emblemsDownloaded = 0;
  let flagsDownloaded = 0;
  const errors: string[] = [];

  try {
    let country = await prisma.country.findFirst({
      where: { OR: [{ name: dp.country }, { code: dp.countryCode }] },
    });
    if (!country) {
      country = await prisma.country.create({ data: { name: dp.country, code: dp.countryCode, flag: "" } });
    }

    let confederation = await prisma.confederation.findFirst({
      where: { code: dp.confederation },
    });
    if (!confederation) {
      confederation = await prisma.confederation.create({ data: { name: dp.confederation, code: dp.confederation, logo: "" } });
    }

    if (!country.confederationId) {
      await prisma.country.update({ where: { id: country.id }, data: { confederationId: confederation.id } });
    }

    let league = await prisma.league.findFirst({
      where: { name: { contains: dp.shortName } },
    });
    if (!league) {
      league = await prisma.league.create({
        data: {
          name: dp.shortName,
          logo: "",
          countryId: country.id,
          confederationId: confederation.id,
          isInternational: false,
        },
      });
    } else {
      const u: { countryId?: string; confederationId?: string } = {};
      if (!league.countryId) u.countryId = country.id;
      if (!league.confederationId) u.confederationId = confederation.id;
      if (Object.keys(u).length > 0) await prisma.league.update({ where: { id: league.id }, data: u });
    }

    let competition = await prisma.competition.findFirst({
      where: { name: { contains: dp.name }, seasonId: null },
    });
    if (!competition) {
      competition = await prisma.competition.create({
        data: {
          name: dp.name,
          type: "liga",
          seasonId: null,
          numTeams: dp.numTeams,
          numTurns: 2,
          format: dp.format,
          promoted: dp.promoted,
          relegated: dp.relegated,
          sourceUrl: dp.wikiUrl,
          lastSyncAt: new Date(),
        },
      });
      competitionsCreated++;
    } else {
      await prisma.competition.update({
        where: { id: competition.id },
        data: { numTeams: dp.numTeams, format: dp.format, promoted: dp.promoted, relegated: dp.relegated, sourceUrl: dp.wikiUrl, lastSyncAt: new Date() },
      });
    }

    let group = await prisma.group.findFirst({ where: { competitionId: competition.id } });
    if (!group) {
      group = await prisma.group.create({ data: { name: "Grupo Unico", competitionId: competition.id } });
    }

    const wikiSource = getDataSource("wikipedia");
    let extComp: ExternalCompetition | null = null;
    try {
      extComp = await wikiSource.fetchCompetitionDataByUrl(dp.wikiUrl);
    } catch { /* */ }

    if (extComp && extComp.clubs && extComp.clubs.length > 0) {
      let division = await prisma.division.findFirst({ where: { countryId: country.id, level: 1 } });
      if (!division) {
        division = await prisma.division.create({
          data: { name: `${country.name} Division 1`, countryId: country.id, level: 1 },
        });
      }

      for (const extClub of extComp.clubs) {
        try {
          const existing = await prisma.club.findFirst({ where: { name: { equals: extClub.name } } });
          let club;
          if (!existing) {
            club = await prisma.club.create({
              data: {
                name: extClub.name,
                shortName: extClub.shortName || "",
                city: extClub.city || "",
                countryId: country.id,
                divisionId: division.id,
                founded: extClub.founded || "",
                strength: 5.0,
              },
            });
            clubsCreated++;
          } else {
            club = existing;
            const fix: { countryId?: string; divisionId?: string } = {};
            if (!club.countryId) fix.countryId = country.id;
            if (!club.divisionId) fix.divisionId = division.id;
            if (Object.keys(fix).length > 0) {
              await prisma.club.update({ where: { id: club.id }, data: fix });
            }
            clubsUpdated++;
          }

          const standing = await prisma.standing.findFirst({
            where: { groupId: group.id, clubId: club.id },
          });
          if (!standing) {
            await prisma.standing.create({ data: { groupId: group.id, clubId: club.id, position: 0 } });
          }

          const wdSource = getDataSource("wikidata");
          const img = await wdSource.fetchEmblem(club.name, country.name);
          if (img) {
            const safe = sanitizeFilename(club.name);
            const localPath = await downloadImage(img.url, safe, "escudos");
            if (localPath) {
              await prisma.club.update({ where: { id: club.id }, data: { emblem: localPath } });
              emblemsDownloaded++;
            }
          }
        } catch (e) {
          errors.push(`Club [${extClub.name}]: ${e instanceof Error ? e.message : String(e)}`);
        }
      }
    }

    const wSource = getDataSource("wikidata");
    const flagImg = await wSource.fetchFlag(dp.countryCode);
    if (flagImg) {
      const localPath = await downloadImage(flagImg.url, dp.countryCode, "bandeiras");
      if (localPath) {
        await prisma.country.update({ where: { id: country.id }, data: { flag: localPath } });
        flagsDownloaded++;
      }
    }

    const result = {
      source: "datapack",
      clubsCreated,
      clubsUpdated,
      competitionsCreated,
      competitionsUpdated: 0,
      flagsDownloaded,
      emblemsDownloaded,
      stadiumsUpdated: 0,
      elapsedMs: Date.now() - start,
      errors,
    };

    await createSyncLog({
      ...result,
      level: "datapack",
      adminUsername: adminUser.username,
      entity: dp.name,
    });

    return NextResponse.json(result);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json({ error: msg, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, emblemsDownloaded: 0, flagsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors: [msg] }, { status: 500 });
  }
}