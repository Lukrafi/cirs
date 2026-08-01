import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { syncCompetition, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const perms = await getPermissions();
  if (!perms.canSyncData) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const competitionId = body.competitionId;
  const source = body.source as string | undefined;

  if (!competitionId) {
    return NextResponse.json({ error: "competitionId é obrigatório" }, { status: 400 });
  }

  const result = await syncCompetition(competitionId, source);
  await createSyncLog({
    ...result,
    level: "competition",
    adminUsername: "admin",
    entity: "competição",
    entityId: competitionId,
  });

  return NextResponse.json(result);
}