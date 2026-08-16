import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CAF_COMPETITIONS, CafCompetitionType } from "@/lib/caf-competitions";
import CafSimulateButton from "@/app/caf/CafSimulateButton";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

export default async function CafCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
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

  const cafType = competition.type as CafCompetitionType;
  const config = CAF_COMPETITIONS[cafType];
  const isCaf = ["caf-champions-league", "caf-confederations-cup"].includes(competition.type);

  const preliminaryGroups = competition.groups.filter((g) => g.name.includes("Pré-Eliminatória"));
  const groupStageGroups = competition.groups.filter((g) => g.name.startsWith("Grupo"));
  const knockoutGroups = competition.groups.filter(
    (g) => !g.name.startsWith("Grupo") && !g.name.includes("Pré-Eliminatória")
  );

  const allGroupMatches = groupStageGroups.flatMap((g) => g.matches);
  const groupRounds = [...new Set(allGroupMatches.map((m) => m.round || "").filter(Boolean))].sort(
    (a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""))
  );
  const finishedGroupCount = allGroupMatches.filter((m) => m.status === "finished").length;
  const scheduledGroupCount = allGroupMatches.filter((m) => m.status === "scheduled").length;

  const hasGroupStage = groupStageGroups.length > 0;
  const hasKnockout = knockoutGroups.length > 0;
  const hasPreliminary = preliminaryGroups.length > 0;

  const p1Group = preliminaryGroups.find((g) => g.name.includes("Primeira"));
  const p2Group = preliminaryGroups.find((g) => g.name.includes("Segunda"));
  const qfGroup = knockoutGroups.find((g) => g.name === "Quartas de Final");
  const sfGroup = knockoutGroups.find((g) => g.name === "Semifinais");
  const finalGroup = knockoutGroups.find((g) => g.name === "Grande Final");

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div
          className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-black"
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
          <span className="text-gold font-medium">
            Pré-eliminatórias + {config.groupStageGroups} grupos de {config.teamsPerGroup} + Mata-mata
          </span>
        </div>
        <div>
          <span className="text-muted">Fase de Grupos:</span>{" "}
          <span className="font-medium">16 times • Top 2 avançam</span>
        </div>
      </div>

      {isCaf && hasPreliminary && (
        <>
          {p1Group && (
            <PreliminarySection
              group={p1Group}
              title="Primeira Pré-Eliminatória"
              competitionId={competition.id}
              phase="P1"
            />
          )}
          {p2Group && (
            <PreliminarySection
              group={p2Group}
              title="Segunda Pré-Eliminatória"
              competitionId={competition.id}
              phase="P2"
            />
          )}
        </>
      )}

      {isCaf && (
        !hasGroupStage && !hasKnockout && (
          <div className="glass rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold gold-text mb-3">Avançar para Fase de Grupos</h2>
            <p className="text-muted text-sm mb-3">
              Após simular as pré-eliminatórias, gere a fase de grupos com os 16 times classificados
              (4 grupos de 4, turno e returno).
            </p>
            <CafSimulateButton
              competitionId={competition.id}
              action="generate-group-stage"
              label="Gerar Fase de Grupos (4 grupos de 4)"
              body={{}}
            />
          </div>
        )
      )}

      {isCaf && hasGroupStage && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold gold-text">Fase de Grupos</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <CafSimulateButton
                competitionId={competition.id}
                phase="groups"
                label="Simular Fase de Grupos"
              />
              {scheduledGroupCount === 0 && !hasKnockout && (
                <CafSimulateButton
                  competitionId={competition.id}
                  action="generate-quarterfinals"
                  label="Gerar Quartas de Final"
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

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {groupStageGroups.map((group) => (
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
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted flex-wrap">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500/40"></span>
              1º–2º: Classifica para Quartas
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500/40"></span>
              3º–4º: Eliminado
            </span>
          </div>
        </div>
      )}

      {isCaf && hasKnockout && (
        <div className="space-y-6">
          {qfGroup && (
            <KnockoutSection group={qfGroup} title="Quartas de Final" competitionId={competition.id} phase="QF" />
          )}
          {sfGroup && (
            <KnockoutSection group={sfGroup} title="Semifinais" competitionId={competition.id} phase="SF" />
          )}
          {finalGroup && (
            <KnockoutSection group={finalGroup} title="Grande Final" competitionId={competition.id} phase="Final" />
          )}
        </div>
      )}

      {isCaf && hasKnockout && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold gold-text mb-4">Simular Fase Eliminatória</h2>
          <div className="flex items-center gap-2 flex-wrap">
            <CafSimulateButton competitionId={competition.id} phase="QF" label="Simular Quartas" />
            <CafSimulateButton competitionId={competition.id} phase="SF" label="Simular Semifinais" />
            <CafSimulateButton competitionId={competition.id} phase="Final" label="Simular Final" />
          </div>
        </div>
      )}
    </div>
  );
}

function PreliminarySection({
  group,
  title,
  competitionId,
  phase,
}: {
  group: {
    id: string;
    name: string;
    matches: Array<{
      id: string;
      homeTeam: { name: string; emblem: string } | null;
      awayTeam: { name: string; emblem: string } | null;
      homeScore: number | null;
      awayScore: number | null;
      round: string | null;
      status: string;
    }>;
  };
  title: string;
  competitionId: string;
  phase: string;
}) {
  const rounds = [...new Set(group.matches.map((m) => m.round || "").filter(Boolean))].sort();

  return (
    <div className="glass rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold gold-text">{title}</h2>
        <CafSimulateButton
          competitionId={competitionId}
          phase={phase}
          label={`Simular ${title}`}
        />
      </div>
      <div className="space-y-2">
        {group.matches.map((m) => (
          <div key={m.id} className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
            <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
            <span className="px-3 py-1 bg-blue-deep rounded gold-border font-bold min-w-[70px] text-center">
              {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
            </span>
            <span className="flex-1 truncate pl-2">{m.awayTeam?.name || "—"}</span>
            {m.round && (
              <span className="ml-2 text-[10px] text-muted min-w-[80px] text-right">{m.round}</span>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function KnockoutSection({
  group,
  title,
  competitionId,
  phase,
}: {
  group: {
    id: string;
    name: string;
    matches: Array<{
      id: string;
      homeTeam: { name: string; emblem: string } | null;
      awayTeam: { name: string; emblem: string } | null;
      homeScore: number | null;
      awayScore: number | null;
      round: string | null;
      status: string;
    }>;
  };
  title: string;
  competitionId: string;
  phase: string;
}) {
  const rounds = [...new Set(group.matches.map((m) => m.round || "").filter(Boolean))].sort();

  return (
    <div className="glass rounded-2xl p-6">
      <h2 className="text-lg font-bold gold-text mb-4">{title}</h2>
      {rounds.map((r) => (
        <div key={r} className="mb-3">
          <h3 className="text-xs uppercase text-muted mb-2">{r}</h3>
          <div className="space-y-1">
            {group.matches
              .filter((m) => m.round === r)
              .map((m) => (
                <div key={m.id} className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
                  <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
                  <span className="px-3 py-1 bg-blue-deep rounded gold-border font-bold min-w-[70px] text-center">
                    {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                  </span>
                  <span className="flex-1 truncate pl-2">{m.awayTeam?.name || "—"}</span>
                </div>
              ))}
          </div>
        </div>
      ))}
      {!rounds.length && (
        <div className="space-y-1">
          {group.matches.map((m) => (
            <div key={m.id} className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
              <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
              <span className="px-3 py-1 bg-blue-deep rounded gold-border font-bold min-w-[70px] text-center">
                {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
              </span>
              <span className="flex-1 truncate pl-2">{m.awayTeam?.name || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
