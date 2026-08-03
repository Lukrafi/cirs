import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { requireAdmin } from "@/lib/apiAuth";
import { generateRoundrobin, generateKnockout, generateSwiss, generateGroups } from "@/lib/fixtureGenerator";

export const dynamic = "force-dynamic";

export async function GET() {
  const competitions = await prisma.competition.findMany({
    include: { season: { include: { league: true } }, groups: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(competitions);
}

export async function POST(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const { clubIds, ...compData } = body;

  const competition = await prisma.competition.create({
    data: {
      name: compData.name,
      type: compData.type || "league",
      logo: compData.logo || "",
      seasonId: compData.seasonId || null,
      isKnockout: compData.isKnockout || false,
      format: compData.format || "round-robin",
      numTeams: compData.numTeams || (clubIds?.length ?? 0),
      numTurns: compData.numTurns ?? 2,
      promoted: compData.promoted ?? 0,
      relegated: compData.relegated ?? 0,
      qualifiedLibertadores: compData.qualifiedLibertadores ?? 0,
      qualifiedSulAmericana: compData.qualifiedSulAmericana ?? 0,
      pointsPerWin: compData.pointsPerWin ?? 3,
      pointsPerDraw: compData.pointsPerDraw ?? 1,
      hasExtraTime: compData.hasExtraTime ?? false,
      hasPenalties: compData.hasPenalties ?? false,
      maxSubstitutions: compData.maxSubstitutions ?? 5,
      maxCardsBeforeSuspension: compData.maxCardsBeforeSuspension ?? 3,
      tiebreaker1: compData.tiebreaker1 || "points",
      tiebreaker2: compData.tiebreaker2 || "wins",
      tiebreaker3: compData.tiebreaker3 || "goalDiff",
      tiebreaker4: compData.tiebreaker4 || "goalsFor",
      tiebreaker5: compData.tiebreaker5 || "head-to-head",
    },
  });

  if (clubIds && clubIds.length >= 2) {
    const format = compData.format || "round-robin";
    const startDate = compData.startDate ? new Date(compData.startDate) : new Date();
    const numTurns = compData.numTurns ?? 2;

    if (format === "groups") {
      const numGroups = compData.numGroups ?? Math.ceil(clubIds.length / 4);
      const groups = generateGroups(clubIds, numGroups, startDate);
      for (const g of groups) {
        const group = await prisma.group.create({
          data: {
            name: `Grupo ${String.fromCharCode(65 + g.groupIndex)}`,
            competitionId: competition.id,
          },
        });
        for (const cid of g.clubIds) {
          await prisma.standing.create({
            data: { groupId: group.id, clubId: cid, position: 0 },
          });
        }
        for (const m of g.matches) {
          await prisma.match.create({
            data: {
              homeTeamId: m.homeId,
              awayTeamId: m.awayId,
              groupId: group.id,
              round: m.round,
              matchDate: m.matchDate,
              status: "scheduled",
            },
          });
        }
      }
    } else if (format === "knockout" || format === "mata-mata") {
      const group = await prisma.group.create({
        data: { name: "Mata-mata", competitionId: competition.id },
      });
      for (const cid of clubIds) {
        await prisma.standing.create({
          data: { groupId: group.id, clubId: cid, position: 0 },
        });
      }
      const matches = generateKnockout(clubIds, startDate);
      for (const m of matches) {
        await prisma.match.create({
          data: {
            homeTeamId: m.homeId,
            awayTeamId: m.awayId,
            groupId: group.id,
            round: m.round,
            matchDate: m.matchDate,
            status: "scheduled",
            isKnockout: true,
          },
        });
      }
    } else if (format === "swiss") {
      const group = await prisma.group.create({
        data: { name: "Fase Suíça", competitionId: competition.id },
      });
      for (const cid of clubIds) {
        await prisma.standing.create({
          data: { groupId: group.id, clubId: cid, position: 0 },
        });
      }
      const numRounds = compData.numRounds ?? 5;
      const matches = generateSwiss(clubIds, numRounds, startDate);
      for (const m of matches) {
        await prisma.match.create({
          data: {
            homeTeamId: m.homeId,
            awayTeamId: m.awayId,
            groupId: group.id,
            round: m.round,
            matchDate: m.matchDate,
            status: "scheduled",
          },
        });
      }
    } else {
      const groupName = format === "single-round" ? "Turno Único" : "Pontos Corridos";
      const group = await prisma.group.create({
        data: { name: groupName, competitionId: competition.id },
      });
      for (const cid of clubIds) {
        await prisma.standing.create({
          data: { groupId: group.id, clubId: cid, position: 0 },
        });
      }
      const turns = format === "single-round" ? 1 : numTurns;
      const matches = generateRoundrobin(clubIds, turns, startDate);
      for (const m of matches) {
        await prisma.match.create({
          data: {
            homeTeamId: m.homeId,
            awayTeamId: m.awayId,
            groupId: group.id,
            round: m.round,
            matchDate: m.matchDate,
            status: "scheduled",
          },
        });
      }
    }
  }

  return NextResponse.json(competition, { status: 201 });
}

export async function PUT(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const body = await req.json();
  const { id, ...data } = body;
  const competition = await prisma.competition.update({ where: { id }, data });
  return NextResponse.json(competition);
}

export async function DELETE(req: NextRequest) {
  const auth = await requireAdmin();
  if ("error" in auth) return auth.error;
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID required" }, { status: 400 });

  const groups = await prisma.group.findMany({ where: { competitionId: id } });
  for (const g of groups) {
    await prisma.standing.deleteMany({ where: { groupId: g.id } });
    await prisma.match.deleteMany({ where: { groupId: g.id } });
  }
  await prisma.group.deleteMany({ where: { competitionId: id } });
  await prisma.competition.delete({ where: { id } });
  return NextResponse.json({ success: true });
}
