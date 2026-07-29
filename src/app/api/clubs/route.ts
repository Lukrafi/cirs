import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const clubs = await prisma.club.findMany({ orderBy: { name: "asc" } });
  return NextResponse.json(clubs);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const club = await prisma.club.create({ data: body });
  return NextResponse.json(club, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const club = await prisma.club.update({ where: { id }, data });
  return NextResponse.json(club);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.club.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
