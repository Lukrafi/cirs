import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

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
        matches.push({ homeTeamId: turn === 0 ? home : away, awayTeamId: turn === 0 ? away : home, round: String(roundNum) });
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
      } else { next.push(current[i]); }
    }
    current = next;
    roundNum++;
  }
  return matches;
}

function cuid(): string {
  return "c" + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

async function main() {
  const year = new Date().getFullYear();
  console.log(`=== Seed Partidas ${year} (batch) ===`);

  const season = await prisma.season.findFirst({ where: { year } });
  if (!season) { console.log(`Season ${year} não encontrada. Pulando.`); return; }

  // Verifica se já tem partidas
  const existingMatches = await prisma.match.count({
    where: { group: { competition: { season: { year } } } },
  });
  if (existingMatches > 1000) {
    console.log(`${existingMatches} partidas já existem. Pulando.`);
    return;
  }

  // Ligas com país
  const leagues = await prisma.league.findMany({
    where: { countryId: { not: null } },
    select: { id: true, name: true, countryId: true },
  });
  const leagueMap: Record<string, string> = {};
  leagues.forEach((l) => { if (l.countryId) leagueMap[l.name] = l.countryId; });

  // Competições do ano
  const comps = await prisma.competition.findMany({
    where: { seasonId: season.id },
    select: { id: true, name: true, numTurns: true },
  });

  // Clubes por país
  const clubsByCountry: Record<string, { id: string; strength: number }[]> = {};
  const allClubs = await prisma.club.findMany({ select: { id: true, countryId: true, strength: true } });
  allClubs.forEach((c) => {
    if (!c.countryId) return;
    if (!clubsByCountry[c.countryId]) clubsByCountry[c.countryId] = [];
    clubsByCountry[c.countryId].push(c);
  });
  Object.values(clubsByCountry).forEach((arr) => arr.sort((a, b) => b.strength - a.strength));

  const groupData: { id: string; name: string; competitionId: string }[] = [];
  const standingData: { id: string; groupId: string; clubId: string; points: number; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; goalsDiff: number; position: number }[] = [];
  const matchData: { id: string; groupId: string; homeTeamId: string; awayTeamId: string; round: string; status: string; isSimulated: boolean; matchDate: Date }[] = [];

  let compsProcessed = 0;
  const dateStart = new Date(`${year}-01-01`);

  for (const comp of comps) {
    const countryId = leagueMap[comp.name];
    if (!countryId) continue;

    const clubs = clubsByCountry[countryId] || [];
    if (clubs.length < 2) continue;

    const teamCount = Math.min(getTeamCount(comp.name), clubs.length);
    const selected = clubs.slice(0, teamCount);
    const teamIds = selected.map((c) => c.id);

    const groupId = cuid();
    groupData.push({ id: groupId, name: "Grupo Único", competitionId: comp.id });

    for (const club of selected) {
      standingData.push({
        id: cuid(), groupId, clubId: club.id,
        points: 0, played: 0, wins: 0, draws: 0, losses: 0,
        goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, position: 0,
      });
    }

    const isCup = comp.name.toLowerCase().includes("copa") || comp.name.toLowerCase().includes("cup");
    const isSupercup = comp.name.toLowerCase().includes("supercop") || comp.name.toLowerCase().includes("super cup");

    let fixtures;
    if (isSupercup || teamCount === 2) fixtures = generateKnockout(teamIds);
    else if (isCup && teamCount <= 16) fixtures = generateKnockout(teamIds);
    else fixtures = generateRoundRobin(teamIds, comp.numTurns || 2);

    for (const f of fixtures) {
      matchData.push({
        id: cuid(), groupId, homeTeamId: f.homeTeamId, awayTeamId: f.awayTeamId,
        round: f.round, status: "scheduled", isSimulated: false, matchDate: dateStart,
      });
    }
    compsProcessed++;
  }

  const CHUNK = 5000;
  for (let i = 0; i < groupData.length; i += CHUNK) {
    await prisma.group.createMany({ data: groupData.slice(i, i + CHUNK) });
  }
  for (let i = 0; i < standingData.length; i += CHUNK) {
    await prisma.standing.createMany({ data: standingData.slice(i, i + CHUNK) });
  }
  for (let i = 0; i < matchData.length; i += CHUNK) {
    await prisma.match.createMany({ data: matchData.slice(i, i + CHUNK) });
  }

  console.log(`${compsProcessed} competições, ${matchData.length} partidas criadas`);
}

main()
  .catch((e) => { console.error("Seed partidas falhou:", e); })
  .finally(() => prisma.$disconnect());
