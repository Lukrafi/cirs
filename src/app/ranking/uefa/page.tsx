import Link from "next/link";
import rankingData from "@/lib/uefa-power-ranking.json";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Power Ranking UEFA — CIRS",
  description: "Ranking de força das ligas nacionais da UEFA — Europa.",
};

const UEFA_COLOR = "#3b82f6";

const COUNTRY_FLAGS: Record<string, string> = {
  "Inglaterra": "🏴󠁧󠁢󠁥󠁮󠁧󠁿",
  "Espanha": "🇪🇸",
  "Itália": "🇮🇹",
  "Alemanha": "🇩🇪",
  "França": "🇫🇷",
  "Portugal": "🇵🇹",
  "Países Baixos": "🇳🇱",
  "Turquia": "🇹🇷",
  "Bélgica": "🇧🇪",
  "Escócia": "🏴󠁧󠁢󠁳󠁣󠁴󠁿",
  "Áustria": "🇦🇹",
  "Rússia": "🇷🇺",
  "Ucrânia": "🇺🇦",
  "Grécia": "🇬🇷",
  "Dinamarca": "🇩🇰",
  "Polônia": "🇵🇱",
  "Croácia": "🇭🇷",
  "República Tcheca": "🇨🇿",
  "Suíça": "🇨🇭",
  "Noruega": "🇳🇴",
  "Suécia": "🇸🇪",
  "Hungria": "🇭🇺",
  "Romênia": "🇷🇴",
  "Israel": "🇮🇱",
  "Chipre": "🇨🇾",
  "Sérvia": "🇷🇸",
  "Bulgária": "🇧🇬",
  "Azerbaijão": "🇦🇿",
  "Eslováquia": "🇸🇰",
  "Eslovênia": "🇸🇮",
  "Cazaquistão": "🇰🇿",
  "Moldávia": "🇲🇩",
  "Islândia": "🇮🇸",
  "Irlanda": "🇮🇪",
  "Letônia": "🇱🇻",
  "Lituânia": "🇱🇹",
  "Albânia": "🇦🇱",
  "Bósnia e Herzegovina": "🇧🇦",
  "Macedônia do Norte": "🇲🇰",
  "Estônia": "🇪🇪",
  "Armênia": "🇦🇲",
  "Malta": "🇲🇹",
  "País de Gales": "🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  "Ilhas Faroe": "🇫🇴",
  "Irlanda do Norte": "🏴󠁧󠁢󠁮󠁩󠁲󠁬󠁿",
  "Geórgia": "🇬🇪",
  "Bielorrússia": "🇧🇾",
  "Montenegro": "🇲🇪",
  "Kosovo": "🇽🇰",
  "San Marino": "🇸🇲",
  "Gibraltar": "🇬🇮",
  "Andorra": "🇦🇩",
};

function ratingTier(rating: number): string {
  if (rating >= 900) return "bg-blue-500/10 text-blue-300";
  if (rating >= 750) return "bg-blue-500/10 text-blue-400";
  if (rating >= 600) return "bg-indigo-500/10 text-indigo-400";
  if (rating >= 400) return "bg-foreground/5 text-foreground";
  return "bg-muted/10 text-muted";
}

type RankingEntry = {
  rank: number;
  league: string;
  country: string;
  division: number;
  rating: number;
};

const entries = rankingData as RankingEntry[];

const topLeague = entries[0];
const avgRating = Math.round(entries.reduce((s, e) => s + e.rating, 0) / entries.length);
const firstDiv = entries.filter((e) => e.division === 1);
const secondDiv = entries.filter((e) => e.division === 2);

export default function UefaPowerRankingPage() {
  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Power Ranking
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Power Ranking da UEFA</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Ranking de força das ligas nacionais da Europa. Ratings de 0 a 1000 baseados em
        desempenho histórico, competitividade, talento e exposição internacional.
      </p>

      <div className="flex items-center gap-2 mb-8 flex-wrap">
        <Link
          href="/ranking"
          className="text-xs px-3 py-1.5 rounded-lg glass hover:gold-border transition-all text-muted hover:text-gold"
        >
          ← Ranking Global
        </Link>
        <span className="text-xs px-3 py-1.5 rounded-lg" style={{ background: `${UEFA_COLOR}22`, color: UEFA_COLOR }}>
          UEFA
        </span>
        <Link href="/ranking/caf" className="text-xs px-3 py-1.5 rounded-lg glass hover:gold-border transition-all text-muted hover:text-gold">CAF</Link>
        <Link href="/ranking/ofc" className="text-xs px-3 py-1.5 rounded-lg glass hover:gold-border transition-all text-muted hover:text-gold">OFC</Link>
      </div>

      {topLeague && (
        <div className="glass rounded-2xl p-6 mb-10 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Liga #1 da UEFA</div>
            <div className="text-2xl font-black gold-text mt-1">{topLeague.league}</div>
            <div className="text-sm text-muted mt-1">
              {topLeague.country} · 1ª Divisão
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black gold-text">{topLeague.rating}</div>
            <div className="text-xs text-muted mt-1">{entries.length} ligas rankeadas</div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold gold-text">{entries.length}</div>
          <div className="text-xs text-muted uppercase mt-1">Ligas Rankeadas</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold gold-text">{firstDiv.length}</div>
          <div className="text-xs text-muted uppercase mt-1">1ª Divisão</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold gold-text">{secondDiv.length}</div>
          <div className="text-xs text-muted uppercase mt-1">2ª Divisão</div>
        </div>
        <div className="glass rounded-xl p-4 text-center">
          <div className="text-2xl font-bold gold-text">{avgRating}</div>
          <div className="text-xs text-muted uppercase mt-1">Rating Médio</div>
        </div>
      </div>

      <RanksView entries={firstDiv} title="1ª Divisão" color={UEFA_COLOR} />
      <RanksView entries={secondDiv} title="2ª Divisão" color={UEFA_COLOR} />
    </div>
  );
}

function RanksView({ entries, title, color }: { entries: RankingEntry[]; title: string; color: string }) {
  return (
    <section className="mb-12">
      <div className="flex items-end gap-3 mb-4">
        <div className="w-1 h-8 rounded-full" style={{ background: color }} />
        <h2 className="text-xl font-bold">
          <span style={{ color }}>{title}</span>
          <span className="text-muted text-sm ml-2 font-normal">
            {entries.length} ligas
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
              {entries.map((e, idx) => (
                <tr key={`${e.league}-${e.country}-${idx}`} className="border-b border-border last:border-0 hover:bg-white/5 transition-colors">
                  <td className="p-3 text-center text-muted font-mono text-xs">
                    {e.rank}
                  </td>
                  <td className="p-3 text-center text-lg">
                    {COUNTRY_FLAGS[e.country] || "🏳️"}
                  </td>
                  <td className="p-3 font-medium">{e.league}</td>
                  <td className="p-3 text-muted-foreground/60">{e.country}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ratingTier(e.rating)}`}>
                      {e.rating}
                    </span>
                  </td>
                  <td className="p-3">
                    <div className="h-1.5 bg-blue-deep rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${(e.rating / 1000) * 100}%`,
                          background: `linear-gradient(90deg, ${color}, ${color}88)`,
                        }}
                      />
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
}