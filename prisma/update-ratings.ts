import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

const leagueRatingsPath = path.join(__dirname, "..", "src", "lib", "league-ratings.json");
type LeagueRatingEntry = { league: string; country: string; rating: number; aliases?: string[] };
const leagueRatings: Record<string, LeagueRatingEntry[]> =
  JSON.parse(fs.readFileSync(leagueRatingsPath, "utf-8"));

function getLeagueRating(countryName: string, leagueName: string): number {
  for (const [, entries] of Object.entries(leagueRatings)) {
    for (const entry of entries) {
      if (entry.country.toLowerCase() !== countryName.toLowerCase()) continue;
      if (entry.league.toLowerCase() === leagueName.toLowerCase()) return entry.rating;
      const aliases = entry.aliases || [];
      if (aliases.some((a) => a.toLowerCase() === leagueName.toLowerCase())) return entry.rating;
    }
  }
  for (const [, entries] of Object.entries(leagueRatings)) {
    for (const entry of entries) {
      if (entry.country.toLowerCase() !== countryName.toLowerCase()) continue;
      if (leagueName.toLowerCase().startsWith(entry.league.toLowerCase())) return entry.rating;
      if (entry.league.length > 4 && leagueName.toLowerCase().includes(entry.league.toLowerCase())) return entry.rating;
      const aliases = entry.aliases || [];
      if (aliases.some((a) => a.toLowerCase() === leagueName.toLowerCase())) return entry.rating;
    }
  }
  return 0;
}

async function main() {
  const leagues = await prisma.league.findMany({
    where: { isInternational: false },
    include: { country: true, confederation: true },
  });

  let updated = 0;
  for (const league of leagues) {
    const countryName = league.country?.name || "";
    const cleanName = league.name.startsWith(countryName + " - ")
      ? league.name.slice(countryName.length + 3)
      : league.name;
    const expected = getLeagueRating(countryName, cleanName);
    if (expected !== league.rating) {
      await prisma.league.update({
        where: { id: league.id },
        data: { rating: expected },
      });
      updated++;
    }
  }

  console.log(`Atualizados: ${updated} ratings.`);
  await prisma.$disconnect();
}

main().catch(console.error).finally(() => prisma.$disconnect());