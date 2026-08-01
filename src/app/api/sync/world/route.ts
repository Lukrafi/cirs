import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { syncWorld, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const perms = await getPermissions();
  if (!perms.canSyncData) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const source = body.source as string | undefined;

  const result = await syncWorld(source);
  await createSyncLog({
    ...result,
    level: "world",
    adminUsername: "admin",
    entity: "mundo",
  });

  return NextResponse.json(result);
}