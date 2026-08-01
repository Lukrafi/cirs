import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Copa do Mundo FIFA — CIRS",
  description: "Fase Final da Copa do Mundo FIFA.",
};

export default function CopaDoMundoPage() {
  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/fifa" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para FIFA
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gold/10 flex items-center justify-center text-4xl">🌍</div>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">FIFA</div>
            <h1 className="text-4xl font-black gold-text">Copa do Mundo FIFA</h1>
            <p className="text-muted mt-1">Fase Final — 48 seleções</p>
          </div>
        </div>
      </header>

      {/* Grupos */}
      <section className="mb-8">
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Fase de Grupos
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 12 }, (_, i) => (
            <div key={i} className="glass rounded-xl p-5">
              <h3 className="text-sm font-bold gold-text mb-3">Grupo {String.fromCharCode(65 + i)}</h3>
              <div className="space-y-2">
                {Array.from({ length: 4 }, (_, j) => (
                  <div key={j} className="flex items-center justify-between text-xs">
                    <span className="text-muted">Seleção {j + 1}</span>
                    <span className="text-[10px] text-muted/50">—</span>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
        <p className="text-xs text-muted text-center mt-4">Os grupos serão sorteados e exibidos aqui.</p>
      </section>

      {/* Tabela de Mata-mata */}
      <section className="mb-8">
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Mata-mata
        </h2>
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted text-sm">A tabela do mata-mata aparecerá aqui após a fase de grupos.</p>
          <div className="flex flex-wrap justify-center gap-3 mt-4 text-xs">
            <span className="px-3 py-1 rounded-full bg-gold/10 text-gold font-semibold">Rodada de 32</span>
            <span className="px-3 py-1 rounded-full bg-gold/10 text-gold font-semibold">Oitavas de Final</span>
            <span className="px-3 py-1 rounded-full bg-gold/10 text-gold font-semibold">Quartas de Final</span>
            <span className="px-3 py-1 rounded-full bg-gold/10 text-gold font-semibold">Semifinal</span>
            <span className="px-3 py-1 rounded-full bg-gold/10 text-gold font-semibold">Final</span>
          </div>
        </div>
      </section>

      {/* Estatísticas */}
      <section>
        <div className="grid sm:grid-cols-3 gap-6">
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="text-gold">⚽</span> Artilheiros
            </h3>
            <p className="text-xs text-muted text-center py-6">Em breve...</p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="text-gold">🅰️</span> Assistências
            </h3>
            <p className="text-xs text-muted text-center py-6">Em breve...</p>
          </div>
          <div className="glass rounded-xl p-6">
            <h3 className="text-sm font-semibold mb-3 flex items-center gap-2">
              <span className="text-gold">🧤</span> Goleiros
            </h3>
            <p className="text-xs text-muted text-center py-6">Em breve...</p>
          </div>
        </div>
      </section>
    </div>
  );
}
