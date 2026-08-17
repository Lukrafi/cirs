import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const formatLabels: Record<string, string> = {
  "round-robin": "Turno e Returno",
  "single-round": "Turno Único",
  groups: "Grupos",
  knockout: "Mata-mata",
  swiss: "Fase Suíça",
};

export default async function CompetitionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      season: { include: { league: true } },
      groups: {
        include: {
          standings: {
            include: { club: true },
            orderBy: [{ points: "desc" }, { wins: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }],
          },
          matches: {
            include: { homeTeam: true, awayTeam: true },
            orderBy: { matchDate: "asc" },
          },
        },
      },
    },
  });

  if (!competition) notFound();

  const formatLabel = formatLabels[competition.format] || competition.format;

  const numTurns = competition.numTurns || 2;
  const roundsPerTurn = competition.numTeams > 1 ? competition.numTeams - 1 : 9;

  const formatRound = (round: string | null) => {
    if (!round) return "";
    const roundNum = parseInt(round, 10);
    if (isNaN(roundNum)) return `Rod. ${round}`;
    if (numTurns <= 1) return `Rod. ${roundNum}`;
    const turn = Math.ceil(roundNum / roundsPerTurn);
    const roundInTurn = roundNum - (turn - 1) * roundsPerTurn;
    const turnLabel = turn === 1 ? "Ida" : "Volta";
    return `Rod. ${roundInTurn} (${turnLabel})`;
  };

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-2">
        {competition.logo && <img src={competition.logo} alt={competition.name} className="w-16 h-16 rounded-xl object-contain" />}
        <div>
          <h1 className="text-3xl font-black">{competition.name}</h1>
          <p className="text-muted text-sm uppercase">{competition.type}</p>
          <p className="text-muted text-sm">{competition.season?.name} {competition.season?.league ? `• ${competition.season.league.name}` : ""}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-8 flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted">Formato:</span>{" "}
          <span className="text-gold font-medium">{formatLabel}</span>
        </div>
        <div>
          <span className="text-muted">Times:</span>{" "}
          <span className="font-medium">{competition.numTeams}</span>
        </div>
        <div>
          <span className="text-muted">Vitória:</span>{" "}
          <span className="font-medium">{competition.pointsPerWin}pts</span>
        </div>
        <div>
          <span className="text-muted">Empate:</span>{" "}
          <span className="font-medium">{competition.pointsPerDraw}pts</span>
        </div>
        {competition.relegated > 0 && (
          <div>
            <span className="text-muted">Rebaixados:</span>{" "}
            <span className="text-red-400 font-medium">{competition.relegated}</span>
          </div>
        )}
        {competition.qualifiedLibertadores > 0 && (
          <div>
            <span className="text-muted">Libertadores:</span>{" "}
            <span className="font-medium">{competition.qualifiedLibertadores}</span>
          </div>
        )}
        {competition.qualifiedSulAmericana > 0 && (
          <div>
            <span className="text-muted">Sul-Americana:</span>{" "}
            <span className="font-medium">{competition.qualifiedSulAmericana}</span>
          </div>
        )}
      </div>

      {competition.groups.map((group: (typeof competition.groups)[number]) => (
        <div key={group.id} className="mb-8">
          <h2 className="text-lg font-bold uppercase text-gold mb-4">{group.name}</h2>

          {group.standings.length > 0 && (
            <div className="glass rounded-2xl overflow-x-auto mb-6">
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
                  {group.standings.map((s, idx) => (
                    <tr key={s.id} className="border-b border-border last:border-0 hover:bg-white/5">
                      <td className="p-3 text-muted">{idx + 1}</td>
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
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {group.matches.length > 0 && (
            <div>
              <h3 className="text-sm uppercase text-muted mb-3">Partidas</h3>
              <div className="space-y-2">
                {group.matches.slice(0, 50).map((m) => (
                  <div key={m.id} className="glass rounded-lg p-3 flex items-center justify-between text-sm">
                    <span className="flex-1 text-right">{m.homeTeam?.name || "—"}</span>
                    <span className="px-4 py-1 bg-blue-deep rounded gold-border font-bold">
                      {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                    </span>
                    <span className="flex-1">{m.awayTeam?.name || "—"}</span>
                    <span className="ml-3 text-xs text-muted min-w-[80px] text-right">{formatRound(m.round)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {group.standings.length === 0 && group.matches.length === 0 && (
            <p className="text-muted text-sm">Nenhum dado para este grupo ainda.</p>
          )}
        </div>
      ))}

      {competition.groups.length === 0 && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Nenhum grupo criado para esta competição ainda.</p>
        </div>
      )}
    </div>
  );
}