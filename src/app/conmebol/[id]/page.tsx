import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { CONMEBOL_COMPETITIONS, ConmebolCompetitionType } from "@/lib/conmebol-competitions";
import ConmebolSimulateButton from "@/app/conmebol/ConmebolSimulateButton";

export const dynamic = "force-dynamic";

export async function generateStaticParams() { return []; }

export default async function ConmebolCompetitionPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const competition = await prisma.competition.findUnique({
    where: { id },
    include: {
      season: true,
      groups: {
        include: {
          standings: { include: { club: true }, orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }] },
          matches: { include: { homeTeam: true, awayTeam: true }, orderBy: [{ round: "asc" }, { matchDate: "asc" }] },
        },
      },
    },
  });

  if (!competition) notFound();

  const conmebolType = competition.type as ConmebolCompetitionType;
  const config = CONMEBOL_COMPETITIONS[conmebolType];
  const isConmebol = ["copa-libertadores", "copa-sul-americana"].includes(competition.type);
  const isLibertadores = competition.type === "copa-libertadores";
  const isSulAmericana = competition.type === "copa-sul-americana";

  const groupGroups = competition.groups.filter((g) => g.name.startsWith("Grupo"));
  const knockoutGroups = competition.groups.filter((g) => !g.name.startsWith("Grupo"));

  const allGroupMatches = groupGroups.flatMap((g) => g.matches);
  const rounds = [...new Set(allGroupMatches.map((m) => m.round || "").filter(Boolean))].sort((a, b) => parseInt(a.replace(/\D/g, "")) - parseInt(b.replace(/\D/g, "")));
  const finishedGroup = allGroupMatches.filter((m) => m.status === "finished").length;
  const scheduledGroup = allGroupMatches.filter((m) => m.status === "scheduled").length;

  const hasKnockout = knockoutGroups.length > 0;

  const preliminaryGroups = knockoutGroups.filter((g) => g.name.startsWith("Fase"));
  const poGroup = knockoutGroups.find((g) => g.name === "Play-offs da Sul-Americana");
  const r16Group = knockoutGroups.find((g) => g.name === "Oitavas de Final");
  const qfGroup = knockoutGroups.find((g) => g.name === "Quartas de Final");
  const sfGroup = knockoutGroups.find((g) => g.name === "Semifinais");
  const finalGroup = knockoutGroups.find((g) => g.name === "Grande Final");

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-2">
        <div className="w-16 h-16 rounded-xl flex items-center justify-center text-lg font-black" style={{ background: `${config.color}22`, color: config.color }}>{config.shortName}</div>
        <div>
          <h1 className="text-3xl font-black">{competition.name}</h1>
          <p className="text-muted text-sm">{competition.season?.name || "Sem temporada"}</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-8 flex flex-wrap gap-4 text-sm">
        <div><span className="text-muted">Formato:</span> <span className="text-gold font-medium">{config.groupStageGroups} grupos de {config.teamsPerGroup} + Mata-mata</span></div>
        <div><span className="text-muted">Times:</span> <span className="font-medium">{competition.numTeams}</span></div>
      </div>

      {preliminaryGroups.map((pg) => (
        <div key={pg.id} className="glass rounded-2xl p-6 mb-8">
          <h2 className="text-lg font-bold gold-text mb-4">{pg.name}</h2>
          <ConmebolSimulateButton competitionId={competition.id} phase={pg.name.startsWith("Fase 1") ? "P1" : pg.name.startsWith("Fase 2") ? "P2" : "P3"} label={`Simular ${pg.name}`} />
          <div className="space-y-1 mt-3">
            {pg.matches.map((m) => (
              <div key={m.id} className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
                <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
                <span className="px-2 py-1 bg-blue-deep rounded gold-border font-bold min-w-[70px] text-center">{m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}</span>
                <span className="flex-1 truncate pl-2">{m.awayTeam?.name || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      ))}

      {groupGroups.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-8">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-3">
            <h2 className="text-lg font-bold gold-text">Fase de Grupos</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <ConmebolSimulateButton competitionId={competition.id} phase="groups" label="Simular Fase de Grupos" />
              {scheduledGroup === 0 && !hasKnockout && isLibertadores && (
                <ConmebolSimulateButton competitionId={competition.id} action="generate-libertadores-knockout" label="Gerar Oitavas (3º → Sul-Americana)" />
              )}
              {scheduledGroup === 0 && !hasKnockout && isSulAmericana && (
                <ConmebolSimulateButton competitionId={competition.id} action="generate-sul-americana-playoffs" label="Gerar Play-offs" body={{ thirdPlaceIds: [] }} />
              )}
            </div>
          </div>

          {rounds.length > 0 && (
            <div className="flex items-center gap-2 mb-4 flex-wrap">
              <span className="text-xs text-muted">Rodadas:</span>
              {rounds.map((r) => {
                const rm = allGroupMatches.filter((m) => m.round === r);
                const rf = rm.filter((m) => m.status === "finished").length;
                return <span key={r} className={`text-xs px-2 py-1 rounded-full font-medium ${rf === rm.length ? "bg-green-500/15 text-green-400" : "bg-blue-deep text-muted"}`}>Rod. {r} ({rf}/{rm.length})</span>;
              })}
            </div>
          )}

          <div className={groupGroups.length > 4 ? "grid grid-cols-1 lg:grid-cols-2 gap-4" : "grid grid-cols-1 md:grid-cols-2 gap-4"}>
            {groupGroups.map((group) => (
              <div key={group.id}>
                <h3 className="text-sm font-bold text-gold mb-2">{group.name}</h3>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="border-b border-border">
                      <tr className="text-left text-muted text-xs">
                        <th className="p-2">#</th><th className="p-2">Time</th><th className="p-2 text-center">J</th><th className="p-2 text-center">V</th><th className="p-2 text-center">E</th><th className="p-2 text-center">D</th><th className="p-2 text-center">SG</th><th className="p-2 text-center">Pts</th>
                      </tr>
                    </thead>
                    <tbody>
                      {group.standings.map((s, idx) => {
                        const pos = s.position || idx + 1;
                        const isTop2 = pos <= 2;
                        const isThird = pos === 3;
                        return (
                          <tr key={s.id} className={`border-b border-border last:border-0 hover:bg-white/5 ${isTop2 ? "bg-green-500/5" : isThird ? "bg-orange-500/5" : ""}`}>
                            <td className="p-2"><span className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-xs font-bold ${isTop2 ? "bg-green-500/20 text-green-400" : isThird ? "bg-orange-500/20 text-orange-400" : "text-muted"}`}>{pos}</span></td>
                            <td className="p-2 font-medium"><div className="flex items-center gap-2">{s.club?.emblem && <img src={s.club.emblem} alt="" className="w-4 h-4 rounded object-contain" />}{s.club?.name || "—"}</div></td>
                            <td className="p-2 text-center">{s.played}</td><td className="p-2 text-center">{s.wins}</td><td className="p-2 text-center">{s.draws}</td><td className="p-2 text-center">{s.losses}</td><td className="p-2 text-center">{s.goalsDiff > 0 ? `+${s.goalsDiff}` : s.goalsDiff}</td><td className="p-2 text-center font-bold gold-text">{s.points}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <div className="space-y-1 mt-1">
                  {group.matches.map((m) => (
                    <div key={m.id} className="glass rounded-lg p-1.5 flex items-center justify-between text-[10px]">
                      <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
                      <span className="px-2 py-0.5 bg-blue-deep rounded font-bold min-w-[55px] text-center">{m.status === "finished" ? `${m.homeScore}-${m.awayScore}` : "vs"}</span>
                      <span className="flex-1 truncate pl-1">{m.awayTeam?.name || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 mt-3 text-[10px] text-muted flex-wrap">
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-green-500/40"></span>1º–2º: Oitavas</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-orange-500/40"></span>3º: {isLibertadores ? "Sul-Americana" : "Play-offs"}</span>
            <span className="flex items-center gap-1"><span className="inline-block w-2.5 h-2.5 rounded-full bg-red-500/40"></span>4º: Eliminado</span>
          </div>
        </div>
      )}

      {poGroup && <KOSection group={poGroup} title="Play-offs da Sul-Americana" competitionId={competition.id} phase="PO" />}
      {r16Group && <KOSection group={r16Group} title="Oitavas de Final" competitionId={competition.id} phase="R16" />}
      {qfGroup && <KOSection group={qfGroup} title="Quartas de Final" competitionId={competition.id} phase="QF" />}
      {sfGroup && <KOSection group={sfGroup} title="Semifinais" competitionId={competition.id} phase="SF" />}
      {finalGroup && <KOSection group={finalGroup} title="Grande Final" competitionId={competition.id} phase="Final" isSingle />}

      {isConmebol && hasKnockout && (
        <div className="glass rounded-2xl p-6">
          <h2 className="text-lg font-bold gold-text mb-4">Simular Fase Eliminatória</h2>
          <div className="flex items-center gap-2 flex-wrap">
            {r16Group && <ConmebolSimulateButton competitionId={competition.id} phase="R16" label="Simular Oitavas" />}
            {qfGroup && <ConmebolSimulateButton competitionId={competition.id} phase="QF" label="Simular Quartas" />}
            {sfGroup && <ConmebolSimulateButton competitionId={competition.id} phase="SF" label="Simular Semis" />}
            {finalGroup && <ConmebolSimulateButton competitionId={competition.id} phase="Final" label="Simular Final" />}
          </div>
        </div>
      )}
    </div>
  );
}

type KoMatch = {
  id: string;
  round?: string | null;
  homeTeam?: { name?: string } | null;
  awayTeam?: { name?: string } | null;
  homeScore?: number | null;
  awayScore?: number | null;
  status?: string;
};

type KoGroup = { matches: KoMatch[] };

function KOSection({ group, title, competitionId, phase, isSingle }: {
  group: KoGroup; title: string; competitionId: string; phase: string; isSingle?: boolean;
}) {
  const rounds = Array.from(new Set(group.matches.map((m) => m.round || "").filter(Boolean) as string[])).sort();
  return (
    <div className="glass rounded-2xl p-6 mb-8">
      <h2 className="text-lg font-bold gold-text mb-4">{title}</h2>
      {rounds.length > 0 ? rounds.map((r) => (
        <div key={r} className="mb-3">
          <h3 className="text-xs uppercase text-muted mb-2">{r}</h3>
          <div className="space-y-1">
            {group.matches.filter((m) => m.round === r).map((m) => (
              <div key={m.id} className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
                <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
                <span className="px-3 py-1 bg-blue-deep rounded gold-border font-bold min-w-[70px] text-center">{m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}</span>
                <span className="flex-1 truncate pl-2">{m.awayTeam?.name || "—"}</span>
              </div>
            ))}
          </div>
        </div>
      )) : (
        <div className="space-y-1">
          {group.matches.map((m) => (
            <div key={m.id} className="glass rounded-lg p-2.5 flex items-center justify-between text-sm">
              <span className="flex-1 text-right truncate">{m.homeTeam?.name || "—"}</span>
              <span className="px-3 py-1 bg-blue-deep rounded gold-border font-bold min-w-[70px] text-center">{m.status === "finished" ? `${m.homeScore} - ${m.awayScore}` : "vs"}</span>
              <span className="flex-1 truncate pl-2">{m.awayTeam?.name || "—"}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
