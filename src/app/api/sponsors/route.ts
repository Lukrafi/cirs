import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const sponsors = await prisma.sponsor.findMany({ include: { club: true }, orderBy: { name: "asc" } });
  return NextResponse.json(sponsors);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const sponsor = await prisma.sponsor.create({ data: body });
  return NextResponse.json(sponsor, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const sponsor = await prisma.sponsor.update({ where: { id }, data });
  return NextResponse.json(sponsor);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.sponsor.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
