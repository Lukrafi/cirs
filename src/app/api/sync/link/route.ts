import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { syncByLink, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const perms = await getPermissions();
  if (!perms.canSyncData) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const url = body.url;
  const source = body.source as string | undefined;

  if (!url) {
    return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 });
  }

  const result = await syncByLink(url, source);
  await createSyncLog({
    ...result,
    level: "link",
    adminUsername: "admin",
    entity: url,
  });

  return NextResponse.json(result);
}