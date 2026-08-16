import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  simulatePhase,
  simulateLeagueRound,
  generateKnockoutPhase,
  simulateFullCompetition,
} from "@/lib/uefa-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { competitionId, phase, round, startDate } = body as {
      competitionId: string;
      phase: string;
      round?: string;
      startDate?: string;
    };

    if (!competitionId || !phase) {
      return NextResponse.json(
        { error: "competitionId and phase are required" },
        { status: 400 }
      );
    }

    const start = startDate ? new Date(startDate) : new Date();

    switch (phase) {
      case "league-round": {
        if (!round) {
          return NextResponse.json({ error: "round is required for league-round" }, { status: 400 });
        }
        const result = await simulateLeagueRound(competitionId, round);
        return NextResponse.json(result);
      }

      case "generate-knockout": {
        const result = await generateKnockoutPhase(competitionId, start);
        return NextResponse.json(result);
      }

      case "full":
      case "all": {
        const result = await simulateFullCompetition(competitionId, start);
        return NextResponse.json(result);
      }

      default: {
        const result = await simulatePhase(competitionId, phase);
        return NextResponse.json(result);
      }
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
