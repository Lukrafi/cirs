import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const competitions = await prisma.competition.findMany({
    include: { season: { include: { league: true } }, groups: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(competitions);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const competition = await prisma.competition.create({ data: body });
  return NextResponse.json(competition, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const competition = await prisma.competition.update({ where: { id }, data });
  return NextResponse.json(competition);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.competition.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
