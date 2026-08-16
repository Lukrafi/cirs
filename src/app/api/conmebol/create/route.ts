import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { createLibertadores, createSulAmericana } from "@/lib/conmebol-competitions";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  try {
    const body = await req.json();
    const { type, seasonId, startDate, preliminaryTeams, qualifiedGroupStageIds, groupStageTeams, sulPreliminaryTeams } = body as {
      type: "copa-libertadores" | "copa-sul-americana";
      seasonId: string;
      startDate?: string;
      preliminaryTeams?: { phase: string; teamIds: string[] }[];
      qualifiedGroupStageIds?: string[];
      groupStageTeams?: string[];
      sulPreliminaryTeams?: string[];
    };

    if (!type || !seasonId) {
      return NextResponse.json({ error: "type and seasonId required" }, { status: 400 });
    }

    const start = startDate ? new Date(startDate) : new Date();

    if (type === "copa-libertadores") {
      if (!qualifiedGroupStageIds || qualifiedGroupStageIds.length < 2) {
        return NextResponse.json({ error: "qualifiedGroupStageIds required" }, { status: 400 });
      }
      const result = await createLibertadores(seasonId, preliminaryTeams || [], qualifiedGroupStageIds, start);
      return NextResponse.json(result, { status: 201 });
    }

    if (type === "copa-sul-americana") {
      if (!groupStageTeams || groupStageTeams.length < 2) {
        return NextResponse.json({ error: "groupStageTeams required" }, { status: 400 });
      }
      const result = await createSulAmericana(seasonId, sulPreliminaryTeams || [], groupStageTeams, start);
      return NextResponse.json(result, { status: 201 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Failed" }, { status: 500 });
  }
}
