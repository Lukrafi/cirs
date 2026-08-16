import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/permissions";
import { syncStadiums, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(_req: NextRequest) {
  const adminUser = await getUserSession();
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const result = await syncStadiums();
  await createSyncLog({
    ...result,
    level: "stadiums",
    adminUsername: adminUser.username,
    entity: "estádios",
  });

  return NextResponse.json(result);
}