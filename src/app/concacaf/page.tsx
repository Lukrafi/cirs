import { prisma } from "@/lib/prisma";
import { CONCACAF_COMPETITIONS, ConcacafCompetitionType } from "@/lib/concacaf-competitions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Competições CONCACAF — CIRS",
  description: "Champions Cup, Leagues Cup, Central American Cup, Caribbean Cup e Caribbean Shield.",
};

const COMPETITION_DETAILS: Record<ConcacafCompetitionType, { format: string; phases: string[]; value: string }> = {
  "champions-cup": {
    format: "Mata-mata de ida e volta",
    phases: ["Primeira Rodada (22 times → 11 vencedores)", "Oitavas (+ 5 pré-classificados)", "Quartas", "Semifinais", "Final"],
    value: "Vaga direta para a Copa do Mundo de Clubes da FIFA + premiação + prestígio máximo no continente",
  },
  "leagues-cup": {
    format: "Fase de Grupos (3 times/grupo) + Mata-mata",
    phases: ["Fase de Grupos (MLS vs Liga MX)", "16 Avos de Final", "Oitavas", "Quartas", "Semifinais", "Final (jogo único)"],
    value: "Vagas na CONCACAF Champions Cup para os 3 primeiros colocados",
  },
  "central-american-cup": {
    format: "4 grupos de 5 + Mata-mata de ida e volta",
    phases: ["Fase de Grupos (4 grupos de 5)", "Quartas de Final", "Play-ins", "Semifinais", "Final"],
    value: "Vagas na CONCACAF Champions Cup para semifinalistas e vencedores de play-in",
  },
  "caribbean-cup": {
    format: "2 grupos de 5 + Mata-mata de ida e volta",
    phases: ["Fase de Grupos (2 grupos de 5, turno único)", "Semifinais", "Disputa de 3º lugar", "Final"],
    value: "Vagas na CONCACAF Champions Cup (campeão → oitavas; 2º e 3º → primeira fase)",
  },
  "caribbean-shield": {
    format: "Grupos curtos em sede única + Mata-mata",
    phases: ["Fase de Grupos (sede única)", "Semifinais (jogo único)", "Final (jogo único)"],
    value: "Classificação dos finalistas para a CONCACAF Caribbean Cup da temporada seguinte",
  },
};

export default async function ConcacafPage() {
  const competitions = await prisma.competition.findMany({
    where: {
      type: { in: ["champions-cup", "leagues-cup", "central-american-cup", "caribbean-cup", "caribbean-shield"] },
    },
    include: {
      season: true,
      groups: { include: { matches: true, standings: true } },
    },
    orderBy: { createdAt: "desc" },
  });

  const compTypes: ConcacafCompetitionType[] = [
    "champions-cup",
    "leagues-cup",
    "central-american-cup",
    "caribbean-cup",
    "caribbean-shield",
  ];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Simulação Continental
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Competições CONCACAF</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Todos os torneios oficiais da CONCACAF: de clubes e as competições regionais que alimentam
        a Champions Cup continental.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {compTypes.map((type) => {
          const config = CONCACAF_COMPETITIONS[type];
          const details = COMPETITION_DETAILS[type];
          const activeComp = competitions.find((c) => c.type === type);

          return (
            <Link
              key={type}
              href={activeComp ? `/concacaf/${activeComp.id}` : `/concacaf?type=${type}`}
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
                  <span className="text-foreground/80">{details.format}</span>
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
    </div>
  );
}
