import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { randomBytes } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Admin access required" }, { status: 403 });
  }

  const body = await req.json().catch(() => ({}));
  const label = body.label || "HaxBall Integration";
  const key = `cirs_${randomBytes(24).toString("hex")}`;

  const apiKey = await prisma.apiKey.create({
    data: { key, label },
  });

  await prisma.log.create({
    data: {
      action: "API_KEY_CREATED",
      entity: "ApiKey",
      entityId: apiKey.id,
      adminId: session.id,
      details: `Label: ${label}`,
    },
  });

  return NextResponse.json({ key, label, id: apiKey.id }, { status: 201 });
}
