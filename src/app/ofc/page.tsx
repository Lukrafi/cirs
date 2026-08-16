import { prisma } from "@/lib/prisma";
import { OFC_COMPETITIONS, OfcCompetitionType, OFC_PRO_LEAGUE_CLUBS, OFC_PRO_LEAGUE_CLUB_INFO } from "@/lib/ofc-competitions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Competições OFC — CIRS",
  description: "OFC Pro League e OFC Champions League.",
};

const DETAILS: Record<OfcCompetitionType, { phases: string[]; value: string }> = {
  "ofc-pro-league": {
    phases: [
      "Fase 1 — Temporada Regular: 8 clubes, pontos corridos turno e returno (14 rodadas)",
      "Fase 2 — Playoffs: Top 4 → Grupo de Líderes (3 avançam direto); Bottom 4 → Grupo de Desafiantes (1 vaga restante)",
      "Fase Eliminatória — Semifinais em jogo único",
      "Grande Final em partida única",
    ],
    value: "Vaga direta no FIFA Intercontinental Cup + via de qualificação para o FIFA Club World Cup",
  },
  "ofc-champions-league": {
    phases: [
      "Play-offs Nacionais (ida e volta) + Qualificação Centralizada (associações em desenvolvimento)",
      "Fase de Grupos: 8 equipes, 2 grupos de 4 (turno único)",
      "Semifinais (top 2 de cada grupo avançam)",
      "Grande Final",
    ],
    value: "Título de campeão da Oceania + vaga em torneios continentais e intercontinentais",
  },
};

export default async function OfcPage() {
  const competitions = await prisma.competition.findMany({
    where: { type: { in: ["ofc-pro-league", "ofc-champions-league"] } },
    include: { season: true, groups: { include: { matches: true, standings: true } } },
    orderBy: { createdAt: "desc" },
  });

  const compTypes: OfcCompetitionType[] = ["ofc-pro-league", "ofc-champions-league"];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Simulação Continental
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Competições OFC</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Os torneios oficiais da Confederação de Futebol da Oceania: a nova OFC Pro League
        (liga profissional com 8 clubes fundadores) e a tradicional OFC Champions League.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {compTypes.map((type) => {
          const config = OFC_COMPETITIONS[type];
          const detail = DETAILS[type];
          const activeComp = competitions.find((c) => c.type === type);

          return (
            <Link
              key={type}
              href={activeComp ? `/ofc/${activeComp.id}` : `/ofc?type=${type}`}
              className="glass rounded-2xl p-6 hover:gold-border transition-all duration-300 group"
              style={{ borderTop: `3px solid ${config.color}` }}
            >
              <div className="flex items-start gap-4 mb-3">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shrink-0"
                  style={{ background: `${config.color}22`, color: config.color }}
                >
                  {config.shortName}
                </div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold group-hover:text-gold transition-colors">
                    {config.name}
                  </h2>
                  <p className="text-xs text-muted">{config.description}</p>
                </div>
              </div>

              <div className="space-y-1 text-sm">
                <div>
                  <span className="text-muted">Fases:</span>
                  <ol className="ml-4 mt-1 space-y-0.5">
                    {detail.phases.map((p, i) => (
                      <li key={i} className="text-xs text-foreground/60 list-decimal">{p}</li>
                    ))}
                  </ol>
                </div>
                <div className="pt-1">
                  <span className="text-muted">O que vale:</span>{" "}
                  <span className="text-xs text-gold/80">{detail.value}</span>
                </div>
              </div>

              {activeComp && (
                <div className="mt-3 text-xs px-2 py-1 rounded-full bg-gold/10 text-gold font-semibold inline-block">
                  Competição ativa • {activeComp.numTeams} times
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold gold-text mb-4">OFC Pro League — Os 8 Clubes Fundadores</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {OFC_PRO_LEAGUE_CLUBS.map((name) => {
            const info = OFC_PRO_LEAGUE_CLUB_INFO[name];
            return (
              <div key={name} className="glass rounded-xl p-3">
                <div className="text-sm font-bold text-gold">{name}</div>
                <div className="text-xs text-muted">{info?.country}</div>
                {info?.note && (
                  <div className="text-[10px] text-orange-400 mt-1 leading-tight">{info.note}</div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
