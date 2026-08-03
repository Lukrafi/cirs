import Link from "next/link";
import uefaData from "@/lib/uefa-power-ranking.json";
import conmebolData from "@/lib/conmebol-power-ranking.json";
import concacafData from "@/lib/concacaf-power-ranking.json";
import cafData from "@/lib/caf-power-ranking.json";
import ofcData from "@/lib/ofc-power-ranking.json";
import afcData from "@/lib/afc-power-ranking.json";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Power Ranking de Ligas — CIRS",
  description: "Ranking de força das ligas nacionais do futebol mundial por confederação.",
};

const CONFED_INFO: Record<string, { color: string; href: string }> = {
  UEFA: { color: "#3b82f6", href: "/ranking/uefa" },
  CONMEBOL: { color: "#fbbf24", href: "/ranking/conmebol" },
  CONCACAF: { color: "#a855f7", href: "/ranking/concacaf" },
  CAF: { color: "#22c55e", href: "/ranking/caf" },
  AFC: { color: "#ef4444", href: "/ranking/afc" },
  OFC: { color: "#06b6d4", href: "/ranking/ofc" },
};

const CONFED_ORDER = ["UEFA", "CONMEBOL", "CONCACAF", "CAF", "AFC", "OFC"];

type Entry = { rank: number; league: string; country: string; division: number; rating: number };

const ALL_ENTRIES: Record<string, Entry[]> = {
  UEFA: uefaData as Entry[],
  CONMEBOL: conmebolData as Entry[],
  CONCACAF: concacafData as Entry[],
  CAF: cafData as Entry[],
  OFC: ofcData as Entry[],
  AFC: afcData as Entry[],
};

function ratingTier(rating: number): string {
  if (rating >= 900) return "bg-yellow-500/10 text-yellow-300";
  if (rating >= 800) return "bg-gold/10 text-gold";
  if (rating >= 700) return "bg-blue-500/10 text-blue-400";
  if (rating >= 500) return "bg-foreground/5 text-foreground";
  return "bg-muted/10 text-muted";
}

