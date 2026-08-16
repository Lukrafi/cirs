import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/apiAuth";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

function getTeamCount(compName: string): number {
  const n = compName.toLowerCase();
  if (n.includes("supercop") || n.includes("super cup") || n.includes("supertaça") || n.includes("superkup") || n.includes("supercoupe") || n.includes("superpuchar") || n.includes("community shield") || n.includes("trophée") || n.includes("johan cruijff") || n.includes("süper kupa") || n.includes("superpokal") || n.includes("supercoppa")) return 2;
  if (n.includes("copa") || n.includes("cup") || n.includes("taça") || n.includes("coupe") || n.includes("kup") || n.includes("pokal")) return 16;
  return 16;
}

function generateRoundRobin(teamIds: string[], numTurns = 2) {
  const n = teamIds.length;
  if (n < 2) return [];
  const isOdd = n % 2 !== 0;
  const teams = isOdd ? [...teamIds, null] : [...teamIds];
  const size = teams.length;
  const rounds = size - 1;
  const matches: { homeTeamId: string; awayTeamId: string; round: string }[] = [];

  for (let turn = 0; turn < numTurns; turn++) {
    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < size / 2; i++) {
        const home = teams[i];
        const away = teams[size - 1 - i];
        if (home === null || away === null) continue;
        const roundNum = turn * rounds + round + 1;
        const h = turn === 0 ? home : away;
        const a = turn === 0 ? away : home;
        matches.push({ homeTeamId: h, awayTeamId: a, round: String(roundNum) });
      }
      const last = teams.pop()!;
      teams.splice(1, 0, last);
    }
  }
  return matches;
}

function generateKnockout(teamIds: string[]) {
  const matches: { homeTeamId: string; awayTeamId: string; round: string }[] = [];
  let current = [...teamIds];
  let roundNum = 1;
  while (current.length > 1) {
    const next: string[] = [];
    for (let i = 0; i < current.length; i += 2) {
      if (i + 1 < current.length) {
        matches.push({ homeTeamId: current[i], awayTeamId: current[i + 1], round: `Rodada ${roundNum}` });
        next.push(current[i]);
      } else {
        next.push(current[i]);
      }
    }
    current = next;
    roundNum++;
  }
  return matches;
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;

  let body: Record<string, unknown> = {};
  try { body = await req.json(); } catch {}

  const year = typeof body.year === "number" ? body.year : new Date().getFullYear();

  const season = await prisma.season.findFirst({ where: { year } });
  if (!season) return NextResponse.json({ error: `Season ${year} não encontrada` }, { status: 404 });

  const leagues = await prisma.league.findMany({
    where: { countryId: { not: null } },
    select: { name: true, countryId: true },
  });
  const leagueMap: Record<string, string | null> = {};
  leagues.forEach((l) => { leagueMap[l.name] = l.countryId; });

  const competitions = await prisma.competition.findMany({
    where: { seasonId: season.id },
    select: { id: true, name: true, isKnockout: true, numTurns: true },
  });

  let totalMatches = 0;
  let compsProcessed = 0;

  for (const comp of competitions) {
    const countryId = leagueMap[comp.name];
    if (!countryId) continue;

    const clubs = await prisma.club.findMany({
      where: { countryId },
      select: { id: true },
      orderBy: { strength: "desc" },
    });
    if (clubs.length < 2) continue;

    const existingMatches = await prisma.match.count({
      where: { group: { competitionId: comp.id } },
    });
    if (existingMatches > 0) continue;

    const teamCount = Math.min(getTeamCount(comp.name), clubs.length);
    const selectedClubs = clubs.slice(0, teamCount);

    const group = await prisma.group.create({
      data: { name: "Grupo Único", competitionId: comp.id },
    });

    for (const club of selectedClubs) {
      await prisma.standing.create({
        data: {
          groupId: group.id, clubId: club.id,
          points: 0, played: 0, wins: 0, draws: 0, losses: 0,
          goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, position: 0,
        },
      });
    }

    const teamIds = selectedClubs.map((c) => c.id);
    const isSupercup = comp.name.toLowerCase().includes("supercop") || comp.name.toLowerCase().includes("super cup");
    const isCup = comp.name.toLowerCase().includes("copa") || comp.name.toLowerCase().includes("cup") || comp.name.toLowerCase().includes("taça");

    let fixtures;
    if (isSupercup || teamCount === 2) {
      fixtures = generateKnockout(teamIds);
    } else if (isCup && teamCount <= 16) {
      fixtures = generateKnockout(teamIds);
    } else {
      fixtures = generateRoundRobin(teamIds, comp.numTurns || 2);
    }

    for (const f of fixtures) {
      await prisma.match.create({
        data: {
          groupId: group.id, homeTeamId: f.homeTeamId, awayTeamId: f.awayTeamId,
          round: f.round, status: "scheduled", isSimulated: false,
          matchDate: new Date(`${year}-01-01`),
        },
      });
    }

    totalMatches += fixtures.length;
    compsProcessed++;
  }

  return NextResponse.json({
    success: true,
    year,
    competitions: compsProcessed,
    matches: totalMatches,
  });
}
