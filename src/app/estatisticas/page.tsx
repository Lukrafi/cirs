import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function StatisticsPage() {
  const [matches, clubs, players, totalGoals, matchStats, allMatches, clubsWithStandings, matchStatsAggregated] = await Promise.all([
    prisma.match.count({ where: { status: "finished" } }),
    prisma.club.count(),
    prisma.player.count(),
    prisma.matchStat.aggregate({ _sum: { goals: true } }),
    prisma.matchStat.findMany({
      include: { match: true },
      orderBy: { createdAt: "asc" },
    }),
    prisma.match.findMany({
      where: { status: "finished" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.club.findMany({ include: { standings: true } }),
    prisma.matchStat.groupBy({ by: ["playerId"], _sum: { goals: true, assists: true, powerShots: true, shots: true, tackles: true, yellowCards: true, redCards: true, saves: true } }),
  ]);

  const statCards = [
    { label: "Partidas", value: matches, color: "gold" },
    { label: "Clubes", value: clubs, color: "blue" },
    { label: "Jogadores", value: players, color: "gold" },
    { label: "Gols Totais", value: totalGoals._sum.goals || 0, color: "gold" },
  ];

  const agg = matchStatsAggregated.reduce(
    (acc, m) => ({
      goals: acc.goals + (m._sum.goals || 0),
      assists: acc.assists + (m._sum.assists || 0),
      powerShots: acc.powerShots + (m._sum.powerShots || 0),
      shots: acc.shots + (m._sum.shots || 0),
      tackles: acc.tackles + (m._sum.tackles || 0),
      yellows: acc.yellows + (m._sum.yellowCards || 0),
      reds: acc.reds + (m._sum.redCards || 0),
      saves: acc.saves + (m._sum.saves || 0),
      passes: acc.passes,
    }),
    { goals: 0, assists: 0, powerShots: 0, shots: 0, tackles: 0, yellows: 0, reds: 0, saves: 0, passes: 0 }
  );

  // Gráfico: gols por clube (top 10)
  const clubGoals = await prisma.matchStat.groupBy({
    by: ["clubId"],
    _sum: { goals: true },
    orderBy: { _sum: { goals: "desc" } },
    take: 10,
  });
  const clubsList = await prisma.club.findMany({ where: { id: { in: clubGoals.map((g) => g.clubId).filter((id): id is string => id !== null) } } });
  const clubMap = new Map(clubsList.map((c) => [c.id, c]));
  const maxGoals = Math.max(...clubGoals.map((g) => g._sum.goals || 0), 1);

  // Vitorias/Empates/Derrotas por clube (top 5)
  const clubPerformance = clubsWithStandings
    .map((c) => ({
      id: c.id,
      name: c.name,
      emblem: c.emblem,
      wins: c.standings.reduce((sum, s) => sum + s.wins, 0),
      draws: c.standings.reduce((sum, s) => sum + s.draws, 0),
      losses: c.standings.reduce((sum, s) => sum + s.losses, 0),
      goalsFor: c.standings.reduce((sum, s) => sum + s.goalsFor, 0),
      goalsAgainst: c.standings.reduce((sum, s) => sum + s.goalsAgainst, 0),
    }))
    .sort((a, b) => b.wins - a.wins)
    .slice(0, 5);

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2"><span className="gold-text">Estatísticas</span></h1>
      <p className="text-muted mb-8">Gráficos e dados gerais da CIRS.</p>

      {/* Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {statCards.map((s) => (
          <div key={s.label} className="glass rounded-xl p-6 text-center">
            <div className="text-4xl font-black gold-text">{s.value}</div>
            <div className="text-xs text-muted uppercase mt-1">{s.label}</div>
          </div>
        ))}
      </div>

      {/* Gols por Clube */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-4"><span className="gold-text">Gols por Clube</span></h2>
        <div className="glass rounded-2xl p-6">
          {clubGoals.length === 0 ? (
            <p className="text-muted text-sm">Nenhum dado ainda.</p>
          ) : (
            <div className="space-y-3">
              {clubGoals.map((g) => {
                const club = g.clubId ? clubMap.get(g.clubId) : null;
                const goals = g._sum.goals || 0;
                return (
                  <div key={g.clubId} className="flex items-center gap-3">
                    <span className="text-sm font-medium w-32 truncate">{club?.name || "—"}</span>
                    <div className="flex-1 bg-blue-deep rounded-full h-6 relative overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-gold to-yellow-300 rounded-full transition-all" style={{ width: `${(goals / maxGoals) * 100}%` }} />
                    </div>
                    <span className="text-sm font-bold gold-text w-12 text-right">{goals}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-10">
        {/* V/E/D */}
        <section>
          <h2 className="text-2xl font-bold mb-4"><span className="gold-text">Vitórias / Empates / Derrotas</span></h2>
          <div className="glass rounded-2xl p-6 space-y-4">
            {clubPerformance.length === 0 || clubPerformance.every((c) => c.wins + c.draws + c.losses === 0) ? (
              <p className="text-muted text-sm">Nenhum dado ainda.</p>
            ) : (
              clubPerformance.map((c) => {
                const total = c.wins + c.draws + c.losses || 1;
                return (
                  <div key={c.id}>
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="font-medium">{c.name}</span>
                      <span className="text-xs text-muted">{c.wins}V {c.draws}E {c.losses}D</span>
                    </div>
                    <div className="flex h-3 rounded-full overflow-hidden bg-blue-deep">
                      <div className="bg-green-500" style={{ width: `${(c.wins / total) * 100}%` }} />
                      <div className="bg-muted" style={{ width: `${(c.draws / total) * 100}%` }} />
                      <div className="bg-red-500" style={{ width: `${(c.losses / total) * 100}%` }} />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </section>

        {/* Resumo geral */}
        <section>
          <h2 className="text-2xl font-bold mb-4"><span className="gold-text">Resumo Geral</span></h2>
          <div className="glass rounded-2xl p-6 space-y-2 text-sm">
            <div className="flex justify-between"><span>Gols</span><b className="gold-text">{agg.goals}</b></div>
            <div className="flex justify-between"><span>Assistências</span><b className="gold-text">{agg.assists}</b></div>
            <div className="flex justify-between"><span>Power Shots</span><b className="gold-text">{agg.powerShots}</b></div>
            <div className="flex justify-between"><span>Chutes</span><b className="gold-text">{agg.shots}</b></div>
            <div className="flex justify-between"><span>Defesas</span><b className="gold-text">{agg.saves}</b></div>
            <div className="flex justify-between"><span>Desarmes</span><b>{agg.tackles}</b></div>
            <div className="flex justify-between"><span>Amarelos</span><b>{agg.yellows}</b></div>
            <div className="flex justify-between"><span>Vermelhos</span><b>{agg.reds}</b></div>
          </div>
        </section>
      </div>

      {/* Últimos Resultados */}
      <section>
        <h2 className="text-2xl font-bold mb-4"><span className="gold-text">Últimos Resultados</span></h2>
        {allMatches.length === 0 ? (
          <p className="text-muted text-sm">Nenhum resultado ainda.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {allMatches.slice(0, 9).map((m) => (
              <div key={m.id} className="glass rounded-xl p-4 flex items-center justify-between text-sm">
                <span className="flex-1 text-right">{m.homeTeam?.name || "TBD"}</span>
                <span className="px-3 font-black gold-text">{m.homeScore} - {m.awayScore}</span>
                <span className="flex-1">{m.awayTeam?.name || "TBD"}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
