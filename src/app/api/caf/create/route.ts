import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { createCafCompetition, CafCompetitionType } from "@/lib/caf-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { type, seasonId, preliminaryRound1Teams, startDate } = body as {
      type: CafCompetitionType;
      seasonId: string;
      preliminaryRound1Teams: string[];
      startDate?: string;
    };

    if (!type || !seasonId || !preliminaryRound1Teams || preliminaryRound1Teams.length < 2) {
      return NextResponse.json(
        { error: "type, seasonId and preliminaryRound1Teams (min 2) are required" },
        { status: 400 }
      );
    }

    const validTypes: CafCompetitionType[] = ["caf-champions-league", "caf-confederations-cup"];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid competition type" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const result = await createCafCompetition(type, seasonId, preliminaryRound1Teams, start);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create competition" },
      { status: 500 }
    );
  }
}
