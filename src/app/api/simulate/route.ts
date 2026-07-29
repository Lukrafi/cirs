import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { simulateMatch, applySimulation } from "@/lib/simulator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const { matchId } = await req.json();
  if (!matchId) return NextResponse.json({ error: "matchId required" }, { status: 400 });

  try {
    const result = await simulateMatch(matchId);
    await applySimulation(matchId, result);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Simulation failed" },
      { status: 500 }
    );
  }
}
