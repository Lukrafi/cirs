import { PrismaClient } from "@prisma/client";
import fs from "fs";
import path from "path";

const prisma = new PrismaClient();

type Member = { name: string; confed: string; code: string };

// 211 membros da FIFA (nome usado no site, confederação, código ISO 3166-1
// alpha-2 usado no flagcdn.com). Exceções sem ISO (Inglaterra, Escócia, País de
// Gales e Irlanda do Norte) usam códigos próprios resolvidos via Wikimedia.
const MEMBERS: Member[] = [
  // UEFA (55)
  { name: "Albania", confed: "UEFA", code: "al" },
  { name: "Andorra", confed: "UEFA", code: "ad" },
  { name: "Armenia", confed: "UEFA", code: "am" },
  { name: "Austria", confed: "UEFA", code: "at" },
  { name: "Azerbaijan", confed: "UEFA", code: "az" },
  { name: "Belarus", confed: "UEFA", code: "by" },
  { name: "Belgium", confed: "UEFA", code: "be" },
  { name: "Bosnia and Herzegovina", confed: "UEFA", code: "ba" },
  { name: "Bulgaria", confed: "UEFA", code: "bg" },
  { name: "Croatia", confed: "UEFA", code: "hr" },
  { name: "Cyprus", confed: "UEFA", code: "cy" },
  { name: "Czechia", confed: "UEFA", code: "cz" },
  { name: "Denmark", confed: "UEFA", code: "dk" },
  { name: "England", confed: "UEFA", code: "eng" },
  { name: "Estonia", confed: "UEFA", code: "ee" },
  { name: "Faroe Islands", confed: "UEFA", code: "fo" },
  { name: "Finland", confed: "UEFA", code: "fi" },
  { name: "France", confed: "UEFA", code: "fr" },
  { name: "Georgia", confed: "UEFA", code: "ge" },
  { name: "Germany", confed: "UEFA", code: "de" },
  { name: "Gibraltar", confed: "UEFA", code: "gi" },
  { name: "Greece", confed: "UEFA", code: "gr" },
  { name: "Hungary", confed: "UEFA", code: "hu" },
  { name: "Iceland", confed: "UEFA", code: "is" },
  { name: "Ireland", confed: "UEFA", code: "ie" },
  { name: "Israel", confed: "UEFA", code: "il" },
  { name: "Italy", confed: "UEFA", code: "it" },
  { name: "Kazakhstan", confed: "UEFA", code: "kz" },
  { name: "Kosovo", confed: "UEFA", code: "xk" },
  { name: "Latvia", confed: "UEFA", code: "lv" },
  { name: "Liechtenstein", confed: "UEFA", code: "li" },
  { name: "Lithuania", confed: "UEFA", code: "lt" },
  { name: "Luxembourg", confed: "UEFA", code: "lu" },
  { name: "Malta", confed: "UEFA", code: "mt" },
  { name: "Moldova", confed: "UEFA", code: "md" },
  { name: "Montenegro", confed: "UEFA", code: "me" },
  { name: "Netherlands", confed: "UEFA", code: "nl" },
  { name: "North Macedonia", confed: "UEFA", code: "mk" },
  { name: "Northern Ireland", confed: "UEFA", code: "nir" },
  { name: "Norway", confed: "UEFA", code: "no" },
  { name: "Poland", confed: "UEFA", code: "pl" },
  { name: "Portugal", confed: "UEFA", code: "pt" },
  { name: "Romania", confed: "UEFA", code: "ro" },
  { name: "Russia", confed: "UEFA", code: "ru" },
  { name: "San Marino", confed: "UEFA", code: "sm" },
  { name: "Scotland", confed: "UEFA", code: "sco" },
  { name: "Serbia", confed: "UEFA", code: "rs" },
  { name: "Slovakia", confed: "UEFA", code: "sk" },
  { name: "Slovenia", confed: "UEFA", code: "si" },
  { name: "Spain", confed: "UEFA", code: "es" },
  { name: "Sweden", confed: "UEFA", code: "se" },
  { name: "Switzerland", confed: "UEFA", code: "ch" },
  { name: "Türkiye", confed: "UEFA", code: "tr" },
  { name: "Ukraine", confed: "UEFA", code: "ua" },
  { name: "Wales", confed: "UEFA", code: "wal" },

  // CONMEBOL (10)
  { name: "Argentina", confed: "CONMEBOL", code: "ar" },
  { name: "Bolivia", confed: "CONMEBOL", code: "bo" },
  { name: "Brazil", confed: "CONMEBOL", code: "br" },
  { name: "Chile", confed: "CONMEBOL", code: "cl" },
  { name: "Colombia", confed: "CONMEBOL", code: "co" },
  { name: "Ecuador", confed: "CONMEBOL", code: "ec" },
  { name: "Paraguay", confed: "CONMEBOL", code: "py" },
  { name: "Peru", confed: "CONMEBOL", code: "pe" },
  { name: "Uruguay", confed: "CONMEBOL", code: "uy" },
  { name: "Venezuela", confed: "CONMEBOL", code: "ve" },

  // CONCACAF (35)
  { name: "Anguilla", confed: "CONCACAF", code: "ai" },
  { name: "Antigua and Barbuda", confed: "CONCACAF", code: "ag" },
  { name: "Aruba", confed: "CONCACAF", code: "aw" },
  { name: "Bahamas", confed: "CONCACAF", code: "bs" },
  { name: "Barbados", confed: "CONCACAF", code: "bb" },
  { name: "Belize", confed: "CONCACAF", code: "bz" },
  { name: "Bermuda", confed: "CONCACAF", code: "bm" },
  { name: "British Virgin Islands", confed: "CONCACAF", code: "vg" },
  { name: "Canada", confed: "CONCACAF", code: "ca" },
  { name: "Cayman Islands", confed: "CONCACAF", code: "ky" },
  { name: "Costa Rica", confed: "CONCACAF", code: "cr" },
  { name: "Cuba", confed: "CONCACAF", code: "cu" },
  { name: "Curaçao", confed: "CONCACAF", code: "cw" },
  { name: "Dominica", confed: "CONCACAF", code: "dm" },
  { name: "Dominican Republic", confed: "CONCACAF", code: "do" },
  { name: "El Salvador", confed: "CONCACAF", code: "sv" },
  { name: "Grenada", confed: "CONCACAF", code: "gd" },
  { name: "Guatemala", confed: "CONCACAF", code: "gt" },
  { name: "Guyana", confed: "CONCACAF", code: "gy" },
  { name: "Haiti", confed: "CONCACAF", code: "ht" },
  { name: "Honduras", confed: "CONCACAF", code: "hn" },
  { name: "Jamaica", confed: "CONCACAF", code: "jm" },
  { name: "Mexico", confed: "CONCACAF", code: "mx" },
  { name: "Montserrat", confed: "CONCACAF", code: "ms" },
  { name: "Nicaragua", confed: "CONCACAF", code: "ni" },
  { name: "Panama", confed: "CONCACAF", code: "pa" },
  { name: "Puerto Rico", confed: "CONCACAF", code: "pr" },
  { name: "Saint Kitts and Nevis", confed: "CONCACAF", code: "kn" },
  { name: "Saint Lucia", confed: "CONCACAF", code: "lc" },
  { name: "Saint Vincent and the Grenadines", confed: "CONCACAF", code: "vc" },
  { name: "Suriname", confed: "CONCACAF", code: "sr" },
  { name: "Trinidad and Tobago", confed: "CONCACAF", code: "tt" },
  { name: "Turks and Caicos Islands", confed: "CONCACAF", code: "tc" },
  { name: "United States of America", confed: "CONCACAF", code: "us" },
  { name: "US Virgin Islands", confed: "CONCACAF", code: "vi" },

  // AFC (46)
  { name: "Afghanistan", confed: "AFC", code: "af" },
  { name: "Australia", confed: "AFC", code: "au" },
  { name: "Bahrain", confed: "AFC", code: "bh" },
  { name: "Bangladesh", confed: "AFC", code: "bd" },
  { name: "Bhutan", confed: "AFC", code: "bt" },
  { name: "Brunei Darussalam", confed: "AFC", code: "bn" },
  { name: "Cambodia", confed: "AFC", code: "kh" },
  { name: "China PR", confed: "AFC", code: "cn" },
  { name: "Chinese Taipei", confed: "AFC", code: "tw" },
  { name: "Guam", confed: "AFC", code: "gu" },
  { name: "Hong Kong", confed: "AFC", code: "hk" },
  { name: "India", confed: "AFC", code: "in" },
  { name: "Indonesia", confed: "AFC", code: "id" },
  { name: "Iran", confed: "AFC", code: "ir" },
  { name: "Iraq", confed: "AFC", code: "iq" },
  { name: "Japan", confed: "AFC", code: "jp" },
  { name: "Jordan", confed: "AFC", code: "jo" },
  { name: "DPR Korea", confed: "AFC", code: "kp" },
  { name: "Korea Republic", confed: "AFC", code: "kr" },
  { name: "Kuwait", confed: "AFC", code: "kw" },
  { name: "Kyrgyzstan", confed: "AFC", code: "kg" },
  { name: "Laos", confed: "AFC", code: "la" },
  { name: "Lebanon", confed: "AFC", code: "lb" },
  { name: "Macau", confed: "AFC", code: "mo" },
  { name: "Malaysia", confed: "AFC", code: "my" },
  { name: "Maldives", confed: "AFC", code: "mv" },
  { name: "Mongolia", confed: "AFC", code: "mn" },
  { name: "Myanmar", confed: "AFC", code: "mm" },
  { name: "Nepal", confed: "AFC", code: "np" },
  { name: "Oman", confed: "AFC", code: "om" },
  { name: "Pakistan", confed: "AFC", code: "pk" },
  { name: "Palestine", confed: "AFC", code: "ps" },
  { name: "Philippines", confed: "AFC", code: "ph" },
  { name: "Qatar", confed: "AFC", code: "qa" },
  { name: "Saudi Arabia", confed: "AFC", code: "sa" },
  { name: "Singapore", confed: "AFC", code: "sg" },
  { name: "Sri Lanka", confed: "AFC", code: "lk" },
  { name: "Syria", confed: "AFC", code: "sy" },
  { name: "Tajikistan", confed: "AFC", code: "tj" },
  { name: "Thailand", confed: "AFC", code: "th" },
  { name: "Timor-Leste", confed: "AFC", code: "tl" },
  { name: "Turkmenistan", confed: "AFC", code: "tm" },
  { name: "United Arab Emirates", confed: "AFC", code: "ae" },
  { name: "Uzbekistan", confed: "AFC", code: "uz" },
  { name: "Vietnam", confed: "AFC", code: "vn" },
  { name: "Yemen", confed: "AFC", code: "ye" },

  // CAF (54)
  { name: "Algeria", confed: "CAF", code: "dz" },
  { name: "Angola", confed: "CAF", code: "ao" },
  { name: "Benin", confed: "CAF", code: "bj" },
  { name: "Botswana", confed: "CAF", code: "bw" },
  { name: "Burkina Faso", confed: "CAF", code: "bf" },
  { name: "Burundi", confed: "CAF", code: "bi" },
  { name: "Cabo Verde", confed: "CAF", code: "cv" },
  { name: "Cameroon", confed: "CAF", code: "cm" },
  { name: "Central African Republic", confed: "CAF", code: "cf" },
  { name: "Chad", confed: "CAF", code: "td" },
  { name: "Comoros", confed: "CAF", code: "km" },
  { name: "Congo", confed: "CAF", code: "cg" },
  { name: "Congo DR", confed: "CAF", code: "cd" },
  { name: "Côte d'Ivoire", confed: "CAF", code: "ci" },
  { name: "Djibouti", confed: "CAF", code: "dj" },
  { name: "Egypt", confed: "CAF", code: "eg" },
  { name: "Equatorial Guinea", confed: "CAF", code: "gq" },
  { name: "Eritrea", confed: "CAF", code: "er" },
  { name: "Eswatini", confed: "CAF", code: "sz" },
  { name: "Ethiopia", confed: "CAF", code: "et" },
  { name: "Gabon", confed: "CAF", code: "ga" },
  { name: "The Gambia", confed: "CAF", code: "gm" },
  { name: "Ghana", confed: "CAF", code: "gh" },
  { name: "Guinea", confed: "CAF", code: "gn" },
  { name: "Guinea-Bissau", confed: "CAF", code: "gw" },
  { name: "Kenya", confed: "CAF", code: "ke" },
  { name: "Lesotho", confed: "CAF", code: "ls" },
  { name: "Liberia", confed: "CAF", code: "lr" },
  { name: "Libya", confed: "CAF", code: "ly" },
  { name: "Madagascar", confed: "CAF", code: "mg" },
  { name: "Malawi", confed: "CAF", code: "mw" },
  { name: "Mali", confed: "CAF", code: "ml" },
  { name: "Mauritania", confed: "CAF", code: "mr" },
  { name: "Mauritius", confed: "CAF", code: "mu" },
  { name: "Morocco", confed: "CAF", code: "ma" },
  { name: "Mozambique", confed: "CAF", code: "mz" },
  { name: "Namibia", confed: "CAF", code: "na" },
  { name: "Niger", confed: "CAF", code: "ne" },
  { name: "Nigeria", confed: "CAF", code: "ng" },
  { name: "Rwanda", confed: "CAF", code: "rw" },
  { name: "Sao Tome and Principe", confed: "CAF", code: "st" },
  { name: "Senegal", confed: "CAF", code: "sn" },
  { name: "Seychelles", confed: "CAF", code: "sc" },
  { name: "Sierra Leone", confed: "CAF", code: "sl" },
  { name: "Somalia", confed: "CAF", code: "so" },
  { name: "South Africa", confed: "CAF", code: "za" },
  { name: "South Sudan", confed: "CAF", code: "ss" },
  { name: "Sudan", confed: "CAF", code: "sd" },
  { name: "Tanzania", confed: "CAF", code: "tz" },
  { name: "Togo", confed: "CAF", code: "tg" },
  { name: "Tunisia", confed: "CAF", code: "tn" },
  { name: "Uganda", confed: "CAF", code: "ug" },
  { name: "Zambia", confed: "CAF", code: "zm" },
  { name: "Zimbabwe", confed: "CAF", code: "zw" },

  // OFC (11)
  { name: "American Samoa", confed: "OFC", code: "as" },
  { name: "Cook Islands", confed: "OFC", code: "ck" },
  { name: "Fiji", confed: "OFC", code: "fj" },
  { name: "New Caledonia", confed: "OFC", code: "nc" },
  { name: "New Zealand", confed: "OFC", code: "nz" },
  { name: "Papua New Guinea", confed: "OFC", code: "pg" },
  { name: "Samoa", confed: "OFC", code: "ws" },
  { name: "Solomon Islands", confed: "OFC", code: "sb" },
  { name: "Tahiti", confed: "OFC", code: "pf" },
  { name: "Tonga", confed: "OFC", code: "to" },
  { name: "Vanuatu", confed: "OFC", code: "vu" },
];

