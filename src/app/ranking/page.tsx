import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Power Ranking de Ligas — CIRS",
  description: "Ranking de força das ligas nacionais do futebol mundial por confederação.",
};

const CONFED_INFO: Record<string, { color: string }> = {
  CONMEBOL: { color: "#fbbf24" },
  UEFA: { color: "#3b82f6" },
  CAF: { color: "#22c55e" },
  AFC: { color: "#ef4444" },
  CONCACAF: { color: "#a855f7" },
  OFC: { color: "#06b6d4" },
};

const CONFED_ORDER = ["CONMEBOL", "UEFA", "CAF", "AFC", "CONCACAF", "OFC"];

function ratingTier(rating: number): string {
  if (rating >= 900) return "bg-yellow-500/10 text-yellow-300";
  if (rating >= 800) return "bg-gold/10 text-gold";
  if (rating >= 700) return "bg-blue-500/10 text-blue-400";
  if (rating >= 500) return "bg-foreground/5 text-foreground";
  return "bg-muted/10 text-muted";
}

export default async function RankingPage() {
  const leagues = await prisma.league.findMany({
    where: { isInternational: false },
    include: {
      country: { select: { name: true, flag: true } },
      confederation: { select: { code: true, name: true } },
    },
    orderBy: { rating: "desc" },
  });

  const group = new Map<string, typeof leagues>();
  for (const l of leagues) {
    const code = l.confederation?.code || "OTHER";
    if (!group.has(code)) group.set(code, []);
    group.get(code)!.push(l);
  }

  const sortedKeys = [...group.keys()].sort(
    (a, b) => CONFED_ORDER.indexOf(a) - CONFED_ORDER.indexOf(b)
  );

  const totalWithRating = leagues.filter((l) => l.rating > 0).length;
  const topLeague = leagues.find((l) => l.rating > 0);

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

      {topLeague && (
        <div className="glass rounded-2xl p-6 mb-10 flex items-center justify-between">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted">Liga #1 do Mundo</div>
            <div className="text-2xl font-black gold-text mt-1">{topLeague.name}</div>
            <div className="text-sm text-muted mt-1">
              {topLeague.country?.name} · {topLeague.confederation?.name}
            </div>
          </div>
          <div className="text-right">
            <div className="text-5xl font-black gold-text">{topLeague.rating}</div>
            <div className="text-xs text-muted mt-1">{totalWithRating} ligas rankeadas</div>
          </div>
        </div>
      )}

      {sortedKeys.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhuma liga cadastrada ainda.</p>
        </div>
      ) : (
        sortedKeys.map((code) => {
          const confLeagues = group.get(code)!;
          const info = CONFED_INFO[code] || { color: "#d4af37" };
          const filtered = confLeagues.filter((l) => (l.rating || 0) > 0);
          const avgRating = filtered.length > 0
            ? Math.round(filtered.reduce((s, l) => s + (l.rating || 0), 0) / filtered.length)
            : 0;

          return (
            <section key={code} className="mb-12">
              <div className="flex items-end gap-3 mb-4">
                <div className="w-1 h-8 rounded-full" style={{ background: info.color }} />
                <h2 className="text-xl font-bold">
                  <span style={{ color: info.color }}>{confLeagues[0]?.confederation?.code || code}</span>
                  <span className="text-muted text-sm ml-2 font-normal">
                    {filtered.length > 0
                      ? `${filtered.length} ligas rankeadas — média ${avgRating}`
                      : "Ratings ainda não publicados"}
                  </span>
                </h2>
              </div>

              {filtered.length === 0 ? (
                <div className="glass rounded-2xl p-8 text-center">
                  <p className="text-muted text-sm">
                    Esta confederação ainda não tem um power ranking publicado.
                  </p>
                </div>
              ) : (
                <div className="glass rounded-2xl overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="border-b border-border">
                        <tr className="text-left text-muted text-xs uppercase tracking-wider">
                          <th className="p-3 text-center w-12">#</th>
                          <th className="p-3 text-center w-10" />
                          <th className="p-3">Liga</th>
                          <th className="p-3">País</th>
                          <th className="p-3 text-center w-28">Rating</th>
                          <th className="p-3 text-center w-40">Barra</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filtered.map((l, idx) => (
                          <tr key={l.id} className="border-b border-border last:border-0 hover:bg-white/5 transition-colors">
                            <td className="p-3 text-center text-muted font-mono text-xs">
                              {idx + 1}
                            </td>
                            <td className="p-3 text-center">
                              {l.country?.flag ? (
                                <img src={l.country.flag} alt="" className="w-5 h-3.5 rounded object-cover inline-block" />
                              ) : null}
                            </td>
                            <td className="p-3 font-medium">{l.name}</td>
                            <td className="p-3 text-muted-foreground/60">{l.country?.name || "—"}</td>
                            <td className="p-3 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${ratingTier(l.rating || 0)}`}>
                                {l.rating}
                              </span>
                            </td>
                            <td className="p-3">
                              <div className="h-1.5 bg-blue-deep rounded-full overflow-hidden">
                                <div
                                  className="h-full rounded-full transition-all"
                                  style={{
                                    width: `${((l.rating || 0) / 1000) * 100}%`,
                                    background: `linear-gradient(90deg, ${info.color}, ${info.color}88)`,
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
              )}
            </section>
          );
        })
      )}
    </div>
  );
}