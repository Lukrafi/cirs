import { prisma } from "./prisma";
import { simulateMatch, applySimulation, SimulationResult } from "./simulator";

export type OfcCompetitionType = "ofc-pro-league" | "ofc-champions-league";

export type OfcPhase =
  | "regular-season"
  | "playoffs-leaders"
  | "playoffs-challengers"
  | "qualification"
  | "groups"
  | "semifinals"
  | "final";

export const OFC_COMPETITIONS: Record<OfcCompetitionType, {
  name: string;
  shortName: string;
  logo: string;
  color: string;
  description: string;
}> = {
  "ofc-pro-league": {
    name: "OFC Pro League",
    shortName: "OFC PL",
    logo: "",
    color: "#06b6d4",
    description: "A primeira liga de futebol profissional organizada pela Confederação de Futebol da Oceania.",
  },
  "ofc-champions-league": {
    name: "OFC Champions League",
    shortName: "OFC CL",
    logo: "",
    color: "#3b82f6",
    description: "O principal torneio eliminatório tradicional de clubes da Oceania.",
  },
};

export const OFC_PRO_LEAGUE_CLUBS = [
  "Auckland FC",
  "Bula FC",
  "PNG Hekari FC",
  "Solomon Kings FC",
  "South Island United",
  "South Melbourne FC",
  "Tahiti United",
  "Vanuatu United FC",
];

export const OFC_PRO_LEAGUE_CLUB_INFO: Record<string, { country: string; note?: string }> = {
  "Auckland FC": { country: "Nova Zelândia" },
  "Bula FC": { country: "Fiji" },
  "PNG Hekari FC": { country: "Papua-Nova Guiné" },
  "Solomon Kings FC": { country: "Ilhas Salomão" },
  "South Island United": { country: "Nova Zelândia" },
  "South Melbourne FC": {
    country: "Austrália",
    note: "Convidado/representante histórico da Oceania, sem direito a vagas em torneios FIFA da OFC",
  },
  "Tahiti United": { country: "Taiti / Polinésia Francesa" },
  "Vanuatu United FC": { country: "Vanuatu" },
};

export const PHASE_LABELS: Record<OfcPhase, string> = {
  "regular-season": "Temporada Regular (Pontos Corridos)",
  "playoffs-leaders": "Playoffs — Grupo de Líderes",
  "playoffs-challengers": "Playoffs — Grupo de Desafiantes",
  "qualification": "Fase de Qualificação",
  "groups": "Fase de Grupos",
  "semifinals": "Semifinais",
  "final": "Grande Final",
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
    const idx = i / 2;
    const matchDate = new Date(startDate);
    matchDate.setDate(startDate.getDate() + idx * daysBetweenMatches);
    matches.push({ homeId: teamA, awayId: teamB, round: `${roundLabel}-P${idx + 1}`, matchDate });
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
    const idx = i / 2;
    const leg1Date = new Date(startDate);
    leg1Date.setDate(startDate.getDate() + idx * 3);
    const leg2Date = new Date(startDate);
    leg2Date.setDate(leg1Date.getDate() + daysBetweenLegs);
    matches.push({ homeId: teamA, awayId: teamB, round: `${roundLabel}-Leg1-P${idx + 1}`, matchDate: leg1Date, leg: 1, pairingIndex: idx });
    matches.push({ homeId: teamB, awayId: teamA, round: `${roundLabel}-Leg2-P${idx + 1}`, matchDate: leg2Date, leg: 2, pairingIndex: idx });
  }
  return matches;
}

export async function createOfcProLeague(
  seasonId: string,
  clubIds: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "OFC Pro League",
      type: "ofc-pro-league",
      seasonId,
      isKnockout: false,
      format: "round-robin",
      numTeams: clubIds.length,
      numTurns: 2,
      hasExtraTime: true,
      hasPenalties: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
    },
  });

  const regularGroup = await prisma.group.create({
    data: { name: "Temporada Regular", competitionId: competition.id },
  });

  for (const cid of clubIds) {
    await prisma.standing.create({
      data: { groupId: regularGroup.id, clubId: cid, position: 0 },
    });
  }

  const fixtures = generateRoundrobinFixtures(clubIds, 2, startDate, 7);
  for (const m of fixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId: regularGroup.id,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: false,
      },
    });
  }

  return { competitionId: competition.id };
}

