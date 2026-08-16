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
  if (!Number.isFinite(n) || n < 0) return fallback;
  return Math.min(n, 100);
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

  if (typeof reportId !== "string" || !reportId) {
    return NextResponse.json({ error: "reportId required" }, { status: 400 });
  }

  const report = await prisma.matchReport.findUnique({ where: { id: reportId } });
  if (!report) {
    return NextResponse.json({ error: "Report not found" }, { status: 404 });
  }

  const finalRed = toScore(redScore ?? report.redScore);
  const finalBlue = toScore(blueScore ?? report.blueScore);

  await prisma.matchReport.update({
    where: { id: reportId },
    data: {
      redScore: finalRed,
      blueScore: finalBlue,
      redPossession: toPercentage(redPossession ?? report.redPossession, report.redPossession),
      bluePossession: toPercentage(bluePossession ?? report.bluePossession, report.bluePossession),
      mvpPlayerName:
        typeof mvpPlayerName === "string" ? mvpPlayerName.slice(0, 60) : undefined,
      mvpRating:
        typeof mvpRating === "number" && Number.isFinite(mvpRating)
          ? Math.max(0, Math.min(10, mvpRating))
          : undefined,
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
        homeScore: finalRed,
        awayScore: finalBlue,
        status: "finished",
        isSimulated: false,
      },
    });

    await prisma.log.create({
      data: {
        action: "MATCH_FINISHED_VIA_HX",
        entity: "Match",
        entityId: report.matchId,
        details: `${report.redTeamName} ${finalRed} x ${finalBlue} ${report.blueTeamName}`,
      },
    });
  }

  return NextResponse.json({ success: true });
}
