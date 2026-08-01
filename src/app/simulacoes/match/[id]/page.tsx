import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { include: { players: true } },
      awayTeam: { include: { players: true } },
      group: { include: { competition: true } },
      matchStats: { include: { player: true } },
    },
  });

  if (!match) notFound();

  const homeStats = match.matchStats.filter((s) => s.clubId === match.homeTeamId);
  const awayStats = match.matchStats.filter((s) => s.clubId === match.awayTeamId);
  const mvp = match.matchStats.find((s) => s.mvp);

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="glass rounded-2xl p-6 mb-6">
        <div className="flex items-center justify-around gap-4 mb-4">
          <div className="text-center flex-1">
            {match.homeTeam?.emblem && <img src={match.homeTeam.emblem} alt="" className="w-16 h-16 rounded-lg mx-auto mb-2" />}
            <h2 className="font-bold">{match.homeTeam?.name}</h2>
          </div>

          <div className="text-center px-8">
            <div className="text-5xl font-black gold-text">
              {match.homeScore ?? "—"} <span className="text-muted text-3xl">x</span> {match.awayScore ?? "—"}
            </div>
            <div className="text-xs text-muted uppercase mt-2">{match.status}</div>
            {match.isSimulated && <div className="text-xs text-gold mt-1">Simulado</div>}
          </div>

          <div className="text-center flex-1">
            {match.awayTeam?.emblem && <img src={match.awayTeam.emblem} alt="" className="w-16 h-16 rounded-lg mx-auto mb-2" />}
            <h2 className="font-bold">{match.awayTeam?.name}</h2>
          </div>
        </div>

        {match.group?.competition && (
          <p className="text-center text-sm text-muted">{match.group.competition.name} • {match.round || ""}</p>
        )}
        {match.matchDate && (
          <p className="text-center text-xs text-muted mt-1">{new Date(match.matchDate).toLocaleString("pt-BR")}</p>
        )}

        {mvp && (
          <div className="text-center mt-4">
            <span className="text-sm glass px-4 py-2 rounded-full gold-border">
              🏆 MVP: <span className="text-gold font-bold">{mvp.player?.name}</span> ({mvp.rating.toFixed(1)})
            </span>
          </div>
        )}
      </div>

      {match.status === "finished" && match.matchStats.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[{ team: match.homeTeam?.name, stats: homeStats }, { team: match.awayTeam?.name, stats: awayStats }].map((side) => (
            <div key={side.team} className="glass rounded-2xl p-6">
              <h3 className="font-bold uppercase text-gold text-sm mb-4">{side.team}</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead className="border-b border-border">
                    <tr className="text-left text-muted">
                      <th className="p-2">Jogador</th>
                      <th className="p-2 text-center">G</th>
                      <th className="p-2 text-center">A</th>
                      <th className="p-2 text-center">PS</th>
                      <th className="p-2 text-center">Nota</th>
                    </tr>
                  </thead>
                  <tbody>
                    {side.stats.map((s) => (
                      <tr key={s.id} className="border-b border-border last:border-0">
                        <td className="p-2">{s.player?.name || "—"}</td>
                        <td className="p-2 text-center">{s.goals}</td>
                        <td className="p-2 text-center">{s.assists}</td>
                        <td className="p-2 text-center">{s.powerShots}</td>
                        <td className="p-2 text-center gold-text font-bold">{s.rating.toFixed(1)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
