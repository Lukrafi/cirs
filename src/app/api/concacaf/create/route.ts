import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import {
  createChampionsCup,
  createLeaguesCup,
  createCentralAmericanCup,
  createCaribbeanCup,
  createCaribbeanShield,
  ConcacafCompetitionType,
} from "@/lib/concacaf-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { type, seasonId, clubIds, roundOneTeams, preQualifiedTeams, startDate } = body as {
      type: ConcacafCompetitionType;
      seasonId: string;
      clubIds?: string[];
      roundOneTeams?: string[];
      preQualifiedTeams?: string[];
      startDate?: string;
    };

    if (!type || !seasonId) {
      return NextResponse.json({ error: "type and seasonId are required" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();
    let result: { competitionId: string };

    switch (type) {
      case "champions-cup":
        if (!roundOneTeams || !preQualifiedTeams) {
          return NextResponse.json(
            { error: "roundOneTeams and preQualifiedTeams are required for champions-cup" },
            { status: 400 }
          );
        }
        result = await createChampionsCup(seasonId, roundOneTeams, preQualifiedTeams, start);
        break;

      case "leagues-cup":
        if (!clubIds || clubIds.length < 2) {
          return NextResponse.json(
            { error: "clubIds (min 2) required for leagues-cup" },
            { status: 400 }
          );
        }
        result = await createLeaguesCup(seasonId, clubIds, start);
        break;

      case "central-american-cup":
        if (!clubIds || clubIds.length < 2) {
          return NextResponse.json(
            { error: "clubIds (min 2) required for central-american-cup" },
            { status: 400 }
          );
        }
        result = await createCentralAmericanCup(seasonId, clubIds, start);
        break;

      case "caribbean-cup":
        if (!clubIds || clubIds.length < 2) {
          return NextResponse.json(
            { error: "clubIds (min 2) required for caribbean-cup" },
            { status: 400 }
          );
        }
        result = await createCaribbeanCup(seasonId, clubIds, start);
        break;

      case "caribbean-shield":
        if (!clubIds || clubIds.length < 2) {
          return NextResponse.json(
            { error: "clubIds (min 2) required for caribbean-shield" },
            { status: 400 }
          );
        }
        result = await createCaribbeanShield(seasonId, clubIds, start);
        break;

      default:
        return NextResponse.json({ error: "Invalid competition type" }, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to create competition" },
      { status: 500 }
    );
  }
}
