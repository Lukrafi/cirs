import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

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
            orderBy: { points: "desc" },
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

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        {competition.logo && <img src={competition.logo} alt={competition.name} className="w-16 h-16 rounded-xl" />}
        <div>
          <h1 className="text-3xl font-black">{competition.name}</h1>
          <p className="text-muted text-sm uppercase">{competition.type}</p>
          <p className="text-muted text-sm">{competition.season?.name} • {competition.season?.league?.name}</p>
        </div>
      </div>

      {competition.groups.map((group: typeof competition.groups[number]) => (
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
                {group.matches.map((m) => (
                  <div key={m.id} className="glass rounded-lg p-3 flex items-center justify-between text-sm">
                    <span className="flex-1 text-right">{m.homeTeam?.name || "—"}</span>
                    <span className="px-4 py-1 bg-blue-deep rounded gold-border font-bold">
                      {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                    </span>
                    <span className="flex-1">{m.awayTeam?.name || "—"}</span>
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
