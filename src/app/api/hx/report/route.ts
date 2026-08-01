import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = await validateApiKey(req);
  if (!key) return unauthorizedResponse();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const red = String(body.red ?? body.redTeamName ?? "");
  const blue = String(body.blue ?? body.blueTeamName ?? "");

  if (!red || !blue) {
    return NextResponse.json({ error: "Team names (red/blue) required" }, { status: 400 });
  }

  const score = body.score as { red?: number; blue?: number } | undefined;
  const redScore = score?.red ?? 0;
  const blueScore = score?.blue ?? 0;

  const matchLog = body.matchLog as
    | { events?: unknown[]; mvp?: string; mvpRating?: number; startTime?: string }
    | null;

  const seasonStats = body.seasonStats ?? {};
  const cards = body.cards ?? {};
  const competition = body.competition as string | null;

  const events = JSON.stringify(matchLog?.events ?? []);
  const playerStats = JSON.stringify(seasonStats);
  const teamStats = JSON.stringify(cards);
  const penaltyShootout = JSON.stringify({ competition });

  const mvpPlayerName = matchLog?.mvp || undefined;
  const mvpRating = matchLog?.mvpRating ?? 0;

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
