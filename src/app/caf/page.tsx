import { prisma } from "@/lib/prisma";
import { CAF_COMPETITIONS, CafCompetitionType } from "@/lib/caf-competitions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Competições CAF — CIRS",
  description: "Liga dos Campeões da CAF e Copa das Confederações da CAF.",
};

const COMPETITION_DETAILS: Record<CafCompetitionType, { phases: string[]; value: string }> = {
  "caf-champions-league": {
    phases: [
      "1ª Pré-Eliminatória (mata-mata ida e volta)",
      "2ª Pré-Eliminatória (mata-mata ida e volta)",
      "Fase de Grupos: 4 grupos de 4 (turno e returno)",
      "Quartas de Final (ida e volta)",
      "Semifinais (ida e volta)",
      "Final",
    ],
    value: "Vaga para a Copa do Mundo de Clubes da FIFA + prestígio máximo no futebol africano",
  },
  "caf-confederations-cup": {
    phases: [
      "1ª Pré-Eliminatória (mata-mata ida e volta)",
      "2ª Pré-Eliminatória (mata-mata ida e volta)",
      "Fase de Grupos: 4 grupos de 4 (turno e returno)",
      "Quartas de Final (ida e volta)",
      "Semifinais (ida e volta)",
      "Final",
    ],
    value: "Vaga para a Supercopa da CAF (contra o campeão da Liga dos Campeões)",
  },
};

export default async function CafPage() {
  const competitions = await prisma.competition.findMany({
    where: {
      type: { in: ["caf-champions-league", "caf-confederations-cup"] },
    },
    include: {
      season: true,
      groups: { include: { matches: true, standings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const compTypes: CafCompetitionType[] = ["caf-champions-league", "caf-confederations-cup"];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Simulação Continental
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Competições CAF</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Os dois principais torneios de clubes do futebol africano. Estrutura progressiva de
        pré-eliminatórias em mata-mata (ida e volta), seguida por fase de grupos de 4 grupos de 4
        times (turno e returno), e mata-mata final até a grande final.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {compTypes.map((type) => {
          const config = CAF_COMPETITIONS[type];
          const details = COMPETITION_DETAILS[type];
          const activeComp = competitions.find((c) => c.type === type);

          return (
            <Link
              key={type}
              href={activeComp ? `/caf/${activeComp.id}` : `/caf?type=${type}`}
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
                  <span className="text-muted">Formato:</span>{" "}
                  <span className="text-foreground/80">
                    Pré-eliminatórias + {config.groupStageGroups} grupos de {config.teamsPerGroup} + Mata-mata
                  </span>
                </div>
                <div>
                  <span className="text-muted">Fases:</span>
                  <ol className="ml-4 mt-1 space-y-0.5">
                    {details.phases.map((p, i) => (
                      <li key={i} className="text-xs text-foreground/60 list-decimal">
                        {p}
                      </li>
                    ))}
                  </ol>
                </div>
                <div className="pt-1">
                  <span className="text-muted">O que vale:</span>{" "}
                  <span className="text-xs text-gold/80">{details.value}</span>
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
        <h2 className="text-lg font-bold gold-text mb-4">Distribuição de Vagas</h2>
        <p className="text-muted text-sm mb-3">
          A distribuição de vagas é baseada no Ranking Oficial das Associações da CAF:
        </p>
        <ul className="space-y-2 text-sm">
          <li className="flex gap-2">
            <span className="text-gold font-bold">•</span>
            <span>
              <strong className="text-foreground">12 melhores federações</strong> do ranking continental têm
              direito a <strong className="text-gold">2 clubes</strong> na Liga dos Campeões e
              <strong className="text-gold"> 2 clubes</strong> na Copa das Confederações.
            </span>
          </li>
          <li className="flex gap-2">
            <span className="text-gold font-bold">•</span>
            <span>
              <strong className="text-foreground">Demais federações</strong> participam com
              <strong className="text-gold"> 1 clube</strong> por torneio, conforme critérios de coeficiente
              e vagas disponíveis.
            </span>
          </li>
        </ul>
      </section>
    </div>
  );
}
