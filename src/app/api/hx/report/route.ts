import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function toScore(v: unknown): number {
  const n = typeof v === "number" ? v : parseInt(String(v), 10);
  if (!Number.isFinite(n) || n < 0) return 0;
  return Math.min(Math.floor(n), 999);
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

  const events = JSON.stringify(matchLog?.events ?? []);
  const playerStats = JSON.stringify(seasonStats);
  const teamStats = JSON.stringify(cards);
  const penaltyShootout = JSON.stringify({ competition });

  const mvpPlayerName =
    typeof matchLog?.mvp === "string" ? matchLog.mvp.slice(0, 60) : undefined;
  const mvpRating =
    typeof matchLog?.mvpRating === "number" && Number.isFinite(matchLog.mvpRating)
      ? Math.max(0, Math.min(10, matchLog.mvpRating))
      : 0;

  const report = await prisma.matchReport.create({
    data: {
      apiKeyId: key.id,
      redTeamName: red,
      blueTeamName: blue,
      redScore,
      blueScore,
      redPossession: 50,
      bluePossession: 50,
      mvpPlayerName,
      mvpRating,
      events,
      playerStats,
      teamStats,
      penaltyShootout,
    },
  });

  await prisma.log.create({
    data: {
      action: "MATCH_REPORT_RECEIVED",
      entity: "MatchReport",
      entityId: report.id,
      details: `${red} ${redScore} x ${blueScore} ${blue}${competition ? ` (${competition})` : ""}`,
    },
  });

  return NextResponse.json({ success: true, reportId: report.id });
}
