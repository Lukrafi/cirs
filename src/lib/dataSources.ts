export interface DataSource {
  name: string;
  fetchClubData(countryCode: string): Promise<ExternalClub[]>;
  fetchCompetitionData(leagueName: string): Promise<ExternalCompetition>;
  fetchEmblem(clubName: string): Promise<string | null>;
  fetchFlag(countryCode: string): Promise<string | null>;
  fetchStadium(clubName: string): Promise<string | null>;
  fetchPlayers(clubName: string): Promise<ExternalPlayer[]>;
}

export interface ExternalClub {
  name: string;
  city: string;
  founded: string;
  colors: string[];
  nickname: string;
  stadium: string;
  stadiumCapacity: number;
  emblem: string;
}

export interface ExternalCompetition {
  name: string;
  numTeams: number;
  numRounds: number;
  promoted: number;
  relegated: number;
  format: string;
  isKnockout: boolean;
}

export interface ExternalPlayer {
  name: string;
  nationality: string;
  age: number;
  position: string;
  number: number;
  height: number;
  weight: number;
  overall: number;
  photo: string;
}

class MockDataSource implements DataSource {
  name = "Mock";

  async fetchClubData(_countryCode: string): Promise<ExternalClub[]> {
    return [];
  }

  async fetchCompetitionData(_leagueName: string): Promise<ExternalCompetition> {
    return {
      name: _leagueName,
      numTeams: 20,
      numRounds: 38,
      promoted: 0,
      relegated: 3,
      format: "round-robin",
      isKnockout: false,
    };
  }

  async fetchEmblem(_clubName: string): Promise<string | null> {
    return null;
  }

  async fetchFlag(_countryCode: string): Promise<string | null> {
    return null;
  }

  async fetchStadium(_clubName: string): Promise<string | null> {
    return null;
  }
}

class WikidataSource implements DataSource {
  name = "Wikidata";

  async fetchClubData(countryCode: string): Promise<ExternalClub[]> {
    const sparql = `
      SELECT ?club ?clubLabel ?cityLabel ?founded ?stadiumLabel WHERE {
        ?club wdt:P31 wd:Q476028.
        ?club wdt:P17 wd:${countryCode}.
        OPTIONAL { ?club wdt:/*P118*/ []. }
        OPTIONAL { ?club wdt:?founded ?founded. }
        OPTIONAL { ?club wdt:?stadium ?stadium. }
        SERVICE wikibase:label { bd:serviceParam wikibase:language "en,pt". }
      }
      LIMIT 200
    `;
    try {
      const res = await fetch(`https://query.wikidata.org/sparql?format=json&query=${encodeURIComponent(transfer)}`);
      const data = await res.json();
      return (data.results?.bindings || []).map((r: any) => ({
        name: r.clubLabel?.value || "",
        city: r.cityLabel?.value || "",
        founded: r.founded?.value || "",
        colors: [],
        nickname: "",
        stadium: r.stadiumLabel?.value || "",
        stadiumCapacity: 0,
        emblem: "",
      }));
    } catch {
      return [];
    }
  }

  async fetchCompetitionData(_leagueName: string): Promise<ExternalCompetition> {
    return {
      name: _leagueName,
      numTeams: 0,
      numRounds: 0,
      promoted: 0,
      relegated: 0,
      format: "round-robin",
      isKnockout: false,
    };
  }

  async fetchFlag(countryCode: string): Promise<string | null> {
    try {
      return `https://flagcdn.com/w320/${countryCode.toLowerCase()}.png`;
    } catch {
      return null;
    }
  }

  async fetchEmblem(_clubName: string): Promise<string | null> {
    return null;
  }

  async fetchStadium(_clubName: string): Promise<string | null> {
    return null;
  }

  async fetchPlayers(_clubName: string): Promise<ExternalPlayer[]> {
    return [];
  }
}

const availableSources: Record<string, DataSource> = {
  mock: new MockDataSource(),
  wikidata: new WikidataSource(),
};

export function getDataSource(name?: string): DataSource {
  return availableSources[name || "mock"] || availableSources.mock;
}

export { availableSources };