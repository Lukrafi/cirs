import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = await validateApiKey(req);
  if (!key) return unauthorizedResponse();

  const body = await req.json();
  const {
    reportId,
    redScore,
    blueScore,
    redPossession,
    bluePossession,
    mvpPlayerName,
    mvpRating,
    events,
    playerStats,
    teamStats,
    penaltyShootout,
  } = body;

  if (!reportId) {
    return NextResponse.json({ error: "reportId required" }, { status: 400 });
  }

  const report = await prisma.matchReport.findUnique({ where: { id: reportId } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  await prisma.matchReport.update({
    where: { id: reportId },
    data: {
      redScore: redScore ?? report.redScore,
      blueScore: blueScore ?? report.blueScore,
      redPossession: redPossession ?? report.redPossession,
      bluePossession: bluePossession ?? report.bluePossession,
      mvpPlayerName: mvpPlayerName ?? undefined,
      mvpRating: mvpRating ?? undefined,
      events: typeof events === "string" ? events : JSON.stringify(events ?? "[]"),
      playerStats: typeof playerStats === "string" ? playerStats : JSON.stringify(playerStats ?? "[]"),
      teamStats: typeof teamStats === "string" ? teamStats : JSON.stringify(teamStats ?? "[]"),
      penaltyShootout: typeof penaltyShootout === "string" ? penaltyShootout : JSON.stringify(penaltyShootout ?? "{}"),
    },
  });

  if (report.matchId) {
    await prisma.match.update({
      where: { id: report.matchId },
      data: {
        homeScore: redScore ?? undefined,
        awayScore: blueScore ?? undefined,
        status: "finished",
        isSimulated: false,
      },
    });

    await prisma.log.create({
      data: {
        action: "MATCH_FINISHED_VIA_HX",
        entity: "Match",
        entityId: report.matchId,
        details: `${report.redTeamName} ${redScore} x ${blueScore} ${report.blueTeamName}`,
      },
    });
  }

  return NextResponse.json({ success: true });
}