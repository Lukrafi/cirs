import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  simulateCafPhase,
  advanceToPreliminaryRound2,
  generateGroupStage,
  generateQuarterfinalsFromGroups,
  advanceKnockoutTwoLegs,
} from "@/lib/caf-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const {
      competitionId,
      phase,
      round,
      startDate,
      action,
      round1Winners,
      qualifiedTeamIds,
    } = body as {
      competitionId: string;
      phase?: string;
      round?: string;
      startDate?: string;
      action?: string;
      round1Winners?: string[];
      qualifiedTeamIds?: string[];
    };

    if (!competitionId) {
      return NextResponse.json({ error: "competitionId is required" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();

    if (action === "advance-to-preliminary-2") {
      if (!round1Winners) {
        return NextResponse.json({ error: "round1Winners required" }, { status: 400 });
      }
      const result = await advanceToPreliminaryRound2(competitionId, round1Winners, start);
      return NextResponse.json(result);
    }

    if (action === "generate-group-stage") {
      if (!qualifiedTeamIds || qualifiedTeamIds.length < 2) {
        return NextResponse.json({ error: "qualifiedTeamIds (min 2) required" }, { status: 400 });
      }
      const result = await generateGroupStage(competitionId, qualifiedTeamIds, start);
      return NextResponse.json(result);
    }

    if (action === "generate-quarterfinals") {
      const result = await generateQuarterfinalsFromGroups(competitionId, start);
      return NextResponse.json(result);
    }

    if (action === "advance-to-semifinals") {
      if (!qualifiedTeamIds) {
        return NextResponse.json({ error: "qualifiedTeamIds (winners) required" }, { status: 400 });
      }
      const result = await advanceKnockoutTwoLegs(competitionId, "Semifinais", "SF", qualifiedTeamIds, start);
      return NextResponse.json(result);
    }

    if (action === "advance-to-final") {
      if (!qualifiedTeamIds || qualifiedTeamIds.length < 2) {
        return NextResponse.json({ error: "qualifiedTeamIds (winners, min 2) required" }, { status: 400 });
      }
      const result = await advanceKnockoutTwoLegs(competitionId, "Grande Final", "Final", qualifiedTeamIds, start);
      return NextResponse.json(result);
    }

    if (!phase) {
      return NextResponse.json({ error: "phase or action is required" }, { status: 400 });
    }

    const result = await simulateCafPhase(competitionId, phase, round);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