export async function createOfcChampionsLeague(
  seasonId: string,
  clubIds: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "OFC Champions League",
      type: "ofc-champions-league",
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

export async function updateStandings(groupId: string): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: {
      standings: { include: { club: true } },
      matches: { where: { status: "finished" } },
    },
  });

  if (!group) return;

  const table: Record<string, {
    clubId: string; played: number; wins: number; draws: number; losses: number;
    goalsFor: number; goalsAgainst: number; points: number;
  }> = {};

  for (const s of group.standings) {
    if (!s.clubId) continue;
    table[s.clubId] = { clubId: s.clubId, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
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
    if (m.homeScore > m.awayScore) { home.wins++; home.points += 3; away.losses++; }
    else if (m.homeScore === m.awayScore) { home.draws++; home.points += 1; away.draws++; away.points += 1; }
    else { away.wins++; away.points += 3; home.losses++; }
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
    const standing = await prisma.standing.findFirst({ where: { groupId, clubId: s.clubId } });
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

export async function simulateRoundrobinPhase(
  competitionId: string,
  groupId?: string
): Promise<{ simulated: number; results: SimulationResult[] }> {
  const where: Record<string, unknown> = {
    status: "scheduled",
    isKnockout: false,
  };
  if (groupId) {
    where.groupId = groupId;
  } else {
    where.group = { competitionId };
  }

  const matches = await prisma.match.findMany({
    where: where as never,
    include: { group: { include: { competition: true } } },
    orderBy: { matchDate: "asc" },
  });

  const results: SimulationResult[] = [];
  const touchedGroups = new Set<string>();

  for (const match of matches) {
    const ppw = match.group?.competition?.pointsPerWin ?? 3;
    const ppd = match.group?.competition?.pointsPerDraw ?? 1;
    const result = await simulateMatch(match.id);
    await applySimulation(match.id, result, ppw, ppd);
    results.push(result);
    if (match.groupId) touchedGroups.add(match.groupId);
  }

  for (const gid of touchedGroups) {
    await updateStandings(gid);
  }

  return { simulated: matches.length, results };
}

export async function simulateRoundrobinRound(
  competitionId: string,
  roundNumber: string,
  groupId?: string
): Promise<{ simulated: number; results: SimulationResult[] }> {
  const where: Record<string, unknown> = {
    round: roundNumber,
    status: "scheduled",
    isKnockout: false,
  };
  if (groupId) {
    where.groupId = groupId;
  } else {
    where.group = { competitionId };
  }

  const matches = await prisma.match.findMany({
    where: where as never,
    include: { group: { include: { competition: true } } },
  });

  const results: SimulationResult[] = [];
  const touchedGroups = new Set<string>();

  for (const match of matches) {
    const ppw = match.group?.competition?.pointsPerWin ?? 3;
    const ppd = match.group?.competition?.pointsPerDraw ?? 1;
    const result = await simulateMatch(match.id);
    await applySimulation(match.id, result, ppw, ppd);
    results.push(result);
    if (match.groupId) touchedGroups.add(match.groupId);
  }

  for (const gid of touchedGroups) {
    await updateStandings(gid);
  }

  return { simulated: matches.length, results };
}

export async function generateProLeaguePlayoffs(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number }> {
  const regularGroup = await prisma.group.findFirst({
    where: { competitionId, name: "Temporada Regular" },
    include: {
      standings: {
        include: { club: true },
        orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }],
      },
    },
  });

  if (!regularGroup || regularGroup.standings.length < 8) {
    throw new Error("Temporada Regular not found or insufficient teams");
  }

  const standings = regularGroup.standings;
  const top4 = standings.slice(0, 4);
  const bottom4 = standings.slice(4, 8);

  let created = 0;

  const leadersGroup = await prisma.group.create({
    data: { name: "Playoffs — Grupo de Líderes", competitionId },
  });

  for (const s of top4) {
    if (s.clubId) {
      await prisma.standing.create({
        data: { groupId: leadersGroup.id, clubId: s.clubId, position: s.position || 0 },
      });
    }
  }

  const leadersFixtures = generateRoundrobinFixtures(
    top4.map((s) => s.clubId).filter((id): id is string => id !== null),
    1,
    startDate,
    5
  );
  for (const m of leadersFixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId: leadersGroup.id,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: false,
      },
    });
    created++;
  }

  const challengersGroup = await prisma.group.create({
    data: { name: "Playoffs — Grupo de Desafiantes", competitionId },
  });

  for (const s of bottom4) {
    if (s.clubId) {
      await prisma.standing.create({
        data: { groupId: challengersGroup.id, clubId: s.clubId, position: s.position || 0 },
      });
    }
  }

  const challengersFixtures = generateRoundrobinFixtures(
    bottom4.map((s) => s.clubId).filter((id): id is string => id !== null),
    1,
    startDate,
    5
  );
  for (const m of challengersFixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId: challengersGroup.id,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: false,
      },
    });
    created++;
  }

  return { created };
}

