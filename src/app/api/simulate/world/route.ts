import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { simularTemporada } from "@/lib/simulator";

export const dynamic = "force-dynamic";
export const maxDuration = 300;

export async function POST(_req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  const start = Date.now();
  let competitionsSimulated = 0;
  let matchesSimulated = 0;
  const errors: string[] = [];

  const currentYear = new Date().getFullYear();

  // Agrupar todas as competicoes por liga (via temporada) ou diretamente
  const competitions = await prisma.competition.findMany({
    where: {
      groups: { some: { matches: { some: { status: "scheduled" } } } },
    },
    include: {
      season: { select: { id: true, year: true, leagueId: true } },
    },
    orderBy: { name: "asc" },
  });

  // Simular cada competicao
  for (const comp of competitions) {
    try {
      const result = await simularTemporada(comp.id);
      competitionsSimulated++;
      matchesSimulated += result.simulated;
    } catch (e) {
      errors.push(`${comp.name}: ${e instanceof Error ? e.message : String(e)}`);
    }
  }

  // Criar a proxima temporada para cada liga que teve ligas na temporada atual
  const leaguesWithSeasons = await prisma.season.findMany({
    where: { year: currentYear },
    include: { league: { select: { id: true, name: true } } },
    distinct: ["leagueId"],
  });

  let newSeasons = 0;
  for (const season of leaguesWithSeasons) {
    if (!season.league) continue;
    const nextYear = currentYear + 1;

    const existing = await prisma.season.findFirst({
      where: { leagueId: season.league.id, year: nextYear },
    });
    if (existing) continue;

    const newSeason = await prisma.season.create({
      data: {
        name: `${nextYear}`,
        year: nextYear,
        leagueId: season.league.id,
        startDate: new Date(`${nextYear}-01-01`),
        endDate: new Date(`${nextYear}-12-31`),
      },
    });
    newSeasons++;

    // Clonar as competicoes da temporada atual para a nova temporada
    const currentSeasonComps = await prisma.competition.findMany({
      where: { seasonId: season.id },
    });

    for (const comp of currentSeasonComps) {
      await prisma.competition.create({
        data: {
          name: comp.name,
          type: comp.type,
          logo: comp.logo,
          seasonId: newSeason.id,
          isKnockout: comp.isKnockout,
          format: comp.format,
          numTeams: comp.numTeams,
          numTurns: comp.numTurns,
          promoted: comp.promoted,
          relegated: comp.relegated,
          qualifiedLibertadores: comp.qualifiedLibertadores,
          qualifiedSulAmericana: comp.qualifiedSulAmericana,
          pointsPerWin: comp.pointsPerWin,
          pointsPerDraw: comp.pointsPerDraw,
          hasExtraTime: comp.hasExtraTime,
          hasPenalties: comp.hasPenalties,
          maxSubstitutions: comp.maxSubstitutions,
          maxCardsBeforeSuspension: comp.maxCardsBeforeSuspension,
          tiebreaker1: comp.tiebreaker1,
          tiebreaker2: comp.tiebreaker2,
          tiebreaker3: comp.tiebreaker3,
          tiebreaker4: comp.tiebreaker4,
          tiebreaker5: comp.tiebreaker5,
        },
      });
    }
  }

  const elapsedMs = Date.now() - start;

  return NextResponse.json({
    success: true,
    message: `Simulação mundial concluída em ${(elapsedMs / 1000).toFixed(1)}s. ${matchesSimulated} partidas simuladas em ${competitionsSimulated} competições. ${newSeasons} temporadas ${currentYear + 1} criadas.`,
    competitionsSimulated,
    matchesSimulated,
    newSeasons,
    nextYear: currentYear + 1,
    errors: errors.slice(0, 10),
    elapsedMs,
  });
}