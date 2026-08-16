import { prisma } from "./prisma";
import { simulateMatch, applySimulation, SimulationResult } from "./simulator";

export type UefaCompetitionType = "champions-league" | "europa-league" | "conference-league";

export type UefaPhase =
  | "q1"
  | "q2-champions"
  | "q2-league"
  | "q3-champions"
  | "q3-league"
  | "playoff-champions"
  | "playoff-league"
  | "playoff-main"
  | "league-phase"
  | "knockout-playoff"
  | "r16"
  | "qf"
  | "sf"
  | "final";

export const UEFA_COMPETITIONS: Record<UefaCompetitionType, {
  name: string;
  shortName: string;
  leaguePhaseMatches: number;
  leaguePhaseTeams: number;
  directR16: number;
  knockoutPlayoffSlots: number;
  eliminated: number;
  logo: string;
  color: string;
}> = {
  "champions-league": {
    name: "UEFA Champions League",
    shortName: "UCL",
    leaguePhaseMatches: 8,
    leaguePhaseTeams: 36,
    directR16: 8,
    knockoutPlayoffSlots: 16,
    eliminated: 12,
    logo: "",
    color: "#0a1e6e",
  },
  "europa-league": {
    name: "UEFA Europa League",
    shortName: "UEL",
    leaguePhaseMatches: 8,
    leaguePhaseTeams: 36,
    directR16: 8,
    knockoutPlayoffSlots: 16,
    eliminated: 12,
    logo: "",
    color: "#f97316",
  },
  "conference-league": {
    name: "UEFA Conference League",
    shortName: "UECL",
    leaguePhaseMatches: 6,
    leaguePhaseTeams: 36,
    directR16: 8,
    knockoutPlayoffSlots: 16,
    eliminated: 12,
    logo: "",
    color: "#22c55e",
  },
};

export const PHASE_LABELS: Record<UefaPhase, string> = {
  "q1": "1ª Pré-Eliminatória",
  "q2-champions": "2ª Pré-Eliminatória (Caminho dos Campeões)",
  "q2-league": "2ª Pré-Eliminatória (Caminho da Liga)",
  "q3-champions": "3ª Pré-Eliminatória (Caminho dos Campeões)",
  "q3-league": "3ª Pré-Eliminatória (Caminho da Liga)",
  "playoff-champions": "Play-off (Caminho dos Campeões)",
  "playoff-league": "Play-off (Caminho da Liga)",
  "playoff-main": "Play-off (Caminho Principal)",
  "league-phase": "Fase de Liga",
  "knockout-playoff": "Play-off da Fase Eliminatória",
  "r16": "Oitavas de Final",
  "qf": "Quartas de Final",
  "sf": "Semifinais",
  "final": "Final",
};

export type QualificationRound = {
  phase: UefaPhase;
  competition: UefaCompetitionType;
  clubIds: string[];
  pairings: { homeId: string; awayId: string }[];
  twoLegs: boolean;
  losersDropTo?: UefaCompetitionType;
  losersDropToPhase?: UefaPhase;
};

export type LeaguePhaseConfig = {
  competition: UefaCompetitionType;
  totalTeams: number;
  matchesPerTeam: number;
  homeMatches: number;
  awayMatches: number;
  directR16: number;
  knockoutPlayoffStart: number;
  knockoutPlayoffEnd: number;
  eliminatedStart: number;
};

export function getLeaguePhaseConfig(competition: UefaCompetitionType): LeaguePhaseConfig {
  const config = UEFA_COMPETITIONS[competition];
  return {
    competition,
    totalTeams: config.leaguePhaseTeams,
    matchesPerTeam: config.leaguePhaseMatches,
    homeMatches: config.leaguePhaseMatches / 2,
    awayMatches: config.leaguePhaseMatches / 2,
    directR16: config.directR16,
    knockoutPlayoffStart: config.directR16 + 1,
    knockoutPlayoffEnd: config.directR16 + config.knockoutPlayoffSlots,
    eliminatedStart: config.leaguePhaseTeams - config.eliminated + 1,
  };
}