const COUNTRY_FLAGS: Record<string, string> = {
  "Inglaterra": "🏴", "Espanha": "🇪🇸", "Itália": "🇮🇹", "Alemanha": "🇩🇪", "França": "🇫🇷",
  "Portugal": "🇵🇹", "Países Baixos": "🇳🇱", "Turquia": "🇹🇷", "Bélgica": "🇧🇪", "Escócia": "🏴",
  "Áustria": "🇦🇹", "Rússia": "🇷🇺", "Ucrânia": "🇺🇦", "Grécia": "🇬🇷", "Dinamarca": "🇩🇰",
  "Polônia": "🇵🇱", "Croácia": "🇭🇷", "República Tcheca": "🇨🇿", "Suíça": "🇨🇭", "Noruega": "🇳🇴",
  "Suécia": "🇸🇪", "Hungria": "🇭🇺", "Romênia": "🇷🇴", "Israel": "🇮🇱", "Chipre": "🇨🇾",
  "Sérvia": "🇷🇸", "Bulgária": "🇧🇬", "Azerbaijão": "🇦🇿", "Eslováquia": "🇸🇰", "Eslovênia": "🇸🇮",
  "Cazaquistão": "🇰🇿", "Moldávia": "🇲🇩", "Islândia": "🇮🇸", "Irlanda": "🇮🇪", "Letônia": "🇱🇻",
  "Lituânia": "🇱🇹", "Albânia": "🇦🇱", "Bósnia e Herzegovina": "🇧🇦", "Macedônia do Norte": "🇲🇰",
  "Estônia": "🇪🇪", "Armênia": "🇦🇲", "Malta": "🇲🇹", "País de Gales": "🏴", "Ilhas Faroe": "🇫🇴",
  "Irlanda do Norte": "🏴", "Geórgia": "🇬🇪", "Bielorrússia": "🇧🇾", "Montenegro": "🇲🇪",
  "Kosovo": "🇽🇰", "San Marino": "🇸🇲", "Gibraltar": "🇬🇮", "Andorra": "🇦🇩",
  "Brasil": "🇧🇷", "Argentina": "🇦🇷", "Uruguai": "🇺🇾", "Colômbia": "🇨🇴", "Chile": "🇨🇱",
  "Equador": "🇪🇨", "Paraguai": "🇵🇾", "Peru": "🇵🇪", "Venezuela": "🇻🇪", "Bolívia": "🇧🇴",
  "México": "🇲🇽", "Estados Unidos": "🇺🇸", "Canadá": "🇨🇦", "Costa Rica": "🇨🇷", "Panamá": "🇵🇦",
  "Jamaica": "🇯🇲", "Honduras": "🇭🇳", "Guatemala": "🇬🇹", "El Salvador": "🇸🇻",
  "Trinidad e Tobago": "🇹🇹", "Haiti": "🇭🇹", "Curaçao": "🇨🇼", "Nicarágua": "🇳🇮",
  "Rep. Dominicana": "🇩🇴", "Cuba": "🇨🇺", "Suriname": "🇸🇷", "Martinica": "🇲🇶", "Guadalupe": "🇬🇵",
  "Guiana": "🇬🇾", "Bermudas": "🇧🇲", "Antígua e Barbuda": "🇦🇬", "St. Kitts e Nevis": "🇰🇳",
  "Porto Rico": "🇵🇷", "Barbados": "🇧🇧", "Santa Lúcia": "🇱🇨", "Granada": "🇬🇩",
  "Dominica": "🇩🇲", "St. Vincent e Granadinas": "🇻🇨", "Belize": "🇧🇿", "Aruba": "🇦🇼",
  "Ilhas Cayman": "🇰🇾", "Bahamas": "🇧🇸", "Guiana Francesa": "🇬🇫", "Bonaire": "🇧🇶",
  "Ilhas Virgens Britânicas": "🇻🇬", "Ilhas Virgens EUA": "🇻🇮", "Anguilla": "🇦🇮",
  "Turks e Caicos": "🇹🇨", "Montserrat": "🇲🇸", "Saint Martin": "🇲🇫", "Sint Maarten": "🇸🇽",
  "Marrocos": "🇲🇦", "Egito": "🇪🇬", "África do Sul": "🇿🇦", "Tunísia": "🇹🇳", "Argélia": "🇩🇿",
  "RD Congo": "🇨🇩", "Tanzânia": "🇹🇿", "Sudão": "🇸🇩", "Gana": "🇬🇭", "Nigéria": "🇳🇬",
  "Angola": "🇦🇴", "Zâmbia": "🇿🇲", "Costa do Marfim": "🇨🇮", "Zimbábue": "🇿🇼", "Quênia": "🇰🇪",
  "Uganda": "🇺🇬", "Etiópia": "🇪🇹", "Ruanda": "🇷🇼", "Senegal": "🇸🇳", "Mali": "🇲🇱",
  "Burkina Faso": "🇧🇫", "Benin": "🇧🇯", "Guiné": "🇬🇳", "Camarões": "🇨🇲", "Moçambique": "🇲🇿",
  "Burundi": "🇧🇮", "Malawi": "🇲🇼", "Botswana": "🇧🇼", "Lesoto": "🇱🇸", "Essuatíni": "🇸🇿",
  "Namíbia": "🇳🇦", "Madagascar": "🇲🇬", "Maurício": "🇲🇺", "Seicheles": "🇸🇨", "Comores": "🇰🇲",
  "Congo": "🇨🇬", "Gabão": "🇬🇦", "Guiné Equatorial": "🇬🇶", "República Centro-Africana": "🇨🇫",
  "Chade": "🇹🇩", "São Tomé e Príncipe": "🇸🇹", "Djibouti": "🇩🇯", "Eritreia": "🇪🇷",
  "Somália": "🇸🇴", "Sudão do Sul": "🇸🇸", "Mauritânia": "🇲🇷", "Gâmbia": "🇬🇲", "Libéria": "🇱🇷",
  "Serra Leoa": "🇸🇱", "Guiné-Bissau": "🇬🇼", "Cabo Verde": "🇨🇻", "Níger": "🇳🇪",
  "Togo": "🇹🇬", "Zanzibar": "🇹🇿", "Reunião": "🇷🇪",
  "Arábia Saudita": "🇸🇦", "Japão": "🇯🇵", "Coreia do Sul": "🇰🇷", "Emirados Árabes": "🇦🇪",
  "Catar": "🇶🇦", "China": "🇨🇳", "Irã": "🇮🇷", "Austrália": "🇦🇺", "Uzbequistão": "🇺🇿",
  "Tailândia": "🇹🇭", "Iraque": "🇮🇶", "Índia": "🇮🇳", "Malásia": "🇲🇾", "Vietnã": "🇻🇳",
  "Indonésia": "🇮🇩", "Jordânia": "🇯🇴", "Síria": "🇸🇾", "Hong Kong": "🇭🇰", "Omã": "🇴🇲",
  "Kuwait": "🇰🇼", "Bahrein": "🇧🇭", "Singapura": "🇸🇬", "Líbano": "🇱🇧", "Tadjiquistão": "🇹🇯",
  "Turcomenistão": "🇹🇲", "Quirguistão": "🇰🇬", "Coreia do Norte": "🇰🇵", "Filipinas": "🇵🇭",
  "Bangladesh": "🇧🇩", "Mianmar": "🇲🇲", "Palestina": "🇵🇸", "Camboja": "🇰🇭", "Taiwan": "🇹🇼",
  "Maldivas": "🇲🇻", "Mongólia": "🇲🇳", "Laos": "🇱🇦", "Macau": "🇲🇴", "Afeganistão": "🇦🇫",
  "Butão": "🇧🇹", "Nepal": "🇳🇵", "Brunei": "🇧🇳", "Paquistão": "🇵🇰", "Sri Lanka": "🇱🇰",
  "Timor-Leste": "🇹🇱", "Iêmen": "🇾🇪", "Guam": "🇬🇺", "Ilhas Marianas do Norte": "🇲🇵",
  "Nova Zelândia": "🇳🇿", "Nova Caledônia": "🇳🇨", "Taiti": "🇵🇫", "Fiji": "🇫🇯",
  "Ilhas Salomão": "🇸🇧", "Vanuatu": "🇻🇺", "Papua-Nova Guiné": "🇵🇬", "Samoa": "🇼🇸",
  "Tonga": "🇹🇴", "Ilhas Cook": "🇨🇰", "Samoa Americana": "🇦🇸",
};

