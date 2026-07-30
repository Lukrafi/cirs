import { prisma } from "./prisma";

export type SimulationResult = {
  homeScore: number;
  awayScore: number;
  homeGoals: { minute: number; playerId?: string; scorer: string }[];
  awayGoals: { minute: number; playerId?: string; scorer: string }[];
  homePowerShot: boolean;
  awayPowerShot: boolean;
  mvpPlayerId?: string;
  mvpRating: number;
  matchStats: Array<{
    playerId?: string;
    clubId: string;
    goals: number;
    assists: number;
    powerShots: number;
    shots: number;
    shotsOnTarget: number;
    passes: number;
    passAccuracy: number;
    tackles: number;
    interceptions: number;
    saves: number;
    cleanSheet: boolean;
    yellowCards: number;
    redCards: number;
    minutesPlayed: number;
    rating: number;
  }>;
};

function clampStrength(s: number): number {
  return Math.max(1.0, Math.min(10.0, s));
}

function strengthToExpectedGoals(strength: number, opponentStrength: number, isHome: boolean): number {
  const myStr = clampStrength(strength);
  const oppStr = clampStrength(opponentStrength);
  const ratio = myStr / (myStr + oppStr);
  const baseXG = 1.4;
  const homeBoost = isHome ? 1.15 : 1.0;
  return Math.max(0.05, baseXG * ratio * homeBoost);
}

function samplePoisson(lambda: number): number {
  const L = Math.exp(-lambda);
  let k = 0;
  let p = 1;
  do {
    k++;
    p *= Math.random();
  } while (p > L);
  return k - 1;
}

export async function simulateMatch(
  matchId: string
): Promise<SimulationResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: true } },
      awayTeam: { include: { players: true } },
      group: { include: { competition: true } },
    },
  });

  if (!match || !match.homeTeam || !match.awayTeam) {
    throw new Error("Match or teams not found");
  }

  const homeStrength = match.homeTeam.strength;
  const awayStrength = match.awayTeam.strength;

  const homeXG = strengthToExpectedGoals(homeStrength, awayStrength, true);
  const awayXG = strengthToExpectedGoals(awayStrength, homeStrength, false);

  const homeScore = samplePoisson(homeXG);
  const awayScore = samplePoisson(awayXG);

  const homePowerShot = Math.random() < (homeStrength / 40);
  const awayPowerShot = Math.random() < (awayStrength / 40);

  const homeAttackers = match.homeTeam.players.filter((p) =>
    ["ATA", "ATQ", "Forward", "Atacante"].includes(p.position)
  );
  const homeMidfielders = match.homeTeam.players.filter((p) =>
    ["MEI", "VOL", "Midfielder", "Meio-Campo"].includes(p.position)
  );
  const awayAttackers = match.awayTeam.players.filter((p) =>
    ["ATA", "ATQ", "Forward", "Atacante"].includes(p.position)
  );
  const awayMidfielders = match.awayTeam.players.filter((p) =>
    ["MEI", "VOL", "Midfielder", "Meio-Campo"].includes(p.position)
  );

  const homeGoals: SimulationResult["homeGoals"] = [];
  for (let i = 0; i < homeScore; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const pool = [...homeAttackers, ...homeMidfielders];
    const scorer = pool[Math.floor(Math.random() * pool.length)];
    homeGoals.push({ minute, scorer: scorer?.name || "Jogador", playerId: scorer?.id });
  }

  const awayGoals: SimulationResult["awayGoals"] = [];
  for (let i = 0; i < awayScore; i++) {
    const minute = Math.floor(Math.random() * 90) + 1;
    const pool = [...awayAttackers, ...awayMidfielders];
    const scorer = pool[Math.floor(Math.random() * pool.length)];
    awayGoals.push({ minute, scorer: scorer?.name || "Jogador", playerId: scorer?.id });
  }

  const homeStrengthAdv = homeStrength / (homeStrength + awayStrength);
  const awayStrengthAdv = awayStrength / (homeStrength + awayStrength);

  const allPlayers = [
    ...match.homeTeam.players.map((p) => ({ ...p, clubId: match.homeTeam!.id })),
    ...match.awayTeam.players.map((p) => ({ ...p, clubId: match.awayTeam!.id })),
  ];

  const matchStats: SimulationResult["matchStats"] = allPlayers.map((p) => {
    const goals =
      homeGoals.filter((g) => g.playerId === p.id && p.clubId === match.homeTeam!.id).length +
      awayGoals.filter((g) => g.playerId === p.id && p.clubId === match.awayTeam!.id).length;
    const powerShots =
      p.clubId === match.homeTeam!.id && homePowerShot && goals > 0 && homeGoals[0]?.playerId === p.id
        ? 1
        : p.clubId === match.awayTeam!.id && awayPowerShot && goals > 0 && awayGoals[0]?.playerId === p.id
        ? 1
        : 0;
    const assists = Math.random() < 0.3 ? 1 : 0;
    const shots = Math.floor(Math.random() * 5) + 1;
    const shotsOnTarget = Math.floor(shots * (0.3 + Math.random() * 0.4));
    const passes = Math.floor(Math.random() * 60) + 20;
    const passAccuracy = Math.floor(65 + (p.clubId === match.homeTeam!.id ? homeStrengthAdv : awayStrengthAdv) * 25 + Math.random() * 10);
    const tackles = Math.floor(Math.random() * 8);
    const interceptions = Math.floor(Math.random() * 6);
    const saves =
      p.position === "GOL" || p.position === "GK" || p.position === "Goleiro"
        ? Math.floor(Math.random() * 8) + 1
        : 0;
    const cleanSheet =
      saves >= 0 &&
      (p.clubId === match.homeTeam!.id ? awayScore === 0 : homeScore === 0);
    const yellowCards = Math.random() < 0.25 ? 1 : 0;
    const redCards = Math.random() < 0.04 ? 1 : 0;
    const rating = Math.min(
      10,
      5.5 +
        goals * 0.8 +
        assists * 0.4 +
        (cleanSheet ? 0.5 : 0) -
        yellowCards * 0.3 -
        redCards * 1
    );

    return {
      playerId: p.id,
      clubId: p.clubId,
      goals,
      assists,
      powerShots,
      shots,
      shotsOnTarget,
      passes,
      passAccuracy,
      tackles,
      interceptions,
      saves,
      cleanSheet,
      yellowCards,
      redCards,
      minutesPlayed: 90,
      rating: parseFloat(rating.toFixed(1)),
    };
  });

  const mvp = matchStats.reduce(
    (best, cur) => (cur.rating > best.rating ? cur : best),
    matchStats[0]
  );

  return {
    homeScore,
    awayScore,
    homeGoals,
    awayGoals,
    homePowerShot,
    awayPowerShot,
    mvpPlayerId: mvp?.playerId,
    mvpRating: mvp?.rating ?? 6.0,
    matchStats,
  };
}

