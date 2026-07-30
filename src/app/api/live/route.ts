import { NextRequest } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const competitionId = searchParams.get("competitionId");

  if (!competitionId) {
    return new Response("competitionId required", { status: 400 });
  }

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      const sendData = async () => {
        try {
          const competition = await prisma.competition.findUnique({
            where: { id: competitionId },
            include: {
              groups: {
                include: {
                  standings: {
                    include: { club: true },
                    orderBy: [
                      { points: "desc" },
                      { wins: "desc" },
                      { goalsDiff: "desc" },
                      { goalsFor: "desc" },
                    ],
                  },
                  matches: {
                    include: { homeTeam: true, awayTeam: true },
                    orderBy: { matchDate: "asc" },
                  },
                },
              },
            },
          });

          const stats = await prisma.matchStat.groupBy({
            by: ["playerId"],
            where: { match: { group: { competitionId } } },
            _sum: { goals: true, assists: true, powerShots: true },
            orderBy: [{ _sum: { goals: "desc" } }],
            take: 10,
          });

          const allMatches = competition?.groups.flatMap((g) => g.matches) ?? [];
          const finished = allMatches.filter((m) => m.status === "finished");
          const scheduled = allMatches.filter((m) => m.status === "scheduled");

          const data = {
            competition: competition
              ? {
                  name: competition.name,
                  format: competition.format,
                  numTeams: competition.numTeams,
                  relegated: competition.relegated,
                  qualifiedLibertadores: competition.qualifiedLibertadores,
                }
              : null,
            groups: competition?.groups.map((g) => ({
              id: g.id,
              name: g.name,
              standings: g.standings.map((s, idx) => ({
                clubId: s.clubId,
                clubName: s.club?.name ?? "",
                clubEmblem: s.club?.emblem ?? "",
                played: s.played,
                wins: s.wins,
                draws: s.draws,
                losses: s.losses,
                goalsFor: s.goalsFor,
                goalsAgainst: s.goalsAgainst,
                goalsDiff: s.goalsDiff,
                points: s.points,
                position: idx + 1,
              })),
              recentResults: g.matches
                .filter((m) => m.status === "finished")
                .slice(-5)
                .reverse()
                .map((m) => ({
                  id: m.id,
                  homeName: m.homeTeam?.name ?? "",
                  awayName: m.awayTeam?.name ?? "",
                  homeScore: m.homeScore,
                  awayScore: m.awayScore,
                })),
              nextMatches: g.matches
                .filter((m) => m.status === "scheduled")
                .slice(0, 5)
                .map((m) => ({
                  id: m.id,
                  homeName: m.homeTeam?.name ?? "",
                  awayName: m.awayTeam?.name ?? "",
                  round: m.round,
                })),
            })),
            topScorers: stats.slice(0, 10).map((s) => ({
              playerId: s.playerId,
              goals: s._sum.goals ?? 0,
              assists: s._sum.assists ?? 0,
            })),
            progress: {
              total: allMatches.length,
              finished: finished.length,
              scheduled: scheduled.length,
              percentage: allMatches.length > 0 ? Math.round((finished.length / allMatches.length) * 100) : 0,
            },
            timestamp: Date.now(),
          };

          controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`));
        } catch {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: true, timestamp: Date.now() })}\n\n`));
        }
      };

      await sendData();

      const interval = setInterval(sendData, 3000);

      const keepAlive = setInterval(() => {
        try {
          controller.enqueue(encoder.encode(`: keepalive\n\n`));
        } catch {
          clearInterval(interval);
          clearInterval(keepAlive);
        }
      }, 15000);

      const cleanup = () => {
        clearInterval(interval);
        clearInterval(keepAlive);
      };

      req.signal.addEventListener("abort", cleanup);
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}