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
  country?: string;
  countryCode?: string;
  confederation?: string;
  clubs?: ExternalClub[];
}

export interface ExternalClub {
  name: string;
  shortName: string;
  city: string;
  stadium: string;
  founded: string;
  emblem?: string;
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
// WIKIPEDIA — scraping de paginas de competicoes
// ====================================================================
class WikipediaSource implements DataSource {
  name = "wikipedia";

  private async fetchHtml(url: string): Promise<string | null> {
    try {
      const u = new URL(url);
      if (!u.hostname.includes("wikipedia.org")) return null;
      const res = await fetch(url, {
        headers: { "User-Agent": "CIRS-Sync/1.0" },
        signal: AbortSignal.timeout(15000),
      });
      if (!res.ok) return null;
      return await res.text();
    } catch {
      return null;
    }
  }

  extractCompetitionFromHtml(html: string): ExternalCompetition | null {
    const h1 = html.match(/<h1[^>]*id="firstHeading"[^>]*>(.*?)<\/h1>/i);
    const rawName = h1 ? h1[1].replace(/<[^>]+>/g, "").trim() : "";
    if (!rawName) return null;

    const name = rawName.replace(/\s*\([^)]*\)/g, "").replace(/\s*[-]\s*Wikip.*$/i, "").trim();
    if (!name) return null;

    let numTeams = 0;
    const tmPatterns = [
      /(?:equipes?|times?|clubes?)\s*<\/th>\s*<td[^>]*>\s*(\d+)/i,
      /(?:equipes?|times?|clubes?)\s*<\/[a-z]+>\s*<td[^>]*>\s*(\d+)/i,
      /N[ºo.]\s*(?:de\s*)?(?:equipes?|times?|clubes?)\s*<\/th>\s*<td[^>]*>\s*(\d+)/i,
      /N[ºo.]\s*(?:de\s*)?(?:equipes?|times?|clubes?)[^<]*<td[^>]*>(\d+)/i,
    ];
    for (const pat of tmPatterns) {
      const m = html.match(pat);
      if (m) { numTeams = parseInt(m[1]); break; }
    }

    let promoted = 0;
    const promPatterns = [
      /(?:promovidos?|acesso)\s*<\/[a-z]+>\s*<td[^>]*>\s*(\d+)/i,
      /(?:promovidos?)\s*(?:<\/[a-z]+>\s*)?<td[^>]*>[^\d]*(\d+)/i,
    ];
    for (const pat of promPatterns) {
      const m = html.match(pat);
      if (m) { promoted = parseInt(m[1]); break; }
    }

    let relegated = 0;
    const relPatterns = [
      /(?:rebaixad[oa]s?|rebaixamento|descenso)\s*<\/[a-z]+>\s*<td[^>]*>\s*(\d+)/i,
      /(?:rebaixad[oa]s?|rebaixamento|descenso)\s*(?:<\/[a-z]+>\s*)?<td[^>]*>[^\d]*(\d+)/i,
    ];
    for (const pat of relPatterns) {
      const m = html.match(pat);
      if (m) { relegated = parseInt(m[1]); break; }
    }

    const isKnockout = /(?:mata[-\s]?mata|eliminator|knockout|copa\s+do\s+brasil)/i.test(html)
      && !/(?:pontos\s+corridos|fase\s+de\s+grupos)/i.test(html);
    const format = isKnockout ? "knockout" : "round-robin";

    let numRounds = 0;
    if (!isKnockout && numTeams > 1) {
      const turnM = html.match(/[Rr]odadas?\s*(?:<[^>]*>)*\s*(\d+)/i);
      numRounds = turnM ? parseInt(turnM[1]) : (numTeams > 14 ? (numTeams - 1) * 2 : numTeams - 1);
    }

    let country = "";
    let countryCode = "";

