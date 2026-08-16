import { prisma } from "./prisma";
import { simulateMatch, applySimulation, SimulationResult } from "./simulator";

export type ConmebolCompetitionType = "copa-libertadores" | "copa-sul-americana";

export type ConmebolPhase =
  | "preliminary-1"
  | "preliminary-2"
  | "preliminary-3"
  | "preliminary-nacional"
  | "groups"
  | "playoffs"
  | "r16"
  | "quarterfinals"
  | "semifinals"
  | "final";

export const CONMEBOL_COMPETITIONS: Record<ConmebolCompetitionType, {
  name: string;
  shortName: string;
  logo: string;
  color: string;
  description: string;
  groupStageGroups: number;
  teamsPerGroup: number;
  qualifyPerGroup: number;
}> = {
  "copa-libertadores": {
    name: "Copa CONMEBOL Libertadores",
    shortName: "LIB",
    logo: "",
    color: "#fbbf24",
    description: "O principal torneio de clubes da América do Sul.",
    groupStageGroups: 8,
    teamsPerGroup: 4,
    qualifyPerGroup: 2,
  },
  "copa-sul-americana": {
    name: "Copa CONMEBOL Sul-Americana",
    shortName: "SUL",
    logo: "",
    color: "#a3a3a3",
    description: "O segundo torneio continental da América do Sul.",
    groupStageGroups: 8,
    teamsPerGroup: 4,
    qualifyPerGroup: 2,
  },
};

export const PHASE_LABELS: Record<ConmebolPhase, string> = {
  "preliminary-1": "Fase 1 (Pré-Eliminatória)",
  "preliminary-2": "Fase 2 (Pré-Eliminatória)",
  "preliminary-3": "Fase 3 (Pré-Eliminatória)",
  "preliminary-nacional": "Fase Preliminar Nacional",
  "groups": "Fase de Grupos",
  "playoffs": "Play-offs da Sul-Americana",
  "r16": "Oitavas de Final",
  "quarterfinals": "Quartas de Final",
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
      const rn = `${round + 1 + turn * roundsPerTurn}`;
      const md = new Date(startDate);
      md.setDate(startDate.getDate() + (round + turn * roundsPerTurn) * daysBetweenRounds);
      for (let i = 0; i < n / 2; i++) {
        let home = current[i];
        let away = current[n - 1 - i];
        if (turn % 2 === 1) [home, away] = [away, home];
        if (home !== "BYE" && away !== "BYE") {
          matches.push({ homeId: home, awayId: away, round: rn, matchDate: md });
        }
      }
      current = [current[0], ...current.slice(-1), ...current.slice(1, -1)];
    }
  }
  return matches;
}

export function generateTwoLegKnockout(
  clubIds: string[],
  startDate: Date = new Date(),
  daysBetweenLegs: number = 7,
  roundLabel: string = "KO"
): { homeId: string; awayId: string; round: string; matchDate: Date; leg: 1 | 2; pairingIndex: number }[] {
  const m: { homeId: string; awayId: string; round: string; matchDate: Date; leg: 1 | 2; pairingIndex: number }[] = [];
  for (let i = 0; i < clubIds.length; i += 2) {
    const ta = clubIds[i], tb = clubIds[i + 1];
    if (!ta || !tb) continue;
    const idx = i / 2;
    const l1 = new Date(startDate); l1.setDate(startDate.getDate() + idx * 3);
    const l2 = new Date(startDate); l2.setDate(l1.getDate() + daysBetweenLegs);
    m.push({ homeId: ta, awayId: tb, round: `${roundLabel}-Leg1-P${idx + 1}`, matchDate: l1, leg: 1, pairingIndex: idx });
    m.push({ homeId: tb, awayId: ta, round: `${roundLabel}-Leg2-P${idx + 1}`, matchDate: l2, leg: 2, pairingIndex: idx });
  }
  return m;
}

