import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  simulateOfcPhase,
  generateProLeaguePlayoffs,
  generateProLeagueSemifinals,
  generateChampionsLeagueSemifinals,
  generateFinal,
} from "@/lib/ofc-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { competitionId, phase, round, startDate, action } = body as {
      competitionId: string;
      phase?: string;
      round?: string;
      startDate?: string;
      action?: string;
    };

    if (!competitionId) {
      return NextResponse.json({ error: "competitionId required" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();

    if (action === "generate-pro-league-playoffs") {
      const result = await generateProLeaguePlayoffs(competitionId, start);
      return NextResponse.json(result);
    }
    if (action === "generate-pro-league-semifinals") {
      const result = await generateProLeagueSemifinals(competitionId, start);
      return NextResponse.json(result);
    }
    if (action === "generate-champions-league-semifinals") {
      const result = await generateChampionsLeagueSemifinals(competitionId, start);
      return NextResponse.json(result);
    }
    if (action === "generate-final") {
      const result = await generateFinal(competitionId, start);
      return NextResponse.json(result);
    }

    if (!phase) {
      return NextResponse.json({ error: "phase or action required" }, { status: 400 });
    }

    const result = await simulateOfcPhase(competitionId, phase, round);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
