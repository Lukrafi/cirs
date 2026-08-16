import { prisma } from "@/lib/prisma";
import { UEFA_COMPETITIONS, UefaCompetitionType, getLeaguePhaseConfig } from "@/lib/uefa-competitions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Competições UEFA — CIRS",
  description: "Champions League, Europa League e Conference League no simulador CIRS.",
};

export default async function UefaPage() {
  const competitions = await prisma.competition.findMany({
    where: {
      type: { in: ["champions-league", "europa-league", "conference-league"] },
    },
    include: {
      season: true,
      groups: { include: { matches: true, standings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const compTypes: UefaCompetitionType[] = [
    "champions-league",
    "europa-league",
    "conference-league",
  ];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Simulação Continental
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Competições UEFA</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        As três principais competições continentais da Europa com formato de Fase de Liga (suíço)
        de 36 equipes, qualificação em múltiplas fases com caminhos de campeões e liga, e mata-mata
        completo até a grande final.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        {compTypes.map((type) => {
          const config = UEFA_COMPETITIONS[type];
          const leagueConfig = getLeaguePhaseConfig(type);
          const activeComp = competitions.find((c) => c.type === type);

          return (
            <Link
              key={type}
              href={activeComp ? `/uefa/${activeComp.id}` : `/uefa?type=${type}`}
              className="glass rounded-2xl p-6 hover:gold-border transition-all duration-300 group"
              style={{ borderTop: `3px solid ${config.color}` }}
            >
              <div
                className="w-14 h-14 rounded-xl flex items-center justify-center text-2xl font-black mb-4"
                style={{ background: `${config.color}22`, color: config.color }}
              >
                {config.shortName}
              </div>
              <h2 className="text-xl font-bold mb-2 group-hover:text-gold transition-colors">
                {config.name}
              </h2>
              <div className="space-y-1 text-sm text-muted">
                <div>
                  <span className="text-foreground/70">Fase de Liga:</span>{" "}
                  {leagueConfig.totalTeams} times • {config.leaguePhaseMatches} jogos/time
                </div>
                <div>
                  <span className="text-foreground/70">Classificação direta:</span>{" "}
                  Top {leagueConfig.directR16} → Oitavas
                </div>
                <div>
                  <span className="text-foreground/70">Play-off eliminatório:</span>{" "}
                  {leagueConfig.knockoutPlayoffStart}º–{leagueConfig.knockoutPlayoffEnd}º
                </div>
                <div>
                  <span className="text-foreground/70">Eliminados:</span>{" "}
                  {leagueConfig.eliminatedStart}º–{leagueConfig.totalTeams}º
                </div>
              </div>
              {activeComp && (
                <div className="mt-4 text-xs px-2 py-1 rounded-full bg-gold/10 text-gold font-semibold inline-block">
                  Competição ativa • {activeComp.numTeams} times
                </div>
              )}
            </Link>
          );
        })}
      </div>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold gold-text mb-4">Estrutura das Competições</h2>
        <div className="space-y-4 text-sm">
          <div>
            <h3 className="font-semibold text-gold mb-1">Etapa 1 — Qualificação</h3>
            <p className="text-muted">
              Fases pré-eliminatórias (1ª, 2ª, 3ª e Play-off) em mata-mata de ida e volta.
              Caminho dos Campeões (campeões nacionais) e Caminho da Liga (vices/terceiros).
              Perdedores de fases superiores descem para competições inferiores (ex: CL → EL → UECL).
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gold mb-1">Etapa 2 — Fase de Liga (Suíço)</h3>
            <p className="text-muted">
              36 equipes em tabela única. CL/EL: 8 rodadas (4 casa, 4 fora). UECL: 6 rodadas
              (3 casa, 3 fora). Top 8 avançam direto às Oitavas. 9º–24º jogam Play-off eliminatório.
              25º–36º eliminados.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gold mb-1">Etapa 3 — Fase Eliminatória</h3>
            <p className="text-muted">
              Play-off (ida e volta) → Oitavas → Quartas → Semifinais (todas em ida e volta) →
              Final única em campo neutro. Prorrogação e pênaltis em caso de empate no agregado.
            </p>
          </div>
          <div>
            <h3 className="font-semibold text-gold mb-1">Etapa 4 — Simular Fase</h3>
            <p className="text-muted">
              Botão &ldquo;Simular Fase&rdquo; permite simular rodadas inteiras da fase de liga ou
              chaves completas do mata-mata automaticamente, atualizando tabelas e chaveamentos
              instantaneamente.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}
