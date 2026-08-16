import { NextRequest, NextResponse } from "next/server";
import { validateApiKey, unauthorizedResponse } from "@/lib/hx-auth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const key = await validateApiKey(req);
  if (!key) return unauthorizedResponse();

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const competition =
    typeof body.competition === "string" ? body.competition.trim().slice(0, 200) : null;

  if (!competition) {
    return NextResponse.json({ error: "competition required" }, { status: 400 });
  }

  await prisma.settings.upsert({
    where: { key: "active_competition" },
    update: { value: competition },
    create: { key: "active_competition", value: competition },
  });

  await prisma.settings.upsert({
    where: { key: "active_competition_updated_at" },
    update: { value: new Date().toISOString() },
    create: { key: "active_competition_updated_at", value: new Date().toISOString() },
  });

  await prisma.log.create({
    data: {
      action: "ACTIVE_COMPETITION_SET",
      entity: "Settings",
      details: `Competition set to: ${competition}`,
      adminId: key.id,
    },
  });

  return NextResponse.json({ success: true, competition });
}

export async function GET() {
  const setting = await prisma.settings.findUnique({
    where: { key: "active_competition" },
  });

  const updatedAt = await prisma.settings.findUnique({
    where: { key: "active_competition_updated_at" },
  });

  return NextResponse.json({
    competition: setting?.value ?? null,
    updatedAt: updatedAt?.value ?? null,
  });
}