export function generateSingleMatch(
  clubIds: string[],
  startDate: Date = new Date(),
  days: number = 3,
  roundLabel: string = "KO"
): { homeId: string; awayId: string; round: string; matchDate: Date }[] {
  const m: { homeId: string; awayId: string; round: string; matchDate: Date }[] = [];
  for (let i = 0; i < clubIds.length; i += 2) {
    const ta = clubIds[i], tb = clubIds[i + 1];
    if (!ta || !tb) continue;
    const idx = i / 2;
    const md = new Date(startDate); md.setDate(startDate.getDate() + idx * days);
    m.push({ homeId: ta, awayId: tb, round: `${roundLabel}-P${idx + 1}`, matchDate: md });
  }
  return m;
}

export async function updateStandings(groupId: string): Promise<void> {
  const group = await prisma.group.findUnique({
    where: { id: groupId },
    include: { standings: { include: { club: true } }, matches: { where: { status: "finished" } } },
  });
  if (!group) return;

  const table: Record<string, { clubId: string; played: number; wins: number; draws: number; losses: number; goalsFor: number; goalsAgainst: number; points: number }> = {};
  for (const s of group.standings) {
    if (!s.clubId) continue;
    table[s.clubId] = { clubId: s.clubId, played: 0, wins: 0, draws: 0, losses: 0, goalsFor: 0, goalsAgainst: 0, points: 0 };
  }
  for (const m of group.matches) {
    if (m.status !== "finished" || m.homeScore === null || m.awayScore === null) continue;
    if (!m.homeTeamId || !m.awayTeamId) continue;
    const h = table[m.homeTeamId], a = table[m.awayTeamId];
    if (!h || !a) continue;
    h.played++; a.played++;
    h.goalsFor += m.homeScore; h.goalsAgainst += m.awayScore;
    a.goalsFor += m.awayScore; a.goalsAgainst += m.homeScore;
    if (m.homeScore > m.awayScore) { h.wins++; h.points += 3; a.losses++; }
    else if (m.homeScore === m.awayScore) { h.draws++; h.points += 1; a.draws++; a.points += 1; }
    else { a.wins++; a.points += 3; h.losses++; }
  }
  const sorted = Object.values(table).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    const aGD = a.goalsFor - a.goalsAgainst, bGD = b.goalsFor - b.goalsAgainst;
    if (bGD !== aGD) return bGD - aGD;
    return b.goalsFor - a.goalsFor;
  });
  for (let i = 0; i < sorted.length; i++) {
    const s = sorted[i];
    const standing = await prisma.standing.findFirst({ where: { groupId, clubId: s.clubId } });
    if (standing) {
      await prisma.standing.update({
        where: { id: standing.id },
        data: { played: s.played, wins: s.wins, draws: s.draws, losses: s.losses, goalsFor: s.goalsFor, goalsAgainst: s.goalsAgainst, goalsDiff: s.goalsFor - s.goalsAgainst, points: s.points, position: i + 1 },
      });
    }
  }
}

export async function createLibertadores(
  seasonId: string,
  preliminaryTeams: { phase: string; teamIds: string[] }[],
  qualifiedGroupStageIds: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "Copa CONMEBOL Libertadores",
      type: "copa-libertadores",
      seasonId, isKnockout: false, format: "groups",
      numTeams: qualifiedGroupStageIds.length,
      hasExtraTime: true, hasPenalties: true,
      pointsPerWin: 3, pointsPerDraw: 1,
    },
  });

  for (const p of preliminaryTeams) {
    const g = await prisma.group.create({
      data: { name: `Fase ${p.phase}`, competitionId: competition.id },
    });
    const f = generateTwoLegKnockout(p.teamIds, startDate, 7, `P${p.phase}`);
    for (const m of f) {
      await prisma.match.create({
        data: { homeTeamId: m.homeId, awayTeamId: m.awayId, groupId: g.id, round: m.round, matchDate: m.matchDate, status: "scheduled", isKnockout: true },
      });
    }
  }

  const shuffled = [...qualifiedGroupStageIds].sort(() => Math.random() - 0.5);
  const perGroup = 4;
  for (let g = 0; g < 8; g++) {
    const teams = shuffled.slice(g * perGroup, (g + 1) * perGroup);
    if (teams.length < 2) continue;
    const group = await prisma.group.create({
      data: { name: `Grupo ${String.fromCharCode(65 + g)}`, competitionId: competition.id },
    });
    for (const cid of teams) {
      await prisma.standing.create({ data: { groupId: group.id, clubId: cid, position: 0 } });
    }
    const fix = generateRoundrobinFixtures(teams, 2, new Date(startDate.getTime() + g * 86400000), 7);
    for (const m of fix) {
      await prisma.match.create({
        data: { homeTeamId: m.homeId, awayTeamId: m.awayId, groupId: group.id, round: m.round, matchDate: m.matchDate, status: "scheduled", isKnockout: false },
      });
    }
  }

  return { competitionId: competition.id };
}

