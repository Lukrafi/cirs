export interface DataSource {
  name: string;
  fetchEmblem(clubName: string, country?: string): Promise<ExternalImage | null>;
  fetchFlag(countryCode: string): Promise<ExternalImage | null>;
  fetchStadium(clubName: string): Promise<ExternalStadium | null>;
  fetchCompetitionData(leagueName: string): Promise<ExternalCompetition | null>;
  fetchCompetitionDataByUrl(url: string): Promise<ExternalCompetition | null>;
}

export interface ExternalImage {
  url: string;
  format: "svg" | "png" | "jpeg" | "webp";
}

export interface ExternalStadium {
  name: string;
  city: string;
  capacity: number;
  coordinates: string;
}

export interface ExternalCompetition {
  name: string;
  shortName: string;
  numTeams: number;
  numRounds: number;
  promoted: number;
  relegated: number;
  format: string;
  isKnockout: boolean;
  continentalSpots: number;
}

// ============================================================
// MOCK — provedor vazio / mock
// ============================================================
class MockDataSource implements DataSource {
  name = "mock";

  async fetchEmblem(_clubName: string): Promise<ExternalImage | null> { return null; }
  async fetchFlag(_countryCode: string): Promise<ExternalImage | null> { return null; }
  async fetchStadium(_clubName: string): Promise<ExternalStadium | null> { return null; }

  async fetchCompetitionData(leagueName: string): Promise<ExternalCompetition | null> {
    return {
      name: leagueName,
      shortName: leagueName,
      numTeams: 20,
      numRounds: 38,
      promoted: 0,
      relegated: 0,
      format: "round-robin",
      isKnockout: false,
      continentalSpots: 0,
    };
  }

  async fetchCompetitionDataByUrl(_url: string): Promise<ExternalCompetition | null> {
    return null;
  }
}

// ============================================================
// WIKIDATA — dados abertos, sem API key, gratuito
// ============================================================
class WikidataSource implements DataSource {
  name = "wikidata";

  async fetchEmblem(clubName: string, country?: string): Promise<ExternalImage | null> {
    try {
      const params = new URLSearchParams({
        action: "query",
        list: "search",
        srsearch: `${clubName} escudo`,
        format: "json",
        srlimit: "3",
      });
      const res = await fetch(`https://commons.wikimedia.org/w/api.php?${params.toString()}`);
      const data = await res.json();
      const pages = data?.query?.search || [];
      if (pages.length === 0) return null;

      for (const page of pages.slice(0, 3)) {
        try {
          const imgParams = new URLSearchParams({
            action: "query",
            titles: page.title,
            prop: "imageinfo",
            iiprop: "url|mime",
            format: "json",
          });
          const imgRes = await fetch(`https://commons.wikimedia.org/w/api.php?${imgParams}`);
          const imgData = await imgRes.json();
          const pages = imgData?.query?.pages || {};
          for (const p of Object.values<any>(pages)) {
            if (p.imageinfo?.[0]) {
              const mime = p.imageinfo[0].mime || "";
              const format = mime.includes("svg") ? "svg" as const : "png" as const;
              return { url: p.imageinfo[0].url, format };
            }
          }
        } catch { /* continue */ }
      }
      return null;
    } catch {
      return null;
    }
  }

  async fetchFlag(countryCode: string): Promise<ExternalImage | null> {
    const lower = countryCode.toLowerCase();
    const svgUrl = `https://flagcdn.com/${lower}.svg`;
    try {
      const res = await fetch(svgUrl, { method: "HEAD" });
      if (res.ok) return { url: svgUrl, format: "svg" };
    } catch { /* */ }
    const pngUrl = `https://flagcdn.com/w320/${lower}.png`;
    return { url: pngUrl, format: "png" };
  }

  async fetchStadium(clubName: string): Promise<ExternalStadium | null> {
    return null;
  }

  async fetchCompetitionData(_name: string): Promise<ExternalCompetition | null> {
    return null;
  }

  async fetchCompetitionDataByUrl(_url: string): Promise<ExternalCompetition | null> {
    return null;
  }
}

// ====================================================================
// THESPORTSDB — API gratuita, key = THE_SPORTSDB_KEY do .env
// ====================================================================
class TheSportsDbSource implements DataSource {
  name = "thesportsdb";
  private base = "https://www.thesportsdb.com/api/v1/json";

  private getKey(): string {
    const key = process.env.THESPORTSDB_KEY;
    if (!key) return "3";
    return key;
  }

  async fetchEmblem(clubName: string): Promise<ExternalImage | null> {
    try {
      const res = await fetch(`${this.base}/${this.getKey()}/searchteams.php?t=${encodeURIComponent(clubName)}`);
      const data = await res.json();
      const team = data?.teams?.[Object];
      if (!team?.strBadge) return null;
      const url: string = team.strBadge;
      if (url.includes("badge.png") || url.endsWith(".svg")) {
        return { url, format: url.includes(".svg") ? "svg" : "png" };
      }
      return { url, format: "png" };
    } catch {
      return null;
    }
  }

  async fetchFlag(_countryCode: string): Promise<ExternalImage | null> {
    return null;
  }

  async fetchStadium(clubName: string): Promise<ExternalStadium | null> {
    try {
      const res = await fetch(`$(this.base}/$(this.getKey()}/searchteams.php?t=${encodeURIComponent(clubName)}`);
      const data = await res.json();
      const team = data?.teams?.[0];
      if (!team?.strStadium) return null;
      return {
        name: team.strStadium || "",
        city: team.strStadiumLocation || "",
        capacity: parseInt(team.intStadiumCapacity) || 0,
        coordinates: "",
      };
    } catch {
      return null;
    }
  }

  async fetchCompetitionData(leagueName: string): Promise<ExternalCompetition | null> {
    try {
      const res = await fetch(`https://www.thesportsdb.com/api/v1/${this.getKey()}/search_all_leagues.php?c=${encodeURIComponent(leagueName)}`);
      const data = await res.json();
      const league = data?.leagues?.[0];
      if (!league) return null;
      return {
        name: league.strLeague || leagueName,
        shortName: league.strLeagueAlternate || leagueName,
        numTeams: 0,
        numRounds: 0,
        promoted: 0,
        relegated: 0,
        format: "round-robin",
        isKnockout: false,
        continentalSpots: 0,
      };
    } catch {
      return null;
    }
  }

  async fetchCompetitionDataByUrl(_url: string): Promise<ExternalCompetition | null> {
    return null;
  }
}

// ===============================================
// REGISTRO — adicione novos providers aqui
// ===============================================
const availableSources: Record<string, DataSource> = {
  mock: new MockDataSource(),
  wikidata: new WikidataSource(),
  thesportsdb: new TheSportsDbSource(),
};

export function getDataSource(name?: string): DataSource {
  const key = name || "wikidata";
  return availableSources[key] || availableSources.mock;
}

export function listAvailableSources(): string[] {
  return Object.keys(availableSources);
}

export { availableSources };