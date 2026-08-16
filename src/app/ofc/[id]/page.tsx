import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { OFC_COMPETITIONS, OfcCompetitionType } from "@/lib/ofc-competitions";
import OfcSimulateButton from "@/app/ofc/OfcSimulateButton";

export const dynamic = "force-dynamic";

export async function generateStaticParams() {
  return [];
}

export default async function OfcCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
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

  const ofcType = competition.type as OfcCompetitionType;
  const config = OFC_COMPETITIONS[ofcType];
  const isOfc = ["ofc-pro-league", "ofc-champions-league"].includes(competition.type);
  const isProLeague = competition.type === "ofc-pro-league";
  const isChampionsLeague = competition.type === "ofc-champions-league";

  const regularGroup = competition.groups.find((g) => g.name === "Temporada Regular");
  const leadersGroup = competition.groups.find((g) => g.name === "Playoffs — Grupo de Líderes");
  const challengersGroup = competition.groups.find((g) => g.name === "Playoffs — Grupo de Desafiantes");
  const groupStageGroups = competition.groups.filter((g) => g.name.startsWith("Grupo"));
  const sfGroup = competition.groups.find((g) => g.name === "Semifinais");
  const finalGroup = competition.groups.find((g) => g.name === "Grande Final");

  const hasRegular = !!regularGroup;
  const hasPlayoffs = !!leadersGroup || !!challengersGroup;
  const hasGroupStage = groupStageGroups.length > 0;
  const hasKnockout = !!sfGroup || !!finalGroup;

  const allGroupMatches = (regularGroup?.matches || []).concat(groupStageGroups.flatMap((g) => g.matches));
  const rounds = [...new Set(allGroupMatches.map((m) => m.round || "").filter(Boolean))].sort(
    (a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""))
  );
  const finishedCount = allGroupMatches.filter((m) => m.status === "finished").length;
  const scheduledCount = allGroupMatches.filter((m) => m.status === "scheduled").length;

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
          <span className="text-muted">Times:</span> <span className="font-medium">{competition.numTeams}</span>
        </div>
        <div>
          <span className="text-muted">Partidas:</span>{" "}
          <span className="text-gold">{finishedCount} jogadas</span>
          <span className="text-muted"> / </span>
          <span className="text-muted">{scheduledCount} agendadas</span>
        </div>
      </div>

      {isOfc && hasRegular && (
        <StandingsSection
          groups={[regularGroup!]}
          title="Temporada Regular"
          rounds={rounds}
          allMatches={allGroupMatches}
          buttons={
            <>
              <OfcSimulateButton competitionId={competition.id} phase="regular-season" label="Simular Temporada Regular" />
              {scheduledCount === 0 && !hasPlayoffs && isProLeague && (
                <OfcSimulateButton competitionId={competition.id} action="generate-pro-league-playoffs" label="Gerar Playoffs" />
              )}
            </>
          }
        />
      )}

      {isProLeague && hasPlayoffs && (
        <>
          {leadersGroup && (
            <StandingsSection
              groups={[leadersGroup]}
              title="Playoffs — Grupo de Líderes"
              rounds={[...new Set(leadersGroup.matches.map((m) => m.round || "").filter(Boolean))].sort()}
              allMatches={leadersGroup.matches}
              buttons={
                <>
                  <OfcSimulateButton competitionId={competition.id} phase="playoffs-leaders" label="Simular Grupo de Líderes" />
                </>
              }
              highlightTop={3}
            />
          )}
          {challengersGroup && (
            <StandingsSection
              groups={[challengersGroup]}
              title="Playoffs — Grupo de Desafiantes"
              rounds={[...new Set(challengersGroup.matches.map((m) => m.round || "").filter(Boolean))].sort()}
              allMatches={challengersGroup.matches}
              buttons={
                <>
                  <OfcSimulateButton competitionId={competition.id} phase="playoffs-challengers" label="Simular Grupo de Desafiantes" />
                  {!hasKnockout && (
                    <OfcSimulateButton competitionId={competition.id} action="generate-pro-league-semifinals" label="Gerar Semifinais" />
                  )}
                </>
              }
              highlightTop={1}
            />
          )}
        </>
      )}

      {isChampionsLeague && hasGroupStage && (
        <StandingsSection
          groups={groupStageGroups}
          title="Fase de Grupos"
          rounds={[...new Set(groupStageGroups.flatMap((g) => g.matches).map((m) => m.round || "").filter(Boolean))].sort(
            (a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, ""))
          )}
          allMatches={groupStageGroups.flatMap((g) => g.matches)}
          buttons={
            <>
              <OfcSimulateButton competitionId={competition.id} phase="groups" label="Simular Fase de Grupos" />
              {groupStageGroups.flatMap((g) => g.matches).every((m) => m.status === "finished") && !hasKnockout && (
                <OfcSimulateButton competitionId={competition.id} action="generate-champions-league-semifinals" label="Gerar Semifinais" />
              )}
            </>
          }
          highlightTop={2}
        />
      )}

      {sfGroup && (
        <KnockoutSection group={sfGroup} title="Semifinais" buttons={
          <>
            <OfcSimulateButton competitionId={competition.id} phase="SF" label="Simular Semifinais" />
            {!finalGroup && (
              <OfcSimulateButton competitionId={competition.id} action="generate-final" label="Gerar Final" />
            )}
          </>
        } />
      )}

      {finalGroup && (
        <KnockoutSection group={finalGroup} title="Grande Final" buttons={
          <OfcSimulateButton competitionId={competition.id} phase="Final" label="Simular Final" />
        } />
      )}
    </div>
  );
}