    const infStart = html.indexOf("infobox");
    if (infStart > -1) {
      const infChunk = html.slice(infStart, infStart + 10000);
      const cleanInf = infChunk.replace(/<[^>]+>/g, "\n").replace(/\n{2,}/g, "\n");
      const infLines = cleanInf.split("\n").map(l => l.trim()).filter(l => l.length > 0);

      for (let i = 0; i < infLines.length - 1; i++) {
        if (/^pa[ií]s$/i.test(infLines[i]) || /^pa[ií]s\s*[:=]/i.test(infLines[i])) {
          const val = infLines[i].replace(/^pa[ií]s\s*[:=]\s*/i, "").trim() || infLines[i + 1].trim();
          if (val && val.length < 30) {
            const normMap: Record<string, string> = {
              "Equador": "Equador", "Ecuador": "Equador",
              "Brasil": "Brasil", "Brazil": "Brasil",
              "Argentina": "Argentina", "Uruguai": "Uruguai", "Uruguay": "Uruguai",
              "Chile": "Chile", "Colombia": "Colombia",
              "Peru": "Peru", "Paraguai": "Paraguai", "Paraguay": "Paraguai",
              "Bolivia": "Bolivia", "Venezuela": "Venezuela",
              "Inglaterra": "Inglaterra", "England": "Inglaterra",
              "Espanha": "Espanha", "Spain": "Espanha",
              "Italia": "Italia", "Italy": "Italia",
              "Alemanha": "Alemanha", "Germany": "Alemanha",
              "Franca": "Franca", "France": "Franca",
              "Paises Baixos": "Paises Baixos", "Netherlands": "Paises Baixos",
              "Portugal": "Portugal", "Estados Unidos": "Estados Unidos",
              "United States": "Estados Unidos", "Mexico": "Mexico",
              "Japao": "Japao", "Japan": "Japao",
              "Coreia do Sul": "Coreia do Sul", "South Korea": "Coreia do Sul",
              "Australia": "Australia", "Arabia Saudita": "Arabia Saudita",
              "Saudi Arabia": "Arabia Saudita", "Russia": "Russia",
              "Turquia": "Turquia", "Turkey": "Turquia",
              "Grecia": "Grecia", "Greece": "Grecia",
              "Escocia": "Escocia", "Scotland": "Escocia",
            };
            country = normMap[val] || val;
            break;
          }
        }
      }
    }

    const countryDefs: [RegExp, string, string][] = [
      [/Equatoriano|Serie\s+A.*Equador|LigaPro.*Ecuad|Equador|Ecuador/i, "Equador", "EC"],
      [/Brasileir|Copa\s+do\s+Brasil|Brasileirao/i, "Brasil", "BR"],
      [/Argentinos?|Argentina\s+Primera|Liga\s+Profesional/i, "Argentina", "AR"],
      [/Uruguai|Uruguay/i, "Uruguai", "UY"],
      [/Chileno?|Chile\s+Primera/i, "Chile", "CL"],
      [/Colombian[oa]?|Colombia/i, "Colombia", "CO"],
      [/Peruan[oa]?|Peru/i, "Peru", "PE"],
      [/Paragua[io]/i, "Paraguai", "PY"],
      [/Bolivian[oa]?|Bolivia/i, "Bolivia", "BO"],
      [/Venezuelan[oa]?|Venezuela/i, "Venezuela", "VE"],
      [/Premier\s+League/i, "Inglaterra", "GB-ENG"],
      [/La\s+Liga|Primera\s+Division\s+Espan/i, "Espanha", "ES"],
      [/Serie\s+A.*Ital/i, "Italia", "IT"],
      [/Bundesliga/i, "Alemanha", "DE"],
      [/Ligue\s+1|Division\s+1.*Franc/i, "Franca", "FR"],
      [/Eredivisie/i, "Paises Baixos", "NL"],
      [/Primeira\s+Liga|Liga\s+Portugal/i, "Portugal", "PT"],
      [/Major\s+League\s+Soccer|MLS/i, "Estados Unidos", "US"],
      [/Liga\s+MX/i, "Mexico", "MX"],
      [/J1\s+League|JLeague/i, "Japao", "JP"],
      [/K\s*League/i, "Coreia do Sul", "KR"],
      [/A[- ]?League/i, "Australia", "AU"],
      [/Saudi\s+Pro\s+League/i, "Arabia Saudita", "SA"],
    ];

    if (!country) {
      for (const [pat, cName, cCode] of countryDefs) {
        if (pat.test(rawName) || pat.test(name)) {
          country = cName;
          countryCode = cCode;
          break;
        }
      }
    } else {
      const codeMap: Record<string, string> = {
        "Equador": "EC", "Brasil": "BR", "Argentina": "AR", "Uruguai": "UY",
        "Chile": "CL", "Colombia": "CO", "Peru": "PE", "Paraguai": "PY",
        "Bolivia": "BO", "Venezuela": "VE", "Inglaterra": "GB-ENG", "Espanha": "ES",
        "Italia": "IT", "Alemanha": "DE", "Franca": "FR", "Paises Baixos": "NL",
        "Portugal": "PT", "Estados Unidos": "US", "Mexico": "MX",
        "Japao": "JP", "Coreia do Sul": "KR", "Australia": "AU",
        "Arabia Saudita": "SA", "Russia": "RU", "Turquia": "TR",
        "Grecia": "GR", "Escocia": "GB-SCT",
      };
      countryCode = codeMap[country] || "";
    }

