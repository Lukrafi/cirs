import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/permissions";
import { syncCompetition, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminUser = await getUserSession();
  if (!adminUser || adminUser.role !== "admin") {
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
    adminUsername: adminUser.username,
    entity: "competição",
    entityId: competitionId,
  });

  return NextResponse.json(result);
}