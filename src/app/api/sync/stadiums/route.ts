import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { syncStadiums, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const perms = await getPermissions();
  if (!perms.canSyncData) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const result = await syncStadiums();
  await createSyncLog({
    ...result,
    level: "stadiums",
    adminUsername: "admin",
    entity: "estádios",
  });

  return NextResponse.json(result);
}