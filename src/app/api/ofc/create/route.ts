import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { createOfcProLeague, createOfcChampionsLeague, OfcCompetitionType } from "@/lib/ofc-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { type, seasonId, clubIds, startDate } = body as {
      type: OfcCompetitionType;
      seasonId: string;
      clubIds: string[];
      startDate?: string;
    };

    if (!type || !seasonId || !clubIds || clubIds.length < 2) {
      return NextResponse.json({ error: "type, seasonId and clubIds (min 2) required" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    let result: { competitionId: string };

    switch (type) {
      case "ofc-pro-league":
        result = await createOfcProLeague(seasonId, clubIds, start);
        break;
      case "ofc-champions-league":
        result = await createOfcChampionsLeague(seasonId, clubIds, start);
        break;
      default:
        return NextResponse.json({ error: "Invalid type" }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed" },
      { status: 500 }
    );
  }
}
