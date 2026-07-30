import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { simulateMatch, applySimulation, simularRodada, simularTemporada } from "@/lib/simulator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { matchId, competitionId, round, action } = body;

  try {
    if (action === "rodada" && competitionId && round) {
      const result = await simularRodada(competitionId, round);
      return NextResponse.json(result);
    }

    if (action === "temporada" && competitionId) {
      const result = await simularTemporada(competitionId);
      return NextResponse.json(result);
    }

    if (matchId) {
      const match = await prisma.match.findUnique({
        where: { id: matchId },
        include: { group: { include: { competition: true } } },
      });
      const ppw = match?.group?.competition?.pointsPerWin ?? 3;
      const ppd = match?.group?.competition?.pointsPerDraw ?? 1;

      const result = await simulateMatch(matchId);
      await applySimulation(matchId, result, ppw, ppd);
      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "matchId or competitionId required" }, { status: 400 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}