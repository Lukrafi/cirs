import { prisma } from "./prisma";
import { getDataSource, DataSource } from "./dataSources";

export type SyncResult = {
  source: string;
  clubsCreated: number;
  clubsUpdated: number;
  competitionsCreated: number;
  competitionsUpdated: number;
  flagsUpdated: number;
  emblemsUpdated: number;
  stadiumsUpdated: number;
  errors: string[];
};

export async function syncCompetition(
  competitionId: string,
  dataSourceName?: string
): Promise<SyncResult> {
  const result: SyncResult = {
    source: dataSourceName || "mock",
    clubsCreated: 0,
    clubsUpdated: 0,
    competitionsCreated: 0,
    competitionsUpdated: 0,
    flagsUpdated: 0,
    emblemsUpdated: 0,
    stadiumsUpdated: 0,
    errors: [],
  };

  const source: DataSource = getDataSource(dataSourceName);

  const competition = await prisma.competition.findUnique({
    where: { id: competitionId },
    include: {
      season: { include: { league: true } },
      groups: { include: { standings: true } },
    },
  });

  if (!competition) {
    result.errors.push("Competicao nao encontrada");
    return result;
  }

  const league = competition.season?.league;
  const country = league?.countryId
    ? await prisma.country.findUnique({ where: { id: league.countryId } })
    : null;

  try {
    if (country) {
      try {
        const flagUrl = await source.fetchFlag(country.code);
        if (flagUrl) {
          await prisma.country.update({
            where: { id: country.id },
            data: { flag: flagUrl },
          });
          result.flagsUpdated++;
        }
      } catch {
        result.errors.push("Erro ao buscar bandeira para " + country.name);
      }
    }

    const clubs = competition.groups.flatMap((g) =>
      g.standings.map((s) => s.clubId).filter(Boolean)
    ) as string[];

    for (const clubId of [...new Set(clubs)]) {
      try {
        const club = await prisma.club.findUnique({ where: { id: clubId } });
        if (!club) continue;

        try {
          const emblemUrl = await source.fetchEmblem(club.name);
          if (emblemUrl) {
            await prisma.club.update({
              where: { id: club.id },
              data: { emblem: emblemUrl },
            });
            result.emblemsUpdated++;
          }
        } catch {
          // ignora erro de fetchEmblem
        }
      } catch (e: any) {
        result.errors.push("Erro ao sincronizar clube " + clubId + ": " + e.message);
      }
    }

    if (league) {
      try {
        const compData = await source.fetchCompetitionData(league.name);
        if (compData.numTeams > 0) {
          await prisma.competition.update({
            where: { id: competition.id },
            data: {
              numTeams: compData.numTeams,
              numTurns: compData.numRounds > 0 ? Math.ceil(compData.numRounds / compData.numTeams) : 2,
              promoted: compData.promoted,
              relegated: compData.relegated,
              format: compData.format,
              isKnockout: compData.isKnockout,
            },
          });
          result.competitionsUpdated++;
        }
      } catch (e: any) {
        result.errors.push("Erro ao buscar formato da competicao: " + e.message);
      }
    }
  } catch (e: any) {
    result.errors.push("Erro geral: " + e.message);
  }

  return result;
}

export async function syncAllCompetitions(
  dataSourceName?: string
): Promise<SyncResult> {
  const competitions = await prisma.competition.findMany({
    include: {
      season: { include: { league: true } },
      groups: { include: { standings: true } },
    },
  });

  const totalResult: SyncResult = {
    source: dataSourceName || "mock",
    clubsCreated: 0,
    clubsUpdated: 0,
    competitionsCreated: 0,
    competitionsUpdated: 0,
    flagsUpdated: 0,
    emblemsUpdated: 0,
    stadiumsUpdated: 0,
    errors: [],
  };

  for (const comp of competitions) {
    const r = await syncCompetition(comp.id, dataSourceName);
    totalResult.clubsCreated += r.clubsCreated;
    totalResult.clubsUpdated += r.clubsUpdated;
    totalResult.competitionsCreated += r.competitionsCreated;
    totalResult.competitionsUpdated += r.competitionsUpdated;
    totalResult.flagsUpdated += r.flagsUpdated;
    totalResult.emblemsUpdated += r.emblemsUpdated;
    totalResult.stadiumsUpdated += r.stadiumsUpdated;
    totalResult.errors.push(...r.errors);
  }

  return totalResult;
}