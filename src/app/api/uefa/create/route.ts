import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  createUefaCompetition,
  UefaCompetitionType,
} from "@/lib/uefa-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { type, seasonId, clubIds, startDate } = body as {
      type: UefaCompetitionType;
      seasonId: string;
      clubIds: string[];
      startDate?: string;
    };

    if (!type || !seasonId || !clubIds || clubIds.length < 2) {
      return NextResponse.json(
        { error: "type, seasonId and clubIds (min 2) are required" },
        { status: 400 }
      );
    }

    const validTypes: UefaCompetitionType[] = [
      "champions-league",
      "europa-league",
      "conference-league",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Invalid competition type" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    const result = await createUefaCompetition(type, seasonId, clubIds, start);

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create competition" },
      { status: 500 }
    );
  }
}
