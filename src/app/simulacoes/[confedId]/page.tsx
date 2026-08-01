import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const CONF_NAMES: Record<string, string> = {
  CONMEBOL: "Confederação Sul-Americana de Futebol",
  UEFA: "União das Associações Europeias de Futebol",
  CAF: "Confederação Africana de Futebol",
  AFC: "Confederação Asiática de Futebol",
  CONCACAF: "Confederação da América do Norte, Central e Caribe",
  OFC: "Confederação de Futebol da Oceania",
};

const CONF_COLORS: Record<string, string> = {
  CONMEBOL: "#fbbf24",
  UEFA: "#3b82f6",
  CAF: "#22c55e",
  AFC: "#ef4444",
  CONCACAF: "#a855f7",
  OFC: "#06b6d4",
};

export default async function ConfederationPage({
  params,
}: {
  params: Promise<{ confedId: string }>;
}) {
  const { confedId } = await params;

  const confed = await prisma.confederation.findUnique({
    where: { id: confedId },
    include: {
      countries: {
        include: { leagues: true, divisions: true, clubs: { select: { id: true } } },
        orderBy: { name: "asc" },
      },
      leagues: {
        where: { isInternational: true },
        orderBy: { name: "asc" },
      },
    },
  });

  if (!confed) notFound();

  const color = CONF_COLORS[confed.code] || "#d4af37";

  const continentalCompetitions = await prisma.competition.findMany({
    where: {
      type: "continental",
    },
    include: {
      season: { include: { league: true } },
      groups: { include: { matches: { where: { isSimulated: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  const confedCompNames: Record<string, string[]> = {
    UEFA: ["UEFA Champions League", "UEFA Europa League", "UEFA Conference League", "UEFA Super Cup"],
    CONMEBOL: ["Copa Libertadores", "Copa Sul-Americana", "Recopa Sul-Americana"],
    CONCACAF: ["CONCACAF Champions Cup", "CONCACAF Central American Cup", "CONCACAF Caribbean Cup"],
    AFC: ["AFC Champions League Elite", "AFC Champions League Two", "AFC Challenge League"],
    CAF: ["CAF Champions League", "CAF Confederation Cup", "CAF Super Cup"],
    OFC: ["OFC Champions League"],
  };

  const expectedNames = confedCompNames[confed.code] || [];
  const confedComps = continentalCompetitions.filter((c) =>
    expectedNames.some((n) => c.name.startsWith(n))
  );

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/simulacoes" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para Simulações
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4">
          {confed.logo ? (
            <img src={confed.logo} alt={confed.name} className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div
              className="w-20 h-20 rounded-xl flex items-center justify-center text-2xl font-black"
              style={{ background: `${color}22`, color: color }}
            >
              {confed.code.slice(0, 3)}
            </div>
          )}
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">Confederação</div>
            <h1 className="text-4xl font-black">{confed.name}</h1>
            <p className="text-muted mt-1">{CONF_NAMES[confed.code] || confed.name}</p>
          </div>
          <span
            className="ml-auto text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: `${color}15`, color: color }}
          >
            {confed.countries.length} países filiados
          </span>
        </div>
      </header>

      {/* Competições Continentais */}
      <section className="mb-10">
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Competições Continentais
        </h2>
        {confedComps.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted text-sm">Nenhuma competição continental cadastrada ainda.</p>
            <p className="text-muted text-xs mt-2">Execute o seed-world para popular as competições.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {confedComps.map((comp) => {
              const simMatches = comp.groups.reduce((acc, g) => acc + g.matches.length, 0);
              return (
                <Link
                  key={comp.id}
                  href={`/campeonatos/${comp.id}`}
                  className="glass rounded-xl p-5 hover:gold-border transition-all duration-300 group"
                >
                  <div className="flex items-center gap-3">
                    {comp.logo ? (
                      <img src={comp.logo} alt={comp.name} className="w-12 h-12 rounded-lg object-cover" />
                    ) : (
                      <div
                        className="w-12 h-12 rounded-lg flex items-center justify-center text-xl"
                        style={{ background: `${color}15`, color: color }}
                      >
                        🏆
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold truncate group-hover:text-gold transition-colors">
                        {comp.name}
                      </h3>
                      <p className="text-xs text-muted mt-0.5">
                        {comp.format === "knockout" ? "Mata-mata" : "Grupos"} • {comp.numTeams} times
                      </p>
                      {simMatches > 0 && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold font-semibold mt-1 inline-block">
                          Simulado
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Botão Ver Países Filiados */}
      <section>
        <details>
          <summary className="cursor-pointer list-none">
            <div className="flex items-center justify-center gap-2 px-6 py-3 glass rounded-xl hover:gold-border transition-all duration-300 group">
              <span className="text-sm font-semibold text-gold group-hover:gold-text transition-colors">
                Ver Países Filiados
              </span>
              <svg className="w-4 h-4 text-gold transition-transform group-open:rotate-180" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
              <span className="text-xs text-muted ml-2">({confed.countries.length} países)</span>
            </div>
          </summary>

          {confed.countries.length === 0 ? (
            <div className="glass rounded-2xl p-12 text-center mt-4">
              <p className="text-muted text-lg">Nenhum país cadastrado nesta confederação.</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 mt-4">
              {confed.countries.map((country) => (
                <Link
                  key={country.id}
                  href={`/simulacoes/${confedId}/${country.id}`}
                  className="glass rounded-xl p-4 hover:gold-border transition-all duration-300 group text-center"
                >
                  {country.flag ? (
                    <img src={country.flag} alt={country.name} className="w-12 h-8 mx-auto rounded object-cover mb-2" />
                  ) : (
                    <div className="w-12 h-8 mx-auto rounded bg-blue-deep flex items-center justify-center mb-2">
                      <span className="text-[10px] font-bold text-gold">{country.code}</span>
                    </div>
                  )}
                  <div className="text-sm font-medium truncate group-hover:text-gold transition-colors">{country.name}</div>
                  <div className="text-[10px] text-muted mt-1">{country.leagues.length} ligas · {country.clubs.length} clubes</div>
                </Link>
              ))}
            </div>
          )}
        </details>
      </section>
    </div>
  );
}
