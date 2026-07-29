import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function LigasPage() {
  const leagues = await prisma.league.findMany({
    include: { seasons: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Ligas</span>
      </h1>
      <p className="text-muted mb-8">Ligas e temporadas da CIRS.</p>

      {leagues.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhuma liga cadastrada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {leagues.map((l) => (
            <Link
              key={l.id}
              href={`/ligas/${l.id}`}
              className="glass rounded-2xl p-6 hover:gold-border transition-all duration-300 group"
            >
              <div className="flex items-center gap-3 mb-3">
                {l.logo && (
                  <img src={l.logo} alt={l.name} className="w-12 h-12 rounded-lg object-cover" />
                )}
                <h3 className="text-lg font-bold group-hover:text-gold transition-colors">{l.name}</h3>
              </div>
              <p className="text-sm text-muted">{l.seasons.length} temporada(s)</p>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
