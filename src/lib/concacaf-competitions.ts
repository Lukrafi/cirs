import { prisma } from "./prisma";
import { simulateMatch, applySimulation, SimulationResult } from "./simulator";

export type ConcacafCompetitionType =
  | "champions-cup"
  | "leagues-cup"
  | "central-american-cup"
  | "caribbean-cup"
  | "caribbean-shield";

export type ConcacafPhase =
  | "round-one"
  | "r16"
  | "r32"
  | "groups"
  | "quarterfinals"
  | "play-ins"
  | "semifinals"
  | "third-place"
  | "final";

export const CONCACAF_COMPETITIONS: Record<ConcacafCompetitionType, {
  name: string;
  shortName: string;
  logo: string;
  color: string;
  description: string;
}> = {
  "champions-cup": {
    name: "CONCACAF Champions Cup",
    shortName: "CCC",
    logo: "",
    color: "#1e40af",
    description: "O principal torneio de clubes da América do Norte, Central e Caribe.",
  },
  "leagues-cup": {
    name: "Leagues Cup",
    shortName: "LC",
    logo: "",
    color: "#a855f7",
    description: "Torneio oficial entre todos os clubes da MLS e Liga MX.",
  },
  "central-american-cup": {
    name: "CONCACAF Central American Cup",
    shortName: "CAC",
    logo: "",
    color: "#16a34a",
    description: "Torneio regional exclusivo para clubes da América Central.",
  },
  "caribbean-cup": {
    name: "CONCACAF Caribbean Cup",
    shortName: "CRB",
    logo: "",
    color: "#0ea5e9",
    description: "Torneio regional exclusivo para clubes das federações caribenhas.",
  },
  "caribbean-shield": {
    name: "CONCACAF Caribbean Shield",
    shortName: "CRS",
    logo: "",
    color: "#f59e0b",
    description: "Segunda divisão do Caribe, para campeões de ligas menores e emergentes.",
  },
};

export const PHASE_LABELS: Record<ConcacafPhase, string> = {
  "round-one": "Primeira Rodada",
  "r16": "Oitavas de Final",
  "r32": "16 Avos de Final",
  "groups": "Fase de Grupos",
  "quarterfinals": "Quartas de Final",
  "play-ins": "Play-ins",
  "semifinals": "Semifinais",
  "third-place": "Disputa de 3º Lugar",
  "final": "Grande Final",
};

export type GroupStageConfig = {
  numGroups: number;
  teamsPerGroup: number;
  matchesPerTeam: number;
  homeMatches: number;
  awayMatches: number;
  qualifyPerGroup: number;
};

export function generateRoundrobinFixtures(
  clubIds: string[],
  numTurns: number = 2,
  startDate: Date = new Date(),
  daysBetweenRounds: number = 7
): { homeId: string; awayId: string; round: string; matchDate: Date }[] {
  if (clubIds.length < 2) return [];

  const teams = [...clubIds];
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) teams.push("BYE");

  const n = teams.length;
  const roundsPerTurn = n - 1;
  const matches: { homeId: string; awayId: string; round: string; matchDate: Date }[] = [];
  let current = [...teams];

  for (let turn = 0; turn < numTurns; turn++) {
    for (let round = 0; round < roundsPerTurn; round++) {
      const roundNumber = `${round + 1 + turn * roundsPerTurn}`;
      const matchDate = new Date(startDate);
      matchDate.setDate(startDate.getDate() + (round + turn * roundsPerTurn) * daysBetweenRounds);

      for (let i = 0; i < n / 2; i++) {
        let home = current[i];
        let away = current[n - 1 - i];
        if (turn % 2 === 1) [home, away] = [away, home];
        if (home !== "BYE" && away !== "BYE") {
          matches.push({ homeId: home, awayId: away, round: roundNumber, matchDate });
        }
      }

      current = [current[0], ...current.slice(-1), ...current.slice(1, -1)];
    }
  }

  return matches;
}

