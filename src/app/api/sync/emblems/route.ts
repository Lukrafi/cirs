import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { syncEmblems, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const perms = await getPermissions();
  if (!perms.canSyncData) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const confederationCode = body.confederationCode as string | undefined;

  const result = await syncEmblems(confederationCode);
  await createSyncLog({
    ...result,
    level: "emblems",
    adminUsername: "admin",
    entity: "escudos",
  });

  return NextResponse.json(result);
}