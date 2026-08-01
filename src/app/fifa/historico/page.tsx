import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Histórico & Campeões — FIFA — CIRS",
  description: "Histórico de campeões da Copa do Mundo FIFA e competições de seleções.",
};

const worldCupWinners = [
  { year: 2022, champion: "Argentina", host: "Catar" },
  { year: 2018, champion: "França", host: "Rússia" },
  { year: 2014, champion: "Alemanha", host: "Brasil" },
  { year: 2010, champion: "Espanha", host: "África do Sul" },
  { year: 2006, champion: "Itália", host: "Alemanha" },
  { year: 2002, champion: "Brasil", host: "Coreia/Japão" },
  { year: 1998, champion: "França", host: "França" },
  { year: 1994, champion: "Brasil", host: "EUA" },
  { year: 1990, champion: "Alemanha", host: "Itália" },
  { year: 1986, champion: "Argentina", host: "México" },
  { year: 1982, champion: "Itália", host: "Espanha" },
  { year: 1978, champion: "Argentina", host: "Argentina" },
  { year: 1974, champion: "Alemanha", host: "Alemanha" },
  { year: 1970, champion: "Brasil", host: "México" },
  { year: 1966, champion: "Inglaterra", host: "Inglaterra" },
  { year: 1962, champion: "Brasil", host: "Chile" },
  { year: 1958, champion: "Brasil", host: "Suécia" },
  { year: 1954, champion: "Alemanha", host: "Suíça" },
  { year: 1950, champion: "Uruguai", host: "Brasil" },
  { year: 1938, champion: "Itália", host: "França" },
  { year: 1934, champion: "Itália", host: "Itália" },
  { year: 1930, champion: "Uruguai", host: "Uruguai" },
];

export default function HistoricoPage() {
  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/fifa" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para FIFA
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 rounded-xl bg-gold/10 flex items-center justify-center text-4xl">📋</div>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">FIFA</div>
            <h1 className="text-4xl font-black gold-text">Histórico & Campeões</h1>
            <p className="text-muted mt-1">Todas as edições da Copa do Mundo FIFA</p>
          </div>
        </div>
      </header>

      <section>
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Copa do Mundo FIFA — Campeões
        </h2>
        <div className="glass rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-xs uppercase text-muted">
                <th className="px-4 py-3 text-left">Ano</th>
                <th className="px-4 py-3 text-left">Campeão</th>
                <th className="px-4 py-3 text-left">Sede</th>
              </tr>
            </thead>
            <tbody>
              {worldCupWinners.map((w, i) => (
                <tr key={i} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 text-gold font-bold">{w.year}</td>
                  <td className="px-4 py-3 font-semibold">{w.champion}</td>
                  <td className="px-4 py-3 text-muted">{w.host}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
