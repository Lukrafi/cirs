import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";
import MatchHeader from "@/components/match/MatchHeader";
import MatchEvents from "@/components/match/MatchEvents";
import MatchStatistics from "@/components/match/MatchStatistics";
import MatchFormation from "@/components/match/MatchFormation";
import MatchLineup from "@/components/match/MatchLineup";

export const dynamic = "force-dynamic";

interface MatchReportData {
  competition?: string;
  formations?: { red?: string; blue?: string };
  red?: string;
  blue?: string;
  score?: { red?: number; blue?: number };
  matchLog?: {
    events?: Array<{
      time: string;
      type: string;
      msg: string;
      team: number;
    }>;
    mvp?: string;
    mvpRating?: number;
  };
  possession?: { red?: number; blue?: number };
  teamStats?: {
    red?: {
      shots?: number;
      xg?: number;
      corners?: number;
      blocks?: number;
      interceptions?: number;
      saves?: number;
      fastestShotKmh?: number;
    };
    blue?: {
      shots?: number;
      xg?: number;
      corners?: number;
      blocks?: number;
      interceptions?: number;
      saves?: number;
      fastestShotKmh?: number;
    };
  };
  playerMatchStats?: Array<{
    id: string;
    name: string;
    team: number;
    position: string;
    goals: number;
    ownGoals: number;
    assists: number;
    shots: number;
    xg: number;
    blocks: number;
    saves: number;
    interceptions: number;
    corners: number;
    penSaves: number;
    penMissed: number;
    penaltiesConceded: number;
    goalsConceded: number;
    rating: number;
    yellowCards: number;
    redCard: boolean;
  }>;
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const match = await prisma.match.findUnique({
    where: { id },
    include: {
      homeTeam: { select: { id: true, name: true, emblem: true, city: true, country: true } },
      awayTeam: { select: { id: true, name: true, emblem: true, city: true, country: true } },
      group: { include: { competition: { select: { name: true, type: true } } } },
      reports: { orderBy: { createdAt: "desc" }, take: 1 },
      matchStats: {
        include: { player: { select: { id: true, name: true, position: true } } },
      },
    },
  });

  if (!match) notFound();

  const report = match.reports?.[0];
  let reportData: MatchReportData = {};

  if (report) {
    try {
      reportData = JSON.parse(report.penaltyShootout || "{}");
    } catch {}

    // Parse teamStats (agora é stats do time, não cards)
    try {
      const ts = JSON.parse(report.teamStats || "{}");
      reportData.teamStats = ts;
    } catch {}

    // Parse possession
    reportData.possession = {
      red: report.redPossession,
      blue: report.bluePossession,
    };

    // Parse events
    try {
      const events = JSON.parse(report.events || "[]");
      if (!reportData.matchLog) reportData.matchLog = {};
      reportData.matchLog.events = events;
    } catch {}

    reportData.matchLog = {
      ...reportData.matchLog,
      mvp: report.mvpPlayerName ?? undefined,
      mvpRating: report.mvpRating || undefined,
    };

    // Parse playerMatchStats
    try {
      const ps = JSON.parse(report.playerStats || "[]");
      if (Array.isArray(ps)) {
        reportData.playerMatchStats = ps;
      }
    } catch {}
  }

  // Se não tem report mas tem matchStats do banco
  const hasBankStats = match.matchStats.length > 0;

  const isFinished = match.status === "finished";
  const isLive = match.status === "live";
  const isScheduled = match.status === "scheduled";
  const competitionName = match.group?.competition?.name ?? reportData.competition ?? "";