export async function createSulAmericana(
  seasonId: string,
  preliminaryTeams: string[],
  groupStageTeams: string[],
  startDate: Date = new Date()
): Promise<{ competitionId: string }> {
  const competition = await prisma.competition.create({
    data: {
      name: "Copa CONMEBOL Sul-Americana",
      type: "copa-sul-americana",
      seasonId, isKnockout: false, format: "groups",
      numTeams: groupStageTeams.length,
      hasExtraTime: true, hasPenalties: true,
      pointsPerWin: 3, pointsPerDraw: 1,
    },
  });

  if (preliminaryTeams.length > 0) {
    const pg = await prisma.group.create({
      data: { name: "Fase Preliminar Nacional", competitionId: competition.id },
    });
    const pf = generateSingleMatch(preliminaryTeams, startDate, 2, "PN");
    for (const m of pf) {
      await prisma.match.create({
        data: { homeTeamId: m.homeId, awayTeamId: m.awayId, groupId: pg.id, round: m.round, matchDate: m.matchDate, status: "scheduled", isKnockout: true },
      });
    }
  }

  const shuffled = [...groupStageTeams].sort(() => Math.random() - 0.5);
  const perGroup = 4;
  for (let g = 0; g < 8; g++) {
    const teams = shuffled.slice(g * perGroup, (g + 1) * perGroup);
    if (teams.length < 2) continue;
    const group = await prisma.group.create({
      data: { name: `Grupo ${String.fromCharCode(65 + g)}`, competitionId: competition.id },
    });
    for (const cid of teams) {
      await prisma.standing.create({ data: { groupId: group.id, clubId: cid, position: 0 } });
    }
    const fr = generateRoundrobinFixtures(teams, 2, new Date(startDate.getTime() + g * 86400000), 7);
    for (const m of fr) {
      await prisma.match.create({
        data: { homeTeamId: m.homeId, awayTeamId: m.awayId, groupId: group.id, round: m.round, matchDate: m.matchDate, status: "scheduled", isKnockout: false },
      });
    }
  }

  return { competitionId: competition.id };
}

export async function simulatePhase(
  competitionId: string,
  phase: string,
  roundNumber?: string
): Promise<{ simulated: number; results: SimulationResult[]; winners?: string[] }> {
  if (phase === "groups" || phase === "group-phase") {
    return await simulateAllGroups(competitionId);
  }
  if (phase === "group-round" && roundNumber) {
    return await simulateGroupRound(competitionId, roundNumber);
  }
  return await simulateKnockoutTwoLegs(competitionId, phase);
}

async function simulateAllGroups(competitionId: string) {
  const matches = await prisma.match.findMany({
    where: { group: { competitionId, name: { startsWith: "Grupo" } }, status: "scheduled", isKnockout: false },
    include: { group: { include: { competition: true } } },
    orderBy: { matchDate: "asc" },
  });
  const results: SimulationResult[] = [];
  const touched = new Set<string>();
  for (const match of matches) {
    const ppw = match.group?.competition?.pointsPerWin ?? 3;
    const ppd = match.group?.competition?.pointsPerDraw ?? 1;
    const r = await simulateMatch(match.id);
    await applySimulation(match.id, r, ppw, ppd);
    results.push(r);
    if (match.groupId) touched.add(match.groupId);
  }
  for (const gid of touched) await updateStandings(gid);
  return { simulated: matches.length, results };
}

