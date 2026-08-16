import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  simulateConcacafPhase,
  advanceChampionsCupToR16,
  generateLeaguesCupKnockout,
  generateCentralAmericanKnockout,
  generateCaribbeanCupKnockout,
  generateCaribbeanShieldKnockout,
  generateKnockoutFromGroups,
} from "@/lib/concacaf-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { competitionId, phase, round, startDate, action, qualifyPerGroup, knockoutRoundName, knockoutRoundLabel, twoLegs, roundOneWinners, preQualifiedTeams } = body as {
      competitionId: string;
      phase?: string;
      round?: string;
      startDate?: string;
      action?: string;
      qualifyPerGroup?: number;
      knockoutRoundName?: string;
      knockoutRoundLabel?: string;
      twoLegs?: boolean;
      roundOneWinners?: string[];
      preQualifiedTeams?: string[];
    };

    if (!competitionId) {
      return NextResponse.json({ error: "competitionId is required" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();

    if (action === "advance-champions-cup-r16") {
      if (!roundOneWinners || !preQualifiedTeams) {
        return NextResponse.json(
          { error: "roundOneWinners and preQualifiedTeams required" },
          { status: 400 }
        );
      }
      const result = await advanceChampionsCupToR16(competitionId, roundOneWinners, preQualifiedTeams, start);
      return NextResponse.json(result);
    }

    if (action === "generate-knockout-from-groups") {
      const qpg = qualifyPerGroup ?? 2;
      const krn = knockoutRoundName ?? "Quartas de Final";
      const krl = knockoutRoundLabel ?? "QF";
      const tl = twoLegs ?? true;
      const result = await generateKnockoutFromGroups(competitionId, qpg, start, krn, krl, tl);
      return NextResponse.json(result);
    }

    if (action === "generate-leagues-cup-knockout") {
      const result = await generateLeaguesCupKnockout(competitionId, start);
      return NextResponse.json(result);
    }

    if (action === "generate-central-american-knockout") {
      const result = await generateCentralAmericanKnockout(competitionId, start);
      return NextResponse.json(result);
    }

    if (action === "generate-caribbean-cup-knockout") {
      const result = await generateCaribbeanCupKnockout(competitionId, start);
      return NextResponse.json(result);
    }

    if (action === "generate-caribbean-shield-knockout") {
      const result = await generateCaribbeanShieldKnockout(competitionId, start);
      return NextResponse.json(result);
    }

    if (!phase) {
      return NextResponse.json({ error: "phase or action is required" }, { status: 400 });
    }

    const result = await simulateConcacafPhase(competitionId, phase, round);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
