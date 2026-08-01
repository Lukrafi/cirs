import { prisma } from "@/lib/prisma";
import StatsTabs, { type StatsData } from "@/components/StatsTabs";

export const dynamic = "force-dynamic";

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
    prisma.match.count({ where: { status: "finished" } }),
    prisma.club.count(),
    prisma.player.count(),
    prisma.matchStat.aggregate({ _sum: { goals: true } }),
    prisma.matchStat.groupBy({
      by: ["playerId"],
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
      where: { status: "finished" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.club.findMany({ include: { standings: true } }),
  ]);

  const histClubStats = await prisma.matchStat.groupBy({
    by: ["clubId"],
    _sum: { goals: true },
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

  // --- Dados TEMPORADA (mais recente) ---
  const latestSeason = seasons[0];

  let seasonStatCards = histStatCards;
  let seasonClubGoals = histClubGoals;
  let seasonClubPerf = histClubPerf;
  let seasonSummary = histSummary;
  let seasonRecentMatches = histRecentMatchesData;

  if (latestSeason) {
    const seasonComps = await prisma.competition.findMany({
      where: { seasonId: latestSeason.id },
      select: { id: true, groups: { select: { id: true, matches: { select: { id: true } } } } },
    });
    const seasonGroupIds = seasonComps.flatMap((c) => c.groups.map((g) => g.id));
    const seasonMatchIds = seasonComps.flatMap((c) =>
      c.groups.flatMap((g) => g.matches.map((m) => m.id))
    );

    if (seasonMatchIds.length > 0) {
      const [
        sMatchCount,
        sGoalsAgg,
        sMatchStatsAgg,
        sRecentMatches,
        sClubsWithStandings,
        sClubStats,
      ] = await Promise.all([
        prisma.match.count({ where: { id: { in: seasonMatchIds }, status: "finished" } }),
        prisma.matchStat.aggregate({
          _sum: { goals: true },
          where: { matchId: { in: seasonMatchIds } },
        }),
        prisma.matchStat.groupBy({
          by: ["playerId"],
          where: { matchId: { in: seasonMatchIds } },
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
          where: { id: { in: seasonMatchIds }, status: "finished" },
          include: { homeTeam: true, awayTeam: true },
          orderBy: { updatedAt: "desc" },
          take: 30,
        }),
        prisma.club.findMany({
          where: {
            standings: {
              some: { groupId: { in: seasonGroupIds } },
            },
          },
          include: { standings: true },
        }),
        prisma.matchStat.groupBy({
          by: ["clubId"],
          _sum: { goals: true },
          where: { matchId: { in: seasonMatchIds } },
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

      seasonClubGoals = sClubStats
        .map((g) => ({
          name: g.clubId ? sClubMap.get(g.clubId)?.name || "—" : "—",
          value: g._sum.goals || 0,
        }))
        .filter((g) => g.value > 0);

      seasonClubPerf = sClubsWithStandings
        .map((c) => ({
          id: c.id,
          name: c.name,
          wins: c.standings.reduce((sum, s) => sum + s.wins, 0),
          draws: c.standings.reduce((sum, s) => sum + s.draws, 0),
          losses: c.standings.reduce((sum, s) => sum + s.losses, 0),
        }))
        .sort((a, b) => b.wins - a.wins)
        .slice(0, 5);

      seasonSummary = sMatchStatsAgg.reduce(
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

      const sClubsCount = sClubsWithStandings.length;
      const sPlayerIds = new Set(
        sMatchStatsAgg
          .map((s) => s.playerId)
          .filter((id): id is string => id !== null)
      );
      const sPlayersCount = sPlayerIds.size;

      seasonStatCards = [
        { label: "Partidas", value: sMatchCount },
        { label: "Clubes", value: sClubsCount },
        { label: "Jogadores", value: sPlayersCount },
        { label: "Gols Totais", value: sGoalsAgg._sum.goals || 0 },
      ];

      seasonRecentMatches = sRecentMatches.map((m) => ({
        id: m.id,
        homeName: m.homeTeam?.name || "TBD",
        awayName: m.awayTeam?.name || "TBD",
        homeScore: m.homeScore,
        awayScore: m.awayScore,
      }));
    }
  }

  const statsData: StatsData = {
    seasons: seasons.map((s) => ({ id: s.id, year: s.year })),
    statCards: { season: seasonStatCards, history: histStatCards },
    clubGoals: { season: seasonClubGoals, history: histClubGoals },
    clubPerformance: { season: seasonClubPerf, history: histClubPerf },
    summary: { season: seasonSummary, history: histSummary },
    recentMatches: { season: seasonRecentMatches, history: histRecentMatchesData },
  };

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Estatísticas</span>
      </h1>
      <p className="text-muted mb-8">
        Dados consolidados da CIRS — alterne entre a visão da temporada atual e o histórico completo.
      </p>

      <StatsTabs data={statsData} />
    </div>
  );
}