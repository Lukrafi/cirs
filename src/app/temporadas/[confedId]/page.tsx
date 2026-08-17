import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import ConfederationActions from "./ConfederationActions";

export const dynamic = "force-dynamic";

export default async function ConfederationDetailPage({
  params,
}: {
  params: Promise<{ confedId: string }>;
}) {
  const { confedId } = await params;
  const currentYear = new Date().getFullYear();

  const confederation = await prisma.confederation.findUnique({
    where: { id: confedId },
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
                          matches: {
                            select: { id: true, status: true, isSimulated: true },
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
      },
    },
  });

  if (!confederation) notFound();

  // Monta dados por país
  const countriesData = confederation.countries.map((country) => {
    const leaguesData = country.leagues.map((league) => {
      const season = league.seasons[0];
      if (!season) return null;

      const comps = season.competitions.map((comp) => {
        const allMatches = comp.groups.flatMap((g) => g.matches);
        return {
          id: comp.id,
          name: comp.name,
          isSimulated: comp.isSimulated,
          total: allMatches.length,
          finished: allMatches.filter((m) => m.status === "finished").length,
          scheduled: allMatches.filter((m) => m.status === "scheduled").length,
        };
      });

      return {
        leagueId: league.id,
        leagueName: league.name,
        competitions: comps,
      };
    }).filter(Boolean);

    return {
      id: country.id,
      name: country.name,
      flag: country.flag,
      leagues: leaguesData,
    };
  }).filter((c) => c.leagues.length > 0);

  // Competições continentais
  const intlSeasons = await prisma.season.findMany({
    where: {
      year: currentYear,
      league: { confederationId: confedId, isInternational: true },
    },
    include: {
      league: true,
      competitions: {
        include: {
          groups: {
            include: {
              matches: { select: { id: true, status: true, isSimulated: true } },
            },
          },
        },
      },
    },
  });

  const intlComps = intlSeasons.flatMap((s) =>
    s.competitions.map((comp) => {
      const allMatches = comp.groups.flatMap((g) => g.matches);
      return {
        id: comp.id,
        name: comp.name,
        isSimulated: comp.isSimulated,
        total: allMatches.length,
        finished: allMatches.filter((m) => m.status === "finished").length,
        scheduled: allMatches.filter((m) => m.status === "scheduled").length,
      };
    })
  );

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/temporadas" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para Temporadas
      </Link>

      <header className="mt-6 flex items-center gap-4 mb-8">
        {confederation.logo ? (
          <img src={confederation.logo} alt={confederation.name} className="w-16 h-16 rounded-xl object-contain" />
        ) : (
          <div className="w-16 h-16 rounded-xl bg-gold/10 flex items-center justify-center text-2xl font-bold text-gold">
            {confederation.code}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-black gold-text">{confederation.name}</h1>
          <p className="text-muted text-sm">{confederation.countries.length} países • Temporada {currentYear}</p>
        </div>
      </header>

      {/* Botões de ação */}
      <ConfederationActions
        confederationId={confedId}
        confederationName={confederation.name}
        hasCountries={countriesData.length > 0}
        hasIntl={intlComps.length > 0}
      />

      {/* Competições Continentais */}
      {intlComps.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold gold-text mb-4">Competições Continentais</h2>
          <div className="space-y-2">
            {intlComps.map((comp) => (
              <Link
                key={comp.id}
                href={`/campeonatos/${comp.id}`}
                className="glass rounded-xl p-4 flex items-center justify-between hover:bg-card/60 transition-colors group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-lg">🏆</div>
                  <div>
                    <h3 className="text-sm font-bold group-hover:text-gold transition-colors">{comp.name}</h3>
                    <p className="text-xs text-muted">{comp.total} partidas</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-xs text-muted">{comp.finished}/{comp.total} jogadas</span>
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    comp.isSimulated ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                  }`}>
                    {comp.isSimulated ? "🤖 Simulável" : "🎮 Jogável"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Países */}
      {countriesData.map((country) => (
        <section key={country.id} className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            {country.flag ? (
              <img src={country.flag} alt="" className="w-8 h-6 rounded object-contain" />
            ) : (
              <div className="w-8 h-6 rounded bg-blue-deep flex items-center justify-center text-[10px] text-gold">🌍</div>
            )}
            <h2 className="text-xl font-bold">{country.name}</h2>
          </div>

          <div className="space-y-2">
            {country.leagues.map((league) => (
              <div key={league!.leagueId}>
                <Link
                  href={`/ligas/${league!.leagueId}`}
                  className="text-sm font-semibold text-gold hover:underline mb-2 block"
                >
                  {league!.leagueName}
                </Link>
                <div className="space-y-1 ml-4">
                  {league!.competitions.map((comp) => (
                    <Link
                      key={comp.id}
                      href={`/campeonatos/${comp.id}`}
                      className="glass rounded-lg p-3 flex items-center justify-between hover:bg-card/60 transition-colors group text-sm"
                    >
                      <span className="group-hover:text-gold transition-colors">{comp.name}</span>
                      <div className="flex items-center gap-3">
                        <span className="text-xs text-muted">{comp.finished}/{comp.total}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${
                          comp.isSimulated ? "bg-green-500/20 text-green-400" : "bg-blue-500/20 text-blue-400"
                        }`}>
                          {comp.isSimulated ? "🤖" : "🎮"}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
