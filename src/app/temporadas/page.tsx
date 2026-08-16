import { prisma } from "@/lib/prisma";
import Link from "next/link";
import SeasonSelector from "@/components/SeasonSelector";

export const dynamic = "force-dynamic";

export default async function TemporadasPage() {
  const currentYear = new Date().getFullYear();
  const currentSeason = await prisma.season.findFirst({
    where: { year: currentYear },
    include: {
      league: true,
      competitions: {
        include: {
          groups: {
            include: {
              matches: {
                where: { isSimulated: false },
                include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
              },
              standings: { include: { club: true } },
            },
          },
        },
      },
    },
  });

  const otherSeasons = await prisma.season.findMany({
    where: { year: { lt: currentYear } },
    orderBy: { year: "desc" },
    select: { id: true, year: true, league: { select: { name: true } } },
  });

  if (!currentSeason) {
    return (
      <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <h1 className="text-4xl font-black mb-2"><span className="gold-text">Temporadas</span></h1>
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Temporada {currentYear} ainda não configurada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black mb-1">
            <span className="gold-text">Temporada {currentSeason.year}</span>
          </h1>
          <p className="text-muted max-w-3xl">
            Competições jogadas ativamente no Haxball. Partidas reais, estatísticas reais.
          </p>
        </div>

        {otherSeasons.length > 0 && (
          <SeasonSelector
            currentId={currentSeason.id}
            seasons={otherSeasons.map((s) => ({ id: s.id, year: s.year, leagueName: s.league?.name }))}
          />
        )}
      </div>

      {currentSeason.competitions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhuma competição nesta temporada.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {currentSeason.competitions.map((comp) => (
            <section key={comp.id} className="glass rounded-2xl p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {comp.logo ? (
                    <img src={comp.logo} alt={comp.name} className="w-10 h-10 rounded-lg object-contain" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-lg">🏆</div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{comp.name}</h2>
                    <p className="text-xs text-muted">{comp.type} • {comp.numTeams} times</p>
                  </div>
                </div>
                <Link
                  href={`/campeonatos/${comp.id}`}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-gold/10 text-gold hover:bg-gold/20 transition-colors"
                >
                  Ver detalhes
                </Link>
              </div>

              {comp.groups.length > 0 && comp.groups[0].standings.length > 0 && (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-muted text-xs uppercase border-b border-border">
                        <th className="text-left py-2 px-3">#</th>
                        <th className="text-left py-2 px-3">Clube</th>
                        <th className="text-center py-2 px-3">J</th>
                        <th className="text-center py-2 px-3">V</th>
                        <th className="text-center py-2 px-3">E</th>
                        <th className="text-center py-2 px-3">D</th>
                        <th className="text-center py-2 px-3">GP</th>
                        <th className="text-center py-2 px-3">GC</th>
                        <th className="text-center py-2 px-3">SG</th>
                        <th className="text-center py-2 px-3 font-bold text-gold">P</th>
                      </tr>
                    </thead>
                    <tbody>
                      {comp.groups[0].standings
                        .sort((a, b) => b.points - a.points)
                        .map((standing, i) => (
                          <tr key={standing.id} className="border-b border-white/5 hover:bg-white/5">
                            <td className="py-2 px-3 font-bold text-gold">{i + 1}</td>
                            <td className="py-2 px-3">
                              <Link href={`/times/${standing.club?.id}`} className="hover:text-gold transition-colors">
                                {standing.club?.name || "—"}
                              </Link>
                            </td>
                            <td className="py-2 px-3 text-center">{standing.played}</td>
                            <td className="py-2 px-3 text-center">{standing.wins}</td>
                            <td className="py-2 px-3 text-center">{standing.draws}</td>
                            <td className="py-2 px-3 text-center">{standing.losses}</td>
                            <td className="py-2 px-3 text-center">{standing.goalsFor}</td>
                            <td className="py-2 px-3 text-center">{standing.goalsAgainst}</td>
                            <td className="py-2 px-3 text-center">{standing.goalsDiff >= 0 ? "+" : ""}{standing.goalsDiff}</td>
                            <td className="py-2 px-3 text-center font-bold">{standing.points}</td>
                          </tr>
                        ))}
                    </tbody>
                  </table>
                </div>
              )}

              {comp.groups.length > 0 && comp.groups[0].matches.length > 0 && (
                <div className="mt-4">
                  <h3 className="text-sm font-semibold mb-2">Próximas rodadas</h3>
                  <div className="space-y-1.5">
                    {comp.groups[0].matches
                      .filter((m) => m.status === "scheduled")
                      .slice(0, 5)
                      .map((m) => (
                        <div key={m.id} className="flex items-center justify-between text-xs p-2 bg-blue-deep/50 rounded-lg">
                          <span className="flex-1 text-right pr-2">{m.homeTeam?.name || "TBD"}</span>
                          <span className="px-2">VS</span>
                          <span className="flex-1 text-left pl-2">{m.awayTeam?.name || "TBD"}</span>
                          {m.matchDate && (
                            <span className="text-muted ml-2 whitespace-nowrap">{m.matchDate.toLocaleDateString("pt-BR")}</span>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}