export function generateTwoLegKnockoutFixtures(
  clubIds: string[],
  startDate: Date = new Date(),
  daysBetweenLegs: number = 7,
  roundLabel: string = "KO"
): { homeId: string; awayId: string; round: string; matchDate: Date; leg: 1 | 2; pairingIndex: number }[] {
  const matches: { homeId: string; awayId: string; round: string; matchDate: Date; leg: 1 | 2; pairingIndex: number }[] = [];

  for (let i = 0; i < clubIds.length; i += 2) {
    const teamA = clubIds[i];
    const teamB = clubIds[i + 1];
    if (!teamA || !teamB) continue;

    const pairingIndex = i / 2;
    const leg1Date = new Date(startDate);
    leg1Date.setDate(startDate.getDate() + pairingIndex * 3);
    const leg2Date = new Date(startDate);
    leg2Date.setDate(leg1Date.getDate() + daysBetweenLegs);

    matches.push({
      homeId: teamA, awayId: teamB,
      round: `${roundLabel}-Leg1-P${pairingIndex + 1}`,
      matchDate: leg1Date, leg: 1, pairingIndex,
    });
    matches.push({
      homeId: teamB, awayId: teamA,
      round: `${roundLabel}-Leg2-P${pairingIndex + 1}`,
      matchDate: leg2Date, leg: 2, pairingIndex,
    });
  }

  return matches;
}

export function generateSingleMatchFixtures(
  clubIds: string[],
  startDate: Date = new Date(),
  daysBetweenMatches: number = 3,
  roundLabel: string = "KO"
): { homeId: string; awayId: string; round: string; matchDate: Date }[] {
  const matches: { homeId: string; awayId: string; round: string; matchDate: Date }[] = [];

  for (let i = 0; i < clubIds.length; i += 2) {
    const teamA = clubIds[i];
    const teamB = clubIds[i + 1];
    if (!teamA || !teamB) continue;

    const pairingIndex = i / 2;
    const matchDate = new Date(startDate);
    matchDate.setDate(startDate.getDate() + pairingIndex * daysBetweenMatches);

    matches.push({
      homeId: teamA, awayId: teamB,
      round: `${roundLabel}-P${pairingIndex + 1}`,
      matchDate,
    });
  }

  return matches;
}

export async function createChampionsCup(
  seasonId: string,
  roundOneTeams: string[],
  preQualifiedTeams: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "CONCACAF Champions Cup",
      type: "champions-cup",
      seasonId,
      isKnockout: true,
      format: "knockout",
      numTeams: roundOneTeams.length + preQualifiedTeams.length,
      hasExtraTime: true,
      hasPenalties: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
    },
  });

  const roundOneGroup = await prisma.group.create({
    data: { name: "Primeira Rodada", competitionId: competition.id },
  });

  const roundOneFixtures = generateTwoLegKnockoutFixtures(roundOneTeams, startDate, 7, "R1");
  for (const m of roundOneFixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId: roundOneGroup.id,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: true,
      },
    });
  }

  return { competitionId: competition.id };
}

export async function advanceChampionsCupToR16(
  competitionId: string,
  roundOneWinners: string[],
  preQualifiedTeams: string[],
  startDate: Date = new Date()
): Promise<{ created: number }> {
  const r16Teams = [...roundOneWinners, ...preQualifiedTeams];
  let created = 0;

  const r16Group = await prisma.group.create({
    data: { name: "Oitavas de Final", competitionId },
  });

  const r16Fixtures = generateTwoLegKnockoutFixtures(r16Teams, startDate, 7, "R16");
  for (const m of r16Fixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId: r16Group.id,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: true,
      },
    });
    created++;
  }

  return { created };
}

