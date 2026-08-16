import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { readJsonBody } from "@/lib/readBody";

export const dynamic = "force-dynamic";

export async function GET() {
  const associations = await prisma.nationalAssociation.findMany({ include: { country: true }, orderBy: { name: "asc" } });
  return NextResponse.json(associations);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { name, code, countryId, confederationId } = body;
  const association = await prisma.nationalAssociation.create({ data: { name, code, countryId, confederationId } });
  return NextResponse.json(association, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { id, ...data } = body;
  const association = await prisma.nationalAssociation.update({ where: { id }, data });
  return NextResponse.json(association);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.nationalAssociation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
