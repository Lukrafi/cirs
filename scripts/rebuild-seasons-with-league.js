const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();

const START_YEAR = 2026;
const END_YEAR = 2050;

const QUADRIENNIAL = {
  'FIFA World Cup': 2026, 'FIFA Club World Cup': 2029,
  'Copa América': 2028, 'Eurocopa': 2028, 'Copa da Ásia': 2027,
  'Finalíssima': 2029, 'OFC Nations Cup': 2028,
};
const BIENNIAL = {
  'Gold Cup': 2025, 'Copa Africana de Nações': 2025,
  'African Nations Championship': 2026,
};

function shouldInclude(name, year) {
  if (name in QUADRIENNIAL) return (year - QUADRIENNIAL[name]) % 4 === 0;
  if (name in BIENNIAL) return (year - BIENNIAL[name]) % 2 === 0;
  return true;
}

function getTeamCount(compName) {
  const n = compName.toLowerCase();
  if (n.includes('supercop') || n.includes('super cup') || n.includes('supertaça') || n.includes('superkup') || n.includes('supercoupe') || n.includes('superpuchar') || n.includes('community shield') || n.includes('trophée') || n.includes('johan cruijff') || n.includes('süper kupa') || n.includes('superpokal') || n.includes('supercoppa')) return 2;
  if (n.includes('copa') || n.includes('cup') || n.includes('taça') || n.includes('coupe') || n.includes('kup') || n.includes('pokal')) return 16;
  return 16;
}

function generateRoundRobin(teamIds, numTurns = 2) {
  const n = teamIds.length;
  if (n < 2) return [];
  const isOdd = n % 2 !== 0;
  const teams = isOdd ? [...teamIds, null] : [...teamIds];
  const size = teams.length;
  const rounds = size - 1;
  const matches = [];
  for (let turn = 0; turn < numTurns; turn++) {
    for (let round = 0; round < rounds; round++) {
      for (let i = 0; i < size / 2; i++) {
        const home = teams[i];
        const away = teams[size - 1 - i];
        if (home === null || away === null) continue;
        const roundNum = turn * rounds + round + 1;
        matches.push({ homeTeamId: turn === 0 ? home : away, awayTeamId: turn === 0 ? away : home, round: String(roundNum) });
      }
      const last = teams.pop();
      teams.splice(1, 0, last);
    }
  }
  return matches;
}