export async function createLeaguesCup(
  seasonId: string,
  clubIds: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "Leagues Cup",
      type: "leagues-cup",
      seasonId,
      isKnockout: false,
      format: "groups",
      numTeams: clubIds.length,
      hasExtraTime: false,
      hasPenalties: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
    },
  });

  const numGroups = Math.ceil(clubIds.length / 3);
  const shuffled = [...clubIds].sort(() => Math.random() - 0.5);
  let created = 0;

  for (let g = 0; g < numGroups; g++) {
    const groupTeams = shuffled.slice(g * 3, (g + 1) * 3);
    if (groupTeams.length < 2) continue;

    const group = await prisma.group.create({
      data: { name: `Grupo ${String.fromCharCode(65 + g)}`, competitionId: competition.id },
    });

    for (const cid of groupTeams) {
      await prisma.standing.create({
        data: { groupId: group.id, clubId: cid, position: 0 },
      });
    }

    const groupFixtures = generateRoundrobinFixtures(groupTeams, 1, new Date(startDate.getTime() + g * 86400000), 3);
    for (const m of groupFixtures) {
      await prisma.match.create({
        data: {
          homeTeamId: m.homeId, awayTeamId: m.awayId,
          groupId: group.id,
          round: m.round, matchDate: m.matchDate,
          status: "scheduled", isKnockout: false,
        },
      });
      created++;
    }
  }

  return { competitionId: competition.id };
}

export async function createCentralAmericanCup(
  seasonId: string,
  clubIds: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "CONCACAF Central American Cup",
      type: "central-american-cup",
      seasonId,
      isKnockout: false,
      format: "groups",
      numTeams: clubIds.length,
      hasExtraTime: true,
      hasPenalties: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
    },
  });

  const numGroups = 4;
  const perGroup = Math.ceil(clubIds.length / numGroups);
  const shuffled = [...clubIds].sort(() => Math.random() - 0.5);

  for (let g = 0; g < numGroups; g++) {
    const groupTeams = shuffled.slice(g * perGroup, (g + 1) * perGroup);
    if (groupTeams.length < 2) continue;

    const group = await prisma.group.create({
      data: { name: `Grupo ${String.fromCharCode(65 + g)}`, competitionId: competition.id },
    });

    for (const cid of groupTeams) {
      await prisma.standing.create({
        data: { groupId: group.id, clubId: cid, position: 0 },
      });
    }

    const groupFixtures = generateRoundrobinFixtures(groupTeams, 2, new Date(startDate.getTime() + g * 86400000), 5);
    for (const m of groupFixtures) {
      await prisma.match.create({
        data: {
          homeTeamId: m.homeId, awayTeamId: m.awayId,
          groupId: group.id,
          round: m.round, matchDate: m.matchDate,
          status: "scheduled", isKnockout: false,
        },
      });
    }
  }

  return { competitionId: competition.id };
}

export async function createCaribbeanCup(
  seasonId: string,
  clubIds: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "CONCACAF Caribbean Cup",
      type: "caribbean-cup",
      seasonId,
      isKnockout: false,
      format: "groups",
      numTeams: clubIds.length,
      hasExtraTime: true,
      hasPenalties: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
    },
  });

  const numGroups = 2;
  const perGroup = Math.ceil(clubIds.length / numGroups);
  const shuffled = [...clubIds].sort(() => Math.random() - 0.5);

  for (let g = 0; g < numGroups; g++) {
    const groupTeams = shuffled.slice(g * perGroup, (g + 1) * perGroup);
    if (groupTeams.length < 2) continue;

    const group = await prisma.group.create({
      data: { name: `Grupo ${String.fromCharCode(65 + g)}`, competitionId: competition.id },
    });

    for (const cid of groupTeams) {
      await prisma.standing.create({
        data: { groupId: group.id, clubId: cid, position: 0 },
      });
    }

    const groupFixtures = generateRoundrobinFixtures(groupTeams, 1, new Date(startDate.getTime() + g * 86400000), 5);
    for (const m of groupFixtures) {
      await prisma.match.create({
        data: {
          homeTeamId: m.homeId, awayTeamId: m.awayId,
          groupId: group.id,
          round: m.round, matchDate: m.matchDate,
          status: "scheduled", isKnockout: false,
        },
      });
    }
  }

  return { competitionId: competition.id };
}

