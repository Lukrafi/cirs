import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CONCACAF_COMPETITIONS, ConcacafCompetitionType } from "@/lib/concacaf-competitions";
import ConcacafSimulateButton from "@/app/concacaf/ConcacafSimulateButton";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

export default async function ConcacafCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      season: true,
      groups: {
        include: {
          standings: {
            include: { club: true },
            orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }],
          },
          matches: {
            include: { homeTeam: true, awayTeam: true },
            orderBy: [{ round: "asc" }, { matchDate: "asc" }],
          },
        },
      },
    },
  });

  if (!competition) notFound();

  const concacafType = competition.type as ConcacafCompetitionType;
  const config = CONCACAF_COMPETITIONS[concacafType];
  const isConcacaf = ["champions-cup", "leagues-cup", "central-american-cup", "caribbean-cup", "caribbean-shield"].includes(competition.type);

  const groupGroups = competition.groups.filter((g) => g.name.startsWith("Grupo"));
  const knockoutGroups = competition.groups.filter((g) => !g.name.startsWith("Grupo"));

  const allGroupMatches = groupGroups.flatMap((g) => g.matches);
  const groupRounds = [...new Set(allGroupMatches.map((m) => m.round || "").filter(Boolean))].sort(
    (a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""))
  );
  const finishedGroupCount = allGroupMatches.filter((m) => m.status === "finished").length;
  const scheduledGroupCount = allGroupMatches.filter((m) => m.status === "scheduled").length;

  const hasKnockout = knockoutGroups.length > 0;

  const knockoutButtons: Record<ConcacafCompetitionType, { label: string; phase: string; twoLegs: boolean }[]> = {
    "champions-cup": [
      { label: "Simular 1ª Rodada", phase: "R1", twoLegs: true },
      { label: "Simular Oitavas", phase: "R16", twoLegs: true },
      { label: "Simular Quartas", phase: "QF", twoLegs: true },
      { label: "Simular Semifinais", phase: "SF", twoLegs: true },
      { label: "Simular Final", phase: "Final", twoLegs: true },
    ],
    "leagues-cup": [
      { label: "Simular 16 Avos", phase: "R32", twoLegs: false },
      { label: "Simular Oitavas", phase: "R16", twoLegs: false },
      { label: "Simular Quartas", phase: "QF", twoLegs: false },
      { label: "Simular Semifinais", phase: "SF", twoLegs: false },
      { label: "Simular Final", phase: "Final", twoLegs: false },
    ],
    "central-american-cup": [
      { label: "Simular Quartas", phase: "QF", twoLegs: true },
      { label: "Simular Play-ins", phase: "Play-in", twoLegs: true },
      { label: "Simular Semifinais", phase: "SF", twoLegs: true },
      { label: "Simular Final", phase: "Final", twoLegs: true },
    ],
    "caribbean-cup": [
      { label: "Simular Semifinais", phase: "SF", twoLegs: true },
      { label: "Simular 3º Lugar", phase: "3rd", twoLegs: false },
      { label: "Simular Final", phase: "Final", twoLegs: true },
    ],
    "caribbean-shield": [
      { label: "Simular Semifinais", phase: "SF", twoLegs: false },
      { label: "Simular Final", phase: "Final", twoLegs: false },
    ],
  };

  const genKnockoutAction: Record<ConcacafCompetitionType, string> = {
    "champions-cup": "advance-champions-cup-r16",
    "leagues-cup": "generate-leagues-cup-knockout",
    "central-american-cup": "generate-central-american-knockout",
    "caribbean-cup": "generate-caribbean-cup-knockout",
    "caribbean-shield": "generate-caribbean-shield-knockout",
  };

  const buttons = knockoutButtons[concacafType] || [];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black"
          style={{ background: `${config.color}22`, color: config.color }}
        >
          {config.shortName}
        </div>
        <div>
          <h1 className="text-3xl font-black">{competition.name}</h1>
          <p className="text-muted text-sm">{competition.season?.name || "Sem temporada"}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-8 flex flex-wrap gap-4 text-sm">
        <div>
          <span className="text-muted">Formato:</span>{" "}
          <span className="text-gold font-medium">{competition.format === "groups" ? "Grupos + Mata-mata" : "Mata-mata"}</span>
        </div>
        <div>
          <span className="text-muted">Times:</span>{" "}
          <span className="font-medium">{competition.numTeams}</span>
        </div>
        {groupGroups.length > 0 && (
          <div>
            <span className="text-muted">Grupos (fase de grupos):</span>{" "}
            <span className="font-medium">{groupGroups.length}</span>
          </div>
        )}
        {groupGroups.length > 0 && (
          <div>
            <span className="text-muted">Partidas (grupos):</span>{" "}
            <span className="text-gold">{finishedGroupCount} jogadas</span>
            <span className="text-muted"> / </span>
            <span className="text-muted">{scheduledGroupCount} agendadas</span>
          </div>
        )}
      </div>

      {isConcacaf && groupGroups.length > 0 && (
        <>
          <div className="glass rounded-2xl p-6 mb-8">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
              <h2 className="text-lg font-bold gold-text">Fase de Grupos</h2>
              <div className="flex items-center gap-2 flex-wrap">
                <ConcacafSimulateButton
                  competitionId={competition.id}
                  phase="groups"
                  label="Simular Fase de Grupos"
                />
                {scheduledGroupCount === 0 && !hasKnockout && (
                  <ConcacafSimulateButton
                    competitionId={competition.id}
                    action={genKnockoutAction[concacafType]}
                    label="Gerar Mata-mata"
                  />
                )}
              </div>
            </div>

            {groupRounds.length > 0 && (
              <div className="flex items-center gap-2 mb-4 flex-wrap">
                <span className="text-xs text-muted">Rodadas:</span>
                {groupRounds.map((r) => {
                  const rMatches = allGroupMatches.filter((m) => m.round === r);
                  const rFinished = rMatches.filter((m) => m.status === "finished").length;
                  return (
                    <span
                      key={r}
                      className={`text-xs px-2 py-1 rounded-full font-medium ${
                        rFinished === rMatches.length
                          ? "bg-green-500/15 text-green-400"
                          : "bg-blue-deep text-muted"
                      }`}
                    >
                      Rod. {r} ({rFinished}/{rMatches.length})
                    </span>
                  );
                })}
              </div>
            )}

            <div className="space-y-6">
              {groupGroups.map((group) => (
                <div key={group.id}>
                  <h3 className="text-sm font-bold text-gold mb-2">{group.name}</h3>

                  {group.standings.length > 0 && (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="border-b border-border">
                          <tr className="text-left text-muted text-xs">
                            <th className="p-2">#</th>
                            <th className="p-2">Time</th>
                            <th className="p-2 text-center">J</th>
                            <th className="p-2 text-center">V</th>
                            <th className="p-2 text-center">E</th>
                            <th className="p-2 text-center">D</th>
                            <th className="p-2 text-center">GP</th>
                            <th className="p-2 text-center">GC</th>
                            <th className="p-2 text-center">SG</th>
                            <th className="p-2 text-center">Pts</th>
                          </tr>
                        </thead>
                        <tbody>
                          {group.standings.map((s, idx) => {
                            const pos = s.position || idx + 1;
                            const isQualified = pos <= 2;
                            return (
                              <tr
                                key={s.id}
                                className={`border-b border-border last:border-0 hover:bg-white/5 ${isQualified ? "bg-green-500/5" : ""}`}
                              >
                                <td className="p-2">
                                  <span
                                    className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${
                                      isQualified ? "bg-green-500/20 text-green-400" : "text-muted"
                                    }`}
                                  >
                                    {pos}
                                  </span>
                                </td>
                                <td className="p-2 font-medium">
                                  <div className="flex items-center gap-2">
                                    {s.club?.emblem && (
                                      <img src={s.club.emblem} alt="" className="w-4 h-4 rounded object-cover" />
                                    )}
                                    {s.club?.name || "—"}
                                  </div>
                                </td>
                                <td className="p-2 text-center">{s.played}</td>
                                <td className="p-2 text-center">{s.wins}</td>
                                <td className="p-2 text-center">{s.draws}</td>
                                <td className="p-2 text-center">{s.losses}</td>
                                <td className="p-2 text-center">{s.goalsFor}</td>
                                <td className="p-2 text-center">{s.goalsAgainst}</td>
                                <td className="p-2 text-center">{s.goalsDiff > 0 ? `+${s.goalsDiff}` : s.goalsDiff}</td>
                                <td className="p-2 text-center font-bold gold-text">{s.points}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {group.matches.length > 0 && (
                    <div className="space-y-1 mt-2">
                      {group.matches.map((m) => (
                        <div key={m.id} className="glass rounded-lg p-2 flex items-center justify-between text-xs">
                          <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
                          <span className="px-2 py-1 bg-blue-deep rounded gold-border font-bold min-w-[60px] text-center">
                            {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                          </span>
                          <span className="flex-1 truncate pl-2">{m.awayTeam?.name || "—"}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {group.standings.length === 0 && group.matches.length === 0 && (
                    <p className="text-muted text-sm">Nenhum dado para este grupo ainda.</p>
                  )}
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {isConcacaf && knockoutGroups.length > 0 && (
        <div className="space-y-6">
          {knockoutGroups.map((kg) => (
            <div key={kg.id} className="glass rounded-2xl p-6">
              <h2 className="text-lg font-bold gold-text mb-4">{kg.name}</h2>
              <div className="space-y-1">
                {kg.matches.map((m) => (
                  <div key={m.id} className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
                    <span className="flex-1 text-right truncate">
                      {m.homeTeam?.name || "—"}
                    </span>
                    <span className="px-3 py-1 bg-blue-deep rounded gold-border font-bold min-w-[70px] text-center">
                      {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                    </span>
                    <span className="flex-1 truncate pl-2">
                      {m.awayTeam?.name || "—"}
                    </span>
                    {m.round && (
                      <span className="ml-2 text-[10px] text-muted min-w-[80px] text-right">{m.round}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {isConcacaf && hasKnockout && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold gold-text mb-4">Simular Fase Eliminatória</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {buttons.map((btn) => (
              <ConcacafSimulateButton
                key={btn.phase}
                competitionId={competition.id}
                phase={btn.phase}
                label={btn.label}
              />
            ))}
          </div>
        </div>
      )}

      {isConcacaf && groupGroups.length > 0 && !hasKnockout && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold gold-text mb-4">Gerar Mata-mata</h2>
          <p className="text-muted text-sm mb-3">
            Após simular todos os jogos da fase de grupos, gere as chaves do mata-mata com os classificados.
          </p>
          <ConcacafSimulateButton
            competitionId={competition.id}
            action={genKnockoutAction[concacafType]}
            label="Gerar Mata-mata dos Classificados"
          />
        </div>
      )}
    </div>
  );
}