function generateKnockout(teamIds) {
  const matches = [];
  let current = [...teamIds];
  let roundNum = 1;
  while (current.length > 1) {
    const next = [];
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

function cuid() {
  return 'c' + Math.random().toString(36).slice(2, 12) + Date.now().toString(36);
}

async function main() {
  console.log('=== Recriando seasons (BATCH) ===\n');

  const existingYears = await p.season.groupBy({ by: ['year'], _count: true });
  const done = new Set(existingYears.filter(s => s._count >= 600).map(s => s.year));
  const pending = Array.from({ length: END_YEAR - START_YEAR + 1 }, (_, i) => START_YEAR + i).filter(y => !done.has(y));

  console.log(`Feitos: ${[...done].sort().join(', ') || 'nenhum'}`);
  console.log(`Pendentes: ${pending.join(', ') || 'TUDO PRONTO!'}`);
  if (pending.length === 0) { await p.$disconnect(); return; }

  if (done.size === 0) {
    console.log('Limpando...');
    await p.matchStat.deleteMany({});
    await p.match.deleteMany({});
    await p.standing.deleteMany({});
    await p.group.deleteMany({});
    await p.competition.deleteMany({});
    await p.season.deleteMany({});
  }

  const leagues = await p.league.findMany({
    where: { countryId: { not: null } },
    select: { id: true, name: true, countryId: true },
  });

  // Clubes por país (já ordenados por força)
  const clubsByCountry = {};
  const allClubs = await p.club.findMany({ select: { id: true, countryId: true, strength: true } });
  allClubs.forEach(c => {
    if (!clubsByCountry[c.countryId]) clubsByCountry[c.countryId] = [];
    clubsByCountry[c.countryId].push(c);
  });
  Object.values(clubsByCountry).forEach(arr => arr.sort((a, b) => b.strength - a.strength));

  let totalS = 0, totalC = 0, totalM = 0;

  for (const year of pending) {
    const t0 = Date.now();
    const dateStart = new Date(`${year}-01-01`);
    const dateEnd = new Date(`${year}-12-31`);

    // 1) Batch seasons
    const seasonData = leagues.map(l => ({ id: cuid(), name: String(year), year, leagueId: l.id, startDate: dateStart, endDate: dateEnd }));
    await p.season.createMany({ data: seasonData });
    const seasonMap = {};
    leagues.forEach((l, i) => { seasonMap[l.id] = seasonData[i].id; });

    // 2) Filtra competições que existem neste ano
    const eligibleLeagues = leagues.filter(l => shouldInclude(l.name, year));

    // 3) Batch competições
    const compData = eligibleLeagues.map(l => ({
      id: cuid(), name: l.name, type: 'liga', seasonId: seasonMap[l.id],
      format: 'round-robin', numTurns: 2, isSimulated: false,
    }));
    if (compData.length > 0) await p.competition.createMany({ data: compData });
    const compMap = {};
    eligibleLeagues.forEach((l, i) => { compMap[l.id] = compData[i].id; });

    // 4) Para cada competição: grupo + standings + partidas (batch)
    const groupData = [];
    const standingData = [];
    const matchData = [];

    for (const league of eligibleLeagues) {
      const compId = compMap[league.id];
      const clubs = clubsByCountry[league.countryId] || [];
      if (clubs.length < 2) continue;

      const teamCount = Math.min(getTeamCount(league.name), clubs.length);
      const selected = clubs.slice(0, teamCount);
      const teamIds = selected.map(c => c.id);

      const groupId = cuid();
      groupData.push({ id: groupId, name: 'Grupo Único', competitionId: compId });

      // Standings
      for (const club of selected) {
        standingData.push({
          id: cuid(), groupId, clubId: club.id,
          points: 0, played: 0, wins: 0, draws: 0, losses: 0,
          goalsFor: 0, goalsAgainst: 0, goalsDiff: 0, position: 0,
        });
      }

      // Fixtures
      const isCup = league.name.toLowerCase().includes('copa') || league.name.toLowerCase().includes('cup');
      const isSupercup = league.name.toLowerCase().includes('supercop') || league.name.toLowerCase().includes('super cup');
      let fixtures;
      if (isSupercup || teamCount === 2) fixtures = generateKnockout(teamIds);
      else if (isCup && teamCount <= 16) fixtures = generateKnockout(teamIds);
      else fixtures = generateRoundRobin(teamIds, 2);

      for (const f of fixtures) {
        matchData.push({
          id: cuid(), groupId, homeTeamId: f.homeTeamId, awayTeamId: f.awayTeamId,
          round: f.round, status: 'scheduled', isSimulated: false, matchDate: dateStart,
        });
      }
    }

    // Batch inserts em chunks de 5000
    const CHUNK = 5000;
    for (let i = 0; i < groupData.length; i += CHUNK) {
      await p.group.createMany({ data: groupData.slice(i, i + CHUNK) });
    }
    for (let i = 0; i < standingData.length; i += CHUNK) {
      await p.standing.createMany({ data: standingData.slice(i, i + CHUNK) });
    }
    for (let i = 0; i < matchData.length; i += CHUNK) {
      await p.match.createMany({ data: matchData.slice(i, i + CHUNK) });
    }

    const elapsed = ((Date.now() - t0) / 1000).toFixed(1);
    totalS += seasonData.length;
    totalC += compData.length;
    totalM += matchData.length;
    console.log(`${year}: ${seasonData.length} seasons, ${compData.length} comps, ${matchData.length} partidas (${elapsed}s)`);
  }

  console.log(`\nTotal: ${totalS} seasons, ${totalC} comps, ${totalM} partidas`);
  await p.$disconnect();
}

main().catch(async (e) => { console.error('ERRO:', e); await p.$disconnect(); });