export default function RankingPage() {
  const totalEntries = CONFED_ORDER.reduce((s, c) => s + ALL_ENTRIES[c].length, 0);
  const allSorted = CONFED_ORDER.flatMap((c) => ALL_ENTRIES[c]).sort((a, b) => b.rating - a.rating);
  const topLeague = allSorted[0];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Power Ranking
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Power Ranking de Ligas</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Ranking de força de todas as ligas nacionais do futebol mundial. Ratings baseados em
        desempenho histórico, competitividade, talento e exposição internacional.
      </p>

      <div className="flex items-center gap-2 mb-8 flex-wrap">
        {CONFED_ORDER.map((code) => (
          <Link
            key={code}
            href={CONFED_INFO[code].href}
            className="text-xs px-3 py-1.5 rounded-lg glass hover:gold-border transition-all text-muted hover:text-gold"
          >
            {code}
          </Link>
        ))}
      </div>

      {topLeague && (
        <div className="glass rounded-2xl p-6 mb-10 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Liga #1 do Mundo</div>
            <div className="text-2xl font-black gold-text mt-1">{topLeague.league}</div>
            <div className="text-sm text-muted mt-1">
              {topLeague.country} · {topLeague.rating} rating
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black gold-text">{topLeague.rating}</div>
            <div className="text-xs text-muted mt-1">{totalEntries} ligas rankeadas</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-10">
        {CONFED_ORDER.map((code) => {
          const info = CONFED_INFO[code];
          const data = ALL_ENTRIES[code];
          const avg = Math.round(data.reduce((s, e) => s + e.rating, 0) / data.length);
          return (
            <Link
              key={code}
              href={info.href}
              className="glass rounded-xl p-4 text-center hover:gold-border transition-all group"
            >
              <div className="text-2xl font-bold" style={{ color: info.color }}>{data.length}</div>
              <div className="text-xs text-muted uppercase mt-1 group-hover:text-gold transition-colors">{code}</div>
              <div className="text-[10px] text-muted/60 mt-1">média {avg}</div>
            </Link>
          );
        })}
      </div>

      {CONFED_ORDER.map((code) => {
        const info = CONFED_INFO[code];
        const data = ALL_ENTRIES[code];

        return (
          <section key={code} className="mb-12">
            <div className="flex items-end gap-3 mb-4">
              <div className="w-1 h-8 rounded-full" style={{ background: info.color }} />
              <h2 className="text-xl font-bold">
                <Link href={info.href} className="hover:underline" style={{ color: info.color }}>{code}</Link>
                <span className="text-muted text-sm ml-2 font-normal">
                  {data.length} ligas rankeadas — média {Math.round(data.reduce((s, e) => s + e.rating, 0) / data.length)}
                </span>
              </h2>
            </div>

            <div className="glass rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="border-b border-border">
                    <tr className="text-left text-muted text-xs uppercase tracking-wider">
                      <th className="p-3 text-center w-12">#</th>
                      <th className="p-3 text-center w-10">Bandeira</th>
                      <th className="p-3">Liga</th>
                      <th className="p-3">País</th>
                      <th className="p-3 text-center w-28">Rating</th>
                      <th className="p-3 text-center w-40">Barra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.map((e, idx) => (
                      <tr key={`${code}-${e.league}-${idx}`} className="border-b border-border last:border-0 hover:bg-white/5 transition-colors">
                        <td className="p-3 text-center text-muted font-mono text-xs">{e.rank}</td>
                        <td className="p-3 text-center text-lg">{COUNTRY_FLAGS[e.country] || "🏳️"}</td>
                        <td className="p-3 font-medium">{e.league}</td>
                        <td className="p-3 text-muted-foreground/60">{e.country}</td>
                        <td className="p-3 text-center">
                          <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ratingTier(e.rating)}`}>{e.rating}</span>
                        </td>
                        <td className="p-3">
                          <div className="h-1.5 bg-blue-deep rounded-full overflow-hidden">
                            <div className="h-full rounded-full transition-all" style={{ width: `${(e.rating / 1000) * 100}%`, background: `linear-gradient(90deg, ${info.color}, ${info.color}88)` }} />
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        );
      })}
    </div>
  );
}