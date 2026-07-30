import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const confederations = [
  { name: "UEFA", code: "UEFA", logo: "" },
  { name: "CONMEBOL", code: "CONMEBOL", logo: "" },
  { name: "CONCACAF", code: "CONCACAF", logo: "" },
  { name: "AFC", code: "AFC", logo: "" },
  { name: "CAF", code: "CAF", logo: "" },
  { name: "OFC", code: "OFC", logo: "" },
] as const;

type ConfData = { name: string; code: string; conf: string; strength: number };

const countries: ConfData[] = [
  { name: "Albania", code: "ALB", conf: "UEFA", strength: 3.5 },
  { name: "Andorra", code: "AND", conf: "UEFA", strength: 1.0 },
  { name: "Armenia", code: "ARM", conf: "UEFA", strength: 2.5 },
  { name: "Austria", code: "AUT", conf: "UEFA", strength: 5.5 },
  { name: "Azerbaijan", code: "AZE", conf: "UEFA", strength: 2.5 },
  { name: "Belarus", code: "BLR", conf: "UEFA", strength: 3.0 },
  { name: "Belgium", code: "BEL", conf: "UEFA", strength: 8.0 },
  { name: "Bosnia and Herzegovina", code: "BIH", conf: "UEFA", strength: 4.0 },
  { name: "Bulgaria", code: "BUL", conf: "UEFA", strength: 3.5 },
  { name: "Croatia", code: "CRO", conf: "UEFA", strength: 7.5 },
  { name: "Cyprus", code: "CYP", conf: "UEFA", strength: 2.5 },
  { name: "Czechia", code: "CZE", conf: "UEFA", strength: 5.5 },
  { name: "Denmark", code: "DEN", conf: "UEFA", strength: 6.5 },
  { name: "England", code: "ENG", conf: "UEFA", strength: 8.5 },
  { name: "Estonia", code: "EST", conf: "UEFA", strength: 2.0 },
  { name: "Faroe Islands", code: "FRO", conf: "UEFA", strength: 1.5 },
  { name: "Finland", code: "FIN", conf: "UEFA", strength: 3.5 },
  { name: "France", code: "FRA", conf: "UEFA", strength: 9.0 },
  { name: "Georgia", code: "GEO", conf: "UEFA", strength: 4.5 },
  { name: "Germany", code: "GER", conf: "UEFA", strength: 8.5 },
  { name: "Gibraltar", code: "GIB", conf: "UEFA", strength: 1.0 },
  { name: "Greece", code: "GRE", conf: "UEFA", strength: 4.5 },
  { name: "Hungary", code: "HUN", conf: "UEFA", strength: 5.0 },
  { name: "Iceland", code: "ISL", conf: "UEFA", strength: 3.5 },
  { name: "Republic of Ireland", code: "IRL", conf: "UEFA", strength: 4.5 },
  { name: "Israel", code: "ISR", conf: "UEFA", strength: 4.0 },
  { name: "Italy", code: "ITA", conf: "UEFA", strength: 8.5 },
  { name: "Kazakhstan", code: "KAZ", conf: "UEFA", strength: 2.5 },
  { name: "Kosovo", code: "KOS", conf: "UEFA", strength: 2.5 },
  { name: "Latvia", code: "LVA", conf: "UEFA", strength: 2.0 },
  { name: "Liechtenstein", code: "LIE", conf: "UEFA", strength: 1.0 },
  { name: "Lithuania", code: "LTU", conf: "UEFA", strength: 2.0 },
  { name: "Luxembourg", code: "LUX", conf: "UEFA", strength: 2.5 },
  { name: "Malta", code: "MLT", conf: "UEFA", strength: 1.5 },
  { name: "North Macedonia", code: "MKD", conf: "UEFA", strength: 3.0 },
  { name: "Moldova", code: "MDA", conf: "UEFA", strength: 2.0 },
  { name: "Montenegro", code: "MNE", conf: "UEFA", strength: 3.0 },
  { name: "Netherlands", code: "NED", conf: "UEFA", strength: 8.0 },
  { name: "Northern Ireland", code: "NIR", conf: "UEFA", strength: 3.5 },
  { name: "Norway", code: "NOR", conf: "UEFA", strength: 5.5 },
  { name: "Poland", code: "POL", conf: "UEFA", strength: 5.5 },
  { name: "Portugal", code: "POR", conf: "UEFA", strength: 8.5 },
  { name: "Romania", code: "ROU", conf: "UEFA", strength: 5.0 },
  { name: "Russia", code: "RUS", conf: "UEFA", strength: 6.5 },
  { name: "San Marino", code: "SMR", conf: "UEFA", strength: 1.0 },
  { name: "Scotland", code: "SCO", conf: "UEFA", strength: 5.0 },
  { name: "Serbia", code: "SRB", conf: "UEFA", strength: 5.5 },
  { name: "Slovakia", code: "SVK", conf: "UEFA", strength: 4.5 },
  { name: "Slovenia", code: "SVN", conf: "UEFA", strength: 4.5 },
  { name: "Spain", code: "ESP", conf: "UEFA", strength: 9.0 },
  { name: "Sweden", code: "SWE", conf: "UEFA", strength: 5.5 },
  { name: "Switzerland", code: "SUI", conf: "UEFA", strength: 6.5 },
  { name: "Turkey", code: "TUR", conf: "UEFA", strength: 6.5 },
  { name: "Ukraine", code: "UKR", conf: "UEFA", strength: 6.0 },
  { name: "Wales", code: "WAL", conf: "UEFA", strength: 5.0 },

  { name: "Argentina", code: "ARG", conf: "CONMEBOL", strength: 9.0 },
  { name: "Bolivia", code: "BOL", conf: "CONMEBOL", strength: 3.5 },
  { name: "Brazil", code: "BRA", conf: "CONMEBOL", strength: 9.0 },
  { name: "Chile", code: "CHI", conf: "CONMEBOL", strength: 6.0 },
  { name: "Colombia", code: "COL", conf: "CONMEBOL", strength: 7.0 },
  { name: "Ecuador", code: "ECU", conf: "CONMEBOL", strength: 6.0 },
  { name: "Paraguay", code: "PAR", conf: "CONMEBOL", strength: 5.0 },
  { name: "Peru", code: "PER", conf: "CONMEBOL", strength: 5.5 },
  { name: "Uruguay", code: "URU", conf: "CONMEBOL", strength: 8.0 },
  { name: "Venezuela", code: "VEN", conf: "CONMEBOL", strength: 4.5 },

  { name: "Anguilla", code: "AIA", conf: "CONCACAF", strength: 1.0 },
  { name: "Antigua and Barbuda", code: "ATG", conf: "CONCACAF", strength: 2.0 },
  { name: "Aruba", code: "ARU", conf: "CONCACAF", strength: 1.0 },
  { name: "Bahamas", code: "BAH", conf: "CONCACAF", strength: 1.0 },
  { name: "Barbados", code: "BRB", conf: "CONCACAF", strength: 1.5 },
  { name: "Belize", code: "BLZ", conf: "CONCACAF", strength: 1.0 },
  { name: "Bermuda", code: "BER", conf: "CONCACAF", strength: 1.5 },
  { name: "Bonaire", code: "BOE", conf: "CONCACAF", strength: 1.0 },
  { name: "British Virgin Islands", code: "VGB", conf: "CONCACAF", strength: 1.0 },
  { name: "Canada", code: "CAN", conf: "CONCACAF", strength: 5.5 },
  { name: "Cayman Islands", code: "CAY", conf: "CONCACAF", strength: 1.0 },
  { name: "Costa Rica", code: "CRC", conf: "CONCACAF", strength: 5.5 },
  { name: "Cuba", code: "CUB", conf: "CONCACAF", strength: 2.5 },
  { name: "Curaçao", code: "CUW", conf: "CONCACAF", strength: 2.5 },
  { name: "Dominica", code: "DMA", conf: "CONCACAF", strength: 1.0 },
  { name: "Dominican Republic", code: "DOM", conf: "CONCACAF", strength: 2.0 },
  { name: "El Salvador", code: "SLV", conf: "CONCACAF", strength: 3.0 },
  { name: "Grenada", code: "GRN", conf: "CONCACAF", strength: 1.0 },
  { name: "Guatemala", code: "GUA", conf: "CONCACAF", strength: 3.0 },
  { name: "Guyana", code: "GUY", conf: "CONCACAF", strength: 1.5 },
  { name: "Haiti", code: "HAI", conf: "CONCACAF", strength: 2.5 },
  { name: "Honduras", code: "HON", conf: "CONCACAF", strength: 4.0 },
  { name: "Jamaica", code: "JAM", conf: "CONCACAF", strength: 4.0 },
  { name: "Martinique", code: "MTQ", conf: "CONCACAF", strength: 2.0 },
  { name: "Mexico", code: "MEX", conf: "CONCACAF", strength: 7.5 },
  { name: "Montserrat", code: "MSR", conf: "CONCACAF", strength: 1.0 },
  { name: "Nicaragua", code: "NCA", conf: "CONCACAF", strength: 2.0 },
  { name: "Panama", code: "PAN", conf: "CONCACAF", strength: 4.5 },
  { name: "Puerto Rico", code: "PUR", conf: "CONCACAF", strength: 1.5 },
  { name: "Saint Kitts and Nevis", code: "SKN", conf: "CONCACAF", strength: 1.5 },
  { name: "Saint Lucia", code: "LCA", conf: "CONCACAF", strength: 1.0 },
  { name: "Saint Vincent and the Grenadines", code: "VIN", conf: "CONCACAF", strength: 1.0 },
  { name: "Suriname", code: "SUR", conf: "CONCACAF", strength: 2.0 },
  { name: "Trinidad and Tobago", code: "TTO", conf: "CONCACAF", strength: 3.0 },
  { name: "Turks and Caicos Islands", code: "TCA", conf: "CONCACAF", strength: 1.0 },
  { name: "United States", code: "USA", conf: "CONCACAF", strength: 7.0 },
  { name: "US Virgin Islands", code: "ISV", conf: "CONCACAF", strength: 1.0 },

  { name: "Afghanistan", code: "AFG", conf: "AFC", strength: 1.5 },
  { name: "Australia", code: "AUS", conf: "AFC", strength: 6.5 },
  { name: "Bahrain", code: "BHR", conf: "AFC", strength: 3.0 },
  { name: "Bangladesh", code: "BAN", conf: "AFC", strength: 1.5 },
  { name: "Bhutan", code: "BHU", conf: "AFC", strength: 1.0 },
  { name: "Brunei", code: "BRU", conf: "AFC", strength: 1.0 },
  { name: "Cambodia", code: "CAM", conf: "AFC", strength: 1.0 },
  { name: "China", code: "CHN", conf: "AFC", strength: 4.5 },
  { name: "Chinese Taipei", code: "TPE", conf: "AFC", strength: 2.0 },
  { name: "Guam", code: "GUM", conf: "AFC", strength: 1.0 },
  { name: "Hong Kong", code: "HKG", conf: "AFC", strength: 2.5 },
  { name: "India", code: "IND", conf: "AFC", strength: 3.5 },
  { name: "Indonesia", code: "IDN", conf: "AFC", strength: 3.0 },
  { name: "Iran", code: "IRN", conf: "AFC", strength: 6.5 },
  { name: "Iraq", code: "IRQ", conf: "AFC", strength: 4.5 },
  { name: "Japan", code: "JPN", conf: "AFC", strength: 8.0 },
  { name: "Jordan", code: "JOR", conf: "AFC", strength: 3.5 },
  { name: "Kuwait", code: "KUW", conf: "AFC", strength: 2.5 },
  { name: "Kyrgyzstan", code: "KGZ", conf: "AFC", strength: 2.0 },
  { name: "Laos", code: "LAO", conf: "AFC", strength: 1.0 },
  { name: "Lebanon", code: "LBN", conf: "AFC", strength: 2.5 },
  { name: "Macau", code: "MAC", conf: "AFC", strength: 1.0 },
  { name: "Malaysia", code: "MAS", conf: "AFC", strength: 3.0 },
  { name: "Maldives", code: "MDV", conf: "AFC", strength: 1.0 },
  { name: "Mongolia", code: "MNG", conf: "AFC", strength: 1.0 },
  { name: "Myanmar", code: "MYA", conf: "AFC", strength: 1.5 },
  { name: "Nepal", code: "NEP", conf: "AFC", strength: 1.0 },
  { name: "North Korea", code: "PRK", conf: "AFC", strength: 2.5 },
  { name: "Oman", code: "OMA", conf: "AFC", strength: 3.0 },
  { name: "Pakistan", code: "PAK", conf: "AFC", strength: 1.0 },
  { name: "Palestine", code: "PLE", conf: "AFC", strength: 2.0 },
  { name: "Philippines", code: "PHI", conf: "AFC", strength: 1.5 },
  { name: "Qatar", code: "QAT", conf: "AFC", strength: 5.5 },
  { name: "Saudi Arabia", code: "KSA", conf: "AFC", strength: 5.5 },
  { name: "Singapore", code: "SGP", conf: "AFC", strength: 2.0 },
  { name: "South Korea", code: "KOR", conf: "AFC", strength: 7.5 },
  { name: "Sri Lanka", code: "SRI", conf: "AFC", strength: 1.0 },
  { name: "Syria", code: "SYR", conf: "AFC", strength: 3.0 },
  { name: "Tajikistan", code: "TJK", conf: "AFC", strength: 2.5 },
  { name: "Thailand", code: "THA", conf: "AFC", strength: 3.5 },
  { name: "Timor-Leste", code: "TLS", conf: "AFC", strength: 1.0 },
  { name: "Turkmenistan", code: "TKM", conf: "AFC", strength: 1.5 },
  { name: "United Arab Emirates", code: "UAE", conf: "AFC", strength: 4.5 },
  { name: "Uzbekistan", code: "UZB", conf: "AFC", strength: 4.5 },
  { name: "Vietnam", code: "VIE", conf: "AFC", strength: 3.5 },
  { name: "Yemen", code: "YEM", conf: "AFC", strength: 1.5 },

  { name: "Algeria", code: "ALG", conf: "CAF", strength: 5.5 },
  { name: "Angola", code: "ANG", conf: "CAF", strength: 4.0 },
  { name: "Benin", code: "BEN", conf: "CAF", strength: 2.5 },
  { name: "Botswana", code: "BOT", conf: "CAF", strength: 2.0 },
  { name: "Burkina Faso", code: "BFA", conf: "CAF", strength: 4.0 },
  { name: "Burundi", code: "BDI", conf: "CAF", strength: 1.5 },
  { name: "Cameroon", code: "CMR", conf: "CAF", strength: 5.5 },
  { name: "Cape Verde", code: "CPV", conf: "CAF", strength: 3.5 },
  { name: "Central African Republic", code: "CAF", conf: "CAF", strength: 1.5 },
  { name: "Chad", code: "CHA", conf: "CAF", strength: 1.0 },
  { name: "Comoros", code: "COM", conf: "CAF", strength: 2.0 },
  { name: "Congo", code: "CGO", conf: "CAF", strength: 3.0 },
  { name: "DR Congo", code: "COD", conf: "CAF", strength: 4.0 },
  { name: "Djibouti", code: "DJI", conf: "CAF", strength: 1.0 },
  { name: "Egypt", code: "EGY", conf: "CAF", strength: 6.5 },
  { name: "Equatorial Guinea", code: "EQG", conf: "CAF", strength: 2.5 },
  { name: "Eritrea", code: "ERI", conf: "CAF", strength: 1.0 },
  { name: "Eswatini", code: "SWZ", conf: "CAF", strength: 1.5 },
  { name: "Ethiopia", code: "ETH", conf: "CAF", strength: 2.0 },
  { name: "Gabon", code: "GAB", conf: "CAF", strength: 3.0 },
  { name: "Gambia", code: "GAM", conf: "CAF", strength: 2.0 },
  { name: "Ghana", code: "GHA", conf: "CAF", strength: 5.5 },
  { name: "Guinea", code: "GUI", conf: "CAF", strength: 3.5 },
  { name: "Guinea-Bissau", code: "GNB", conf: "CAF", strength: 2.0 },
  { name: "Ivory Coast", code: "CIV", conf: "CAF", strength: 6.0 },
  { name: "Kenya", code: "KEN", conf: "CAF", strength: 3.0 },
  { name: "Lesotho", code: "LES", conf: "CAF", strength: 1.5 },
  { name: "Liberia", code: "LBR", conf: "CAF", strength: 1.5 },
  { name: "Libya", code: "LBY", conf: "CAF", strength: 2.5 },
  { name: "Madagascar", code: "MAD", conf: "CAF", strength: 2.0 },
  { name: "Malawi", code: "MWI", conf: "CAF", strength: 2.0 },
  { name: "Mali", code: "MLI", conf: "CAF", strength: 4.0 },
  { name: "Mauritania", code: "MTN", conf: "CAF", strength: 2.5 },
  { name: "Mauritius", code: "MRI", conf: "CAF", strength: 1.0 },
  { name: "Morocco", code: "MAR", conf: "CAF", strength: 7.5 },
  { name: "Mozambique", code: "MOZ", conf: "CAF", strength: 2.5 },
  { name: "Namibia", code: "NAM", conf: "CAF", strength: 2.0 },
  { name: "Niger", code: "NIG", conf: "CAF", strength: 2.0 },
  { name: "Nigeria", code: "NGA", conf: "CAF", strength: 6.5 },
  { name: "Rwanda", code: "RWA", conf: "CAF", strength: 2.0 },
  { name: "São Tomé and Príncipe", code: "STP", conf: "CAF", strength: 1.0 },
  { name: "Senegal", code: "SEN", conf: "CAF", strength: 7.5 },
  { name: "Seychelles", code: "SEY", conf: "CAF", strength: 1.0 },
  { name: "Sierra Leone", code: "SLE", conf: "CAF", strength: 1.5 },
  { name: "Somalia", code: "SOM", conf: "CAF", strength: 1.0 },
  { name: "South Africa", code: "RSA", conf: "CAF", strength: 5.5 },
  { name: "South Sudan", code: "SSD", conf: "CAF", strength: 1.5 },
  { name: "Sudan", code: "SDN", conf: "CAF", strength: 2.5 },
  { name: "Tanzania", code: "TAN", conf: "CAF", strength: 2.5 },
  { name: "Togo", code: "TOG", conf: "CAF", strength: 2.5 },
  { name: "Tunisia", code: "TUN", conf: "CAF", strength: 5.5 },
  { name: "Uganda", code: "UGA", conf: "CAF", strength: 3.0 },
  { name: "Zambia", code: "ZAM", conf: "CAF", strength: 3.0 },
  { name: "Zimbabwe", code: "ZIM", conf: "CAF", strength: 2.5 },

  { name: "American Samoa", code: "ASA", conf: "OFC", strength: 1.0 },
  { name: "Cook Islands", code: "COK", conf: "OFC", strength: 1.0 },
  { name: "Fiji", code: "FIJ", conf: "OFC", strength: 2.0 },
  { name: "Kiribati", code: "KIR", conf: "OFC", strength: 1.0 },
  { name: "New Caledonia", code: "NCL", conf: "OFC", strength: 2.0 },
  { name: "New Zealand", code: "NZL", conf: "OFC", strength: 5.0 },
  { name: "Papua New Guinea", code: "PNG", conf: "OFC", strength: 2.0 },
  { name: "Samoa", code: "SAM", conf: "OFC", strength: 1.0 },
  { name: "Solomon Islands", code: "SOL", conf: "OFC", strength: 1.5 },
  { name: "Tahiti", code: "TAH", conf: "OFC", strength: 2.0 },
  { name: "Tonga", code: "TGA", conf: "OFC", strength: 1.0 },
  { name: "Tuvalu", code: "TUV", conf: "OFC", strength: 1.0 },
  { name: "Vanuatu", code: "VAN", conf: "OFC", strength: 1.5 },
];

