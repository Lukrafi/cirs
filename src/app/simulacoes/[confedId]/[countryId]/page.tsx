import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getPermissions } from "@/lib/permissions";
import SimularButtons from "./SimularButtons";

export const dynamic = "force-dynamic";

export default async function CountryPage({
  params,
}: {
  params: Promise<{ confedId: string; countryId: string }>;
}) {
  const { confedId, countryId } = await params;
  const permissions = await getPermissions();

  const country = await prisma.country.findUnique({
    where: { id: countryId },
    include: {
      confederation: true,
      leagues: true,
      divisions: true,
      clubs: { orderBy: { name: "asc" } },
    },
  });

  if (!country || country.confederationId !== confedId) notFound();

  const competitions = await prisma.competition.findMany({
    where: {
      season: { league: { countryId: countryId } },
    },
    include: {
      season: { include: { league: true } },
      groups: { include: { matches: { where: { isSimulated: true } } } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href={`/simulacoes/${confedId}`} className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para {country.confederation?.name || "Confederação"}
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4">
          {country.flag ? (
            <img src={country.flag} alt={country.name} className="w-16 h-12 rounded-lg object-contain" />
          ) : (
            <div className="w-16 h-12 rounded-lg bg-blue-deep flex items-center justify-center">
              <span className="text-lg font-bold text-gold">{country.code}</span>
            </div>
          )}
          <div className="flex-1">
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">{country.confederation?.name}</div>
            <h1 className="text-4xl font-black">{country.name}</h1>
            <p className="text-muted mt-1">
              {country.leagues.length} ligas · {country.divisions.length} divisões · {country.clubs.length} clubes
            </p>
          </div>
          {/* Botões de simulação visíveis apenas para admin */}
          {(permissions.canSimulateCountry || permissions.canSimulateConfederation) && (
            <SimularButtons
              countryId={country.id}
              confederationId={confedId}
              canSimulateCountry={permissions.canSimulateCountry}
              canSimulateConfederation={permissions.canSimulateConfederation}
            />
          )}
        </div>
      </header>

      {country.divisions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold gold-text mb-4">Divisões</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {country.divisions.map((div) => (
              <div key={div.id} className="glass rounded-xl p-5">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="text-sm font-bold">{div.name}</h3>
                  <span className="text-xs px-2 py-0.5 rounded-full bg-gold/10 text-gold">Nível {div.level}</span>
                </div>
                <p className="text-xs text-muted">
                  Clubes: {country.clubs.filter((c) => c.divisionId === div.id).length}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}

      {country.leagues.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold gold-text mb-4">Ligas e Copas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {country.leagues.map((league) => (
              <Link key={league.id} href={`/ligas/${league.id}`} className="glass rounded-xl p-5 hover:gold-border transition-all duration-300 group">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-lg">🏆</div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate group-hover:text-gold transition-colors">{league.name}</h3>
                    <p className="text-xs text-muted mt-0.5">
                      {league.isInternational ? "Internacional" : "Nacional"}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {competitions.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold gold-text mb-4">Competições Simuladas</h2>
          <div className="space-y-3">
            {competitions.map((comp) => (
              <Link key={comp.id} href={`/campeonatos/${comp.id}`} className="glass rounded-xl p-4 hover:bg-card/60 transition-colors flex items-center gap-4 group">
                <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-lg">🏆</div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold group-hover:text-gold transition-colors">{comp.name}</h3>
                  <p className="text-xs text-muted">{comp.type}</p>
                </div>
                <span className="text-[10px] px-2 py-1 rounded-full bg-gold/10 text-gold font-semibold">Simulado</span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {country.clubs.length > 0 && (
        <section>
          <h2 className="text-xl font-bold gold-text mb-4">Clubes</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {country.clubs.map((club) => (
              <Link key={club.id} href={`/times/${club.id}`} className="glass rounded-xl p-3 text-center hover:gold-border transition-all duration-300 group">
                {club.emblem ? (
                  <img src={club.emblem} alt={club.name} className="w-10 h-10 mx-auto rounded-lg object-contain mb-2" />
                ) : (
                  <div className="w-10 h-10 mx-auto rounded-full bg-blue-deep flex items-center justify-center mb-2">
                    <span className="text-xs font-bold text-gold">{club.name.charAt(0)}</span>
                  </div>
                )}
                <div className="text-xs font-medium truncate group-hover:text-gold transition-colors">{club.name}</div>
                <div className="text-[10px] text-gold mt-0.5">⭐ {club.strength.toFixed(1)}</div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}