  return (
    <div className="min-h-screen pb-20">
      {/* Header da Partida */}
      <MatchHeader
        homeTeam={{
          name: match.homeTeam?.name ?? "TBD",
          emblem: match.homeTeam?.emblem ?? "",
        }}
        awayTeam={{
          name: match.awayTeam?.name ?? "TBD",
          emblem: match.awayTeam?.emblem ?? "",
        }}
        homeScore={match.homeScore ?? reportData.score?.red ?? 0}
        awayScore={match.awayScore ?? reportData.score?.blue ?? 0}
        status={match.status}
        competition={competitionName}
        round={match.round ?? undefined}
        matchDate={match.matchDate}
        isSimulated={match.isSimulated}
        mvp={
          reportData.matchLog?.mvp
            ? { name: reportData.matchLog.mvp, rating: reportData.matchLog.mvpRating ?? 0 }
            : undefined
        }
      />

      {/* Tabs */}
      <div className="max-w-5xl mx-auto px-4 mt-6">
        <div className="flex gap-1 overflow-x-auto pb-2 border-b border-border">
          {["formacoes", "estatisticas", "escalacao", "eventos"].map((tab) => (
            <a
              key={tab}
              href={`#${tab}`}
              className="px-4 py-2 text-sm font-medium text-muted hover:text-foreground transition-colors whitespace-nowrap"
            >
              {tab === "formacoes"
                ? "Formações"
                : tab === "estatisticas"
                ? "Estatísticas"
                : tab === "escalacao"
                ? "Escalação"
                : "Eventos"}
            </a>
          ))}
        </div>
      </div>

      {/* Conteúdo */}
      <div className="max-w-5xl mx-auto px-4 mt-6 space-y-8">
        {/* Formações */}
        {isFinished && (reportData.playerMatchStats?.length ?? 0) > 0 && (
          <section id="formacoes">
            <MatchFormation
              homeTeamName={match.homeTeam?.name ?? "TBD"}
              awayTeamName={match.awayTeam?.name ?? "TBD"}
              homeFormation={reportData.formations?.red ?? "padrao"}
              awayFormation={reportData.formations?.blue ?? "padrao"}
              homePlayers={
                reportData.playerMatchStats
                  ?.filter((p) => p.team === 1 && p.position !== "RES" && p.position !== "COACH")
                  .map((p) => ({
                    name: p.name,
                    position: p.position,
                    rating: p.rating,
                    goals: p.goals,
                    assists: p.assists,
                  })) ?? []
              }
              awayPlayers={
                reportData.playerMatchStats
                  ?.filter((p) => p.team === 2 && p.position !== "RES" && p.position !== "COACH")
                  .map((p) => ({
                    name: p.name,
                    position: p.position,
                    rating: p.rating,
                    goals: p.goals,
                    assists: p.assists,
                  })) ?? []
              }
            />
          </section>
        )}

        {/* Estatísticas */}
        {isFinished && reportData.possession && (
          <section id="estatisticas">
            <MatchStatistics
              possession={reportData.possession}
              teamStats={reportData.teamStats}
              homeTeamName={match.homeTeam?.name ?? "TBD"}
              awayTeamName={match.awayTeam?.name ?? "TBD"}
            />
          </section>
        )}

        {/* Escalação */}
        {isFinished && (reportData.playerMatchStats?.length ?? 0) > 0 && (
          <section id="escalacao">
            <MatchLineup
              homePlayers={
                reportData.playerMatchStats?.filter((p) => p.team === 1) ?? []
              }
              awayPlayers={
                reportData.playerMatchStats?.filter((p) => p.team === 2) ?? []
              }
              homeTeamName={match.homeTeam?.name ?? "TBD"}
              awayTeamName={match.awayTeam?.name ?? "TBD"}
            />
          </section>
        )}

        {/* Eventos */}
        {isFinished && (reportData.matchLog?.events?.length ?? 0) > 0 && (
          <section id="eventos">
            <MatchEvents
              events={reportData.matchLog?.events ?? []}
              homeTeamName={match.homeTeam?.name ?? "TBD"}
              awayTeamName={match.awayTeam?.name ?? "TBD"}
            />
          </section>
        )}

        {/* Mensagem quando não há dados */}
        {isFinished && !report && !hasBankStats && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-muted text-sm">
              Esta partida não possui dados detalhados disponíveis.
            </p>
          </div>
        )}

        {/* Partida agendada */}
        {isScheduled && (
          <div className="glass rounded-2xl p-8 text-center">
            <p className="text-gold font-semibold mb-2">Partida Agendada</p>
            <p className="text-muted text-sm">
              {match.matchDate
                ? `Data: ${formatDate(match.matchDate)}`
                : "Data a definir"}
            </p>
          </div>
        )}

        {/* Partida ao vivo */}
        {isLive && (
          <div className="glass rounded-2xl p-8 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
              <p className="text-red-400 font-semibold">AO VIVO</p>
            </div>
            <p className="text-muted text-sm">Acompanhe a partida no servidor HaxBall</p>
          </div>
        )}
      </div>
    </div>
  );
}
