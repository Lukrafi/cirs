import { NextRequest, NextResponse } from "next/server";
import { getUserSession } from "@/lib/permissions";
import { syncEmblems, createSyncLog } from "@/lib/syncService";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const adminUser = await getUserSession();
  if (!adminUser || adminUser.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const confederationCode = body.confederationCode as string | undefined;

  const result = await syncEmblems(confederationCode);
  await createSyncLog({
    ...result,
    level: "emblems",
    adminUsername: adminUser.username,
    entity: "escudos",
  });

  return NextResponse.json(result);
}