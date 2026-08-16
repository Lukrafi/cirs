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
  const confederationId = searchParams.get("id");
  if (!confederationId) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }

  const confederation = await prisma.confederation.findUnique({
    where: { id: confederationId },
    include: { countries: { select: { id: true, name: true } } },
  });
  if (!confederation) {
    return NextResponse.json({ error: "Confederação não encontrada" }, { status: 404 });
  }

  const countryIds = confederation.countries.map((c) => c.id);

  // Busca ligas de todos os países desta confederação
  const leagues = await prisma.league.findMany({
    where: { countryId: { in: countryIds } },
    select: { id: true },
  });
  const leagueIds = leagues.map((l) => l.id);

  // Busca seasons destas ligas
  const seasons = await prisma.season.findMany({
    where: { leagueId: { in: leagueIds } },
    select: { id: true },
  });
  const seasonIds = seasons.map((s) => s.id);

  // Busca competições simuláveis com partidas agendadas
  const competitions = await prisma.competition.findMany({
    where: {
      seasonId: { in: seasonIds },
      isSimulated: true,
      groups: { some: { matches: { some: { status: "scheduled" } } } },
    },
    select: { id: true, name: true },
  });

  // Também busca competições internacionais desta confederação
  const intlCompetitions = await prisma.competition.findMany({
    where: {
      isSimulated: true,
      name: { contains: confederation.name },
      groups: { some: { matches: { some: { status: "scheduled" } } } },
    },
    select: { id: true, name: true },
  });

  const allCompetitions = [...competitions, ...intlCompetitions];
  // Remove duplicatas
  const seen = new Set<string>();
  const uniqueCompetitions = allCompetitions.filter((c) => {
    if (seen.has(c.id)) return false;
    seen.add(c.id);
    return true;
  });

  let totalSimulated = 0;
  let competitionsSimulated = 0;
  const errors: string[] = [];

  for (const comp of uniqueCompetitions) {
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
    message: `${competitionsSimulated} competições simuladas (${totalSimulated} partidas) para ${confederation.name}`,
    confederation: confederation.name,
    countries: confederation.countries.map((c) => c.name),
    competitionsSimulated,
    matchesSimulated: totalSimulated,
    errors,
  });
}
