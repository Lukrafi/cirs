import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toScore(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 999);
}

function toPercentage(v: unknown, fallback: number): number {
  const n = typeof v === "number" ? v : parseFloat(String(v));
  if (!Number.isFinite(n) || n < 0 || n > 100) return fallback;
  return Math.round(n);
}

export async function POST(req: NextRequest) {
  const key = await validateApiKey(req);
  if (!key) return unauthorizedResponse();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const red = typeof body.red === "string" ? body.red.trim().slice(0, 60)
    : typeof body.redTeamName === "string" ? body.redTeamName.trim().slice(0, 60) : "";
  const blue = typeof body.blue === "string" ? body.blue.trim().slice(0, 60)
    : typeof body.blueTeamName === "string" ? body.blueTeamName.trim().slice(0, 60) : "";

  if (!red || !blue) {
    return NextResponse.json({ error: "Team names (red/blue) required" }, { status: 400 });
  }

  const score = body.score as { red?: unknown; blue?: unknown } | undefined;
  const redScore = toScore(score?.red);
  const blueScore = toScore(score?.blue);

  const matchLog = body.matchLog as
    | { events?: unknown[]; mvp?: unknown; mvpRating?: unknown; startTime?: unknown }
    | null;

  const seasonStats = body.seasonStats ?? {};
  const cards = body.cards ?? {};
  const competition = typeof body.competition === "string" ? body.competition.slice(0, 100) : null;

  // ----- NOVOS CAMPOS: dados completos da partida -----
  const playerMatchStats = body.playerMatchStats ?? [];
  const possession = body.possession as { red?: number; blue?: number } | undefined;
  const formations = body.formations as { red?: string; blue?: string } | undefined;
  const teamStatsData = body.teamStats as { red?: Record<string, unknown>; blue?: Record<string, unknown> } | undefined;

  const redPossession = toPercentage(possession?.red, 50);
  const bluePossession = toPercentage(possession?.blue, 50);

  const events = JSON.stringify(matchLog?.events ?? []);

  // ----- playerStats agora guarda as estatísticas POR JOGADOR da partida (não mais temporada) -----
  const playerStatsJson = JSON.stringify(playerMatchStats);

  // ----- teamStats guarda as estatísticas do time (chutes, xG, escanteios, etc.) -----
  const teamStatsJson = JSON.stringify(teamStatsData ?? {});

  // ----- penaltyShootout guarda competição + formações (repurposed field) -----
  const penaltyShootout = JSON.stringify({
    competition,
    formations: formations ?? { red: "padrao", blue: "padrao" },
  });

  const mvpPlayerName =
    typeof matchLog?.mvp === "string" ? matchLog.mvp.slice(0, 60) : undefined;
  const mvpRating =
    typeof matchLog?.mvpRating === "number" && Number.isFinite(matchLog.mvpRating)
      ? Math.max(0, Math.min(10, matchLog.mvpRating))
      : 0;

  // ----- Tenta linkar com um Match existente -----
  let matchId = typeof body.matchId === "string" ? body.matchId : null;

  if (!matchId) {
    // Busca um Match agendado com os mesmos nomes de time
    const scheduledMatches = await prisma.match.findMany({
      where: {
        status: "scheduled",
        isSimulated: false,
      },
      include: {
        homeTeam: { select: { name: true } },
        awayTeam: { select: { name: true } },
      },
      orderBy: { matchDate: "asc" },
    });
    const found = scheduledMatches.find(
      (m) =>
        m.homeTeam?.name?.toLowerCase() === red.toLowerCase() &&
        m.awayTeam?.name?.toLowerCase() === blue.toLowerCase()
    );
    if (found) {
      matchId = found.id;
    }
  }

  const report = await prisma.matchReport.create({
    data: {
      apiKeyId: key.id,
      matchId: matchId ?? undefined,
      redTeamName: red,
      blueTeamName: blue,
      redScore,
      blueScore,
      redPossession,
      bluePossession,
      mvpPlayerName,
      mvpRating,
      events,
      playerStats: playerStatsJson,
      teamStats: teamStatsJson,
      penaltyShootout,
    },
  });

  // ----- Se linkou a um Match, atualiza o status e cria MatchStat records -----
  if (matchId) {
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: redScore,
        awayScore: blueScore,
        status: "finished",
        isSimulated: false,
      },
    });

    // ----- Cria MatchStat records para cada jogador -----
    const match = await prisma.match.findUnique({
      where: { id: matchId },
      select: { homeTeamId: true, awayTeamId: true },
    });

    if (match && Array.isArray(playerMatchStats)) {
      for (const ps of playerMatchStats) {
        if (typeof ps !== "object" || ps === null) continue;

        const playerName = typeof ps.name === "string" ? ps.name : "";
        const playerTeam = typeof ps.team === "number" ? ps.team : 0;
        const clubId = playerTeam === 1 ? match.homeTeamId : playerTeam === 2 ? match.awayTeamId : null;

        // Tenta encontrar o jogador pelo nome
        const player = await prisma.player.findFirst({
          where: { name: playerName },
          select: { id: true },
        });

        await prisma.matchStat.create({
          data: {
            matchId,
            playerId: player?.id ?? undefined,
            clubId: clubId ?? undefined,
            goals: typeof ps.goals === "number" ? ps.goals : 0,
            assists: typeof ps.assists === "number" ? ps.assists : 0,
            shots: typeof ps.shots === "number" ? ps.shots : 0,
            shotsOnTarget: typeof ps.shots === "number" ? ps.shots : 0,
            interceptions: typeof ps.interceptions === "number" ? ps.interceptions : 0,
            saves: typeof ps.saves === "number" ? ps.saves : 0,
            tackles: typeof ps.blocks === "number" ? ps.blocks : 0,
            yellowCards: typeof ps.yellowCards === "number" ? ps.yellowCards : 0,
            redCards: typeof ps.redCard === "boolean" && ps.redCard ? 1 : 0,
            mvp: typeof ps.rating === "number" && ps.rating >= 7.0,
            rating: typeof ps.rating === "number" ? Math.round(ps.rating * 10) / 10 : 6.0,
            cleanSheet: typeof ps.saves === "number" && ps.saves > 0,
          },
        });
      }
    }

    await prisma.log.create({
      data: {
        action: "MATCH_FINISHED_VIA_HX",
        entity: "Match",
        entityId: matchId,
        details: `${red} ${redScore} x ${blueScore} ${blue}${competition ? ` (${competition})` : ""}`,
      },
    });
  }

  await prisma.log.create({
    data: {
      action: "MATCH_REPORT_RECEIVED",
      entity: "MatchReport",
      entityId: report.id,
      details: `${red} ${redScore} x ${blueScore} ${blue}${competition ? ` (${competition})` : ""}`,
    },
  });

  return NextResponse.json({ success: true, reportId: report.id, matchId });
}