export async function createCaribbeanShield(
  seasonId: string,
  clubIds: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "CONCACAF Caribbean Shield",
      type: "caribbean-shield",
      seasonId,
      isKnockout: false,
      format: "groups",
      numTeams: clubIds.length,
      hasExtraTime: true,
      hasPenalties: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
    },
  });

  const numGroups = Math.min(4, Math.floor(clubIds.length / 3));
  const perGroup = Math.ceil(clubIds.length / numGroups);
  const shuffled = [...clubIds].sort(() => Math.random() - 0.5);

  for (let g = 0; g < numGroups; g++) {
    const groupTeams = shuffled.slice(g * perGroup, (g + 1) * perGroup);
    if (groupTeams.length < 2) continue;

    const group = await prisma.group.create({
      data: { name: `Grupo ${String.fromCharCode(65 + g)}`, competitionId: competition.id },
    });

    for (const cid of groupTeams) {
      await prisma.standing.create({
        data: { groupId: group.id, clubId: cid, position: 0 },
      });
    }

    const groupFixtures = generateRoundrobinFixtures(groupTeams, 1, new Date(startDate.getTime() + g * 86400000), 2);
    for (const m of groupFixtures) {
      await prisma.match.create({
        data: {
          homeTeamId: m.homeId, awayTeamId: m.awayId,
          groupId: group.id,
          round: m.round, matchDate: m.matchDate,
          status: "scheduled", isKnockout: false,
        },
      });
    }
  }

  return { competitionId: competition.id };
}

export async function updateGroupStandings(groupId: string): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      standings: { include: { club: true } },
      matches: { where: { status: "finished" } },
    },
  });

  if (!group) return;

  const table: Record<string, {
    clubId: string;
    played: number; wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; points: number;
  }> = {};

  for (const s of group.standings) {
    if (!s.clubId) continue;
    table[s.clubId] = {
      clubId: s.clubId,
      played: 0, wins: 0, draws: 0, losses: 0,
      goalsFor: 0, goalsAgainst: 0, points: 0,
    };
  }

  for (const m of group.matches) {
    if (m.status !== "finished" || m.homeScore === null || m.awayScore === null) continue;
    if (!m.homeTeamId || !m.awayTeamId) continue;

    const home = table[m.homeTeamId];
    const away = table[m.awayTeamId];
    if (!home || !away) continue;

    home.played++; away.played++;
    home.goalsFor += m.homeScore; home.goalsAgainst += m.awayScore;
    away.goalsFor += m.awayScore; away.goalsAgainst += m.homeScore;

    if (m.homeScore > m.awayScore) {
      home.wins++; home.points += 3; away.losses++;
    } else if (m.homeScore === m.awayScore) {
      home.draws++; home.points += 1; away.draws++; away.points += 1;
    } else {
      away.wins++; away.points += 3; home.losses++;
    }
  }

  const sorted = Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.goalsFor - a.goalsAgainst;
    const bGD = b.goalsFor - b.goalsAgainst;
    if (bGD !== aGD) return bGD - aGD;
    return b.goalsFor - a.goalsFor;
  });

  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const standing = await prisma.standing.findFirst({
      where: { groupId, clubId: s.clubId },
    });
    if (standing) {
      await prisma.standing.update({
        where: { id: standing.id },
        data: {
          played: s.played, wins: s.wins, draws: s.draws, losses: s.losses,
          goalsFor: s.goalsFor, goalsAgainst: s.goalsAgainst,
          goalsDiff: s.goalsFor - s.goalsAgainst,
          points: s.points, position: i + 1,
        },
      });
    }
  }
}

