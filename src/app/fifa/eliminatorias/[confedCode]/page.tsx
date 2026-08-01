import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

const CONF_INFO: Record<string, { fullName: string; color: string }> = {
  UEFA: { fullName: "Eliminatórias Europeias", color: "#3b82f6" },
  CONMEBOL: { fullName: "Eliminatórias Sul-Americanas", color: "#fbbf24" },
  CONCACAF: { fullName: "Eliminatórias da CONCACAF", color: "#a855f7" },
  AFC: { fullName: "Eliminatórias Asiáticas", color: "#ef4444" },
  CAF: { fullName: "Eliminatórias Africanas", color: "#22c55e" },
  OFC: { fullName: "Eliminatórias da Oceania", color: "#06b6d4" },
};

export default async function EliminatoriaConfedPage({
  params,
}: {
  params: Promise<{ confedCode: string }>;
}) {
  const { confedCode } = await params;
  const info = CONF_INFO[confedCode];
  if (!info) notFound();

  const confed = await prisma.confederation.findUnique({
    where: { code: confedCode },
    include: {
      nationalTeams: { orderBy: { name: "asc" } },
      countries: { orderBy: { name: "asc" } },
    },
  });

  if (!confed) notFound();

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/fifa/eliminatorias" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para Eliminatórias
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center gap-4">
          <div
            className="w-16 h-16 rounded-xl flex items-center justify-center text-xl font-black"
            style={{ background: `${info.color}22`, color: info.color }}
          >
            {confedCode.slice(0, 3)}
          </div>
          <div>
            <div className="text-xs uppercase tracking-[0.3em] text-gold font-semibold mb-1">Eliminatórias</div>
            <h1 className="text-3xl font-black">{confed.name}</h1>
            <p className="text-muted mt-1">{info.fullName}</p>
          </div>
          <span
            className="ml-auto text-xs px-3 py-1 rounded-full font-semibold"
            style={{ background: `${info.color}15`, color: info.color }}
          >
            {confed.nationalTeams.length} seleções
          </span>
        </div>
      </header>

      {/* Seleções */}
      <section className="mb-8">
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Seleções Participantes
        </h2>
        {confed.nationalTeams.length === 0 ? (
          <div className="glass rounded-xl p-8 text-center">
            <p className="text-muted text-sm">Nenhuma seleção cadastrada ainda.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
            {confed.nationalTeams.map((team) => (
              <div key={team.id} className="glass rounded-xl p-4 text-center hover:gold-border transition-all duration-300 group">
                {team.flag ? (
                  <img src={team.flag} alt={team.name} className="w-12 h-8 mx-auto rounded object-cover mb-2" />
                ) : (
                  <div className="w-12 h-8 mx-auto rounded bg-blue-deep flex items-center justify-center mb-2">
                    <span className="text-[10px] font-bold text-gold">{team.name.slice(0, 3).toUpperCase()}</span>
                  </div>
                )}
                <div className="text-sm font-medium truncate group-hover:text-gold transition-colors">{team.name}</div>
                <div className="text-[10px] text-gold mt-0.5">⭐ {team.strength.toFixed(1)}</div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Grupos / Tabela — placeholder */}
      <section className="mb-8">
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Grupos & Tabela
        </h2>
        <div className="glass rounded-xl p-12 text-center">
          <p className="text-muted text-sm">Os grupos e tabelas das eliminatórias serão exibidos aqui assim que a simulação for iniciada.</p>
          <p className="text-muted text-xs mt-2">Cada eliminatória terá: Grupos, Tabela, Rodadas, Resultados, Artilharia, Assistências e Classificados.</p>
        </div>
      </section>

      {/* Estatísticas */}
      <section>
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Artilharia & Assistências
        </h2>
        <div className="grid sm:grid-cols-2 gap-6">
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
        </div>
      </section>
    </div>
  );
}
