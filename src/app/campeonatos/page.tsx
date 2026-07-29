import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function CampeonatosPage() {
  const competitions = await prisma.competition.findMany({
    include: { season: { include: { league: true } }, groups: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Campeonatos</span>
      </h1>
      <p className="text-muted mb-8">Todas as competições da CIRS.</p>

      {competitions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhum campeonato cadastrado ainda.</p>
          <p className="text-muted text-sm mt-2">Os campeonatos aparecerão aqui assim que forem criados pelo administrador.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {competitions.map((c) => (
            <Link
              key={c.id}
              href={`/campeonatos/${c.id}`}
              className="glass rounded-2xl p-6 hover:gold-border transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-4">
                {c.logo && (
                  <img src={c.logo} alt={c.name} className="w-14 h-14 rounded-lg object-cover" />
                )}
                <div>
                  <h3 className="text-lg font-bold group-hover:text-gold transition-colors">{c.name}</h3>
                  <p className="text-xs text-muted uppercase">{c.type}</p>
                </div>
              </div>
              <div className="text-sm text-muted">
                {c.season?.name || "Sem temporada"}
                {" • "}
                {c.season?.league?.name || "Sem liga"}
              </div>
              <div className="mt-3 text-xs text-muted">
                {c.isKnockout ? "Mata-mata" : "Pontos corridos"} • {c.groups.length} grupo(s)
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
