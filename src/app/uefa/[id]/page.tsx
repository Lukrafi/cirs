import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { UEFA_COMPETITIONS, getLeaguePhaseConfig, UefaCompetitionType } from "@/lib/uefa-competitions";
import SimulateButton from "@/app/uefa/SimulateButton";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

export default async function UefaCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
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

  const uefaType = competition.type as UefaCompetitionType;
  const config = UEFA_COMPETITIONS[uefaType];
  const leagueConfig = getLeaguePhaseConfig(uefaType);
  const leagueGroup = competition.groups.find((g) => g.name === "Fase de Liga");
  const isUefaComp = ["champions-league", "europa-league", "conference-league"].includes(competition.type);

  const knockoutGroups = competition.groups.filter((g) => g.name !== "Fase de Liga");

  const allLeagueMatches = leagueGroup?.matches || [];
  const rounds = [...new Set(allLeagueMatches.map((m) => m.round || "").filter(Boolean))].sort(
    (a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""))
  );

  const finishedCount = allLeagueMatches.filter((m) => m.status === "finished").length;
  const scheduledCount = allLeagueMatches.filter((m) => m.status === "scheduled").length;

  const hasKnockout = knockoutGroups.length > 0;
  const koPlayoffGroup = knockoutGroups.find((g) => g.name === "Play-off da Fase Eliminatória");
  const r16Group = knockoutGroups.find((g) => g.name === "Oitavas");
  const qfGroup = knockoutGroups.find((g) => g.name === "Quartas");
  const sfGroup = knockoutGroups.find((g) => g.name === "Semifinais");
  const finalGroup = knockoutGroups.find((g) => g.name === "Final");

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
          <span className="text-gold font-medium">Fase de Liga (Suíço) + Mata-mata</span>
        </div>
        <div>
          <span className="text-muted">Times na Liga:</span>{" "}
          <span className="font-medium">{leagueConfig.totalTeams}</span>
        </div>
        <div>
          <span className="text-muted">Jogos/time:</span>{" "}
          <span className="font-medium">{config.leaguePhaseMatches}</span>
        </div>
        <div>
          <span className="text-muted">Partidas (Liga):</span>{" "}
          <span className="text-gold">{finishedCount} jogadas</span>
          <span className="text-muted"> / </span>
          <span className="text-muted">{scheduledCount} agendadas</span>
        </div>
      </div>

      {isUefaComp && leagueGroup && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold gold-text">Fase de Liga — Tabela Unificada</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <SimulateButton
                competitionId={competition.id}
                phase="league-phase"
                label="Simular Fase de Liga"
              />
              {scheduledCount === 0 && !hasKnockout && (
                <SimulateButton
                  competitionId={competition.id}
                  phase="generate-knockout"
                  label="Gerar Mata-mata"
                />
              )}
            </div>
          </div>

          {rounds.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-muted">Rodadas:</span>
              {rounds.map((r) => {
                const roundMatches = allLeagueMatches.filter((m) => m.round === r);
                const roundFinished = roundMatches.filter((m) => m.status === "finished").length;
                return (
                  <span
                    key={r}
                    className={`text-xs px-2 py-1 rounded-full font-medium ${
                      roundFinished === roundMatches.length
                        ? "bg-green-500/15 text-green-400"
                        : "bg-blue-deep text-muted"
                    }`}
                  >
                    {r} ({roundFinished}/{roundMatches.length})
                  </span>
                );
              })}
            </div>
          )}

          <div className="overflow-x-auto">
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
                {leagueGroup.standings.map((s, idx) => {
                  const pos = s.position || idx + 1;
                  const isDirect = pos <= leagueConfig.directR16;
                  const isPlayoff = pos > leagueConfig.directR16 && pos <= leagueConfig.knockoutPlayoffEnd;
                  const isEliminated = pos >= leagueConfig.eliminatedStart;

                  const rowColor = isDirect
                    ? "bg-green-500/5"
                    : isPlayoff
                    ? "bg-orange-500/5"
                    : isEliminated
                    ? "bg-red-500/5"
                    : "";

                  return (
                    <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-white/5 ${rowColor}`}>
                      <td className="p-3">
                        <span
                          className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold ${
                            isDirect
                              ? "bg-green-500/20 text-green-400"
                              : isPlayoff
                              ? "bg-orange-500/20 text-orange-400"
                              : isEliminated
                              ? "bg-red-500/20 text-red-400"
                              : "text-muted"
                          }`}
                        >
                          {pos}
                        </span>
                      </td>
                      <td className="p-3 font-medium">
                        <div className="flex items-center gap-2">
                          {s.club?.emblem && (
                            <img src={s.club.emblem} alt="" className="w-5 h-5 rounded object-contain" />
                          )}
                          {s.club?.name || "—"}
                        </div>
                      </td>
                      <td className="p-3 text-center">{s.played}</td>
                      <td className="p-3 text-center">{s.wins}</td>
                      <td className="p-3 text-center">{s.draws}</td>
                      <td className="p-3 text-center">{s.losses}</td>
                      <td className="p-3 text-center">{s.goalsFor}</td>
                      <td className="p-3 text-center">{s.goalsAgainst}</td>
                      <td className="p-3 text-center">{s.goalsDiff > 0 ? `+${s.goalsDiff}` : s.goalsDiff}</td>
                      <td className="p-3 text-center font-bold gold-text">{s.points}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted flex-wrap">
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500/40"></span>
              1º–8º: Oitavas direto
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500/40"></span>
              9º–24º: Play-off eliminatório
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500/40"></span>
              25º–36º: Eliminados
            </span>
          </div>
        </div>
      )}

      {isUefaComp && leagueGroup && leagueGroup.matches.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold gold-text mb-4">Partidas da Fase de Liga</h2>
          {rounds.map((r) => {
            const roundMatches = leagueGroup.matches.filter((m) => m.round === r);
            return (
              <div key={r} className="mb-4">
                <h3 className="text-xs uppercase text-muted mb-2">Rodada {r}</h3>
                <div className="space-y-1">
                  {roundMatches.map((m) => (
                    <div
                      key={m.id}
                      className="glass rounded-lg p-2.5 flex items-center justify-between text-sm"
                    >
                      <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
                      <span className="px-3 py-1 bg-blue-deep rounded gold-border font-bold min-w-[70px] text-center">
                        {m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}
                      </span>
                      <span className="flex-1 truncate pl-2">{m.awayTeam?.name || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {koPlayoffGroup && (
        <KnockoutSection
          group={koPlayoffGroup}
          title="Play-off da Fase Eliminatória"
          competitionId={competition.id}
          phase="KO-Playoff"
          twoLegs
        />
      )}
      {r16Group && (
        <KnockoutSection
          group={r16Group}
          title="Oitavas de Final"
          competitionId={competition.id}
          phase="Oitavas"
          twoLegs
        />
      )}
      {qfGroup && (
        <KnockoutSection
          group={qfGroup}
          title="Quartas de Final"
          competitionId={competition.id}
          phase="Quartas"
          twoLegs
        />
      )}
      {sfGroup && (
        <KnockoutSection
          group={sfGroup}
          title="Semifinais"
          competitionId={competition.id}
          phase="Semifinais"
          twoLegs
        />
      )}
      {finalGroup && (
        <KnockoutSection
          group={finalGroup}
          title="Grande Final"
          competitionId={competition.id}
          phase="Final"
        />
      )}

      {isUefaComp && hasKnockout && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold gold-text">Simulação do Mata-Mata</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <SimulateButton
                competitionId={competition.id}
                phase="Oitavas"
                label="Simular Oitavas"
              />
              <SimulateButton
                competitionId={competition.id}
                phase="Quartas"
                label="Simular Quartas"
              />
              <SimulateButton
                competitionId={competition.id}
                phase="Semifinais"
                label="Simular Semifinais"
              />
              <SimulateButton
                competitionId={competition.id}
                phase="Final"
                label="Simular Final"
              />
            </div>
          </div>
        </div>
      )}

      {isUefaComp && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold gold-text mb-4">Simulação Completa</h2>
          <p className="text-muted text-sm mb-3">
            Simula toda a competição automaticamente: Fase de Liga completa, geração do mata-mata
            e todos os rounds eliminatórios até a final.
          </p>
          <SimulateButton
            competitionId={competition.id}
            phase="full"
            label="Simular Competição Completa"
          />
        </div>
      )}
    </div>
  );
}

function KnockoutSection({
  group,
  title,
  competitionId,
  phase,
  twoLegs,
}: {
  group: {
    id: string;
    name: string;
    matches: Array<{
      id: string;
      homeTeamId: string | null;
      awayTeamId: string | null;
      homeScore: number | null;
      awayScore: number | null;
      round: string | null;
      status: string;
      homeTeam: { name: string; emblem: string } | null;
      awayTeam: { name: string; emblem: string } | null;
    }>;
  };
  title: string;
  competitionId: string;
  phase: string;
  twoLegs?: boolean;
}) {
  const rounds = [...new Set(group.matches.map((m) => m.round || "").filter(Boolean))].sort();

  return (
    <div className="glass rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-bold gold-text mb-4">{title}</h2>
      {rounds.map((r) => (
        <div key={r} className="mb-4">
          {twoLegs && <h3 className="text-xs uppercase text-muted mb-2">{r}</h3>}
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
      {!twoLegs && (
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