// Bandeiras de nações sem código ISO (Wikimedia Commons).
const SPECIAL_FLAGS: Record<string, string> = {
  eng: "File:Flag_of_England.svg",
  sco: "File:Flag_of_Scotland.svg",
  wal: "File:Flag_of_Wales.svg",
  nir: "File:Flag_of_Northern_Ireland.svg",
};

const PUBLIC_DIR = path.join(process.cwd(), "public", "bandeiras-fifa");

async function resolveWikimediaUrl(fileName: string): Promise<string | null> {
  try {
    const api = `https://commons.wikimedia.org/w/api.php?action=query&titles=${encodeURIComponent(
      fileName
    )}&prop=imageinfo&iiprop=url&format=json&redirects=1`;
    const res = await fetch(api);
    const data = await res.json();
    const pages = (data?.query?.pages || {}) as Record<string, { imageinfo?: Array<{ url?: string }> }>;
    for (const key of Object.keys(pages)) {
      const url = pages[key]?.imageinfo?.[0]?.url;
      if (url) return url;
    }
  } catch {
    /* sem rede / erro */
  }
  return null;
}

async function download(url: string, dest: string): Promise<boolean> {
  try {
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) });
    if (!res.ok) return false;
    const buf = Buffer.from(await res.arrayBuffer());
    if (buf.length < 50) return false;
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.writeFileSync(dest, buf);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  // Remove seleções antigas/placeholder sem bandeira (mantém só as 211 oficiais da FIFA).
  const removed = await prisma.nationalTeam.deleteMany({
    where: { flag: { equals: "" } },
  });
  if (removed.count > 0) console.log(`Seleções placeholder sem bandeira removidas: ${removed.count}`);

  const confeds = await prisma.confederation.findMany();
  const confedByCode = new Map(confeds.map((c) => [c.code, c]));
  const countries = await prisma.country.findMany();
  const countryByName = new Map(countries.map((c) => [c.name.toLowerCase(), c]));

  let ok = 0;
  let failed = 0;
  const missing: string[] = [];

  for (const m of MEMBERS) {
    const confed = confedByCode.get(m.confed);
    if (!confed) {
      missing.push(`${m.name} (confed ${m.confed} não encontrada)`);
      continue;
    }

    const filename = `${m.code}.svg`;
    const dest = path.join(PUBLIC_DIR, filename);
    const flagPath = `/bandeiras-fifa/${filename}`;

    let saved = fs.existsSync(dest);
    if (!saved) {
      if (SPECIAL_FLAGS[m.code]) {
        const url = await resolveWikimediaUrl(SPECIAL_FLAGS[m.code]);
        if (url) saved = await download(url, dest);
      } else {
        saved = await download(`https://flagcdn.com/${m.code}.svg`, dest);
      }
    }

    const country = countryByName.get(m.name.toLowerCase());

    await prisma.nationalTeam.upsert({
      where: { name: m.name },
      update: { flag: flagPath, confederationId: confed.id, countryId: country?.id ?? null },
      create: {
        name: m.name,
        flag: flagPath,
        confederationId: confed.id,
        countryId: country?.id ?? null,
        strength: 5.0,
      },
    });

    if (saved) ok++;
    else failed++;
    console.log(`${saved ? "OK  " : "FAIL"} ${m.name} -> ${flagPath}`);
  }

  console.log(
    `\nTotal: ${MEMBERS.length} | bandeiras ok: ${ok} | falhas: ${failed} | sem confed: ${missing.length}`
  );
  if (missing.length > 0) console.log(missing.join("\n"));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