export async function generateProLeagueSemifinals(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number }> {
  const leadersGroup = await prisma.group.findFirst({
    where: { competitionId, name: "Playoffs — Grupo de Líderes" },
    include: {
      standings: {
        include: { club: true },
        orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }],
      },
    },
  });

  const challengersGroup = await prisma.group.findFirst({
    where: { competitionId, name: "Playoffs — Grupo de Desafiantes" },
    include: {
      standings: {
        include: { club: true },
        orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }],
      },
    },
  });

  if (!leadersGroup || leadersGroup.standings.length < 4) {
    throw new Error("Leaders group not found or incomplete");
  }
  if (!challengersGroup || challengersGroup.standings.length < 4) {
    throw new Error("Challengers group not found or incomplete");
  }

  const top3Leaders = leadersGroup.standings.slice(0, 3).map((s) => s.clubId).filter((id): id is string => id !== null);
  const challenger1 = challengersGroup.standings[0]?.clubId;
  if (!challenger1) throw new Error("No challenger winner");

  const semiTeams = [...top3Leaders, challenger1];

  let created = 0;
  const sfGroup = await prisma.group.create({
    data: { name: "Semifinais", competitionId },
  });

  const sfFixtures = generateSingleMatchFixtures(semiTeams, startDate, 5, "SF");
  for (const m of sfFixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId: sfGroup.id,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: true,
      },
    });
    created++;
  }

  return { created };
}

export async function generateChampionsLeagueSemifinals(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number }> {
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
    for (let i = 0; i < Math.min(2, g.standings.length); i++) {
      if (g.standings[i].clubId) qualified.push(g.standings[i].clubId!);
    }
  }

  let created = 0;
  const sfGroup = await prisma.group.create({
    data: { name: "Semifinais", competitionId },
  });

  const sfFixtures = generateSingleMatchFixtures(qualified, startDate, 5, "SF");
  for (const m of sfFixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId: sfGroup.id,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: true,
      },
    });
    created++;
  }

  return { created };
}

export async function generateFinal(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number }> {
  const sfGroup = await prisma.group.findFirst({
    where: { competitionId, name: "Semifinais" },
    include: { matches: { where: { status: "finished" } } },
  });

  if (!sfGroup) throw new Error("Semifinais not found");

  const winners: string[] = [];
  for (const m of sfGroup.matches) {
    if (m.homeScore !== null && m.awayScore !== null) {
      if (m.homeScore > m.awayScore) winners.push(m.homeTeamId || "");
      else if (m.awayScore > m.homeScore) winners.push(m.awayTeamId || "");
      else winners.push(Math.random() < 0.5 ? (m.homeTeamId || "") : (m.awayTeamId || ""));
    }
  }

  if (winners.length < 2) throw new Error("Not enough semifinal winners");

  let created = 0;
  const finalGroup = await prisma.group.create({
    data: { name: "Grande Final", competitionId },
  });

  const finalFixtures = generateSingleMatchFixtures([winners[0], winners[1]], startDate, 0, "Final");
  for (const m of finalFixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId, awayTeamId: m.awayId,
        groupId: finalGroup.id,
        round: m.round, matchDate: m.matchDate,
        status: "scheduled", isKnockout: true,
      },
    });
    created++;
  }

  return { created };
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

    if ((result.homeScore || 0) > (result.awayScore || 0)) winners.push(match.homeTeamId || "");
    else if ((result.awayScore || 0) > (result.homeScore || 0)) winners.push(match.awayTeamId || "");
    else winners.push(Math.random() < 0.5 ? (match.homeTeamId || "") : (match.awayTeamId || ""));
  }

  return { simulated: matches.length, results, winners };
}

export async function simulateOfcPhase(
  competitionId: string,
  phase: string,
  roundNumber?: string
): Promise<{ simulated: number; results: SimulationResult[]; winners?: string[] }> {
  switch (phase) {
    case "regular-season":
      return await simulateRoundrobinPhase(competitionId);

    case "regular-season-round":
      if (!roundNumber) throw new Error("roundNumber required");
      return await simulateRoundrobinRound(competitionId, roundNumber);

    case "playoffs-leaders":
      return await simulateRoundrobinPhase(competitionId, await getGroupId(competitionId, "Playoffs — Grupo de Líderes"));

    case "playoffs-challengers":
      return await simulateRoundrobinPhase(competitionId, await getGroupId(competitionId, "Playoffs — Grupo de Desafiantes"));

    case "groups":
      return await simulateRoundrobinPhase(competitionId);

    case "semifinals":
    case "SF":
      return await simulateKnockoutSingle(competitionId, "SF");

    case "final":
    case "Final":
      return await simulateKnockoutSingle(competitionId, "Final");

    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}

async function getGroupId(competitionId: string, name: string): Promise<string | undefined> {
  const g = await prisma.group.findFirst({ where: { competitionId, name } });
  return g?.id;
}
