import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { readJsonBody } from "@/lib/readBody";

export const dynamic = "force-dynamic";

export async function GET() {
  const leagues = await prisma.league.findMany({ include: { seasons: true }, orderBy: { name: "asc" } });
  return NextResponse.json(leagues);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const league = await prisma.league.create({ data: body });
  return NextResponse.json(league, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { id, ...data } = body;
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }
  const league = await prisma.league.update({ where: { id }, data });
  return NextResponse.json(league);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.league.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
