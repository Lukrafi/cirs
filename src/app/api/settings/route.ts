import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const settings = await prisma.settings.findMany();
  const map: Record<string, string> = {};
  settings.forEach((s: { key: string; value: string }) => { map[s.key] = s.value; });
  return NextResponse.json(map);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const key = typeof body.key === "string" ? body.key.trim().slice(0, 100) : "";
  const value = typeof body.value === "string" ? body.value.slice(0, 5000) : "";
  if (!key) return NextResponse.json({ error: "key required" }, { status: 400 });

  const setting = await prisma.settings.upsert({
    where: { key },
    update: { value },
    create: { key, value },
  });

  return NextResponse.json(setting);
}