export async function simulateGroupPhase(
  competitionId: string
): Promise<{ simulated: number; results: SimulationResult[] }> {
  const matches = await prisma.match.findMany({
    where: {
      group: { competitionId },
      status: "scheduled",
      isKnockout: false,
    },
    include: { group: { include: { competition: true } } },
    orderBy: { matchDate: "asc" },
  });

  const results: SimulationResult[] = [];
  const groupIds = new Set<string>();

  for (const match of matches) {
    const ppw = match.group?.competition?.pointsPerWin ?? 3;
    const ppd = match.group?.competition?.pointsPerDraw ?? 1;
    const result = await simulateMatch(match.id);
    await applySimulation(match.id, result, ppw, ppd);
    results.push(result);
    if (match.groupId) groupIds.add(match.groupId);
  }

  for (const gid of groupIds) {
    await updateGroupStandings(gid);
  }

  return { simulated: matches.length, results };
}

export async function simulateGroupRound(
  competitionId: string,
  roundNumber: string
): Promise<{ simulated: number; results: SimulationResult[] }> {
  const matches = await prisma.match.findMany({
    where: {
      group: { competitionId },
      round: roundNumber,
      status: "scheduled",
      isKnockout: false,
    },
    include: { group: { include: { competition: true } } },
  });

  const results: SimulationResult[] = [];
  const groupIds = new Set<string>();

  for (const match of matches) {
    const ppw = match.group?.competition?.pointsPerWin ?? 3;
    const ppd = match.group?.competition?.pointsPerDraw ?? 1;
    const result = await simulateMatch(match.id);
    await applySimulation(match.id, result, ppw, ppd);
    results.push(result);
    if (match.groupId) groupIds.add(match.groupId);
  }

  for (const gid of groupIds) {
    await updateGroupStandings(gid);
  }

  return { simulated: matches.length, results };
}

export async function simulateKnockoutTwoLegs(
  competitionId: string,
  roundLabel: string
): Promise<{ simulated: number; results: SimulationResult[]; winners: string[] }> {
  const matches = await prisma.match.findMany({
    where: {
      group: { competitionId },
      round: { startsWith: roundLabel },
      status: "scheduled",
    },
    include: { group: { include: { competition: true } } },
    orderBy: { matchDate: "asc" },
  });

  const results: SimulationResult[] = [];
  for (const match of matches) {
    const result = await simulateMatch(match.id);
    await applySimulation(match.id, result, 3, 1);
    results.push(result);
  }

  const pairings: Record<string, { homeId: string; awayId: string; homeAgg: number; awayAgg: number }> = {};

  for (const match of matches) {
    const roundStr = match.round || "";
    const pairingMatch = roundStr.match(/P(\d+)/);
    if (!pairingMatch) continue;
    const pIdx = pairingMatch[1];
    const legMatch = roundStr.match(/Leg(\d+)/);
    if (!legMatch) continue;
    const leg = legMatch[1];

    if (!pairings[pIdx]) {
      pairings[pIdx] = {
        homeId: match.homeTeamId || "",
        awayId: match.awayTeamId || "",
        homeAgg: 0, awayAgg: 0,
      };
    }

    if (leg === "1") {
      pairings[pIdx].homeAgg += match.homeScore || 0;
      pairings[pIdx].awayAgg += match.awayScore || 0;
    } else {
      pairings[pIdx].awayAgg += match.homeScore || 0;
      pairings[pIdx].homeAgg += match.awayScore || 0;
    }
  }

  const winners: string[] = [];
  for (const key of Object.keys(pairings).sort((a, b) => parseInt(a) - parseInt(b))) {
    const p = pairings[key];
    if (p.homeAgg > p.awayAgg) winners.push(p.homeId);
    else if (p.awayAgg > p.homeAgg) winners.push(p.awayId);
    else winners.push(Math.random() < 0.5 ? p.homeId : p.awayId);
  }

  return { simulated: matches.length, results, winners };
}