export function generateSwissFixtures(
  clubIds: string[],
  matchesPerTeam: number,
  startDate: Date = new Date(),
  daysBetweenRounds: number = 7
): { homeId: string; awayId: string; round: string; matchDate: Date }[] {
  if (clubIds.length < 2) return [];

  const teams = [...clubIds];
  const matchesPerTeamInt = Math.min(matchesPerTeam, teams.length - 1);
  const totalRounds = matchesPerTeamInt;
  const matches: { homeId: string; awayId: string; round: string; matchDate: Date }[] = [];

  const homeCount: Record<string, number> = {};
  const awayCount: Record<string, number> = {};
  const opponents: Record<string, Set<string>> = {};
  for (const id of teams) {
    homeCount[id] = 0;
    awayCount[id] = 0;
    opponents[id] = new Set();
  }

  const targetHome = matchesPerTeamInt / 2;

  let currentOrder = [...teams];
  for (let r = 0; r < totalRounds; r++) {
    const roundNumber = `${r + 1}`;
    const matchDate = new Date(startDate);
    matchDate.setDate(startDate.getDate() + r * daysBetweenRounds);

    const remaining = [...currentOrder];
    const usedThisRound = new Set<string>();
    const roundMatches: { homeId: string; awayId: string }[] = [];

    remaining.sort((a, b) => {
      const aMatched = usedThisRound.has(a) ? 1 : 0;
      const bMatched = usedThisRound.has(b) ? 1 : 0;
      if (aMatched !== bMatched) return aMatched - bMatched;
      const aNeedsHome = targetHome - homeCount[a];
      const bNeedsHome = targetHome - homeCount[b];
      return bNeedsHome - aNeedsHome;
    });

    for (let i = 0; i < remaining.length && remaining.length - usedThisRound.size >= 2; i++) {
      const teamA = remaining[i];
      if (usedThisRound.has(teamA)) continue;

      let found = false;
      for (let j = i + 1; j < remaining.length; j++) {
        const teamB = remaining[j];
        if (usedThisRound.has(teamB)) continue;
        if (opponents[teamA].has(teamB)) continue;

        let home = teamA;
        let away = teamB;
        if (homeCount[home] >= targetHome) {
          [home, away] = [away, home];
        }

        roundMatches.push({ homeId: home, awayId: away });
        usedThisRound.add(teamA);
        usedThisRound.add(teamB);
        opponents[teamA].add(teamB);
        opponents[teamB].add(teamA);
        homeCount[home]++;
        awayCount[away]++;
        found = true;
        break;
      }

      if (!found) {
        for (let j = i + 1; j < remaining.length; j++) {
          const teamB = remaining[j];
          if (usedThisRound.has(teamB)) continue;

          let home = teamA;
          let away = teamB;
          if (homeCount[home] >= targetHome) {
            [home, away] = [away, home];
          }

          roundMatches.push({ homeId: home, awayId: away });
          usedThisRound.add(teamA);
          usedThisRound.add(teamB);
          opponents[teamA].add(teamB);
          opponents[teamB].add(teamA);
          homeCount[home]++;
          awayCount[away]++;
          break;
        }
      }
    }

    for (const m of roundMatches) {
      matches.push({ ...m, round: roundNumber, matchDate });
    }

    currentOrder = [...currentOrder].sort(() => Math.random() - 0.5);
  }

  return matches;
}

export function generateTwoLegKnockout(
  clubIds: string[],
  startDate: Date = new Date(),
  daysBetweenLegs: number = 7
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
      homeId: teamA,
      awayId: teamB,
      round: `Leg1-P${pairingIndex + 1}`,
      matchDate: leg1Date,
      leg: 1,
      pairingIndex,
    });
    matches.push({
      homeId: teamB,
      awayId: teamA,
      round: `Leg2-P${pairingIndex + 1}`,
      matchDate: leg2Date,
      leg: 2,
      pairingIndex,
    });
  }

  return matches;
}

