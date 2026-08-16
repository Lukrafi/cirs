import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import SeasonHubTabs, { type SeasonHubData } from "@/components/SeasonHubTabs";

export const dynamic = "force-dynamic";

export default async function SeasonHubPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      league: true,
      competitions: {
        include: {
          groups: {
            include: {
              standings: { include: { club: true } },
              matches: {
                include: { homeTeam: true, awayTeam: true },
                orderBy: { matchDate: "asc" },
              },
            },
          },
        },
      },
    },
  });

  if (!season) notFound();

  const allComps = season.competitions;
  const totalMatches = allComps.reduce(
    (sum, c) => sum + c.groups.reduce((s, g) => s + g.matches.length, 0),
    0
  );
  const finishedMatches = allComps.reduce(
    (sum, c) =>
      sum +
      c.groups.reduce(
        (s, g) => s + g.matches.filter((m) => m.status === "finished").length,
        0
      ),
    0
  );
  const scheduledMatches = totalMatches - finishedMatches;
  const pct = totalMatches > 0 ? Math.round((finishedMatches / totalMatches) * 100) : 0;

  const allMatchIds = allComps.flatMap((c) => c.groups.flatMap((g) => g.matches.map((m) => m.id)));

  const matchStats = allMatchIds.length
    ? await prisma.matchStat.groupBy({
        by: ["playerId"],
        where: { matchId: { in: allMatchIds } },
        _sum: { goals: true, assists: true, rating: true },
        _count: { _all: true },
        orderBy: [{ _sum: { goals: "desc" } }],
        take: 30,
      })
    : [];

  const playerIds = matchStats
    .map((s) => s.playerId)
    .filter((id): id is string => id !== null);

  const players = playerIds.length
    ? await prisma.player.findMany({
        where: { id: { in: playerIds } },
        include: { club: true },
      })
    : [];

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const scorers = matchStats
    .filter((s) => s.playerId !== null)
    .map((s) => {
      const player = playerMap.get(s.playerId as string);
      return {
        playerId: s.playerId,
        playerName: player?.name || "—",
        clubName: player?.club?.name || "Sem clube",
        clubEmblem: player?.club?.emblem || "",
        goals: s._sum.goals || 0,
        assists: s._sum.assists || 0,
        rating: s._sum.rating && s._count._all ? (s._sum.rating / s._count._all) : 0,
      };
    });

  const bestScorer = scorers.length > 0 ? scorers[0].playerName : "—";
  const totalGoals = scorers.reduce((sum, s) => sum + s.goals, 0);
  const ratingSum = scorers.reduce((sum, s) => sum + s.rating, 0);
  const ratingCount = scorers.filter((s) => s.rating > 0).length;
  const avgRating = ratingCount > 0 ? ratingSum / ratingCount : 0;

  const primaryCompetition = allComps[0];

  const hubData: SeasonHubData | null = primaryCompetition
    ? {
        competitionName: primaryCompetition.name,
        competitionLogo: primaryCompetition.logo || "",
        groups: primaryCompetition.groups.map((g) => ({
          id: g.id,
          name: g.name,
          standings: g.standings
            .map((s) => ({
              clubId: s.clubId,
              clubName: s.club?.name || "—",
              clubEmblem: s.club?.emblem || "",
              played: s.played,
              wins: s.wins,
              draws: s.draws,
              losses: s.losses,
              goalsFor: s.goalsFor,
              goalsAgainst: s.goalsAgainst,
              goalsDiff: s.goalsDiff,
              points: s.points,
            }))
            .sort((a, b) => {
              if (b.points !== a.points) return b.points - a.points;
              if (b.wins !== a.wins) return b.wins - a.wins;
              if (b.goalsDiff !== a.goalsDiff) return b.goalsDiff - a.goalsDiff;
              return b.goalsFor - a.goalsFor;
            }),
          matches: g.matches.map((m) => ({
            id: m.id,
            status: m.status,
            round: m.round,
            matchDate: m.matchDate ? m.matchDate.toISOString() : null,
            homeName: m.homeTeam?.name || "—",
            awayName: m.awayTeam?.name || "—",
            homeEmblem: m.homeTeam?.emblem || "",
            awayEmblem: m.awayTeam?.emblem || "",
            homeScore: m.homeScore,
            awayScore: m.awayScore,
            isSimulated: m.isSimulated,
          })),
        })),
        topScorers: scorers,
        totals: {
          matches: totalMatches,
          finished: finishedMatches,
          scheduled: scheduledMatches,
          goals: totalGoals,
          avgRating,
          bestScorer,
        },
        liveFeedUrl: primaryCompetition ? `/api/live?competitionId=${primaryCompetition.id}` : null,
      }
    : null;

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/temporadas" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para Temporadas
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-4">
            {hubData?.competitionLogo && (
              <img
                src={hubData.competitionLogo}
                alt=""
                className="w-16 h-16 rounded-xl object-contain"
              />
            )}
            <div>
              <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">
                Hub de Temporada
              </div>
              <h1 className="text-4xl sm:text-5xl font-black">{season.year}</h1>
              <p className="text-muted mt-1">
                {season.league?.name || "Múltiplas competições"} • {allComps.length} competições
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <KpiCard label="Disputadas" value={finishedMatches} />
            <KpiCard label="Restantes" value={scheduledMatches} />
            <KpiCard label="Gols" value={totalGoals} />
            <KpiCard label="Conclusão" value={`${pct}%`} />
          </div>
        </div>

        <div className="w-full bg-blue-deep rounded-full h-2 mt-6">
          <div
            className="bg-gradient-to-r from-gold to-yellow-300 h-2 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {allComps.length > 1 && (
        <div className="glass rounded-2xl p-4 mb-6 flex flex-wrap gap-2 items-center text-sm">
          <span className="text-muted">Competições da temporada:</span>
          {allComps.map((c) => (
            <Link
              key={c.id}
              href={`/campeonatos/${c.id}`}
              className="text-xs px-3 py-1 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
            >
              {c.name}
            </Link>
          ))}
        </div>
      )}

      {hubData ? (
        <SeasonHubTabs data={hubData} />
      ) : (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Esta temporada ainda não tem competições cadastradas.</p>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold gold-text">{value}</div>
      <div className="text-xs text-muted uppercase">{label}</div>
    </div>
  );
}
