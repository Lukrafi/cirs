import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { readJsonBody } from "@/lib/readBody";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)));
  const yearFilter = searchParams.get("year");
  const leagueFilter = searchParams.get("leagueId");

  const where: Record<string, unknown> = {};
  if (yearFilter) where.year = parseInt(yearFilter, 10);
  if (leagueFilter) where.leagueId = leagueFilter;

  const [seasons, total] = await Promise.all([
    prisma.season.findMany({
      where,
      include: { league: true, competitions: true },
      orderBy: { year: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.season.count({ where }),
  ]);

  return NextResponse.json({
    seasons,
    total,
    page,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;

  const yearRaw = Number(body.year ?? parseInt(String(body.name), 10));
  const year = Number.isFinite(yearRaw) && yearRaw > 0 ? Math.floor(yearRaw) : new Date().getFullYear();

  const existing = await prisma.season.findFirst({ where: { year } });
  if (existing) {
    return NextResponse.json({ error: "Temporada ja existe para este ano" }, { status: 400 });
  }

  const season = await prisma.season.create({
    data: {
      name: String(year),
      year,
      leagueId: typeof body.leagueId === "string" ? body.leagueId : null,
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
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await readJsonBody(req);
  if (body instanceof NextResponse) return body;
  const { id, ...data } = body;
  if (typeof id !== "string" || !id) {
    return NextResponse.json({ error: "ID required" }, { status: 400 });
  }
  const season = await prisma.season.update({ where: { id }, data });
  return NextResponse.json(season);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });
  await prisma.season.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
