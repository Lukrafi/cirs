import { NextRequest, NextResponse } from "next/server";
import { getPermissions } from "@/lib/permissions";
import { prisma } from "@/lib/prisma";
import { getDataSource } from "@/lib/dataSources";
import { createSyncLog } from "@/lib/syncService";
import path from "path";
import fs from "fs";

export const dynamic = "force-dynamic";

const PUBLIC_DIR = path.join(process.cwd(), "public");

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function sanitizeFilename(name: string): string {
  return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9_-]/g, "_").substring(0, 80).toLowerCase();
}

async function downloadImage(imageUrl: string, filename: string, subdir: string): Promise<string | null> {
  try {
    const res = await fetch(imageUrl, { signal: AbortSignal.timeout(15000) });
    if (!res.ok) return null;
    const buffer = Buffer.from(await res.arrayBuffer());
    if (buffer.length < 500) return null;
    const dir = path.join(PUBLIC_DIR, subdir);
    ensureDir(dir);
    const ext = imageUrl.endsWith(".svg") ? "svg" : "png";
    const filePath = path.join(dir, `${filename}.${ext}`);
    fs.writeFileSync(filePath, buffer);
    return `/${subdir}/${filename}.${ext}`;
  } catch {
    return null;
  }
}

const CONMEBOL_DATA = {
  "confederation": "CONMEBOL",
  "season": 2026,
  "countries": [
    {
      "name": "Brasil", "code": "BRA",
      "competitions": [
        { "name": "Brasileirao Serie A", "type": "liga", "division": 1, "teams": ["Athletico Paranaense", "Atletico Mineiro", "Bahia", "Botafogo", "Bragantino", "Chapecoense", "Corinthians", "Coritiba", "Cruzeiro", "Flamengo", "Fluminense", "Gremio", "Internacional", "Mirassol", "Palmeiras", "Remo", "Santos", "Sao Paulo", "Vasco da Gama", "Vitoria"] },
        { "name": "Brasileirao Serie B", "type": "liga", "division": 2, "teams": ["America Mineiro", "Athletic Club", "Atletico Goianiense", "Avai", "Botafogo-SP", "Ceara", "CRB", "Criciuma", "Cuiaba", "Fortaleza", "Goias", "Juventude", "Londrina", "Nautico", "Novorizontino", "Operario Ferroviario", "Ponte Preta", "Sao Bernardo", "Sport", "Vila Nova"] },
        { "name": "Copa do Brasil", "type": "copa" },
        { "name": "Supercopa do Brasil", "type": "supercopa" }
      ]
    },
    {
      "name": "Argentina", "code": "ARG",
      "competitions": [
        { "name": "Liga Profesional de Futbol", "type": "liga", "division": 1, "teams": ["River Plate", "Boca Juniors", "Racing Club", "Independiente", "San Lorenzo", "Estudiantes de La Plata", "Velez Sarsfield", "Talleres", "Lanus", "Defensa y Justicia", "Argentinos Juniors", "Huracan", "Belgrano", "Godoy Cruz", "Newell's Old Boys", "Rosario Central", "Platense", "Atletico Tucuman", "Banfield", "Tigre", "Union", "Instituto", "Barracas Central", "Riestra", "Sarmiento", "Central Cordoba", "Independiente Rivadavia"] },
        { "name": "Primera Nacional", "type": "liga", "division": 2, "teams": ["San Martin de Tucuman", "Colon", "San Martin de San Juan", "Quilmes", "All Boys", "Chacarita Juniors", "Agropecuario", "Gimnasia de Mendoza", "Temperley", "Nueva Chicago"] },
        { "name": "Copa Argentina", "type": "copa" },
        { "name": "Supercopa Argentina", "type": "supercopa" }
      ]
    },
    {
      "name": "Uruguai", "code": "URU",
      "competitions": [
        { "name": "Primera Division Uruguaia", "type": "liga", "division": 1, "teams": ["Nacional", "Penarol", "Liverpool", "Defensor Sporting", "Danubio", "Boston River", "Montevideo Wanderers", "Fenix", "River Plate Uruguay", "Cerro", "Cerro Longo", "Deportivo Maldonado", "Racing Montevideo", "Miramar Misiones", "Progreso", "Juventud"] },
        { "name": "Segunda Division Uruguaia", "type": "liga", "division": 2, "teams": ["Rampla Juniors", "Sud America", "Albion", "Uruguay Montevideo", "Cerrito", "Atenas", "Juventud de Las Piedras", "Rentistas", "Torque", "Bella Vista"] },
        { "name": "Copa Uruguay", "type": "copa" },
        { "name": "Supercopa Uruguaya", "type": "supercopa" }
      ]
    },
    {
      "name": "Colombia", "code": "COL",
      "competitions": [
        { "name": "Categoria Primera A", "type": "liga", "division": 1, "teams": ["Millonarios", "Atletico Nacional", "Junior", "Independiente Medellin", "America de Cali", "Santa Fe", "Deportes Tolima", "Deportivo Calli", "Once Caldas", "Aguilas Doradas", "La Equidad", "Deportivo Pasto", "Bucaramanga", "Pereira", "Jaguares", "Boyaca Chico", "Envigado", "Patriotas", "Fortaleza CEIF", "Llaneros"] },
        { "name": "Categoria Primera B", "type": "liga", "division": 2, "teams": ["Real Cartagena", "Union Magdalena", "Cucuta Deportivo", "Orsomarso", "Tigres", "Bogota", "Real Cundinamarca", "Leones", "Barranquilla", "Cortulua"] },
        { "name": "Copa Colombia", "type": "copa" },
        { "name": "Superliga de Colombia", "type": "supercopa" }
      ]
    },
    {
      "name": "Chile", "code": "CHI",
      "competitions": [
        { "name": "Primera Division de Chile", "type": "liga", "division": 1, "teams": ["Colo-Colo", "Universidad de Chile", "Universidad Catolica", "Palestino", "Huachipato", "Union Espanola", "Everton", "Coquimbo Unido", "Audax Italiano", "Cobresal", "O'Higgins", "Nublense", "La Calera", "Deportes Copiapo", "Cobreloa", "Iquique"] },
        { "name": "Primera B de Chile", "type": "liga", "division": 2, "teams": ["Santiago Wanderers", "Deportes Antofagasta", "San Luis de Quillota", "Deportes Temuco", "Magallanes", "Rangers de Talca", "Barnechea", "San Marcos de Arica", "Union San Felipe", "Curico Unido"] },
        { "name": "Copa Chile", "type": "copa" },
        { "name": "Supercopa de Chile", "type": "supercopa" }
      ]
    },
    {
      "name": "Equador", "code": "ECU",
      "competitions": [
        { "name": "LigaPro Serie A", "type": "liga", "division": 1, "teams": ["Independiente del Valle", "LDU Quito", "Barcelona SC", "Emelec", "Universidad Catolica", "Aucas", "Macara", "El Nacional", "Delfin", "Mushuc Runa", "Deportivo Cuenca", "Tecnico Universitario", "Imbabura", "Ouense", "Cumbaya", "Libertad"] },
        { "name": "LigaPro Serie B", "type": "liga", "division": 2, "teams": ["Guayaquil City", "Manta", "Chacaritas", "Vargas Tors", "San Antonio", "9 de Octubre", "Leones del Norte", "Gualaceo", "Cuniburo", "Buhos ULVR"] },
        { "name": "Copa Ecuador", "type": "copa" },
        { "name": "Supercopa Ecuador", "type": "supercopa" }
      ]
    },
    {
      "name": "Paraguai", "code": "PAR",
      "competitions": [
        { "name": "Division Profesional (Apertura/Clausura)", "type": "liga", "division": 1, "teams": ["Olimpia", "Cerro Porteno", "Libertad", "Guarani", "Sportivo Luqueno", "Nacional Asuncion", "General Caballero JLM", "Tacuary", "Amelia", "Trinidad", "2 de Mayo", "Sol de America"] },
        { "name": "Division Intermedia", "type": "liga", "division": 2, "teams": ["San Lorenzo", "Deportivo Recoleta", "Fernando de la Mora", "Independence CG", "Pastoreo", "Guairena", "12 de Octubre", "Sebastiño Basura", "Encarnacion", "Tembetary"] },
        { "name": "Copa Paraguay", "type": "copa" },
        { "name": "Supercopa Paraguay", "type": "supercopa" }
      ]
    },
    {
      "name": "Peru", "code": "PER",
      "competitions": [
        { "name": "Liga 1", "type": "liga", "division": 1, "teams": ["Universitario", "Alianza Lima", "Sporting Cristal", "Melgar", "Cienciano", "Sporto Hull", "ADT", "Iron FC", "UTC", "Alianza Atletico", "Comerciants Unidoss", "Los Chancas", "Sport Bos", "Deportivo Goloso", "Hipolito Velo", "Loncomila", "Atletico Garra", "Mamãe"] },
        { "name": "Liga 2", "type": "liga", "division": 2, "teams": ["San Martin", "Deportivo Municipal", "Ayaccio FC", "Coops", "Llacubamba", "Pirata FC", "Juan Pablo II", "U. San Martin", "Comportants", "Caverne"] },
        { "name": "Copa Bicentenario", "type": "copa" },
        { "name": "Supercopa Peruana", "type": "supercopa" }
      ]
    },
    {
      "name": "Bolivia", "code": "BOL",
      "competitions": [
        { "name": "Division Profesional", "type": "liga", "division": 1, "teams": ["Bolivar", "The Strongest", "Always Ready", "Blocming", "Wilstermann", "San Antonio Bulo Bulo", "Real Tomata", "Nacional Poto", "Aurora", "Royal Sometimes", "GV San Jose", "Independiente Petrolero", "Oriente Petrolero", "Universitario de Vito", "Real Santa Cruz", "Gitdo Gato"] },
        { "name": "Copa Simon Bolivar (Segunda Div)", "type": "liga", "division": 2, "teams": ["Fatimid", "CD.", "Totra Real Rio", "Stormu", "Ciclo", "Mariscal Sure", "Universitario de Sur", "ABE", "Comercc", "Chico Pe seco"] },
        { "name": "Copa Division Profesional", "type": "copa" },
        { "name": "Supercopa Boliviana", "type": "supercopa" }
      ]
    },
    {
      "name": "Venezuela", "code": "VEN",
      "competitions": [
        { "name": "Liga FUTVE", "type": "liga", "division": 1, "teams": ["Deportivo Tachira", "Carabobo", "Caracas", "Metropolitanos", "Universidad Central", "Deportivo La Guaira", "Academia Puerto Cabello", "Monacos", "Angostura", "Portuguesa", "Inter de Barinas", "Zamora", "Rayo Zuliano", "Estudiantes de Merida"] },
        { "name": "Liga FUTVE 2", "type": "liga", "division": 2, "teams": ["Heroes de Falcon", "Maritimo de La Guaira", "Trujillanos", "Academia Anzoategui", "Bolivar S.C.", "Yaracuyanos", "Deportivo Miriano", "Dinamo Puerto", "El Vigia", "Rena"] },
        { "name": "Copa Venezuela", "type": "copa" },
        { "name": "Supercopa de Venezuela", "type": "supercopa" }
      ]
    }
  ] as JsonCountry[]
};