const confCompetitions: Record<string, string[]> = {
  UEFA: ["Champions League", "Europa League", "Conference League", "Super Cup"],
  CONMEBOL: ["Copa Libertadores", "Copa Sul-Americana", "Recopa Sul-Americana"],
  CONCACAF: ["Champions Cup", "Central American Cup", "Caribbean Cup"],
  AFC: ["Champions League Elite", "Champions League Two", "Challenge League"],
  CAF: ["Champions League", "Confederation Cup", "Super Cup"],
  OFC: ["Champions League"],
};

const fifaCompetitions: string[] = ["Copa Intercontinental", "Mundial de Clubes"];

async function main() {
  const existingConf = await prisma.confederation.count();
  if (existingConf > 0) {
    console.log("Database already seeded. Skipping.");
    return;
  }

  console.log("Seeding world football hierarchy...\n");

  // Step 1: Confederations
  console.log("Creating confederations...");
  await prisma.confederation.createMany({
    data: confederations.map((c) => ({ name: c.name, code: c.code, logo: c.logo })),
  });

  const confMap = new Map<string, string>();
  const allConfs = await prisma.confederation.findMany();
  for (const c of allConfs) {
    confMap.set(c.code, c.id);
  }

  // Step 2: Countries
  console.log(`Creating ${countries.length} countries...`);
  await prisma.country.createMany({
    data: countries.map((c) => ({
      name: c.name,
      code: c.code,
      flag: "",
      confederationId: confMap.get(c.conf)!,
    })),
  });

  const countryMap = new Map<string, string>();
  const allCountries = await prisma.country.findMany();
  for (const c of allCountries) {
    countryMap.set(c.code, c.id);
  }

  // Step 3: Associations
  console.log("Creating national associations...");
  await prisma.nationalAssociation.createMany({
    data: countries.map((c) => ({
      name: c.name,
      code: c.code,
      countryId: countryMap.get(c.code)!,
      confederationId: confMap.get(c.conf)!,
      logo: "",
    })),
  });

  const assocMap = new Map<string, string>();
  const allAssociations = await prisma.nationalAssociation.findMany();
  for (const a of allAssociations) {
    assocMap.set(a.code, a.id);
  }

  // Step 4: National Teams
  console.log("Creating national teams...");
  await prisma.nationalTeam.createMany({
    data: countries.map((c) => ({
      name: `${c.name} NT`,
      countryId: countryMap.get(c.code)!,
      associationId: assocMap.get(c.code)!,
      confederationId: confMap.get(c.conf)!,
      strength: c.strength,
      emblem: "",
      flag: "",
      primaryKit: "",
      secondaryKit: "",
    })),
  });

  // Step 5: Leagues
  console.log("Creating leagues...");
  const leagueData = confederations.map((c) => ({
    name: `${c.name} League System`,
    logo: "",
    confederationId: confMap.get(c.code)!,
    isInternational: true,
  }));

  await prisma.league.createMany({
    data: leagueData,
  });

  // Step 6: Competitions per confederation
  console.log("Creating confederation competitions...");
  let competitionData: { name: string; type: string; logo: string; format: string; isKnockout: boolean }[] = [];

  for (const [confCode, comps] of Object.entries(confCompetitions)) {
    for (const compName of comps) {
      const isKnockout = compName.toLowerCase().includes("super") || compName.toLowerCase().includes("recopa");
      competitionData.push({
        name: confCode === "OFC" ? `${compName} (OFC)` : `${confCode} ${compName}`,
        type: "international",
        logo: "",
        format: "groups",
        isKnockout,
      });
    }
  }

  for (const compName of fifaCompetitions) {
    competitionData.push({
      name: `FIFA ${compName}`,
      type: "international",
      logo: "",
      format: "groups",
      isKnockout: false,
    });
  }

  await prisma.competition.createMany({
    data: competitionData.map((c) => ({ ...c })),
  });

  const total = await prisma.country.count();
  console.log(`\nDone! Created:`);
  console.log(`  ${allConfs.length} confederations`);
  console.log(`  ${total} countries`);
  console.log(`  ${await prisma.nationalAssociation.count()} associations`);
  console.log(`  ${await prisma.nationalTeam.count()} national teams`);
  console.log(`  ${await prisma.league.count()} leagues`);
  console.log(`  ${await prisma.competition.count()} competitions`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });