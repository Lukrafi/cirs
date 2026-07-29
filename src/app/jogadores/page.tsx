import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function JogadoresPage() {
  const players = await prisma.player.findMany({
    include: { club: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Jogadores</span>
      </h1>
      <p className="text-muted mb-8">Todos os jogadores cadastrados na CIRS.</p>

      {players.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhum jogador cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {players.map((p) => (
            <Link
              key={p.id}
              href={`/jogadores/${p.id}`}
              className="glass rounded-xl p-4 hover:gold-border transition-all duration-300 group"
            >
              <div className="flex items-center gap-3">
                {p.photo ? (
                  <img src={p.photo} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-blue-deep flex items-center justify-center text-lg font-bold text-gold">
                    {p.name.charAt(0)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-bold truncate group-hover:text-gold transition-colors">{p.name}</h3>
                  <p className="text-xs text-muted truncate">{p.club?.name || "Sem clube"}</p>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold gold-text">{p.overall}</div>
                  <div className="text-[10px] text-muted">OVR</div>
                </div>
              </div>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted">
                <span>{p.position}</span>
                <span>#{p.number}</span>
                <span>{p.dominantFoot}</span>
                <span>{p.age} anos</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
