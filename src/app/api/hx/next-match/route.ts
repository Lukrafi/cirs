import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const key = await validateApiKey(req);
  if (!key) return unauthorizedResponse();

  const setting = await prisma.settings.findUnique({
    where: { key: "active_competition" },
  });

  const activeCompetition = setting?.value;
  if (!activeCompetition) {
    return NextResponse.json({
      error: "No active competition set. Use POST /api/hx/active-competition first.",
      hasMatch: false,
    });
  }

  const competitions = await prisma.competition.findMany({
    include: {
      groups: {
        include: {
          matches: {
            where: { status: "scheduled", isSimulated: false },
            include: {
              homeTeam: { select: { id: true, name: true, emblem: true } },
              awayTeam: { select: { id: true, name: true, emblem: true } },
            },
            orderBy: [{ round: "asc" }, { matchDate: "asc" }],
          },
        },
      },
    },
  });

  const competition = competitions.find(
    (c) => c.name.toLowerCase() === activeCompetition.toLowerCase()
  );

  if (!competition) {
    return NextResponse.json({
      error: `Competition "${activeCompetition}" not found in database.`,
      hasMatch: false,
      activeCompetition,
    });
  }

  for (const group of competition.groups) {
    if (group.matches.length > 0) {
      const match = group.matches[0];
      return NextResponse.json({
        hasMatch: true,
        activeCompetition: competition.name,
        match: {
          id: match.id,
          homeTeam: match.homeTeam,
          awayTeam: match.awayTeam,
          round: match.round,
          matchDate: match.matchDate,
          isKnockout: match.isKnockout,
          groupName: group.name,
          competitionName: competition.name,
        },
      });
    }
  }

  const allScheduled = await prisma.match.count({
    where: {
      group: { competitionId: competition.id },
      status: "scheduled",
      isSimulated: false,
    },
  });

  return NextResponse.json({
    hasMatch: false,
    activeCompetition: competition.name,
    message: allScheduled === 0
      ? "All matches in this competition have been played."
      : "No more scheduled matches found.",
    remainingMatches: allScheduled,
  });
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

  const matchId = typeof body.matchId === "string" ? body.matchId : null;
  if (!matchId) {
    return NextResponse.json({ error: "matchId required" }, { status: 400 });
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { select: { name: true } },
      awayTeam: { select: { name: true } },
    },
  });

  if (!match) {
    return NextResponse.json({ error: "Match not found" }, { status: 404 });
  }

  await prisma.match.update({
    where: { id: matchId },
    data: { status: "live" },
  });

  await prisma.log.create({
    data: {
      action: "MATCH_STARTED_VIA_SCRIPT",
      entity: "Match",
      entityId: matchId,
      details: `${match.homeTeam?.name ?? "TBD"} vs ${match.awayTeam?.name ?? "TBD"} - set to live by script`,
      adminId: key.id,
    },
  });

  return NextResponse.json({
    success: true,
    match: {
      id: match.id,
      homeTeam: match.homeTeam?.name ?? "TBD",
      awayTeam: match.awayTeam?.name ?? "TBD",
      status: "live",
    },
  });
}
