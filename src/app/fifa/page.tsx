import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "FIFA — CIRS",
  description: "Copa do Mundo FIFA, Eliminatórias, Competições de Seleções e Histórico de Campeões.",
};

const eliminatoryConfeds = [
  { code: "UEFA", name: "UEFA", fullName: "Eliminatórias Europeias", color: "#3b82f6" },
  { code: "CONMEBOL", name: "CONMEBOL", fullName: "Eliminatórias Sul-Americanas", color: "#fbbf24" },
  { code: "CONCACAF", name: "CONCACAF", fullName: "Eliminatórias da CONCACAF", color: "#a855f7" },
  { code: "AFC", name: "AFC", fullName: "Eliminatórias Asiáticas", color: "#ef4444" },
  { code: "CAF", name: "CAF", fullName: "Eliminatórias Africanas", color: "#22c55e" },
  { code: "OFC", name: "OFC", fullName: "Eliminatórias da Oceania", color: "#06b6d4" },
];

const nationalTeamCompetitions: Record<string, { name: string; fullName: string; color: string }[]> = {
  UEFA: [
    { name: "UEFA Nations League", fullName: "Liga das Nações da UEFA", color: "#3b82f6" },
    { name: "Eurocopa", fullName: "Campeonato Europeu de Futebol", color: "#3b82f6" },
  ],
  CONMEBOL: [
    { name: "Copa América", fullName: "Campeonato Sul-Americano de Seleções", color: "#fbbf24" },
    { name: "Finalíssima", fullName: "Conmebol vs UEFA — Finalíssima", color: "#fbbf24" },
  ],
  CONCACAF: [
    { name: "Gold Cup", fullName: "Copa Ouro da CONCACAF", color: "#a855f7" },
    { name: "CONCACAF Nations League", fullName: "Liga das Nações da CONCACAF", color: "#a855f7" },
  ],
  AFC: [
    { name: "Copa da Ásia", fullName: "Campeonato Asiático de Seleções", color: "#ef4444" },
    { name: "AFC Asian Qualifiers", fullName: "Eliminatórias Asiáticas para a Copa do Mundo", color: "#ef4444" },
  ],
  CAF: [
    { name: "Copa Africana de Nações", fullName: "Campeonato Africano de Seleções", color: "#22c55e" },
    { name: "African Nations Championship", fullName: "CHAN — Campeonato Africano de Nações (locais)", color: "#22c55e" },
  ],
  OFC: [
    { name: "OFC Nations Cup", fullName: "Copa das Nações da Oceania", color: "#06b6d4" },
  ],
};

export default function FifaPage() {
  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Confederação Internacional
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">FIFA</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Área exclusiva da FIFA. Aqui ficam as competições de seleções: Copa do Mundo,
        Eliminatórias continentais e todas as competições de seleções das confederações.
      </p>

      {/* Copa do Mundo FIFA */}
      <section className="mb-10">
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Copa do Mundo FIFA
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link href="/fifa/copa-do-mundo" className="glass rounded-xl p-5 hover:gold-border transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center text-xl">🌍</div>
              <div>
                <h3 className="text-sm font-bold group-hover:text-gold transition-colors">Copa do Mundo FIFA</h3>
                <p className="text-xs text-muted mt-0.5">Fase Final — 48 seleções</p>
              </div>
            </div>
          </Link>
          <Link href="/fifa/eliminatorias" className="glass rounded-xl p-5 hover:gold-border transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-blue-glow/20 flex items-center justify-center text-xl">📊</div>
              <div>
                <h3 className="text-sm font-bold group-hover:text-gold transition-colors">Eliminatórias</h3>
                <p className="text-xs text-muted mt-0.5">Todas as confederações</p>
              </div>
            </div>
          </Link>
          <Link href="/fifa/historico" className="glass rounded-xl p-5 hover:gold-border transition-all duration-300 group">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gold/10 flex items-center justify-center text-xl">📋</div>
              <div>
                <h3 className="text-sm font-bold group-hover:text-gold transition-colors">Histórico & Campeões</h3>
                <p className="text-xs text-muted mt-0.5">Todas as edições</p>
              </div>
            </div>
          </Link>
        </div>
      </section>

      {/* Eliminatórias por Confederação */}
      <section className="mb-10">
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Eliminatórias
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {eliminatoryConfeds.map((conf) => (
            <Link
              key={conf.code}
              href={`/fifa/eliminatorias/${conf.code}`}
              className="glass rounded-xl p-5 hover:gold-border transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                <div
                  className="w-12 h-12 rounded-lg flex items-center justify-center text-lg font-black"
                  style={{ background: `${conf.color}22`, color: conf.color }}
                >
                  {conf.code.slice(0, 3)}
                </div>
                <div>
                  <h3 className="text-sm font-bold group-hover:text-gold transition-colors">{conf.name}</h3>
                  <p className="text-xs text-muted mt-0.5">{conf.fullName}</p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Competições Continentais de Seleções */}
      <section>
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Competições Continentais de Seleções
        </h2>
        <div className="space-y-6">
          {Object.entries(nationalTeamCompetitions).map(([confCode, comps]) => {
            const conf = eliminatoryConfeds.find((c) => c.code === confCode)!;
            return (
              <div key={confCode}>
                <h3 className="text-sm font-bold mb-3" style={{ color: conf.color }}>
                  {conf.name}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {comps.map((comp) => (
                    <div
                      key={comp.name}
                      className="glass rounded-xl p-4 hover:gold-border transition-all duration-300 group"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-lg flex items-center justify-center text-lg"
                          style={{ background: `${comp.color}15`, color: comp.color }}
                        >
                          🏆
                        </div>
                        <div>
                          <h4 className="text-sm font-bold group-hover:text-gold transition-colors">{comp.name}</h4>
                          <p className="text-xs text-muted mt-0.5">{comp.fullName}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
