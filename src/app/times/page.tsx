import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function TimesPage() {
  const clubs = await prisma.club.findMany({
    include: { players: true, coach: true, stadiumRel: true },
    orderBy: { name: "asc" },
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Times</span>
      </h1>
      <p className="text-muted mb-8">Todos os clubes cadastrados na CIRS.</p>

      {clubs.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhum clube cadastrado ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {clubs.map((club) => (
            <Link
              key={club.id}
              href={`/times/${club.id}`}
              className="glass rounded-2xl p-6 hover:gold-border transition-all duration-300 group"
            >
              <div className="flex items-center gap-4 mb-4">
                {club.emblem ? (
                  <img src={club.emblem} alt={club.name} className="w-16 h-16 rounded-lg object-cover" />
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-blue-deep flex items-center justify-center text-2xl font-bold text-gold">
                    {club.name.charAt(0)}
                  </div>
                )}
                <div>
                  <h3 className="text-lg font-bold group-hover:text-gold transition-colors">{club.name}</h3>
                  <p className="text-xs text-muted">{club.city}, {club.country}</p>
                </div>
              </div>
              <div className="mt-3 text-center">
                <div className="text-2xl font-bold gold-text">
                  {"⭐".repeat(Math.floor(club.strength))}
                  {club.strength % 1 >= 0.5 ? "½" : ""}
                </div>
                <div className="text-xs text-muted">Força {club.strength}</div>
              </div>
              <div className="mt-3 text-xs text-muted text-center">
                {club.players.length} jogadores • {club.coach?.name || "Sem técnico"}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