interface JsonCountry {
  name: string;
  code: string;
  competitions: JsonCompetition[];
}

interface JsonCompetition {
  name: string;
  type: string;
  division?: number;
  teams?: string[];
}

export async function POST(req: NextRequest) {
  const perms = await getPermissions();
  if (!perms.canSyncData) {
    return NextResponse.json({ error: "Apenas administradores" }, { status: 403 });
  }

  const start = Date.now();
  let clubsCreated = 0;
  let clubsUpdated = 0;
  let competitionsCreated = 0;
  let competitionsUpdated = 0;
  let flagsDownloaded = 0;
  let emblemsDownloaded = 0;
  const errors: string[] = [];

  try {
    const data = CONMEBOL_DATA;
    const confedCode: string = data.confederation;
    const seasonYear: number = data.season || new Date().getFullYear();
    const countries: JsonCountry[] = data.countries;

    let confederation = await prisma.confederation.findFirst({ where: { code: confedCode } });
    if (!confederation) {
      console.log("[import-json] Creating confederation:", confedCode);
      try {
        confederation = await prisma.confederation.create({ data: { name: confedCode, code: confedCode, logo: "" } });
      } catch (e: any) {
        errors.push(`Confederation [${confedCode}]: ${e.message}`);
        return NextResponse.json({ step: "confederation", error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
      }
    }

    for (const cData of countries) {
      try {
        let country = await prisma.country.findFirst({
          where: { OR: [{ name: cData.name }, { code: cData.code }] },
        });
        if (!country) {
          console.log("[import-json] Creating country:", cData.name, cData.code);
          try {
            country = await prisma.country.create({ data: { name: cData.name, code: cData.code, flag: "", confederationId: confederation.id } });
          } catch (e: any) {
            errors.push(`Country create [${cData.name}]: ${e.message}`);
            return NextResponse.json({ step: "country-create", country: cData.name, error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
          }
        } else if (!country.confederationId) {
          await prisma.country.update({ where: { id: country.id }, data: { confederationId: confederation.id } });
        }

        const flagSource = getDataSource("wikidata");
        if (!country.flag) {
          const flagImg = await flagSource.fetchFlag(cData.code);
          if (flagImg) {
            const localPath = await downloadImage(flagImg.url, cData.code, "bandeiras");
            if (localPath) {
              await prisma.country.update({ where: { id: country.id }, data: { flag: localPath } });
              flagsDownloaded++;
            }
          }
        }

        let division = await prisma.division.findFirst({
          where: { name: "Division 1", countryId: country.id },
        });
        if (!division) {
          console.log("[import-json] Creating division for:", country.name);
          try {
            division = await prisma.division.create({ data: { name: "Division 1", countryId: country.id, level: 1 } });
          } catch (e: any) {
            errors.push(`Division [${country.name}]: ${e.message}`);
            return NextResponse.json({ step: "division", country: country.name, error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
          }
        }

        for (const compData of cData.competitions) {
          try {
            let league = await prisma.league.findFirst({
              where: { name: { contains: compData.name } },
            });
            if (!league) {
              console.log("[import-json] Creating league:", compData.name);
              try {
                league = await prisma.league.create({
                  data: {
                    name: compData.name,
                    logo: "",
                    countryId: country.id,
                    confederationId: confederation.id,
                    divisionId: division.id,
                    isInternational: false,
                  },
                });
              } catch (e: any) {
                errors.push(`League [${compData.name}]: ${e.message}`);
                return NextResponse.json({ step: "league", league: compData.name, error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
              }
            } else {
              const u: any = {};
              if (!league.countryId) u.countryId = country.id;
              if (!league.confederationId) u.confederationId = confederation.id;
              if (!league.divisionId) u.divisionId = division.id;
              if (Object.keys(u).length > 0) await prisma.league.update({ where: { id: league.id }, data: u });
            }

            let season = await prisma.season.findFirst({
              where: { leagueId: league.id, year: seasonYear },
            });
            if (!season) {
              console.log("[import-json] Creating season:", seasonYear, league.name);
              try {
                season = await prisma.season.create({
                  data: {
                    name: `${seasonYear}`,
                    year: seasonYear,
                    leagueId: league.id,
                    startDate: new Date(`${seasonYear}-01-01`),
                    endDate: new Date(`${seasonYear}-12-31`),
                  },
                });
              } catch (e: any) {
                errors.push(`Season [${league.name}]: ${e.message}`);
                return NextResponse.json({ step: "season", league: league.name, error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
              }
            }

            let competition = await prisma.competition.findFirst({
              where: { seasonId: season.id, name: { contains: compData.name } },
            });
            if (!competition) {
              console.log("[import-json] Creating competition:", compData.name);
              try {
                competition = await prisma.competition.create({
                  data: {
                    name: compData.name,
                    type: compData.type,
                    seasonId: season.id,
                    numTeams: compData.teams ? compData.teams.length : 0,
                    numTurns: 2,
                    format: compData.type === "copa" ? "knockout" : "round-robin",
                    isKnockout: compData.type === "copa",
                  },
                });
                competitionsCreated++;
              } catch (e: any) {
                errors.push(`Competition [${compData.name}]: ${e.message}`);
                return NextResponse.json({ step: "competition", competition: compData.name, error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
              }
            } else {
              await prisma.competition.update({
                where: { id: competition.id },
                data: {
                  numTeams: compData.teams ? compData.teams.length : 0,
                  format: compData.type === "copa" ? "knockout" : "round-robin",
                  isKnockout: compData.type === "copa",
                },
              });
              competitionsUpdated++;
            }

            let group = await prisma.group.findFirst({ where: { competitionId: competition.id } });
            if (!group) {
              console.log("[import-json] Creating group:", compData.name);
              try {
                group = await prisma.group.create({
                  data: {
                    name: compData.type === "copa" ? "Mata-mata" : "Grupo Unico",
                    competitionId: competition.id,
                  },
                });
              } catch (e: any) {
                errors.push(`Group [${compData.name}]: ${e.message}`);
                return NextResponse.json({ step: "group", competition: compData.name, error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
              }
            }

            if (compData.teams && compData.teams.length > 0) {
              for (const teamName of compData.teams) {
                try {
                  let club = await prisma.club.findFirst({
                    where: { name: { equals: teamName } },
                  });
                  if (!club) {
                    console.log("[import-json] Creating club:", teamName);
                    try {
                      club = await prisma.club.create({
                        data: {
                          name: teamName,
                          shortName: teamName.split(" ").slice(0, 3).join(" "),
                          city: "",
                          countryId: country.id,
                          divisionId: division.id,
                          founded: "",
                          strength: 5.0,
                        },
                      });
                      clubsCreated++;
                    } catch (e: any) {
                      errors.push(`Club create [${teamName}]: ${e.message}`);
                      return NextResponse.json({ step: "club-create", club: teamName, error: e.message, clubsCreated, clubsUpdated, competitionsCreated, flagsDownloaded, emblemsDownloaded, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
                    }
                  } else {
                    clubsUpdated++;
                  }

                  const standing = await prisma.standing.findFirst({
                    where: { groupId: group.id, clubId: club.id },
                  });
                  if (!standing) {
                    console.log("[import-json] Creating standing:", teamName);
                    try {
                      await prisma.standing.create({
                        data: { groupId: group.id, clubId: club.id, position: 0 },
                      });
                    } catch (e: any) {
                      errors.push(`Standing [${teamName}]: ${e.message}`);
                      return NextResponse.json({ step: "standing", club: teamName, error: e.message, clubsCreated, clubsUpdated, competitionsCreated, flagsDownloaded, emblemsDownloaded, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors });
                    }
                  }

                  if (!club.emblem) {
                    const img = await flagSource.fetchEmblem(teamName, country.name);
                    if (img) {
                      const safe = sanitizeFilename(teamName);
                      const localPath = await downloadImage(img.url, safe, "escudos");
                      if (localPath) {
                        await prisma.club.update({ where: { id: club.id }, data: { emblem: localPath } });
                        emblemsDownloaded++;
                      }
                    }
                  }
                } catch (e: any) {
                  errors.push(`Club [${teamName}]: ${e.message}`);
                }
              }
            }
          } catch (e: any) {
            errors.push(`Competition [${compData.name}]: ${e.message}`);
          }
        }
      } catch (e: any) {
        errors.push(`Country [${cData.name}]: ${e.message}`);
      }
    }

    const result = {
      source: "conmebol-json",
      clubsCreated,
      clubsUpdated,
      competitionsCreated,
      competitionsUpdated,
      flagsDownloaded,
      emblemsDownloaded,
      stadiumsUpdated: 0,
      elapsedMs: Date.now() - start,
      errors,
    };

    await createSyncLog({
      ...result,
      level: "world",
      adminUsername: "admin",
      entity: "CONMEBOL Complete",
    });

    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ error: e.message, clubsCreated: 0, clubsUpdated: 0, competitionsCreated: 0, competitionsUpdated: 0, flagsDownloaded: 0, emblemsDownloaded: 0, stadiumsUpdated: 0, elapsedMs: Date.now() - start, errors: [e.message] }, { status: 500 });
  }
}
