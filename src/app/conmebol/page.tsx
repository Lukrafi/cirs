import { prisma } from "@/lib/prisma";
import { CONMEBOL_COMPETITIONS, ConmebolCompetitionType } from "@/lib/conmebol-competitions";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Competições CONMEBOL — CIRS",
  description: "Copa Libertadores e Copa Sul-Americana.",
};

const DETAILS: Record<ConmebolCompetitionType, { phases: string[]; value: string }> = {
  "copa-libertadores": {
    phases: [
      "Fases 1, 2 e 3 (mata-mata ida e volta)",
      "Fase de Grupos: 32 times, 8 grupos de 4 (turno e returno)",
      "Top 2 de cada grupo → Oitavas; 3º colocados → Play-offs da Sul-Americana",
      "Oitavas, Quartas, Semis (ida e volta)",
      "Grande Final (partida única em campo neutro)",
    ],
    value: "Título de campeão da América + vaga no Mundial de Clubes da FIFA",
  },
  "copa-sul-americana": {
    phases: [
      "Fase Preliminar Nacional (jogo único entre clubes do mesmo país)",
      "Fase de Grupos: 32 times, 8 grupos de 4 (turno e returno)",
      "Play-offs: 2º colocados vs 3º colocados da Libertadores (ida e volta)",
      "Oitavas, Quartas, Semis (ida e volta)",
      "Grande Final (partida única)",
    ],
    value: "Vaga na Libertadores da temporada seguinte + título continental",
  },
};

export default async function ConmebolPage() {
  const competitions = await prisma.competition.findMany({
    where: { type: { in: ["copa-libertadores", "copa-sul-americana"] } },
    include: { season: true, groups: { include: { matches: true } } },
    orderBy: { createdAt: "desc" },
  });

  const types: ConmebolCompetitionType[] = ["copa-libertadores", "copa-sul-americana"];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">Simulação Continental</span>
      </div>
      <h1 className="text-4xl font-black mb-2"><span className="gold-text">Competições CONMEBOL</span></h1>
      <p className="text-muted mb-8 max-w-3xl">
        Os dois principais torneios de clubes da América do Sul. Copa Libertadores e Copa Sul-Americana
        com dinâmica alternativa — novas potências surgem, confrontos são diferentes da vida real.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
        {types.map((type) => {
          const config = CONMEBOL_COMPETITIONS[type];
          const detail = DETAILS[type];
          const active = competitions.find((c) => c.type === type);
          return (
            <Link key={type} href={active ? `/conmebol/${active.id}` : `/conmebol?type=${type}`} className="glass rounded-2xl p-6 hover:gold-border transition-all duration-300 group" style={{ borderTop: `3px solid ${config.color}` }}>
              <div className="flex items-start gap-4 mb-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center text-sm font-black shrink-0" style={{ background: `${config.color}22`, color: config.color }}>{config.shortName}</div>
                <div className="flex-1">
                  <h2 className="text-lg font-bold group-hover:text-gold transition-colors">{config.name}</h2>
                  <p className="text-xs text-muted">{config.description}</p>
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div><span className="text-muted">Formato:</span> <span className="text-foreground/80">{config.groupStageGroups} grupos de {config.teamsPerGroup}</span></div>
                <div><span className="text-muted">Fases:</span>
                  <ol className="ml-4 mt-1 space-y-0.5">
                    {detail.phases.map((p, i) => <li key={i} className="text-xs text-foreground/60 list-decimal">{p}</li>)}
                  </ol>
                </div>
                <div className="pt-1"><span className="text-muted">O que vale:</span> <span className="text-xs text-gold/80">{detail.value}</span></div>
              </div>
              {active && <div className="mt-3 text-xs px-2 py-1 rounded-full bg-gold/10 text-gold font-semibold inline-block">Ativa • {active.numTeams} times</div>}
            </Link>
          );
        })}
      </div>

      <section className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold gold-text mb-4">Dinâmica Alternativa</h2>
        <p className="text-muted text-sm">
          Confrontos e participantes são <strong className="text-gold">diferentes da vida real</strong> — novas potências surgem,
          clubes podem ascender ou cair, forças competitivas se redistribuem a cada ciclo de simulação.
        </p>
      </section>
    </div>
  );
}
