import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { getPermissions } from "@/lib/permissions";
import SimularMundoButton from "./SimularMundoButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Simulações — CIRS",
  description:
    "Diretório global de confederações FIFA, países, ligas e competições simuladas externamente.",
};

const CONFEDERATION_ORDER = ["CONMEBOL", "UEFA", "CAF", "AFC", "CONCACAF", "OFC"];

const CONFEDERATION_INFO: Record<string, { fullName: string; color: string }> = {
  CONMEBOL: { fullName: "Confederação Sul-Americana de Futebol", color: "#fbbf24" },
  UEFA: { fullName: "União das Associações Europeias de Futebol", color: "#3b82f6" },
  CAF: { fullName: "Confederação Africana de Futebol", color: "#22c55e" },
  AFC: { fullName: "Confederação Asiática de Futebol", color: "#ef4444" },
  CONCACAF: { fullName: "Confederação da América do Norte, Central e Caribe", color: "#a855f7" },
  OFC: { fullName: "Confederação de Futebol da Oceania", color: "#06b6d4" },
};

export default async function SimulacoesPage() {
  const permissions = await getPermissions();

  const confederations = await prisma.confederation.findMany({
    include: {
      countries: {
        include: {
          leagues: true,
          divisions: true,
        },
        orderBy: { name: "asc" },
      },
      leagues: true,
    },
  });

  const sortedConfeds = [...confederations].sort((a, b) => {
    const ia = CONFEDERATION_ORDER.indexOf(a.code);
    const ib = CONFEDERATION_ORDER.indexOf(b.code);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const simulatedCompetitions = await prisma.competition.findMany({
    where: {
      groups: { some: { matches: { some: { isSimulated: true } } } },
    },
    include: {
      season: { include: { league: true } },
    },
  });

  const recentSimMatches = await prisma.match.findMany({
    where: { isSimulated: true },
    include: { homeTeam: true, awayTeam: true, group: { include: { competition: true } } },
    orderBy: { matchDate: "desc" },
    take: 15,
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Simulação de Bastidores
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Simulações</span>
      </h1>
      <p className="text-muted mb-6 max-w-3xl">
        Diretório global de todas as confederações FIFA e seus países. Aqui ficam as ligas,
        copas e divisões que não são jogadas ativamente no Haxball — tudo gerado por simulação
        externa para alimentar o ecossistema (vagas continentais, alternância de potências).
      </p>

      <div className="mb-10">
        {permissions.canSimulateWorld && <SimularMundoButton />}
      </div>

      {/* Diretório de Confederações */}
      {sortedConfeds.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhuma confederação cadastrada ainda.</p>
          <p className="text-muted text-sm mt-2">
            As confederações e países aparecerão aqui assim que forem configuradas pelo administrador.
          </p>
        </div>
      ) : (
        <div className="space-y-8">
          {sortedConfeds.map((conf) => {
            const info = CONFEDERATION_INFO[conf.code] || { fullName: conf.fullName, color: "#d4af37" };
            return (
              <section key={conf.id} className="glass rounded-2xl p-6">
                <div className="flex items-center gap-4 mb-6">
                  {conf.logo ? (
                    <img src={conf.logo} alt={conf.name} className="w-14 h-14 rounded-lg object-cover" />
                  ) : (
                    <div
                      className="w-14 h-14 rounded-lg flex items-center justify-center text-xl font-black"
                      style={{ background: `${info.color}22`, color: info.color }}
                    >
                      {conf.code.slice(0, 3)}
                    </div>
                  )}
                  <div>
                    <h2 className="text-2xl font-bold">
                      <Link href={`/simulacoes/${conf.id}`} className="hover:text-gold transition-colors">
                        {conf.name}
                      </Link>
                    </h2>
                    <p className="text-xs text-muted mt-0.5">{info.fullName}</p>
                  </div>
                  <span
                    className="ml-auto text-xs px-3 py-1 rounded-full font-semibold"
                    style={{ background: `${info.color}15`, color: info.color }}
                  >
                    {conf.countries.length} países
                  </span>
                </div>

                {conf.countries.length === 0 ? (
                  <p className="text-muted text-sm py-4">Nenhum país cadastrado nesta confederação.</p>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                    {conf.countries.map((country) => (
                      <Link
                        key={country.id}
                        href={`/simulacoes/${conf.id}/${country.id}`}
                        className="glass rounded-xl p-3 hover:gold-border transition-all duration-300 group text-center"
                      >
                        {country.flag ? (
                          <img
                            src={country.flag}
                            alt={country.name}
                            className="w-10 h-7 mx-auto rounded object-cover mb-2"
                          />
                        ) : (
                          <div className="w-10 h-7 mx-auto rounded bg-blue-deep flex items-center justify-center mb-2">
                            <span className="text-[10px] font-bold text-gold">{country.code}</span>
                          </div>
                        )}
                        <div className="text-xs font-medium truncate group-hover:text-gold transition-colors">
                          {country.name}
                        </div>
                        <div className="text-[10px] text-muted mt-0.5">
                          {country.leagues.length} ligas • {country.divisions.length} divisões
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            );
          })}
        </div>
      )}

      {/* Competições simuladas ativas */}
      {simulatedCompetitions.length > 0 && (
        <section className="mt-12">
          <h2 className="text-2xl font-bold gold-text mb-4">Competições Simuladas Ativas</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {simulatedCompetitions.map((comp) => (
              <Link
                key={comp.id}
                href={`/campeonatos/${comp.id}`}
                className="glass rounded-xl p-4 hover:gold-border transition-all duration-300 group"
              >
                <div className="flex items-center gap-3">
                  {comp.logo ? (
                    <img src={comp.logo} alt={comp.name} className="w-10 h-10 rounded-lg object-cover" />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gold/10 flex items-center justify-center text-lg">
                      🏆
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold truncate group-hover:text-gold transition-colors">
                      {comp.name}
                    </h3>
                    <p className="text-xs text-muted">
                      {comp.type} • {comp.season?.league?.name || "Sem liga"}
                    </p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-gold/10 text-gold font-semibold">
                    Simulado
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Últimos resultados simulados */}
      {recentSimMatches.length > 0 && (
        <section className="mt-10">
          <h2 className="text-2xl font-bold gold-text mb-4">Últimos Resultados Simulados</h2>
          <div className="space-y-2">
            {recentSimMatches.map((m) => (
              <Link
                key={m.id}
                href={`/simulacoes/match/${m.id}`}
                className="glass rounded-xl p-3.5 hover:bg-card/60 transition-colors flex items-center justify-between gap-4 group"
              >
                <div className="flex items-center gap-3 flex-1 justify-end">
                  <span className="text-sm font-medium text-right group-hover:text-gold transition-colors">
                    {m.homeTeam?.name || "—"}
                  </span>
                  {m.homeTeam?.emblem && (
                    <img src={m.homeTeam.emblem} alt="" className="w-7 h-7 rounded object-cover" />
                  )}
                </div>
                <div className="text-center px-3 py-1 bg-blue-deep rounded-lg gold-border min-w-[80px]">
                  {m.status === "finished" ? (
                    <span className="text-lg font-bold gold-text">
                      {m.homeScore} - {m.awayScore}
                    </span>
                  ) : (
                    <span className="text-xs text-muted uppercase">{m.status}</span>
                  )}
                </div>
                <div className="flex items-center gap-3 flex-1">
                  {m.awayTeam?.emblem && (
                    <img src={m.awayTeam.emblem} alt="" className="w-7 h-7 rounded object-cover" />
                  )}
                  <span className="text-sm font-medium group-hover:text-gold transition-colors">
                    {m.awayTeam?.name || "—"}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
