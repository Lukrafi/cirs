import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const seasons = await prisma.season.findMany({
    include: { league: true, competitions: true },
    orderBy: { startDate: "desc" },
  });
  return NextResponse.json(seasons);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const season = await prisma.season.create({ data: body });
  return NextResponse.json(season, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const { id, ...data } = body;
  const season = await prisma.season.update({ where: { id }, data });
  return NextResponse.json(season);
}

export async function DELETE(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.season.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
