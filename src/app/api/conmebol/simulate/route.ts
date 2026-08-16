import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  simulatePhase,
  simulateKnockoutTwoLegs,
  simulateKnockoutSingle,
  generateLibertadoresKnockout,
  generateSulAmericanaPlayoffs,
  advanceTwoLegKnockout,
  advanceSingleKnockout,
} from "@/lib/conmebol-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { competitionId, phase, round, startDate, action, winnerIds, thirdPlaceIds } = body as {
      competitionId: string;
      phase?: string;
      round?: string;
      startDate?: string;
      action?: string;
      winnerIds?: string[];
      thirdPlaceIds?: string[];
    };

    if (!competitionId) {
      return NextResponse.json({ error: "competitionId required" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();

    if (action === "generate-libertadores-knockout") {
      const result = await generateLibertadoresKnockout(competitionId, start);
      return NextResponse.json(result);
    }
    if (action === "generate-sul-americana-playoffs") {
      if (!thirdPlaceIds) {
        return NextResponse.json({ error: "thirdPlaceIds required" }, { status: 400 });
      }
      const result = await generateSulAmericanaPlayoffs(competitionId, thirdPlaceIds, start);
      return NextResponse.json(result);
    }
    if (action === "advance-r16") {
      if (!winnerIds) return NextResponse.json({ error: "winnerIds required" }, { status: 400 });
      const result = await advanceTwoLegKnockout(competitionId, "Quartas de Final", "QF", winnerIds, new Date(start.getTime() + 14 * 86400000));
      return NextResponse.json(result);
    }
    if (action === "advance-qf") {
      if (!winnerIds) return NextResponse.json({ error: "winnerIds required" }, { status: 400 });
      const result = await advanceTwoLegKnockout(competitionId, "Semifinais", "SF", winnerIds, new Date(start.getTime() + 28 * 86400000));
      return NextResponse.json(result);
    }
    if (action === "advance-sf") {
      if (!winnerIds || winnerIds.length < 2) return NextResponse.json({ error: "winnerIds (min 2) required" }, { status: 400 });
      const result = await advanceSingleKnockout(competitionId, "Grande Final", "Final", winnerIds, new Date(start.getTime() + 42 * 86400000));
      return NextResponse.json(result);
    }

    if (!phase) {
      return NextResponse.json({ error: "phase or action required" }, { status: 400 });
    }

    if (phase === "final" || phase === "Final") {
      return NextResponse.json(await simulateKnockoutSingle(competitionId, "Final"));
    }

    return NextResponse.json(await simulatePhase(competitionId, phase, round));
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