export async function applySimulation(
  matchId: string,
  result: SimulationResult,
  pointsPerWin = 3,
  pointsPerDraw = 1
) {
  await prisma.match.update({
    where: { id: matchId },
    data: {
      homeScore: result.homeScore,
      awayScore: result.awayScore,
      status: "finished",
      isSimulated: true,
    },
  });

  for (const stat of result.matchStats) {
    await prisma.matchStat.create({
      data: {
        ...stat,
        matchId,
        mvp: stat.playerId === result.mvpPlayerId,
      },
    });
  }

  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: { group: true },
  });

  if (match?.groupId) {
    const homeStanding = await prisma.standing.findFirst({
      where: { groupId: match.groupId, clubId: match.homeTeamId! },
    });
    const awayStanding = await prisma.standing.findFirst({
      where: { groupId: match.groupId, clubId: match.awayTeamId! },
    });

    if (homeStanding && awayStanding) {
      const homeWin = (result.homeScore ?? 0) > (result.awayScore ?? 0);
      const draw = (result.homeScore ?? 0) === (result.awayScore ?? 0);

      const homePoints = homeWin ? pointsPerWin : draw ? pointsPerDraw : 0;
      const awayPoints = !homeWin && !draw ? pointsPerWin : draw ? pointsPerDraw : 0;

      await prisma.standing.update({
        where: { id: homeStanding.id },
        data: {
          played: homeStanding.played + 1,
          wins: homeStanding.wins + (homeWin ? 1 : 0),
          draws: homeStanding.draws + (draw ? 1 : 0),
          losses: homeStanding.losses + (!homeWin && !draw ? 1 : 0),
          goalsFor: homeStanding.goalsFor + (result.homeScore ?? 0),
          goalsAgainst: homeStanding.goalsAgainst + (result.awayScore ?? 0),
          points: homeStanding.points + homePoints,
        },
      });

      await prisma.standing.update({
        where: { id: awayStanding.id },
        data: {
          played: awayStanding.played + 1,
          wins: awayStanding.wins + (!homeWin && !draw ? 1 : 0),
          draws: awayStanding.draws + (draw ? 1 : 0),
          losses: awayStanding.losses + (homeWin ? 1 : 0),
          goalsFor: awayStanding.goalsFor + (result.awayScore ?? 0),
          goalsAgainst: awayStanding.goalsAgainst + (result.homeScore ?? 0),
          points: awayStanding.points + awayPoints,
        },
      });
    }
  }

  return result;
}

export async function simularRodada(competitionId: string, roundNumber: string) {
  const matches = await prisma.match.findMany({
    where: {
      group: { competitionId },
      round: roundNumber,
      status: "scheduled",
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

  return { simulated: matches.length, results };
}

export async function simularTemporada(competitionId: string) {
  const matches = await prisma.match.findMany({
    where: {
      group: { competitionId },
      status: "scheduled",
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

  return { simulated: matches.length, results };
}