async function simulateGroupRound(competitionId: string, roundNumber: string) {
  const matches = await prisma.match.findMany({
    where: { group: { competitionId, name: { startsWith: "Grupo" } }, round: roundNumber, status: "scheduled", isKnockout: false },
    include: { group: { include: { competition: true } } },
  });
  const results: SimulationResult[] = [];
  const touched = new Set<string>();
  for (const match of matches) {
    const ppw = match.group?.competition?.pointsPerWin ?? 3;
    const ppd = match.group?.competition?.pointsPerDraw ?? 1;
    const r = await simulateMatch(match.id);
    await applySimulation(match.id, r, ppw, ppd);
    results.push(r);
    if (match.groupId) touched.add(match.groupId);
  }
  for (const gid of touched) await updateStandings(gid);
  return { simulated: matches.length, results };
}

export async function simulateKnockoutTwoLegs(
  competitionId: string,
  roundLabel: string
): Promise<{ simulated: number; results: SimulationResult[]; winners: string[] }> {
  const matches = await prisma.match.findMany({
    where: { group: { competitionId }, round: { startsWith: roundLabel }, status: "scheduled" },
    include: { group: { include: { competition: true } } },
    orderBy: { matchDate: "asc" },
  });
  const results: SimulationResult[] = [];
  for (const match of matches) {
    const r = await simulateMatch(match.id);
    await applySimulation(match.id, r, 3, 1);
    results.push(r);
  }
  const pairings: Record<string, { homeId: string; awayId: string; homeAgg: number; awayAgg: number }> = {};
  for (const match of matches) {
    const rs = match.round || "";
    const pm = rs.match(/P(\d+)/);
    const lm = rs.match(/Leg(\d+)/);
    if (!pm || !lm) continue;
    const pi = pm[1], lg = lm[1];
    if (!pairings[pi]) pairings[pi] = { homeId: match.homeTeamId || "", awayId: match.awayTeamId || "", homeAgg: 0, awayAgg: 0 };
    if (lg === "1") { pairings[pi].homeAgg += match.homeScore || 0; pairings[pi].awayAgg += match.awayScore || 0; }
    else { pairings[pi].awayAgg += match.homeScore || 0; pairings[pi].homeAgg += match.awayScore || 0; }
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
    where: { group: { competitionId }, round: { startsWith: roundLabel }, status: "scheduled" },
    include: { group: { include: { competition: true } } },
  });
  const results: SimulationResult[] = [];
  const winners: string[] = [];
  for (const match of matches) {
    const r = await simulateMatch(match.id);
    await applySimulation(match.id, r, 3, 1);
    results.push(r);
    if ((r.homeScore || 0) > (r.awayScore || 0)) winners.push(match.homeTeamId || "");
    else if ((r.awayScore || 0) > (r.homeScore || 0)) winners.push(match.awayTeamId || "");
    else winners.push(Math.random() < 0.5 ? (match.homeTeamId || "") : (match.awayTeamId || ""));
  }
  return { simulated: matches.length, results, winners };
}

export async function generateLibertadoresKnockout(
  competitionId: string,
  startDate: Date = new Date()
): Promise<{ created: number; thirdPlaceTeamIds: string[] }> {
  const groups = await prisma.group.findMany({
    where: { competitionId, name: { startsWith: "Grupo" } },
    include: { standings: { include: { club: true }, orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }] } },
  });

  const qualified: string[] = [];
  const thirdPlaces: string[] = [];
  for (const g of groups) {
    for (let i = 0; i < Math.min(3, g.standings.length); i++) {
      const cid = g.standings[i].clubId;
      if (!cid) continue;
      if (i < 2) qualified.push(cid);
      else if (i === 2) thirdPlaces.push(cid);
    }
  }

  const shuffled = [...qualified].sort(() => Math.random() - 0.5);
  let created = 0;
  const r16Group = await prisma.group.create({ data: { name: "Oitavas de Final", competitionId } });
  const fr = generateTwoLegKnockout(shuffled, new Date(startDate.getTime() + 7 * 86400000), 7, "R16");
  for (const m of fr) {
    await prisma.match.create({
      data: { homeTeamId: m.homeId, awayTeamId: m.awayId, groupId: r16Group.id, round: m.round, matchDate: m.matchDate, status: "scheduled", isKnockout: true },
    });
    created++;
  }

  return { created, thirdPlaceTeamIds: thirdPlaces };
}

