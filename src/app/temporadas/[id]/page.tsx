import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CentralTemporadaPage({
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
              standings: {
                include: { club: true },
                orderBy: [
                  { points: "desc" },
                  { wins: "desc" },
                  { goalsDiff: "desc" },
                  { goalsFor: "desc" },
                ],
              },
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

  const allMatches = season.competitions.flatMap((c) =>
    c.groups.flatMap((g) => g.matches.map((m) => ({ ...m, competitionName: c.name })))
  );
  const finishedMatches = allMatches.filter((m) => m.status === "finished");
  const scheduledMatches = allMatches.filter((m) => m.status === "scheduled");

  const rounds = [...new Set(scheduledMatches.map((m) => m.round))].sort(
    (a, b) => parseInt((a || "0").replace(/\D/g, "")) - parseInt((b || "0").replace(/\D/g, ""))
  );
  const currentRound = rounds.length > 0 ? rounds[0] : "—";
  const totalRounds = [...new Set(allMatches.map((m) => m.round))].length;

  const nextMatchDate = scheduledMatches.length > 0
    ? scheduledMatches[0]?.matchDate
    : null;

  const topScorersData = await prisma.matchStat.groupBy({
    by: ["playerId"],
    _sum: { goals: true },
    orderBy: { _sum: { goals: "desc" } },
    take: 10,
  });
  const scorerIds = topScorersData.map((s) => s.playerId).filter((id): id is string => id !== null);
  const scorerPlayers = await prisma.player.findMany({
    where: { id: { in: scorerIds } },
    include: { club: true },
  });
  const scorerMap = new Map(scorerPlayers.map((p) => [p.id, p]));

  const topAssistsData = await prisma.matchStat.groupBy({
    by: ["playerId"],
    _sum: { assists: true },
    orderBy: { _sum: { assists: "desc" } },
    take: 10,
  });

  const stats = {
    goals: finishedMatches.reduce((sum, m) => sum + (m.homeScore || 0) + (m.awayScore || 0), 0),
  };

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/temporadas" className="text-sm text-muted hover:text-gold transition-colors">
        &larr; Voltar para Temporadas
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-black gold-text">{season.year}</h1>
            <p className="text-muted mt-1">
              {season.league?.name || "Múltiplas competições"} &bull; {season.competitions.length} competi&ccedil;&otilde;es
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold gold-text">{currentRound}</div>
              <div className="text-xs text-muted uppercase">Rodada Atual</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gold-text">{totalRounds}</div>
              <div className="text-xs text-muted uppercase">Total Rodadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gold-text">{finishedMatches.length}</div>
              <div className="text-xs text-muted uppercase">Disputadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gold-text">{scheduledMatches.length}</div>
              <div className="text-xs text-muted uppercase">Restantes</div>
            </div>
          </div>
        </div>

        {nextMatchDate && (
          <p className="text-sm text-muted mt-4">
            Próxima rodada: {new Date(nextMatchDate).toLocaleDateString("pt-BR")}
          </p>
        )}
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="lg:col-span-2">
          <h2 className="text-xl font-bold gold-text mb-4">Classificação</h2>
          {season.competitions.map((comp) =>
            comp.groups.map((group) =>
              group.standings.length > 0 ? (
                <div key={group.id} className="glass rounded-2xl overflow-x-auto mb-4">
                  <div className="px-4 py-2 text-xs text-muted uppercase border-b border-border">
                    {comp.name} &bull; {group.name}
                  </div>
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr className="text-left text-muted text-xs">
                        <th className="p-3">#</th>
                        <th className="p-3">Time</th>
                        <th className="p-3 text-center">J</th>
                        <th className="p-3 text-center">V</th>
                        <th className="p-3 text-center">E</th>
                        <th className="p-3 text-center">D</th>
                        <th className="p-3 text-center">GP</th>
                        <th className="p-3 text-center">GC</th>
                        <th className="p-3 text-center">SG</th>
                        <th className="p-3 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.standings.map((s, idx) => {
                        const isRelegated = comp.relegated > 0 && idx >= group.standings.length - comp.relegated;
                        const isQualified = idx < comp.qualifiedLibertadores;
                        return (
                          <tr
                            key={s.id}
                            className={`border-b border-border last:border-0 hover:bg-white/5 ${
                              isQualified ? "bg-green-500/5" : isRelegated ? "bg-red-500/5" : ""
                            }`}
                          >
                            <td className="p-3 text-muted">
                              {isQualified && <span className="text-green-400">●</span>}
                              {isRelegated && <span className="text-red-400">●</span>}
                              {!isQualified && !isRelegated && idx + 1}
                            </td>
                            <td className="p-3 font-medium">{s.club?.name || "—"}</td>
                            <td className="p-3 text-center">{s.played}</td>
                            <td className="p-3 text-center">{s.wins}</td>
                            <td className="p-3 text-center">{s.draws}</td>
                            <td className="p-3 text-center">{s.losses}</td>
                            <td className="p-3 text-center">{s.goalsFor}</td>
                            <td className="p-3 text-center">{s.goalsAgainst}</td>
                            <td className="p-3 text-center">{s.goalsDiff}</td>
                            <td className="p-3 text-center font-bold gold-text">{s.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : null
            )
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold gold-text mb-4">Estatísticas</h2>
          <div className="glass rounded-2xl p-5 space-y-3">
            <div className="flex justify-between">
              <span className="text-muted text-sm">Total de Gols</span>
              <span className="font-bold gold-text">{stats.goals}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted text-sm">Partidas</span>
              <span className="font-bold">{finishedMatches.length}/{allMatches.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted text-sm">Média Gols/Jogo</span>
              <span className="font-bold">
                {finishedMatches.length > 0 ? (stats.goals / finishedMatches.length).toFixed(1) : "0"}
              </span>
            </div>
          </div>

          <div className="glass rounded-2xl p-5 mt-4">
            <h3 className="text-sm uppercase text-muted mb-3">Últimos Resultados</h3>
            {finishedMatches.length === 0 ? (
              <p className="text-muted text-xs">Nenhum resultado ainda.</p>
            ) : (
              <div className="space-y-2">
                {finishedMatches.slice(-5).reverse().map((m) => (
                  <div key={m.id} className="text-xs flex items-center justify-between">
                    <span className="flex-1 text-right truncate">{m.homeTeam?.name}</span>
                    <span className="px-2 font-bold gold-text">
                      {m.homeScore} - {m.awayScore}
                    </span>
                    <span className="flex-1 truncate">{m.awayTeam?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-5 mt-4">
            <h3 className="text-sm uppercase text-muted mb-3">Próximos Jogos</h3>
            {scheduledMatches.length === 0 ? (
              <p className="text-muted text-xs">Nenhum jogo agendado.</p>
            ) : (
              <div className="space-y-2">
                {scheduledMatches.slice(0, 5).map((m) => (
                  <div key={m.id} className="text-xs flex items-center justify-between">
                    <span className="flex-1 text-right truncate">{m.homeTeam?.name}</span>
                    <span className="px-3 text-muted">vs</span>
                    <span className="flex-1 truncate">{m.awayTeam?.name}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div>
          <h2 className="text-xl font-bold gold-text mb-4">Artilharia</h2>
          {topScorersData.length === 0 ? (
            <p className="text-muted text-sm">Sem artilheiros ainda.</p>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              {topScorersData.map((s, i) => {
                const player = s.playerId ? scorerMap.get(s.playerId) : null;
                return (
                  <div
                    key={s.playerId || i}
                    className={`flex items-center px-4 py-3 text-sm border-b border-border last:border-0 ${
                      i < 3 ? "bg-gold/5" : ""
                    }`}
                  >
                    <span
                      className={`w-8 font-bold ${
                        i === 0 ? "text-gold" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{player?.name || "—"}</span>
                    <span className="text-muted text-xs truncate">{player?.club?.name || "—"}</span>
                    <span className="w-12 text-right font-bold gold-text">{s._sum.goals}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        <div>
          <h2 className="text-xl font-bold gold-text mb-4">Assistências</h2>
          {topAssistsData.length === 0 ? (
            <p className="text-muted text-sm">Sem assistências ainda.</p>
          ) : (
            <div className="glass rounded-2xl overflow-hidden">
              {topAssistsData.map((s, i) => {
                const player = s.playerId ? scorerMap.get(s.playerId) : null;
                return (
                  <div
                    key={s.playerId || i}
                    className={`flex items-center px-4 py-3 text-sm border-b border-border last:border-0 ${
                      i < 3 ? "bg-gold/5" : ""
                    }`}
                  >
                    <span
                      className={`w-8 font-bold ${
                        i === 0 ? "text-gold" : i === 1 ? "text-gray-300" : i === 2 ? "text-amber-600" : "text-muted"
                      }`}
                    >
                      {i + 1}
                    </span>
                    <span className="flex-1 truncate">{player?.name || "—"}</span>
                    <span className="text-muted text-xs truncate">{player?.club?.name || "—"}</span>
                    <span className="w-12 text-right font-bold gold-text">{s._sum.assists}</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}