export function generateKnockoutTwoLeg(
  clubIds: string[],
  startDate: Date = new Date(),
  daysBetweenLegs: number = 7,
  roundLabel: string = "R"
): { homeId: string; awayId: string; round: string; matchDate: Date; leg: 1 | 2; pairingIndex: number }[] {
  return generateTwoLegKnockout(clubIds, startDate, daysBetweenLegs).map(m => ({
    ...m,
    round: `${roundLabel}-Leg${m.leg}-P${m.pairingIndex + 1}`,
  }));
}

export function generateFinalMatch(
  homeId: string,
  awayId: string,
  startDate: Date = new Date()
): { homeId: string; awayId: string; round: string; matchDate: Date } {
  return {
    homeId,
    awayId,
    round: "Final",
    matchDate: startDate,
  };
}

export async function createUefaCompetition(
  type: UefaCompetitionType,
  seasonId: string,
  clubIds: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string; groups: { id: string; name: string; phase: string }[] }> {
  const config = UEFA_COMPETITIONS[type];

  const competition = await prisma.competition.create({
    data: {
      name: config.name,
      type: type,
      logo: config.logo,
      seasonId,
      isKnockout: false,
      format: "swiss",
      numTeams: clubIds.length,
      numTurns: 1,
      hasExtraTime: true,
      hasPenalties: true,
      pointsPerWin: 3,
      pointsPerDraw: 1,
    },
  });

  const leagueGroup = await prisma.group.create({
    data: {
      name: "Fase de Liga",
      competitionId: competition.id,
    },
  });

  for (const cid of clubIds) {
    await prisma.standing.create({
      data: { groupId: leagueGroup.id, clubId: cid, position: 0 },
    });
  }

  const fixtures = generateSwissFixtures(clubIds, config.leaguePhaseMatches, startDate, 7);
  for (const m of fixtures) {
    await prisma.match.create({
      data: {
        homeTeamId: m.homeId,
        awayTeamId: m.awayId,
        groupId: leagueGroup.id,
        round: m.round,
        matchDate: m.matchDate,
        status: "scheduled",
        isKnockout: false,
      },
    });
  }

  return {
    competitionId: competition.id,
    groups: [{ id: leagueGroup.id, name: "Fase de Liga", phase: "league-phase" }],
  };
}

export async function simulateLeaguePhase(
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
  for (const match of matches) {
    const ppw = match.group?.competition?.pointsPerWin ?? 3;
    const ppd = match.group?.competition?.pointsPerDraw ?? 1;
    const result = await simulateMatch(match.id);
    await applySimulation(match.id, result, ppw, ppd);
    results.push(result);
  }

  await updateLeagueStandings(competitionId);

  return { simulated: matches.length, results };
}

export async function simulateLeagueRound(
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
  for (const match of matches) {
    const ppw = match.group?.competition?.pointsPerWin ?? 3;
    const ppd = match.group?.competition?.pointsPerDraw ?? 1;
    const result = await simulateMatch(match.id);
    await applySimulation(match.id, result, ppw, ppd);
    results.push(result);
  }

  await updateLeagueStandings(competitionId);

  return { simulated: matches.length, results };
}

export async function updateLeagueStandings(competitionId: string): Promise<void> {
  const group = await prisma.group.findFirst({
    where: { competitionId, name: "Fase de Liga" },
    include: {
      standings: { include: { club: true } },
      matches: { where: { status: "finished" } },
    },
  });

  if (!group) return;

  const table: Record<string, {
    clubId: string;
    played: number;
    wins: number;
    draws: number;
    losses: number;
    goalsFor: number;
    goalsAgainst: number;
    points: number;
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
      home.wins++; home.points += 3;
      away.losses++;
    } else if (m.homeScore === m.awayScore) {
      home.draws++; home.points += 1;
      away.draws++; away.points += 1;
    } else {
      away.wins++; away.points += 3;
      home.losses++;
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
      where: { groupId: group.id, clubId: s.clubId },
    });
    if (standing) {
      await prisma.standing.update({
        where: { id: standing.id },
        data: {
          played: s.played,
          wins: s.wins,
          draws: s.draws,
          losses: s.losses,
          goalsFor: s.goalsFor,
          goalsAgainst: s.goalsAgainst,
          goalsDiff: s.goalsFor - s.goalsAgainst,
          points: s.points,
          position: i + 1,
        },
      });
    }
  }
}

