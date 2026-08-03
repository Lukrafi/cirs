import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";

export const dynamic = "force-dynamic";

export async function GET() {
  const files = await prisma.mapFile.findMany({ orderBy: { createdAt: "desc" } });
  return NextResponse.json(files);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const file = await prisma.mapFile.create({ data: body });
  return NextResponse.json(file, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const { id, ...data } = body;
  const file = await prisma.mapFile.update({ where: { id }, data });
  return NextResponse.json(file);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.mapFile.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