    let confederation = "";

    const infConfMatch = html.match(/Confedera[çc][ãa]o[\s\S]{0,200}?(\bCONMEBOL\b|\bUEFA\b|\bCONCACAF\b|\bAFC\b|\bCAF\b|\bOFC\b)/i);
    if (infConfMatch) {
      confederation = infConfMatch[1].toUpperCase();
    }

    if (!confederation) {
      const confedByCode: Record<string, string> = {
        EC: "CONMEBOL", BR: "CONMEBOL", AR: "CONMEBOL", UY: "CONMEBOL",
        CL: "CONMEBOL", CO: "CONMEBOL", PE: "CONMEBOL", PY: "CONMEBOL",
        BO: "CONMEBOL", VE: "CONMEBOL",
        "GB-ENG": "UEFA", ES: "UEFA", IT: "UEFA", DE: "UEFA",
        FR: "UEFA", NL: "UEFA", PT: "UEFA", RU: "UEFA", TR: "UEFA", GR: "UEFA",
        "GB-SCT": "UEFA",
        US: "CONCACAF", MX: "CONCACAF",
        JP: "AFC", KR: "AFC", AU: "AFC", SA: "AFC",
      };
      confederation = confedByCode[countryCode] || "";
    }

    const clubs: ExternalClub[] = [];
    const seenClubNames = new Set<string>();
    const clubTableMatch = html.match(/<table[^>]*class="[^"]*wikitable[^"]*"[^>]*>([\s\S]*?)<\/table>/i);
    if (clubTableMatch) {
      const allLinks = [...clubTableMatch[0].matchAll(/<a[^>]*href="[^"]*wikipedia\.org\/wiki\/[^"]*"[^>]*title="([^"]*)"/gi)];
      if (allLinks.length === 0) {
        const relLinks = [...clubTableMatch[0].matchAll(/<a[^>]*href="\/wiki\/[^"]*"[^>]*title="([^"]*)"/gi)];
        allLinks.push(...relLinks);
      }
      for (const link of allLinks) {
        const rawTitle = link[1];
        const cleanName = rawTitle
          .replace(/\s*\([^)]*\)/g, "")
          .replace(/\s*-\s*.*$/, "")
          .trim();
        const lower = cleanName.toLowerCase();
        if (cleanName.length < 4) continue;
        if (seenClubNames.has(lower)) continue;
        if (/^(?:wikipedia|predefinicao|categoria|ficheiro|imagem|ajuda|portal)$/i.test(cleanName)) continue;
        if (/^(?:equador|brasil|argentina|chile|peru|colombia|paraguai|bolivia|uruguai|venezuela|espanha|italia|alemanha|franca|portugal|inglaterra|mexico|japao)$/i.test(cleanName)) continue;
        if (/copa\s+do\s+brasil|campeonato\s+equatoriano|liga\s+profesional|primeira\s+divisao|serie\s+a$|serie\s+b$/i.test(cleanName)) continue;
        seenClubNames.add(lower);
        clubs.push({
          name: cleanName,
          shortName: cleanName.split(" ").slice(0, 3).join(" "),
          city: "",
          stadium: "",
          founded: "",
        });
      }
    }

    return {
      name,
      shortName: name.split(" ").slice(0, 3).join(" "),
      numTeams: numTeams || clubs.length || 0,
      numRounds: numRounds || 0,
      promoted,
      relegated,
      format,
      isKnockout,
      continentalSpots: 0,
      country,
      countryCode,
      confederation,
      clubs: clubs.slice(0, 30),
    };
  }

  async fetchEmblem(): Promise<ExternalImage | null> { return null; }
  async fetchFlag(): Promise<ExternalImage | null> { return null; }
  async fetchStadium(): Promise<ExternalStadium | null> { return null; }
  async fetchCompetitionData(): Promise<ExternalCompetition | null> { return null; }

  async fetchCompetitionDataByUrl(url: string): Promise<ExternalCompetition | null> {
    const html = await this.fetchHtml(url);
    if (!html) return null;
    return this.extractCompetitionFromHtml(html);
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
      const team = data?.teams?.[0];
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
      const res = await fetch(`${this.base}/${this.getKey()}/searchteams.php?t=${encodeURIComponent(clubName)}`);
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
  wikipedia: new WikipediaSource(),
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