import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { readJsonBody } from "@/lib/readBody";
import {
  simulateMatch,
  applySimulation,
  simularRodada,
  simularTemporada,
  simularAteRodada,
  simularTurno,
  simularAteData,
  simularTodasCompeticoes,
} from "@/lib/simulator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { matchId, competitionId, round, action, seasonId, maxRound, dataLimite, turno } = body;

  try {
    switch (action) {
      case "rodada":
        return NextResponse.json(await simularRodada(competitionId, round));

      case "temporada":
        return NextResponse.json(await simularTemporada(competitionId));

      case "ate-rodada":
        return NextResponse.json(await simularAteRodada(competitionId, maxRound));

      case "turno":
        return NextResponse.json(await simularTurno(competitionId, turno || "ida"));

      case "ate-data":
        return NextResponse.json(await simularAteData(competitionId, dataLimite));

      case "todas-temporada":
        return NextResponse.json(await simularTodasCompeticoes(seasonId));

      default:
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
        return NextResponse.json({ error: "Invalid action or missing matchId" }, { status: 400 });
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}