import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

// GET: lista competições de uma season com informações extras
export async function GET(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const { searchParams } = new URL(req.url);
  const seasonId = searchParams.get("seasonId");

  if (!seasonId) {
    return NextResponse.json({ error: "seasonId required" }, { status: 400 });
  }

  const competitions = await prisma.competition.findMany({
    where: { seasonId },
    include: {
      groups: {
        include: {
          matches: {
            select: { id: true, status: true, isSimulated: true },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const result = competitions.map((c) => {
    const allMatches = c.groups.flatMap((g) => g.matches);
    return {
      id: c.id,
      name: c.name,
      type: c.type,
      isSimulated: c.isSimulated,
      isKnockout: c.isKnockout,
      format: c.format,
      numTeams: c.numTeams,
      totalMatches: allMatches.length,
      scheduledMatches: allMatches.filter((m) => m.status === "scheduled").length,
      finishedMatches: allMatches.filter((m) => m.status === "finished").length,
    };
  });

  return NextResponse.json(result);
}

// PATCH: ações em massa
export async function PATCH(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const action = body.action as string;

  // Toggle isSimulated em uma ou mais competições
  if (action === "toggle-simulated") {
    const ids = Array.isArray(body.ids) ? body.ids : body.id ? [body.id] : [];
    const isSimulated = body.isSimulated as boolean;

    if (ids.length === 0) {
      return NextResponse.json({ error: "ids required" }, { status: 400 });
    }

    await prisma.competition.updateMany({
      where: { id: { in: ids } },
      data: { isSimulated },
    });

    return NextResponse.json({ success: true, updated: ids.length });
  }

  // Toggle isSimulated para TODAS as competições de uma season
  if (action === "toggle-all-simulated") {
    const seasonId = body.seasonId as string;
    const isSimulated = body.isSimulated as boolean;

    if (!seasonId) {
      return NextResponse.json({ error: "seasonId required" }, { status: 400 });
    }

    const result = await prisma.competition.updateMany({
      where: { seasonId },
      data: { isSimulated },
    });

    return NextResponse.json({ success: true, updated: result.count });
  }

  // Editar competição
  if (action === "edit-competition") {
    const id = body.id as string;
    if (!id) {
      return NextResponse.json({ error: "id required" }, { status: 400 });
    }

    const data: Record<string, unknown> = {};
    if (typeof body.name === "string") data.name = body.name;
    if (typeof body.numTeams === "number") data.numTeams = body.numTeams;
    if (typeof body.numTurns === "number") data.numTurns = body.numTurns;
    if (typeof body.isKnockout === "boolean") data.isKnockout = body.isKnockout;
    if (typeof body.format === "string") data.format = body.format;
    if (typeof body.promoted === "number") data.promoted = body.promoted;
    if (typeof body.relegated === "number") data.relegated = body.relegated;
    if (typeof body.pointsPerWin === "number") data.pointsPerWin = body.pointsPerWin;
    if (typeof body.pointsPerDraw === "number") data.pointsPerDraw = body.pointsPerDraw;

    await prisma.competition.update({ where: { id }, data });
    return NextResponse.json({ success: true });
  }

  // Editar placar de uma partida
  if (action === "edit-score") {
    const matchId = body.matchId as string;
    const homeScore = body.homeScore as number;
    const awayScore = body.awayScore as number;

    if (!matchId || homeScore == null || awayScore == null) {
      return NextResponse.json({ error: "matchId, homeScore, awayScore required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: Math.max(0, Math.min(99, Math.floor(homeScore))),
        awayScore: Math.max(0, Math.min(99, Math.floor(awayScore))),
        status: "finished",
      },
    });

    return NextResponse.json({ success: true });
  }

  // Cancelar simulação (volta a scheduled)
  if (action === "cancel-simulation") {
    const matchId = body.matchId as string;

    if (!matchId) {
      return NextResponse.json({ error: "matchId required" }, { status: 400 });
    }

    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (!match) {
      return NextResponse.json({ error: "Match not found" }, { status: 404 });
    }

    // Só cancela se foi simulado
    await prisma.match.update({
      where: { id: matchId },
      data: {
        homeScore: null,
        awayScore: null,
        status: "scheduled",
        isSimulated: false,
      },
    });

    // Remove stats da partida
    await prisma.matchStat.deleteMany({ where: { matchId } });

    return NextResponse.json({ success: true });
  }

  // Cancelar simulação de TODAS as partidas de uma competição
  if (action === "cancel-all-simulation") {
    const competitionId = body.competitionId as string;

    if (!competitionId) {
      return NextResponse.json({ error: "competitionId required" }, { status: 400 });
    }

    const groups = await prisma.group.findMany({
      where: { competitionId },
      select: { id: true },
    });
    const groupIds = groups.map((g) => g.id);

    const matches = await prisma.match.findMany({
      where: { groupId: { in: groupIds }, isSimulated: true },
      select: { id: true },
    });

    for (const m of matches) {
      await prisma.match.update({
        where: { id: m.id },
        data: { homeScore: null, awayScore: null, status: "scheduled", isSimulated: false },
      });
      await prisma.matchStat.deleteMany({ where: { matchId: m.id } });
    }

    // Zera standings
    await prisma.standing.updateMany({
      where: { groupId: { in: groupIds } },
      data: { points: 0, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, goalsDiff: 0 },
    });

    return NextResponse.json({ success: true, cancelled: matches.length });
  }

  return NextResponse.json({ error: "Unknown action" }, { status: 400 });
}
