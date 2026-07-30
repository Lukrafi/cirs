import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export async function GET() {
  const seasons = await prisma.season.findMany({
    include: { league: true, competitions: true },
    orderBy: { year: "desc" },
  });
  return NextResponse.json(seasons);
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const year = body.year || parseInt(body.name) || new Date().getFullYear();

  const existing = await prisma.season.findFirst({ where: { year } });
  if (existing) {
    return NextResponse.json({ error: "Temporada ja existe para este ano" }, { status: 400 });
  }

  const season = await prisma.season.create({
    data: {
      name: String(year),
      year,
      leagueId: body.leagueId || null,
    },
  });

  const leagues = await prisma.league.findMany();
  for (const league of leagues) {
    const existingComps = await prisma.competition.findMany({
      where: { seasonId: season.id, name: league.name },
    });
    if (existingComps.length === 0) {
      await prisma.competition.create({
        data: {
          name: league.name,
          type: league.isInternational ? "international" : "league",
          logo: league.logo,
          seasonId: season.id,
          format: "round-robin",
          numTurns: 2,
        },
      });
    }
  }

  const intlComps = await prisma.competition.findMany({
    where: { type: "international", seasonId: null },
  });
  for (const comp of intlComps) {
    await prisma.competition.update({
      where: { id: comp.id },
      data: { seasonId: season.id },
    });
  }

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