export async function getLeagueStandings(competitionId: string) {
  const group = await prisma.group.findFirst({
    where: { competitionId, name: "Fase de Liga" },
    include: {
      standings: {
        include: { club: true },
        orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }],
      },
    },
  });
  return group;
}

export async function getLeaguePhaseResults(competitionId: string) {
  const group = await prisma.group.findFirst({
    where: { competitionId, name: "Fase de Liga" },
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
  return group;
}

export async function generateKnockoutPhase(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number }> {
  const group = await prisma.group.findFirst({
    where: { competitionId, name: "Fase de Liga" },
    include: {
      standings: {
        include: { club: true },
        orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }],
      },
    },
  });

  if (!group || group.standings.length === 0) {
    throw new Error("League phase not found or no standings available");
  }

  const config = await prisma.competition.findUnique({ where: { id: competitionId } });
  if (!config) throw new Error("Competition not found");

  const uefaType = config.type as UefaCompetitionType;
  const uefaConfig = UEFA_COMPETITIONS[uefaType];

  const standings = group.standings;
  const playoffTeams = standings.slice(uefaConfig.directR16, uefaConfig.directR16 + uefaConfig.knockoutPlayoffSlots);

  let created = 0;

  const koPlayoffGroup = await prisma.group.create({
    data: { name: "Play-off da Fase Eliminatória", competitionId },
  });

  for (let i = 0; i < playoffTeams.length; i += 2) {
    const teamA = playoffTeams[i]?.clubId;
    const teamB = playoffTeams[i + 1]?.clubId;
    if (!teamA || !teamB) continue;

    const pairingIndex = i / 2;
    const leg1Date = new Date(startDate);
    leg1Date.setDate(startDate.getDate() + pairingIndex * 3);
    const leg2Date = new Date(startDate);
    leg2Date.setDate(leg1Date.getDate() + 7);

    await prisma.match.create({
      data: {
        homeTeamId: teamA,
        awayTeamId: teamB,
        groupId: koPlayoffGroup.id,
        round: `KO-Playoff-Leg1-P${pairingIndex + 1}`,
        matchDate: leg1Date,
        status: "scheduled",
        isKnockout: true,
      },
    });
    created++;

    await prisma.match.create({
      data: {
        homeTeamId: teamB,
        awayTeamId: teamA,
        groupId: koPlayoffGroup.id,
        round: `KO-Playoff-Leg2-P${pairingIndex + 1}`,
        matchDate: leg2Date,
        status: "scheduled",
        isKnockout: true,
      },
    });
    created++;
  }

  return { created };
}

export async function simulateKnockoutRound(
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
    const pairingIndex = pairingMatch[1];
    const legMatch = roundStr.match(/Leg(\d+)/);
    if (!legMatch) continue;
    const leg = legMatch[1];

    if (!pairings[pairingIndex]) {
      pairings[pairingIndex] = {
        homeId: match.homeTeamId || "",
        awayId: match.awayTeamId || "",
        homeAgg: 0,
        awayAgg: 0,
      };
    }

    if (leg === "1") {
      pairings[pairingIndex].homeAgg += match.homeScore || 0;
      pairings[pairingIndex].awayAgg += match.awayScore || 0;
    } else {
      pairings[pairingIndex].awayAgg += match.homeScore || 0;
      pairings[pairingIndex].homeAgg += match.awayScore || 0;
    }
  }

  const winners: string[] = [];
  for (const key of Object.keys(pairings).sort((a, b) => parseInt(a) - parseInt(b))) {
    const p = pairings[key];
    if (p.homeAgg > p.awayAgg) {
      winners.push(p.homeId);
    } else if (p.awayAgg > p.homeAgg) {
      winners.push(p.awayId);
    } else {
      winners.push(Math.random() < 0.5 ? p.homeId : p.awayId);
    }
  }

  return { simulated: matches.length, results, winners };
}

