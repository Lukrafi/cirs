import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { readJsonBody } from "@/lib/readBody";

export const dynamic = "force-dynamic";

export async function GET() {
  const divisions = await prisma.division.findMany({ include: { country: true }, orderBy: { name: "asc" } });
  return NextResponse.json(divisions);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const division = await prisma.division.create({ data: body });
  return NextResponse.json(division, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { id, ...data } = body;
  const division = await prisma.division.update({ where: { id }, data });
  return NextResponse.json(division);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.division.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
