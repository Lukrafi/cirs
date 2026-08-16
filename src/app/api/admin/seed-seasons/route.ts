import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

const START_YEAR = 2026;
const END_YEAR = 2050;

const QUADRIENNIAL: Record<string, number> = {
  "FIFA World Cup": 2026,
  "Copa América": 2028,
  "Eurocopa": 2028,
  "Copa da Ásia": 2027,
  "Finalíssima": 2029,
  "OFC Nations Cup": 2028,
};

const BIENNIAL: Record<string, number> = {
  "Gold Cup": 2025,
  "Copa Africana de Nações": 2025,
  "African Nations Championship": 2026,
};

function shouldInclude(name: string, year: number): boolean {
  if (name in QUADRIENNIAL) return (year - QUADRIENNIAL[name]) % 4 === 0;
  if (name in BIENNIAL) return (year - BIENNIAL[name]) % 2 === 0;
  return true;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  await prisma.competition.deleteMany({});
  await prisma.season.deleteMany({});

  const leagues = await prisma.league.findMany({ select: { id: true, name: true } });

  let totalSeasons = 0;
  let totalComps = 0;

  for (let year = START_YEAR; year <= END_YEAR; year++) {
    const season = await prisma.season.create({
      data: {
        name: String(year),
        year,
        startDate: new Date(`${year}-01-01`),
        endDate: new Date(`${year}-12-31`),
      },
    });
    totalSeasons++;

    for (const league of leagues) {
      if (!shouldInclude(league.name, year)) continue;
      await prisma.competition.create({
        data: {
          name: league.name,
          type: "liga",
          seasonId: season.id,
          format: "round-robin",
          numTurns: 2,
        },
      });
      totalComps++;
    }
  }

  return NextResponse.json({ success: true, seasons: totalSeasons, competitions: totalComps });
}
