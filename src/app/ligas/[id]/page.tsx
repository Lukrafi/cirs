import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function LeaguePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  const league = await prisma.league.findUnique({
    where: { id },
    include: {
      seasons: {
        include: {
          competitions: { include: { groups: true } },
          stats: true,
          awards: true,
        },
        orderBy: { startDate: "desc" },
      },
    },
  });

  if (!league) return notFound();

  const totalMatches = await prisma.match.count();
  const totalGoals = await prisma.matchStat.aggregate({ _sum: { goals: true } });

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="max-w-6xl mx-auto">
        <Link href="/ligas" className="text-sm text-muted hover:text-gold transition-colors">← Voltar para Ligas</Link>

        <header className="mt-6 glass rounded-2xl p-8 flex items-center gap-6">
          {league.logo ? (
            <img src={league.logo} alt={league.name} className="w-20 h-20 rounded-xl object-cover" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gold/20 flex items-center justify-center text-gold font-black text-3xl">
              {league.name.charAt(0)}
            </div>
          )}
          <div>
            <h1 className="text-4xl font-black gold-text">{league.name}</h1>
            <p className="text-muted mt-1">Liga competitiva da CIRS</p>
            <div className="flex gap-4 mt-3 text-xs">
              <span><b className="text-gold">{league.seasons.length}</b> Temporadas</span>
              <span><b className="text-gold">{totalMatches}</b> Partidas</span>
              <span><b className="text-gold">{totalGoals._sum.goals || 0}</b> Gols</span>
            </div>
          </div>
        </header>

        <section className="mt-10">
          <h2 className="text-2xl font-bold mb-6"><span className="gold-text">Temporadas</span></h2>
          {league.seasons.length === 0 ? (
            <p className="text-muted">Nenhuma temporada cadastrada.</p>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {league.seasons.map((season) => (
                <Link key={season.id} href={`/campeonatos`} className="glass rounded-xl p-5 hover:bg-card/60 transition-colors">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-bold">{season.name}</h3>
                    <span className="text-xs text-muted">{formatDate(season.startDate)}</span>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {season.competitions.map((comp) => (
                      <Link key={comp.id} href={`/campeonatos/${comp.id}`}
                        className="text-xs px-3 py-1 rounded-full bg-gold/10 text-gold hover:bg-gold/20 transition-colors">
                        {comp.name}
                      </Link>
                    ))}
                  </div>
                  <div className="mt-3 flex gap-4 text-xs text-muted">
                    <span>{season.competitions.length} competições</span>
                    <span>{season.stats.length} estatisticas</span>
                    <span>{season.awards.length} premiações</span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}