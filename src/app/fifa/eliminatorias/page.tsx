import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Eliminatórias — FIFA — CIRS",
  description: "Eliminatórias da Copa do Mundo FIFA por confederação.",
};

const confeds = [
  { code: "UEFA", name: "UEFA", fullName: "Eliminatórias Europeias", color: "#3b82f6" },
  { code: "CONMEBOL", name: "CONMEBOL", fullName: "Eliminatórias Sul-Americanas", color: "#fbbf24" },
  { code: "CONCACAF", name: "CONCACAF", fullName: "Eliminatórias da CONCACAF", color: "#a855f7" },
  { code: "AFC", name: "AFC", fullName: "Eliminatórias Asiáticas", color: "#ef4444" },
  { code: "CAF", name: "CAF", fullName: "Eliminatórias Africanas", color: "#22c55e" },
  { code: "OFC", name: "OFC", fullName: "Eliminatórias da Oceania", color: "#06b6d4" },
];

export default function EliminatoriasPage() {
  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/fifa" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para FIFA
      </Link>
      <h1 className="text-3xl font-black mt-4 mb-2"><span className="gold-text">Eliminatórias</span></h1>
      <p className="text-muted mb-8">Eliminatórias da Copa do Mundo FIFA por confederação.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {confeds.map((conf) => (
          <Link
            key={conf.code}
            href={`/fifa/eliminatorias/${conf.code}`}
            className="glass rounded-xl p-6 hover:gold-border transition-all duration-300 group"
          >
            <div className="flex items-center gap-4">
              <div
                className="w-14 h-14 rounded-lg flex items-center justify-center text-lg font-black"
                style={{ background: `${conf.color}22`, color: conf.color }}
              >
                {conf.code.slice(0, 3)}
              </div>
              <div>
                <h2 className="text-lg font-bold group-hover:text-gold transition-colors">{conf.name}</h2>
                <p className="text-xs text-muted mt-0.5">{conf.fullName}</p>
              </div>
            </div>
            <div className="mt-4 flex flex-wrap gap-2 text-[10px]">
              <span className="px-2 py-1 rounded-full bg-gold/10 text-gold">Grupos</span>
              <span className="px-2 py-1 rounded-full bg-blue-glow/10 text-blue-glow">Tabela</span>
              <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-500">Rodadas</span>
              <span className="px-2 py-1 rounded-full bg-purple-500/10 text-purple-500">Classificados</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
