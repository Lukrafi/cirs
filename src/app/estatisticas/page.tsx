import { prisma } from "@/lib/prisma";
import StatsTabs, { type StatsData, type SeasonData } from "@/components/StatsTabs";

export const dynamic = "force-dynamic";

async function buildSeasonData(seasonId: string): Promise<SeasonData | null> {
  const comps = await prisma.competition.findMany({
    where: { seasonId },
    select: { id: true, groups: { select: { id: true, matches: { select: { id: true } } } } },
  });
  const groupIds = comps.flatMap((c) => c.groups.map((g) => g.id));
  const matchIds = comps.flatMap((c) => c.groups.flatMap((g) => g.matches.map((m) => m.id)));

  if (matchIds.length === 0) return null;

  const [
    sMatchCount,
    sGoalsAgg,
    sMatchStatsAgg,
    sRecentMatches,
    sClubsWithStandings,
    sClubStats,
  ] = await Promise.all([
    prisma.match.count({ where: { id: { in: matchIds }, status: "finished" } }),
    prisma.matchStat.aggregate({
      _sum: { goals: true },
      where: { matchId: { in: matchIds } },
    }),
    prisma.matchStat.groupBy({
      by: ["playerId"],
      where: { matchId: { in: matchIds } },
      _sum: {
        goals: true,
        assists: true,
        powerShots: true,
        shots: true,
        tackles: true,
        yellowCards: true,
        redCards: true,
        saves: true,
      },
    }),
    prisma.match.findMany({
      where: { id: { in: matchIds }, status: "finished" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.club.findMany({
      where: {
        standings: {
          some: { groupId: { in: groupIds } },
        },
      },
      include: { standings: true },
    }),
    prisma.matchStat.groupBy({
      by: ["clubId"],
      _sum: { goals: true },
      where: { matchId: { in: matchIds } },
      orderBy: { _sum: { goals: "desc" } },
      take: 10,
    }),
  ]);

  const sClubsList = await prisma.club.findMany({
    where: {
      id: {
        in: sClubStats
          .map((g) => g.clubId)
          .filter((id): id is string => id !== null),
      },
    },
  });
  const sClubMap = new Map(sClubsList.map((c) => [c.id, c]));

  const statCards = [
    { label: "Partidas", value: sMatchCount },
    { label: "Clubes", value: sClubsWithStandings.length },
    {
      label: "Jogadores",
      value: new Set(
        sMatchStatsAgg
          .map((s) => s.playerId)
          .filter((id): id is string => id !== null)
      ).size,
    },
    { label: "Gols Totais", value: sGoalsAgg._sum.goals || 0 },
  ];

  const clubGoals = sClubStats
    .map((g) => ({
      name: g.clubId ? sClubMap.get(g.clubId)?.name || "—" : "—",
      value: g._sum.goals || 0,
    }))
    .filter((g) => g.value > 0);

  const clubPerformance = sClubsWithStandings
    .map((c) => ({
      id: c.id,
      name: c.name,
      wins: c.standings.reduce((sum, s) => sum + s.wins, 0),
      draws: c.standings.reduce((sum, s) => sum + s.draws, 0),
      losses: c.standings.reduce((sum, s) => sum + s.losses, 0),
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5);

  const summary = sMatchStatsAgg.reduce(
    (acc, m) => ({
      goals: acc.goals + (m._sum.goals || 0),
      assists: acc.assists + (m._sum.assists || 0),
      powerShots: acc.powerShots + (m._sum.powerShots || 0),
      shots: acc.shots + (m._sum.shots || 0),
      tackles: acc.tackles + (m._sum.tackles || 0),
      saves: acc.saves + (m._sum.saves || 0),
      yellows: acc.yellows + (m._sum.yellowCards || 0),
      reds: acc.reds + (m._sum.redCards || 0),
    }),
    { goals: 0, assists: 0, powerShots: 0, shots: 0, tackles: 0, saves: 0, yellows: 0, reds: 0 }
  );

  const recentMatches = sRecentMatches.map((m) => ({
    id: m.id,
    homeName: m.homeTeam?.name || "TBD",
    awayName: m.awayTeam?.name || "TBD",
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));

  return { statCards, clubGoals, clubPerformance, summary, recentMatches };
}

export default async function StatisticsPage() {
  const seasons = await prisma.season.findMany({ orderBy: { year: "desc" } });

  // --- Dados HISTÓRIA (tudo) ---
  const [
    histMatchesCount,
    histClubsCount,
    histPlayersCount,
    histGoalsAgg,
    histMatchStatsAgg,
    histRecentMatches,
    histClubsWithStandings,
  ] = await Promise.all([
    prisma.match.count({ where: { status: "finished", isSimulated: false } }),
    prisma.club.count(),
    prisma.player.count(),
    prisma.matchStat.aggregate({ _sum: { goals: true }, where: { match: { isSimulated: false } } }),
    prisma.matchStat.groupBy({
      by: ["playerId"],
      where: { match: { isSimulated: false } },
      _sum: {
        goals: true,
        assists: true,
        powerShots: true,
        shots: true,
        tackles: true,
        yellowCards: true,
        redCards: true,
        saves: true,
      },
    }),
    prisma.match.findMany({
      where: { status: "finished", isSimulated: false },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.club.findMany({ include: { standings: { where: { group: { matches: { every: { isSimulated: false } } } } } } }),
  ]);

  const histClubStats = await prisma.matchStat.groupBy({
    by: ["clubId"],
    _sum: { goals: true },
    where: { match: { isSimulated: false } },
    orderBy: { _sum: { goals: "desc" } },
    take: 10,
  });

  const histClubsList = await prisma.club.findMany({
    where: {
      id: {
        in: histClubStats
          .map((g) => g.clubId)
          .filter((id): id is string => id !== null),
      },
    },
  });

  const histClubMap = new Map(histClubsList.map((c) => [c.id, c]));

  const histClubGoals = histClubStats
    .map((g) => ({
      name: g.clubId ? histClubMap.get(g.clubId)?.name || "—" : "—",
      value: g._sum.goals || 0,
    }))
    .filter((g) => g.value > 0);

  const histClubPerf = histClubsWithStandings
    .map((c) => ({
      id: c.id,
      name: c.name,
      wins: c.standings.reduce((sum, s) => sum + s.wins, 0),
      draws: c.standings.reduce((sum, s) => sum + s.draws, 0),
      losses: c.standings.reduce((sum, s) => sum + s.losses, 0),
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5);

  const histSummary = histMatchStatsAgg.reduce(
    (acc, m) => ({
      goals: acc.goals + (m._sum.goals || 0),
      assists: acc.assists + (m._sum.assists || 0),
      powerShots: acc.powerShots + (m._sum.powerShots || 0),
      shots: acc.shots + (m._sum.shots || 0),
      tackles: acc.tackles + (m._sum.tackles || 0),
      saves: acc.saves + (m._sum.saves || 0),
      yellows: acc.yellows + (m._sum.yellowCards || 0),
      reds: acc.reds + (m._sum.redCards || 0),
    }),
    { goals: 0, assists: 0, powerShots: 0, shots: 0, tackles: 0, saves: 0, yellows: 0, reds: 0 }
  );

  const histStatCards = [
    { label: "Partidas", value: histMatchesCount },
    { label: "Clubes", value: histClubsCount },
    { label: "Jogadores", value: histPlayersCount },
    { label: "Gols Totais", value: histGoalsAgg._sum.goals || 0 },
  ];

  const histRecentMatchesData = histRecentMatches.map((m) => ({
    id: m.id,
    homeName: m.homeTeam?.name || "TBD",
    awayName: m.awayTeam?.name || "TBD",
    homeScore: m.homeScore,
    awayScore: m.awayScore,
  }));

  // --- Dados por temporada (cada temporada computada independentemente) ---
  const seasonResults = await Promise.all(seasons.map((s) => buildSeasonData(s.id)));
  const bySeason: Record<string, SeasonData> = {};
  seasons.forEach((s, i) => {
    const d = seasonResults[i];
    if (d) bySeason[s.id] = d;
  });

  const latestSeasonData = seasons[0] ? bySeason[seasons[0].id] : undefined;

  const statsData: StatsData = {
    seasons: seasons.map((s) => ({ id: s.id, year: s.year })),
    bySeason,
    statCards: {
      season: latestSeasonData?.statCards ?? histStatCards,
      history: histStatCards,
    },
    clubGoals: {
      season: latestSeasonData?.clubGoals ?? histClubGoals,
      history: histClubGoals,
    },
    clubPerformance: {
      season: latestSeasonData?.clubPerformance ?? histClubPerf,
      history: histClubPerf,
    },
    summary: {
      season: latestSeasonData?.summary ?? histSummary,
      history: histSummary,
    },
    recentMatches: {
      season: latestSeasonData?.recentMatches ?? histRecentMatchesData,
      history: histRecentMatchesData,
    },
  };

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Estatísticas</span>
      </h1>
      <p className="text-muted mb-8">
        Dados consolidados da CIRS — alterne entre as temporadas e o histórico completo.
      </p>

      <StatsTabs data={statsData} />
    </div>
  );
}
