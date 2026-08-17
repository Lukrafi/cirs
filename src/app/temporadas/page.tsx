import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TemporadasPage() {
  const currentYear = new Date().getFullYear();

  const confederations = await prisma.confederation.findMany({
    include: {
      countries: {
        include: {
          leagues: {
            include: {
              seasons: {
                where: { year: currentYear },
                include: {
                  competitions: {
                    include: {
                      groups: {
                        include: {
                          matches: { select: { id: true, status: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { name: "asc" },
  });

  const stats = confederations.map((conf) => {
    let totalLeagues = 0;
    let totalComps = 0;
    let totalMatches = 0;
    let simulatedMatches = 0;

    for (const country of conf.countries) {
      for (const league of country.leagues) {
        for (const season of league.seasons) {
          totalLeagues++;
          for (const comp of season.competitions) {
            totalComps++;
            for (const group of comp.groups) {
              for (const match of group.matches) {
                totalMatches++;
                if (match.status === "finished") simulatedMatches++;
              }
            }
          }
        }
      }
    }

    return {
      id: conf.id,
      name: conf.name,
      code: conf.code,
      logo: conf.logo,
      countries: conf.countries.length,
      totalLeagues,
      totalComps,
      totalMatches,
      simulatedMatches,
    };
  });

  const totalLeagues = stats.reduce((s, c) => s + c.totalLeagues, 0);
  const totalComps = stats.reduce((s, c) => s + c.totalComps, 0);
  const totalMatches = stats.reduce((s, c) => s + c.totalMatches, 0);
  const simulatedMatches = stats.reduce((s, c) => s + c.simulatedMatches, 0);

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-8">
        <h1 className="text-4xl font-black mb-1">
          <span className="gold-text">Temporada {currentYear}</span>
        </h1>
        <p className="text-muted">Confederações e competições do mundo</p>
      </div>

      {/* Resumo */}
      <div className="glass rounded-2xl p-6 mb-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold gold-text">{totalLeagues}</div>
            <div className="text-xs text-muted uppercase">Ligas</div>
          </div>
          <div>
            <div className="text-2xl font-bold gold-text">{totalComps}</div>
            <div className="text-xs text-muted uppercase">Competições</div>
          </div>
          <div>
            <div className="text-2xl font-bold gold-text">{totalMatches}</div>
            <div className="text-xs text-muted uppercase">Partidas</div>
          </div>
          <div>
            <div className="text-2xl font-bold gold-text">{simulatedMatches}</div>
            <div className="text-xs text-muted uppercase">Simuladas</div>
          </div>
        </div>
      </div>

      {/* Confederações */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {stats.map((conf) => (
          <Link
            key={conf.id}
            href={`/temporadas/${conf.id}`}
            className="glass rounded-2xl p-6 hover:gold-border transition-all duration-300 group"
          >
            <div className="flex items-center gap-4 mb-4">
              {conf.logo ? (
                <img src={conf.logo} alt={conf.name} className="w-14 h-14 rounded-xl object-contain" />
              ) : (
                <div className="w-14 h-14 rounded-xl bg-gold/10 flex items-center justify-center text-xl font-bold text-gold">
                  {conf.code}
                </div>
              )}
              <div>
                <h2 className="text-lg font-bold group-hover:text-gold transition-colors">{conf.name}</h2>
                <p className="text-xs text-muted">{conf.countries} países</p>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className="bg-blue-deep/40 rounded-lg py-2">
                <div className="font-bold text-foreground">{conf.totalComps}</div>
                <div className="text-muted">Competições</div>
              </div>
              <div className="bg-blue-deep/40 rounded-lg py-2">
                <div className="font-bold text-foreground">{conf.totalMatches}</div>
                <div className="text-muted">Partidas</div>
              </div>
              <div className="bg-blue-deep/40 rounded-lg py-2">
                <div className="font-bold text-green-400">{conf.simulatedMatches}</div>
                <div className="text-muted">Simuladas</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
