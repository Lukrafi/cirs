import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = await validateApiKey(req);
  if (!key) return unauthorizedResponse();

  const body = await req.json();
  const { matchId, redTeamName, blueTeamName } = body;

  if (!redTeamName || !blueTeamName) {
    return NextResponse.json({ error: "redTeamName and blueTeamName required" }, { status: 400 });
  }

  const report = await prisma.matchReport.create({
    data: {
      apiKeyId: key.id,
      matchId: matchId ?? undefined,
      redTeamName,
      blueTeamName,
      redScore: 0,
      blueScore: 0,
    },
  });

  if (matchId) {
    await prisma.match.update({
      where: { id: matchId },
      data: { status: "live" },
    });
  }

  return NextResponse.json({ reportId: report.id, status: "live" });
}