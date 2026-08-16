import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { readJsonBody } from "@/lib/readBody";

export const dynamic = "force-dynamic";

export async function GET() {
  const confederations = await prisma.confederation.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(confederations);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { name, code, logo } = body;
  const confederation = await prisma.confederation.create({ data: { name, code, logo } });
  return NextResponse.json(confederation, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { id, ...data } = body;
  const confederation = await prisma.confederation.update({ where: { id }, data });
  return NextResponse.json(confederation);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.confederation.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
