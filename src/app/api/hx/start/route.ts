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

  const matchId = typeof body.matchId === "string" ? body.matchId : undefined;
  const redTeamName = typeof body.redTeamName === "string" ? body.redTeamName.trim().slice(0, 60) : "";
  const blueTeamName = typeof body.blueTeamName === "string" ? body.blueTeamName.trim().slice(0, 60) : "";

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
    const match = await prisma.match.findUnique({ where: { id: matchId } });
    if (match) {
      await prisma.match.update({
        where: { id: matchId },
        data: { status: "live" },
      });
    }
  }

  return NextResponse.json({ reportId: report.id, status: "live" });
}
