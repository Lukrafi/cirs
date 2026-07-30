function rotateArray<T>(arr: T[]): T[] {
  if (arr.length <= 1) return arr;
  return [...arr.slice(-1), ...arr.slice(0, -1)];
}

export type GeneratedMatch = {
  homeId: string;
  awayId: string;
  round: string;
  matchDate: Date;
};

export function generateRoundrobin(
  clubIds: string[],
  numTurns: number = 2,
  startDate: Date = new Date(),
  daysBetweenRounds: number = 7
): GeneratedMatch[] {
  if (clubIds.length < 2) return [];

  const teams = [...clubIds];
  const hasBye = teams.length % 2 !== 0;
  if (hasBye) {
    teams.push("BYE");
  }

  const n = teams.length;
  const roundsPerTurn = n - 1;
  const matches: GeneratedMatch[] = [];
  let currentTeams = [...teams];

  for (let turn = 0; turn < numTurns; turn++) {
    for (let round = 0; round < roundsPerTurn; round++) {
      const roundNumber = `${round + 1 + turn * roundsPerTurn}`;
      const matchDate = new Date(startDate);
      matchDate.setDate(startDate.getDate() + (round + turn * roundsPerTurn) * daysBetweenRounds);

      for (let i = 0; i < n / 2; i++) {
        let home = currentTeams[i];
        let away = currentTeams[n - 1 - i];

        if (turn % 2 === 1) {
          [home, away] = [away, home];
        }

        if (home !== "BYE" && away !== "BYE") {
          matches.push({ homeId: home, awayId: away, round: roundNumber, matchDate });
        }
      }

      currentTeams = [currentTeams[0], ...rotateArray(currentTeams.slice(1))];
    }
  }

  return matches;
}

export function generateSingleRound(
  clubIds: string[],
  startDate: Date = new Date(),
  daysBetweenRounds: number = 7
): GeneratedMatch[] {
  return generateRoundrobin(clubIds, 1, startDate, daysBetweenRounds);
}

export function generateDoubleRound(
  clubIds: string[],
  startDate: Date = new Date(),
  daysBetweenRounds: number = 7
): GeneratedMatch[] {
  return generateRoundrobin(clubIds, 2, startDate, daysBetweenRounds);
}

export function generateGroups(
  clubIds: string[],
  numGroups: number = 1,
  startDate: Date = new Date(),
  daysBetweenRounds: number = 7
): { groupIndex: number; matches: GeneratedMatch[]; clubIds: string[] }[] {
  const shuffled = [...clubIds];
  const groups: { groupIndex: number; matches: GeneratedMatch[]; clubIds: string[] }[] = [];
  const perGroup = Math.ceil(shuffled.length / numGroups);

  for (let g = 0; g < numGroups; g++) {
    const groupClubs = shuffled.slice(g * perGroup, (g + 1) * perGroup);
    const groupMatches = generateRoundrobin(groupClubs, 2, startDate, daysBetweenRounds);
    groups.push({ groupIndex: g, matches: groupMatches, clubIds: groupClubs });
  }

  return groups;
}

export function generateKnockout(
  clubIds: string[],
  startDate: Date = new Date(),
  daysBetweenRounds: number = 14
): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  let current = [...clubIds];
  let round = 1;

  while (current.length > 1) {
    if (current.length % 2 !== 0 && current.length > 2) {
      current.push("BYE");
    }

    const matchDate = new Date(startDate);
    matchDate.setDate(startDate.getDate() + (round - 1) * daysBetweenRounds);

    const roundMatches: GeneratedMatch[] = [];
    const nextRound: string[] = [];

    for (let i = 0; i < current.length; i += 2) {
      const home = current[i];
      const away = current[i + 1];

      if (home !== "BYE" && away !== "BYE") {
        roundMatches.push({
          homeId: home,
          awayId: away,
          round: `R${round}`,
          matchDate,
        });
        nextRound.push(home);
      } else {
        const winner = home === "BYE" ? away : home;
        nextRound.push(winner);
      }
    }

    matches.push(...roundMatches);
    current = nextRound;
    round++;
  }

  return matches;
}

export function generateSwiss(
  clubIds: string[],
  numRounds: number = 5,
  startDate: Date = new Date(),
  daysBetweenRounds: number = 7
): GeneratedMatch[] {
  const matches: GeneratedMatch[] = [];
  let current = [...clubIds];

  for (let r = 0; r < numRounds; r++) {
    const roundNumber = `${r + 1}`;
    const matchDate = new Date(startDate);
    matchDate.setDate(startDate.getDate() + r * daysBetweenRounds);

    for (let i = 0; i < current.length - 1; i += 2) {
      matches.push({
        homeId: current[i],
        awayId: current[i + 1],
        round: roundNumber,
        matchDate,
      });
    }
    current = [...current].sort(() => Math.random() - 0.5);
  }

  return matches;
}
