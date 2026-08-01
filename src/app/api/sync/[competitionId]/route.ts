import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { syncCompetition } from "@/lib/syncService";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  const permissions = await getPermissions();
  if (!permissions.canSyncData) {
    return NextResponse.json({ error: "Não autorizado. Apenas administradores podem sincronizar dados." }, { status: 403 });
  }

  const { competitionId } = await params;
  const body = await req.json().catch(() => ({}));
  const source = body.source as string | undefined;

  try {
    const result = await syncCompetition(competitionId, source);
    return NextResponse.json({ success: true, ...result });
  } catch (e: any) {
    return NextResponse.json(
      { error: e instanceof Error ? e.message : "Erro na sincronização" },
      { status: 500 }
    );
  }
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ competitionId: string }> }
) {
  const permissions = await getPermissions();
  if (!permissions.canSyncData) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 403 });
  }

  const { competitionId } = await params;

  return NextResponse.json({
    competitionId,
    availableSources: ["mock", "wikidata"],
    status: "idle",
  });
}