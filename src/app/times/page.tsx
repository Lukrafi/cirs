import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

const CONFEDERATION_ORDER = ["CONMEBOL", "UEFA", "CAF", "AFC", "CONCACAF", "OFC"];

const CONFEDERATION_INFO: Record<string, { fullName: string; color: string }> = {
  CONMEBOL: { fullName: "Confederação Sul-Americana", color: "#fbbf24" },
  UEFA: { fullName: "União das Associações Europeias", color: "#3b82f6" },
  CAF: { fullName: "Confederação Africana", color: "#22c55e" },
  AFC: { fullName: "Confederação Asiática", color: "#ef4444" },
  CONCACAF: { fullName: "Confederação da América do Norte, Central e Caribe", color: "#a855f7" },
  OFC: { fullName: "Confederação da Oceania", color: "#06b6d4" },
};

export default async function TimesPage() {
  const confederations = await prisma.confederation.findMany({
    include: {
      countries: {
        include: {
          clubs: { select: { id: true, name: true, emblem: true, strength: true, divisionId: true } },
          divisions: true,
        },
        orderBy: { name: "asc" },
      },
    },
  });

  const sortedConfeds = [...confederations].sort((a, b) => {
    const ia = CONFEDERATION_ORDER.indexOf(a.code);
    const ib = CONFEDERATION_ORDER.indexOf(b.code);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Times</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Navegue por confederação → país → times. Veja divisões atuais, elenco e histórico
        de cada clube no servidor.
      </p>

      {sortedConfeds.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">
            Nenhuma confederação cadastrada ainda.
          </p>
          <p className="text-muted text-sm mt-2">
            Os times aparecerão aqui assim que as confederações e países forem configurados.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedConfeds.map((conf) => {
            const info = CONFEDERATION_INFO[conf.code] || {
              fullName: conf.fullName,
              color: "#d4af37",
            };
            const countriesWithClubs = conf.countries.filter(
              (c) => c.clubs.length > 0
            );
            const allClubs = conf.countries.flatMap((c) => c.clubs);

            return (
              <section key={conf.id} className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  {conf.logo ? (
                    <img
                      src={conf.logo}
                      alt={conf.name}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                  ) : (
                    <div
                      className="w-12 h-12 rounded-lg flex items-center justify-center text-sm font-black"
                      style={{ background: `${info.color}22`, color: info.color }}
                    >
                      {conf.code?.slice(0, 3) || conf.name.slice(0, 3)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-xl font-bold">{conf.name}</h2>
                    <p className="text-xs text-muted">{info.fullName}</p>
                  </div>
                  <span className="ml-auto text-xs px-3 py-1 rounded-full font-semibold"
                    style={{ background: `${info.color}15`, color: info.color }}>
                    {allClubs.length} clubes
                  </span>
                </div>

                {countriesWithClubs.length === 0 ? (
                  <p className="text-muted text-sm py-4">
                    Nenhum clube cadastrado nesta confederação.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {countriesWithClubs.map((country) => (
                      <div key={country.id}>
                        <div className="flex items-center gap-3 mb-3">
                          {country.flag ? (
                            <img
                              src={country.flag}
                              alt={country.name}
                              className="w-8 h-6 rounded object-cover"
                            />
                          ) : (
                            <div className="w-8 h-6 rounded bg-blue-deep flex items-center justify-center">
                              <span className="text-[9px] font-bold text-gold">{country.code}</span>
                            </div>
                          )}
                          <h3 className="text-sm font-bold uppercase tracking-wider text-muted">
                            {country.name}
                          </h3>
                          <span className="text-xs text-muted">
                            {country.clubs.length} clubes
                          </span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                          {country.clubs.map((club) => (
                            <Link
                              key={club.id}
                              href={`/times/${club.id}`}
                              className="glass rounded-xl p-3 text-center hover:gold-border transition-all duration-300 group"
                            >
                              {club.emblem ? (
                                <img
                                  src={club.emblem}
                                  alt={club.name}
                                  className="w-10 h-10 mx-auto rounded-lg object-cover mb-2"
                                />
                              ) : (
                                <div className="w-10 h-10 mx-auto rounded-full bg-blue-deep flex items-center justify-center mb-2">
                                  <span className="text-xs font-bold text-gold">
                                    {club.name.charAt(0)}
                                  </span>
                                </div>
                              )}
                              <div className="text-xs font-medium truncate group-hover:text-gold transition-colors">
                                {club.name}
                              </div>
                              <div className="text-[10px] text-gold mt-0.5">
                                ⭐ {club.strength.toFixed(1)}
                              </div>
                            </Link>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}
    </div>
  );
}