export async function simulateKnockoutSingle(
  competitionId: string,
  roundLabel: string
): Promise<{ simulated: number; results: SimulationResult[]; winners: string[] }> {
  const matches = await prisma.match.findMany({
    where: {
      group: { competitionId },
      round: { startsWith: roundLabel },
      status: "scheduled",
    },
    include: { group: { include: { competition: true } } },
  });

  const results: SimulationResult[] = [];
  const winners: string[] = [];

  for (const match of matches) {
    const result = await simulateMatch(match.id);
    await applySimulation(match.id, result, 3, 1);
    results.push(result);

    if ((result.homeScore || 0) > (result.awayScore || 0)) {
      winners.push(match.homeTeamId || "");
    } else if ((result.awayScore || 0) > (result.homeScore || 0)) {
      winners.push(match.awayTeamId || "");
    } else {
      winners.push(Math.random() < 0.5 ? (match.homeTeamId || "") : (match.awayTeamId || ""));
    }
  }

  return { simulated: matches.length, results, winners };
}

export async function advanceKnockoutTwoLegs(
  competitionId: string,
  toRoundName: string,
  toRoundLabel: string,
  winnerIds: string[],
  startDate: Date = new Date()
): Promise<{ created: number }> {
  const existingGroup = await prisma.group.findFirst({
    where: { competitionId, name: toRoundName },
  });

  let groupId: string;
  if (existingGroup) {
    groupId = existingGroup.id;
  } else {
    const g = await prisma.group.create({
      data: { name: toRoundName, competitionId },
    });
    groupId = g.id;
  }

  let created = 0;
  const fixtures = generateTwoLegKnockoutFixtures(winnerIds, startDate, 7, toRoundLabel);
  for (const m of fixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: true,
      },
    });
    created++;
  }

  return { created };
}

export async function advanceKnockoutSingle(
  competitionId: string,
  toRoundName: string,
  toRoundLabel: string,
  winnerIds: string[],
  startDate: Date = new Date()
): Promise<{ created: number }> {
  const existingGroup = await prisma.group.findFirst({
    where: { competitionId, name: toRoundName },
  });

  let groupId: string;
  if (existingGroup) {
    groupId = existingGroup.id;
  } else {
    const g = await prisma.group.create({
      data: { name: toRoundName, competitionId },
    });
    groupId = g.id;
  }

  let created = 0;
  const fixtures = generateSingleMatchFixtures(winnerIds, startDate, 3, toRoundLabel);
  for (const m of fixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: true,
      },
    });
    created++;
  }

  return { created };
}

export async function generateKnockoutFromGroups(
  competitionId: string,
  qualifyPerGroup: number,
  startDate: Date = new Date(),
  knockoutRoundName: string = "Quartas de Final",
  knockoutRoundLabel: string = "QF",
  twoLegs: boolean = true
): Promise<{ created: number; qualifiedTeamIds: string[] }> {
  const groups = await prisma.group.findMany({
    where: { competitionId, name: { startsWith: "Grupo" } },
    include: {
      standings: {
        include: { club: true },
        orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }],
      },
    },
  });

  const qualified: string[] = [];
  for (const g of groups) {
    for (let i = 0; i < Math.min(qualifyPerGroup, g.standings.length); i++) {
      if (g.standings[i].clubId) qualified.push(g.standings[i].clubId!);
    }
  }

  const shuffled = [...qualified].sort(() => Math.random() - 0.5);

  const existingGroup = await prisma.group.findFirst({
    where: { competitionId, name: knockoutRoundName },
  });

  let groupId: string;
  if (existingGroup) {
    groupId = existingGroup.id;
  } else {
    const g = await prisma.group.create({
      data: { name: knockoutRoundName, competitionId },
    });
    groupId = g.id;
  }

  let created = 0;
  if (twoLegs) {
    const fixtures = generateTwoLegKnockoutFixtures(shuffled, startDate, 7, knockoutRoundLabel);
    for (const m of fixtures) {
      await prisma.match.create({
        data: {
          homeTeamId: m.homeId, awayTeamId: m.awayId,
          groupId,
          round: m.round, matchDate: m.matchDate,
          status: "scheduled", isKnockout: true,
        },
      });
      created++;
    }
  } else {
    const fixtures = generateSingleMatchFixtures(shuffled, startDate, 3, knockoutRoundLabel);
    for (const m of fixtures) {
      await prisma.match.create({
        data: {
          homeTeamId: m.homeId, awayTeamId: m.awayId,
          groupId,
          round: m.round, matchDate: m.matchDate,
          status: "scheduled", isKnockout: true,
        },
      });
      created++;
    }
  }

  return { created, qualifiedTeamIds: shuffled };
}

