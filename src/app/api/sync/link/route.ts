import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/permissions";
import { syncByLink, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminUser = await getUserSession();
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const url = body.url;

  if (!url) {
    return NextResponse.json({ error: "URL é obrigatória" }, { status: 400 });
  }

  const result = await syncByLink(url);
  await createSyncLog({
    ...result,
    level: "link",
    adminUsername: adminUser.username,
    entity: url,
  });

  return NextResponse.json(result);
}