function StandingsSection({
  groups,
  title,
  rounds,
  allMatches,
  buttons,
  highlightTop,
}: {
  groups: Array<{
    id: string;
    name: string;
    standings: Array<{
      id: string;
      clubId: string | null;
      club: { name: string; emblem: string } | null;
      played: number; wins: number; draws: number; losses: number;
      goalsFor: number; goalsAgainst: number; goalsDiff: number; points: number; position: number;
    }>;
    matches: Array<{
      id: string;
      homeTeam: { name: string; emblem: string } | null;
      awayTeam: { name: string; emblem: string } | null;
      homeScore: number | null;
      awayScore: number | null;
      round: string | null;
      status: string;
    }>;
  }>;
  title: string;
  rounds: string[];
  allMatches: Array<{
    id: string;
    homeTeam: { name: string; emblem: string } | null;
    awayTeam: { name: string; emblem: string } | null;
    homeScore: number | null;
    awayScore: number | null;
    round: string | null;
    status: string;
  }>;
  buttons: React.ReactNode;
  highlightTop?: number;
}) {
  const finishedCount = allMatches.filter((m) => m.status === "finished").length;
  const scheduledCount = allMatches.filter((m) => m.status === "scheduled").length;

  return (
    <div className="glass rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold gold-text">{title}</h2>
        <div className="flex items-center gap-2 flex-wrap">{buttons}</div>
      </div>

      {rounds.length > 0 && (
        <div className="flex items-center gap-2 mb-4 flex-wrap">
          <span className="text-xs text-muted">Rodadas:</span>
          {rounds.map((r) => {
            const rMatches = allMatches.filter((m) => m.round === r);
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

      <div className={`grid gap-6 ${groups.length > 1 ? "lg:grid-cols-2" : ""}`}>
        {groups.map((group) => (
          <div key={group.id}>
            {groups.length > 1 && <h3 className="text-sm font-bold text-gold mb-2">{group.name}</h3>}

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
                      const isQualified = highlightTop ? pos <= highlightTop : pos <= 2;
                      return (
                        <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-white/5 ${isQualified ? "bg-green-500/5" : ""}`}>
                          <td className="p-2">
                            <span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${isQualified ? "bg-green-500/20 text-green-400" : "text-muted"}`}>
                              {pos}
                            </span>
                          </td>
                          <td className="p-2 font-medium">
                            <div className="flex items-center gap-2">
                              {s.club?.emblem && <img src={s.club.emblem} alt="" className="w-4 h-4 rounded object-cover" />}
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
                {group.matches.slice(0, 30).map((m) => (
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
    </div>
  );
}

function KnockoutSection({
  group,
  title,
  buttons,
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
  buttons: React.ReactNode;
}) {
  return (
    <div className="glass rounded-2xl p-6 mb-8">
      <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
        <h2 className="text-lg font-bold gold-text">{title}</h2>
        <div className="flex items-center gap-2 flex-wrap">{buttons}</div>
      </div>
      <div className="space-y-2">
        {group.matches.map((m) => (
          <div key={m.id} className="glass rounded-lg p-3 flex items-center justify-between text-sm">
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
}