export async function generateLeaguesCupKnockout(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number; qualifiedTeamIds: string[] }> {
  return await generateKnockoutFromGroups(competitionId, 2, startDate, "16 Avos de Final", "R32", false);
}

export async function generateCentralAmericanKnockout(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number; qualifiedTeamIds: string[] }> {
  return await generateKnockoutFromGroups(competitionId, 2, startDate, "Quartas de Final", "QF", true);
}

export async function generateCaribbeanCupKnockout(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number; qualifiedTeamIds: string[] }> {
  return await generateKnockoutFromGroups(competitionId, 2, startDate, "Semifinais", "SF", true);
}

export async function generateCaribbeanShieldKnockout(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number; qualifiedTeamIds: string[] }> {
  return await generateKnockoutFromGroups(competitionId, 2, startDate, "Semifinais", "SF", false);
}

export async function simulateConcacafPhase(
  competitionId: string,
  phase: string,
  roundNumber?: string
): Promise<{ simulated: number; results: SimulationResult[]; winners?: string[] }> {
  const competition = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!competition) throw new Error("Competition not found");

  switch (phase) {
    case "groups":
    case "group-phase":
      return await simulateGroupPhase(competitionId);

    case "group-round":
      if (!roundNumber) throw new Error("roundNumber required for group-round");
      return await simulateGroupRound(competitionId, roundNumber);

    case "round-one":
    case "R1":
      return await simulateKnockoutTwoLegs(competitionId, "R1");

    case "r16":
    case "R16":
      return await simulateKnockoutTwoLegs(competitionId, "R16");

    case "r32":
    case "R32":
      return await simulateKnockoutSingle(competitionId, "R32");

    case "quarterfinals":
    case "QF":
      return await simulateKnockoutTwoLegs(competitionId, "QF");

    case "play-ins":
    case "Play-in":
      return await simulateKnockoutTwoLegs(competitionId, "Play-in");

    case "semifinals":
    case "SF":
      return await simulateKnockoutTwoLegs(competitionId, "SF");

    case "third-place":
    case "3rd":
      return await simulateKnockoutSingle(competitionId, "3rd");

    case "final":
    case "Final":
      return await simulateKnockoutTwoLegs(competitionId, "Final");

    case "final-single":
      return await simulateKnockoutSingle(competitionId, "Final");

    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

export async function getGroupStageResults(competitionId: string) {
  const groups = await prisma.group.findMany({
    where: {
      competitionId,
      name: { startsWith: "Grupo" },
    },
    include: {
      standings: {
        include: { club: true },
        orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }],
      },
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: [{ round: "asc" }, { matchDate: "asc" }],
      },
    },
  });
  return groups;
}

export async function getKnockoutRounds(competitionId: string) {
  const groups = await prisma.group.findMany({
    where: {
      competitionId,
      name: { not: { startsWith: "Grupo" } },
    },
    include: {
      matches: {
        include: { homeTeam: true, awayTeam: true },
        orderBy: [{ round: "asc" }, { matchDate: "asc" }],
      },
    },
  });
  return groups;
}