export async function simulateSimpleKnockoutRound(
  competitionId: string,
  roundLabel: string
): Promise<{ simulated: number; results: SimulationResult[]; winners: string[] }> {
  const matches = await prisma.match.findMany({
    where: {
      group: { competitionId },
      round: roundLabel,
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

export async function advanceToNextRound(
  competitionId: string,
  fromRound: string,
  toRound: string,
  winnerIds: string[],
  startDate: Date = new Date(),
  isTwoLegs: boolean = true
): Promise<{ created: number }> {
  const existingGroup = await prisma.group.findFirst({
    where: { competitionId, name: toRound },
  });

  let groupId: string;
  if (existingGroup) {
    groupId = existingGroup.id;
  } else {
    const g = await prisma.group.create({
      data: { name: toRound, competitionId },
    });
    groupId = g.id;
  }

  let created = 0;

  if (isTwoLegs) {
    for (let i = 0; i < winnerIds.length; i += 2) {
      const teamA = winnerIds[i];
      const teamB = winnerIds[i + 1];
      if (!teamA || !teamB) continue;

      const pairingIndex = i / 2;
      const leg1Date = new Date(startDate);
      leg1Date.setDate(startDate.getDate() + pairingIndex * 3);
      const leg2Date = new Date(startDate);
      leg2Date.setDate(leg1Date.getDate() + 7);

      await prisma.match.create({
        data: {
          homeTeamId: teamA,
          awayTeamId: teamB,
          groupId,
          round: `${toRound}-Leg1-P${pairingIndex + 1}`,
          matchDate: leg1Date,
          status: "scheduled",
          isKnockout: true,
        },
      });
      created++;

      await prisma.match.create({
        data: {
          homeTeamId: teamB,
          awayTeamId: teamA,
          groupId,
          round: `${toRound}-Leg2-P${pairingIndex + 1}`,
          matchDate: leg2Date,
          status: "scheduled",
          isKnockout: true,
        },
      });
      created++;
    }
  } else {
    for (let i = 0; i < winnerIds.length; i += 2) {
      const teamA = winnerIds[i];
      const teamB = winnerIds[i + 1];
      if (!teamA || !teamB) continue;

      const matchDate = new Date(startDate);
      matchDate.setDate(startDate.getDate() + (i / 2) * 3);

      await prisma.match.create({
        data: {
          homeTeamId: teamA,
          awayTeamId: teamB,
          groupId,
          round: toRound,
          matchDate,
          status: "scheduled",
          isKnockout: true,
        },
      });
      created++;
    }
  }

  return { created };
}

export async function simulateEntireKnockout(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ simulated: number; champion: string | null }> {
  let totalSimulated = 0;
  let champion: string | null = null;

  const koPlayoffMatches = await prisma.match.findMany({
    where: {
      group: { competitionId },
      round: { startsWith: "KO-Playoff" },
      status: "scheduled",
    },
  });

  if (koPlayoffMatches.length > 0) {
    const koResult = await simulateKnockoutRound(competitionId, "KO-Playoff");
    totalSimulated += koResult.simulated;

    const group = await prisma.group.findFirst({
      where: { competitionId, name: "Fase de Liga" },
      include: {
        standings: {
          include: { club: true },
          orderBy: [{ position: "asc" }],
        },
      },
    });

    if (group) {
      const config = await prisma.competition.findUnique({ where: { id: competitionId } });
      if (config) {
        const uefaConfig = UEFA_COMPETITIONS[config.type as UefaCompetitionType];
        const top8 = group.standings.slice(0, uefaConfig.directR16);
        const top8Ids = top8.map(s => s.clubId).filter((id): id is string => id !== null);
        const allR16: string[] = [...top8Ids, ...koResult.winners];

        await advanceToNextRound(competitionId, "KO-Playoff", "Oitavas", allR16, startDate, true);
        const r16Result = await simulateKnockoutRound(competitionId, "Oitavas");
        totalSimulated += r16Result.simulated;

        await advanceToNextRound(competitionId, "Oitavas", "Quartas", r16Result.winners, new Date(startDate.getTime() + 14 * 86400000), true);
        const qfResult = await simulateKnockoutRound(competitionId, "Quartas");
        totalSimulated += qfResult.simulated;

        await advanceToNextRound(competitionId, "Quartas", "Semifinais", qfResult.winners, new Date(startDate.getTime() + 28 * 86400000), true);
        const sfResult = await simulateKnockoutRound(competitionId, "Semifinais");
        totalSimulated += sfResult.simulated;

        if (sfResult.winners.length >= 2) {
          const finalGroup = await prisma.group.create({
            data: { name: "Final", competitionId },
          });
          const finalDate = new Date(startDate.getTime() + 42 * 86400000);
          await prisma.match.create({
            data: {
              homeTeamId: sfResult.winners[0],
              awayTeamId: sfResult.winners[1],
              groupId: finalGroup.id,
              round: "Final",
              matchDate: finalDate,
              status: "scheduled",
              isKnockout: true,
            },
          });

          const finalResult = await simulateSimpleKnockoutRound(competitionId, "Final");
          totalSimulated += finalResult.simulated;
          champion = finalResult.winners[0] || null;
        }
      }
    }
  } else {
    for (const round of ["Oitavas", "Quartas", "Semifinais"] as const) {
      const result = await simulateKnockoutRound(competitionId, round);
      totalSimulated += result.simulated;

      if (round === "Semifinais" && result.winners.length >= 2) {
        const finalGroup = await prisma.group.create({
          data: { name: "Final", competitionId },
        });
        const finalDate = new Date(startDate.getTime() + 42 * 86400000);
        await prisma.match.create({
          data: {
            homeTeamId: result.winners[0],
            awayTeamId: result.winners[1],
            groupId: finalGroup.id,
            round: "Final",
            matchDate: finalDate,
            status: "scheduled",
            isKnockout: true,
          },
        });
        const finalResult = await simulateSimpleKnockoutRound(competitionId, "Final");
        totalSimulated += finalResult.simulated;
        champion = finalResult.winners[0] || null;
      } else if (result.winners.length > 1) {
        const nextRound = round === "Oitavas" ? "Quartas" : round === "Quartas" ? "Semifinais" : null;
        if (nextRound) {
          await advanceToNextRound(competitionId, round, nextRound, result.winners, new Date(startDate.getTime() + 14 * 86400000), true);
        }
      }
    }
  }

  return { simulated: totalSimulated, champion };
}

export async function simulateFullCompetition(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ simulated: number; champion: string | null }> {
  await simulateLeaguePhase(competitionId);
  await generateKnockoutPhase(competitionId, startDate);
  const koResult = await simulateEntireKnockout(competitionId, startDate);
  return koResult;
}

export async function simulatePhase(
  competitionId: string,
  phase: string
): Promise<{ simulated: number; results: SimulationResult[]; winners?: string[]; champion?: string | null }> {
  switch (phase) {
    case "league":
    case "league-phase":
      return await simulateLeaguePhase(competitionId);

    case "league-round":
      return await simulateLeagueRound(competitionId, phase);

    case "knockout-playoff":
    case "KO-Playoff": {
      const result = await simulateKnockoutRound(competitionId, "KO-Playoff");
      return { ...result, champion: undefined };
    }

    case "r16":
    case "Oitavas":
      return await simulateKnockoutRound(competitionId, "Oitavas");

    case "qf":
    case "Quartas":
      return await simulateKnockoutRound(competitionId, "Quartas");

    case "sf":
    case "Semifinais":
      return await simulateKnockoutRound(competitionId, "Semifinais");

    case "final":
    case "Final": {
      const result = await simulateSimpleKnockoutRound(competitionId, "Final");
      return { ...result, champion: result.winners[0] || null };
    }

    case "full":
    case "all": {
      const result = await simulateFullCompetition(competitionId);
      return { simulated: result.simulated, results: [], champion: result.champion };
    }

    default:
      throw new Error(`Unknown phase: ${phase}`);
  }
}
