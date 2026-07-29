import { prisma } from "./prisma";

export type ClubPower = {
  attack: number;
  midfield: number;
  defense: number;
  goalkeeper: number;
  chemistry: number;
  form: number;
  morale: number;
};

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

function clampPower(p: number): number {
  return Math.max(0, Math.min(100, p));
}

function effectiveStrength(p: ClubPower): number {
  const attack = (clampPower(p.attack) + clampPower(p.midfield)) / 2;
  const defense = (clampPower(p.defense) + clampPower(p.goalkeeper)) / 2;
  const base = attack * 0.6 + defense * 0.4;
  const synergy = (clampPower(p.chemistry) + clampPower(p.form) + clampPower(p.morale)) / 3;
  return base * (0.7 + (synergy / 100) * 0.6);
}

function expectedGoals(p: ClubPower, opponent: ClubPower, isHome: boolean): number {
  const myStr = effectiveStrength(p);
  const oppStr = effectiveStrength(opponent);
  const ratio = myStr / (myStr + oppStr);
  const baseXG = 1.3;
  const homeBoost = isHome ? 1.1 : 1.0;
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

export async function simulateMatch(matchId: string): Promise<SimulationResult> {
  const match = await prisma.match.findUnique({
    where: { id: matchId },
    include: {
      homeTeam: { include: { players: true } },
      awayTeam: { include: { players: true } },
    },
  });

  if (!match || !match.homeTeam || !match.awayTeam) {
    throw new Error("Match or teams not found");
  }

  const homePower: ClubPower = {
    attack: match.homeTeam.attack,
    midfield: match.homeTeam.midfield,
    defense: match.homeTeam.defense,
    goalkeeper: match.homeTeam.goalkeeper,
    chemistry: match.homeTeam.chemistry,
    form: match.homeTeam.form,
    morale: match.homeTeam.morale,
  };

  const awayPower: ClubPower = {
    attack: match.awayTeam.attack,
    midfield: match.awayTeam.midfield,
    defense: match.awayTeam.defense,
    goalkeeper: match.awayTeam.goalkeeper,
    chemistry: match.awayTeam.chemistry,
    form: match.awayTeam.form,
    morale: match.awayTeam.morale,
  };

  const homeXG = expectedGoals(homePower, awayPower, true);
  const awayXG = expectedGoals(awayPower, homePower, false);

  let homeScore = samplePoisson(homeXG);
  let awayScore = samplePoisson(awayXG);

  const homePowerShot = Math.random() < (clampPower(homePower.attack) + clampPower(homePower.midfield)) / 400;
  const awayPowerShot = Math.random() < (clampPower(awayPower.attack) + clampPower(awayPower.midfield)) / 400;

  const homeAttackers = match.homeTeam.players.filter((p) => ["ATA", "ATQ", "Forward", "Atacante"].includes(p.position));
  const homeMidfielders = match.homeTeam.players.filter((p) => ["MEI", "VOL", "Midfielder", "Meio-Campo"].includes(p.position));
  const awayAttackers = match.awayTeam.players.filter((p) => ["ATA", "ATQ", "Forward", "Atacante"].includes(p.position));
  const awayMidfielders = match.awayTeam.players.filter((p) => ["MEI", "VOL", "Midfielder", "Meio-Campo"].includes(p.position));

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

  const allPlayers = [
    ...match.homeTeam.players.map((p) => ({ ...p, clubId: match.homeTeam!.id })),
    ...match.awayTeam.players.map((p) => ({ ...p, clubId: match.awayTeam!.id })),
  ];

  const matchStats: SimulationResult["matchStats"] = allPlayers.map((p) => {
    const goals = homeGoals.filter((g) => g.playerId === p.id && p.clubId === match.homeTeam!.id).length +
      awayGoals.filter((g) => g.playerId === p.id && p.clubId === match.awayTeam!.id).length;
    const powerShots = p.clubId === match.homeTeam!.id && homePowerShot && goals > 0 && homeGoals[0]?.playerId === p.id ? 1 : 0;
    const assists = Math.floor(Math.random() * 2);
    const shots = Math.floor(Math.random() * 5) + 1;
    const shotsOnTarget = Math.floor(shots * (0.3 + Math.random() * 0.4));
    const passes = Math.floor(Math.random() * 60) + 20;
    const passAccuracy = Math.floor(70 + Math.random() * 25);
    const tackles = Math.floor(Math.random() * 8);
    const interceptions = Math.floor(Math.random() * 6);
    const saves = p.position === "GOL" || p.position === "GK" || p.position === "Goleiro" ? Math.floor(Math.random() * 8) : 0;
    const cleanSheet = saves > 0 && (p.clubId === match.homeTeam!.id ? awayScore === 0 : homeScore === 0);
    const yellowCards = Math.random() < 0.3 ? 1 : 0;
    const redCards = Math.random() < 0.05 ? 1 : 0;
    const rating = Math.min(10, 5.5 + goals * 0.8 + assists * 0.4 + (cleanSheet ? 0.5 : 0) - yellowCards * 0.3 - redCards * 1);

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

  const mvp = matchStats.reduce((best, cur) => (cur.rating > best.rating ? cur : best), matchStats[0]);

  const result: SimulationResult = {
    homeScore,
    awayScore,
    homeGoals,
    awayGoals,
    homePowerShot,
    awayPowerShot,
    mvpPlayerId: mvp.playerId,
    mvpRating: mvp.rating,
    matchStats,
  };

  return result;
}

export async function applySimulation(matchId: string, result: SimulationResult) {
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

      await prisma.standing.update({
        where: { id: homeStanding.id },
        data: {
          played: homeStanding.played + 1,
          wins: homeStanding.wins + (homeWin ? 1 : 0),
          draws: homeStanding.draws + (draw ? 1 : 0),
          losses: homeStanding.losses + (!homeWin && !draw ? 1 : 0),
          goalsFor: homeStanding.goalsFor + (result.homeScore ?? 0),
          goalsAgainst: homeStanding.goalsAgainst + (result.awayScore ?? 0),
          points: homeStanding.points + (homeWin ? 3 : draw ? 1 : 0),
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
          points: awayStanding.points + (!homeWin && !draw ? 3 : draw ? 1 : 0),
        },
      });
    }
  }

  return result;
}