export async function generateSulAmericanaPlayoffs(
  competitionId: string,
  thirdPlaceIds: string[],
  startDate: Date = new Date()
): Promise<{ created: number }> {
  const groups = await prisma.group.findMany({
    where: { competitionId, name: { startsWith: "Grupo" } },
    include: { standings: { include: { club: true }, orderBy: [{ position: "asc" }] } },
  });

  const secondPlaces: string[] = [];
  for (const g of groups) {
    if (g.standings.length >= 2 && g.standings[1].clubId) {
      secondPlaces.push(g.standings[1].clubId!);
    }
  }

  const shuffledTP = [...thirdPlaceIds].sort(() => Math.random() - 0.5);
  const shuffledSP = [...secondPlaces].sort(() => Math.random() - 0.5);
  const pairings: string[] = [];
  const count = Math.min(shuffledTP.length, shuffledSP.length);
  for (let i = 0; i < count; i++) {
    pairings.push(shuffledSP[i], shuffledTP[i]);
  }

  let created = 0;
  const poGroup = await prisma.group.create({
    data: { name: "Play-offs da Sul-Americana", competitionId },
  });
  const fi = generateTwoLegKnockout(pairings, startDate, 7, "PO");
  for (const m of fi) {
    await prisma.match.create({
      data: { homeTeamId: m.homeId, awayTeamId: m.awayId, groupId: poGroup.id, round: m.round, matchDate: m.matchDate, status: "scheduled", isKnockout: true },
    });
    created++;
  }

  return { created };
}

export async function advanceTwoLegKnockout(
  competitionId: string,
  name: string,
  label: string,
  winnerIds: string[],
  startDate: Date = new Date()
): Promise<{ created: number }> {
  let created = 0;
  const g = await prisma.group.create({ data: { name, competitionId } });
  const fi = generateTwoLegKnockout(winnerIds, startDate, 7, label);
  for (const m of fi) {
    await prisma.match.create({
      data: { homeTeamId: m.homeId, awayTeamId: m.awayId, groupId: g.id, round: m.round, matchDate: m.matchDate, status: "scheduled", isKnockout: true },
    });
    created++;
  }
  return { created };
}

export async function advanceSingleKnockout(
  competitionId: string,
  name: string,
  label: string,
  winnerIds: string[],
  startDate: Date = new Date()
): Promise<{ created: number }> {
  let created = 0;
  const g = await prisma.group.create({ data: { name, competitionId } });
  const fi = generateSingleMatch(winnerIds, startDate, 3, label);
  for (const m of fi) {
    await prisma.match.create({
      data: { homeTeamId: m.homeId, awayTeamId: m.awayId, groupId: g.id, round: m.round, matchDate: m.matchDate, status: "scheduled", isKnockout: true },
    });
    created++;
  }
  return { created };
}

export async function getGroupResults(competitionId: string) {
  return await prisma.group.findMany({
    where: { competitionId, name: { startsWith: "Grupo" } },
    include: {
      standings: { include: { club: true }, orderBy: [{ position: "asc" }, { points: "desc" }, { goalsDiff: "desc" }, { goalsFor: "desc" }] },
      matches: { include: { homeTeam: true, awayTeam: true }, orderBy: [{ round: "asc" }, { matchDate: "asc" }] },
    },
  });
}

export async function getKnockoutRounds(competitionId: string) {
  return await prisma.group.findMany({
    where: { competitionId, name: { not: { startsWith: "Grupo" } } },
    include: { matches: { include: { homeTeam: true, awayTeam: true }, orderBy: [{ round: "asc" }, { matchDate: "asc" }] } },
  });
}