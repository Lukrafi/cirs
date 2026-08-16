import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAdminSession } from "@/lib/session";
import { simularTemporada } from "@/lib/simulator";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ error: "Não autorizado" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const countryId = searchParams.get("id");
  if (!countryId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const country = await prisma.country.findUnique({ where: { id: countryId } });
  if (!country) {
    return NextResponse.json({ error: "País não encontrado" }, { status: 404 });
  }

  // Busca competições que pertencem a ligas deste país
  const leagues = await prisma.league.findMany({
    where: { countryId },
    select: { id: true },
  });
  const leagueIds = leagues.map((l) => l.id);

  // Busca seasons destas ligas
  const seasons = await prisma.season.findMany({
    where: { leagueId: { in: leagueIds } },
    select: { id: true },
  });
  const seasonIds = seasons.map((s) => s.id);

  // Busca competições que são simuláveis e têm partidas agendadas
  const competitions = await prisma.competition.findMany({
    where: {
      seasonId: { in: seasonIds },
      isSimulated: true,
      groups: { some: { matches: { some: { status: "scheduled" } } } },
    },
    select: { id: true, name: true },
  });

  let totalSimulated = 0;
  let competitionsSimulated = 0;
  const errors: string[] = [];

  for (const comp of competitions) {
    try {
      const result = await simularTemporada(comp.id);
      if (result.simulated > 0) {
        competitionsSimulated++;
        totalSimulated += result.simulated;
      }
    } catch (e) {
      errors.push(`${comp.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  return NextResponse.json({
    success: true,
    message: `${competitionsSimulated} competições simuladas (${totalSimulated} partidas) para ${country.name}`,
    country: country.name,
    competitionsSimulated,
    matchesSimulated: totalSimulated,
    errors,
  });
}
