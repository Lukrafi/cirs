import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/permissions";
import { syncConfederation, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminUser = await getUserSession();
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const confederationId = body.confederationId;
  const source = body.source as string | undefined;

  if (!confederationId) {
    return NextResponse.json({ error: "confederationId é obrigatório" }, { status: 400 });
  }

  const result = await syncConfederation(confederationId, source);
  await createSyncLog({
    ...result,
    level: "confederation",
    adminUsername: adminUser.username,
    entity: "confederação",
    entityId: confederationId,
  });

  return NextResponse.json(result);
}