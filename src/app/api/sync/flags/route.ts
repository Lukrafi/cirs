import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/permissions";
import { syncFlags, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminUser = await getUserSession();
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const source = body.source as string | undefined;

  const result = await syncFlags(source);
  await createSyncLog({
    ...result,
    adminUsername: adminUser.username,
    level: "flags",
    entity: "bandeiras",
  });

  return NextResponse.json(result);
}