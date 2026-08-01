import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TemporadasPage() {
  const seasons = await prisma.season.findMany({
    include: {
      league: true,
      competitions: { include: { groups: { include: { matches: true } } } },
    },
    orderBy: { year: "desc" },
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Temporadas</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Gerencie e acompanhe as ligas jogadas ativamente pela comunidade no Haxball.
        Aqui ficam os formatos, calendários e resultados das partidas reais.
      </p>

      {seasons.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhuma temporada cadastrada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {seasons.map((season) => {
            const totalMatches = season.competitions.reduce(
              (sum, c) => sum + c.groups.reduce((s, g) => s + g.matches.length, 0),
              0
            );
            const finishedMatches = season.competitions.reduce(
              (sum, c) =>
                sum +
                c.groups.reduce(
                  (s, g) => s + g.matches.filter((m) => m.status === "finished").length,
                  0
                ),
              0
            );
            return (
              <Link
                key={season.id}
                href={`/temporadas/${season.id}`}
                className="glass rounded-2xl p-6 hover:gold-border transition-all duration-300 group"
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-2xl font-bold group-hover:text-gold transition-colors">
                    {season.year}
                  </h3>
                  <span className="text-sm text-muted">{season.league?.name || "—"}</span>
                </div>
                <div className="text-sm text-muted space-y-1">
                  <p>{season.competitions.length} competi&ccedil;&otilde;es</p>
                  <p>
                    {finishedMatches}/{totalMatches} partidas disputadas
                  </p>
                  {totalMatches > 0 && (
                    <div className="w-full bg-blue-deep rounded-full h-1.5 mt-2">
                      <div
                        className="bg-gold h-1.5 rounded-full transition-all"
                        style={{ width: `${(finishedMatches / totalMatches) * 100}%` }}
                      />
                    </div>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}