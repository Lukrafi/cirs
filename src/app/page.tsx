import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [news, upcomingMatches, recentMatches, topScorers, clubsForRanking] = await Promise.all([
    prisma.news.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.match.findMany({
      where: { status: "scheduled" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: "asc" },
      take: 4,
    }),
    prisma.match.findMany({
      where: { status: "finished" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { updatedAt: "desc" },
      take: 4,
    }),
    prisma.matchStat.groupBy({
      by: ["playerId"],
      _sum: { goals: true },
      orderBy: { _sum: { goals: "desc" } },
      take: 5,
    }),
    prisma.club.findMany({ include: { standings: true } }),
  ]);

  const [matchCount, clubsCount, playerCountDB, competitionCount] = await Promise.all([
    prisma.match.count({ where: { status: "finished" } }),
    prisma.club.count(),
    prisma.player.count(),
    prisma.competition.count(),
  ]);

  const scorerIds = topScorers.map((s) => s.playerId).filter((id): id is string => id !== null);
  const players = await prisma.player.findMany({
    where: { id: { in: scorerIds } },
    include: { club: true },
  });
  const scorerMap = new Map(players.map((p) => [p.id, p]));

  const clubsRanked = clubsForRanking
    .map((c) => ({ ...c, totalPoints: c.standings.reduce((sum, s) => sum + s.points, 0) }))
    .sort((a, b) => b.totalPoints - a.totalPoints)
    .slice(0, 5);

  return (
    <div className="relative min-h-screen overflow-hidden pt-16">
      <div
        className="absolute inset-0 z-0"
        style={{
          background: "linear-gradient(180deg, rgba(5,8,16,0.7) 0%, rgba(5,8,16,0.85) 50%, rgba(5,8,16,1) 100%), url('https://images.unsplash.com/photo-1459865986338-3c8e6b7e7e6a?q=80&w=1920') center/cover",
        }}
      />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-glow/20 rounded-full blur-[120px] z-0 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] z-0" />

      <div className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto animate-fade-in pb-20">
        <div className="mb-2">
          <span className="text-xs sm:text-sm uppercase tracking-[0.4em] text-gold font-semibold">Confederação Internacional</span>
        </div>
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-4">
          <span className="gold-text">CIRS</span>
        </h1>
        <p className="text-lg sm:text-xl text-foreground/80 mb-3 tracking-wide">Confederação Internacional Real Soccer</p>
        <p className="text-sm sm:text-base text-muted mb-10 max-w-xl leading-relaxed">O maior servidor de Real Soccer X5 com PowerShot.</p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/jogar" className="btn-primary text-base sm:text-lg px-10 py-4 animate-glow">Jogar Agora</Link>
          <Link href="/discord" target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-base sm:text-lg px-10 py-4 flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.872-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 0-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Entrar no Discord
          </Link>
        </div>
        <div className="relative z-10 mt-16 w-full max-w-3xl px-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 glass rounded-2xl p-6">
            <div className="text-center">
              <div className="text-3xl font-bold gold-text">{matchCount}</div>
              <div className="text-xs text-muted uppercase mt-1">Partidas</div>
            </div>
            <div className="text-center border-l border-border">
              <div className="text-3xl font-bold gold-text">{clubsCount}</div>
              <div className="text-xs text-muted uppercase mt-1">Clubes</div>
            </div>
            <div className="text-center border-l border-border">
              <div className="text-3xl font-bold gold-text">{playerCountDB}</div>
              <div className="text-xs text-muted uppercase mt-1">Jogadores</div>
            </div>
            <div className="text-center border-l border-border">
              <div className="text-3xl font-bold gold-text">{competitionCount}</div>
              <div className="text-xs text-muted uppercase mt-1">Campeonatos</div>
            </div>
          </div>
        </div>
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-4 pb-16 space-y-16">
        <div className="grid md:grid-cols-2 gap-8">
          <section>
            <h2 className="text-2xl font-bold mb-6"><span className="gold-text">Últimos Resultados</span></h2>
            {recentMatches.length === 0 ? (
              <p className="text-muted text-sm">Nenhum resultado ainda.</p>
            ) : (
              <div className="space-y-3">
                {recentMatches.map((m) => (
                  <Link key={m.id} href={`/simulacoes/${m.id}`} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-card/60 transition-colors">
                    <span className="text-sm font-bold flex-1 text-right">{m.homeTeam?.name || "TBD"}</span>
                    <span className="text-xl font-black gold-text whitespace-nowrap">{m.homeScore} - {m.awayScore}</span>
                    <span className="text-sm font-bold flex-1">{m.awayTeam?.name || "TBD"}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
          <section>
            <h2 className="text-2xl font-bold mb-6"><span className="gold-text">Próximos Jogos</span></h2>
            {upcomingMatches.length === 0 ? (
              <p className="text-muted text-sm">Nenhum jogo agendado.</p>
            ) : (
              <div className="space-y-3">
                {upcomingMatches.map((m) => (
                  <Link key={m.id} href={`/simulacoes/${m.id}`} className="glass rounded-xl p-4 flex items-center gap-4 hover:bg-card/60 transition-colors">
                    <span className="text-sm font-bold flex-1 text-right">{m.homeTeam?.name || "TBD"}</span>
                    <div className="text-center">
                      <span className="text-xs text-muted font-medium">VS</span>
                      {m.matchDate && <div className="text-xs text-muted mt-0.5">{formatDate(m.matchDate)}</div>}
                    </div>
                    <span className="text-sm font-bold flex-1">{m.awayTeam?.name || "TBD"}</span>
                  </Link>
                ))}
              </div>
            )}
          </section>
        </div>

        {topScorers.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">
              <span className="gold-text">Artilheiros</span>
              <Link href="/ranking" className="text-xs text-muted ml-3 hover:text-gold transition-colors">Ver ranking completo →</Link>
            </h2>
            <div className="glass rounded-2xl overflow-hidden">
              <div className="flex text-xs text-muted uppercase px-6 py-3 border-b border-border">
                <span className="w-8">#</span><span className="flex-1">Jogador</span><span className="flex-1">Clube</span><span className="w-16 text-right">Gols</span>
              </div>
              {topScorers.map((s, i) => {
                const playerId = s.playerId;
                if (!playerId) return null;
                const player = scorerMap.get(playerId);
                return (
                  <div key={playerId} className={`flex items-center px-6 py-3 text-sm border-b border-border/50 last:border-0 ${i < 3 ? "bg-gold/5" : ""}`}>
                    <span className={`w-8 font-bold ${i === 0 ? "text-gold" : i === 1 ? "text-muted/80" : i === 2 ? "text-amber-700" : "text-muted"}`}>{i + 1}</span>
                    <Link href={`/jogadores/${playerId}`} className="flex-1 hover:text-gold transition-colors">{player?.name || "Desconhecido"}</Link>
                    <span className="flex-1 text-muted">
                      <Link href={`/times/${player?.clubId}`} className="hover:text-gold transition-colors">{player?.club?.name || "-"}</Link>
                    </span>
                    <span className="w-16 text-right font-bold">{s._sum.goals}</span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {clubsRanked.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">
              <span className="gold-text">Clubes em Destaque</span>
              <Link href="/ranking" className="text-xs text-muted ml-3 hover:text-gold transition-colors">Ver ranking completo →</Link>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
              {clubsRanked.map((club) => (
                <Link key={club.id} href={`/times/${club.id}`} className="glass rounded-xl p-4 text-center hover:bg-card/60 transition-colors">
                  {club.emblem ? (
                    <img src={club.emblem} alt={club.name} className="w-10 h-10 mx-auto rounded-full mb-2 object-cover" />
                  ) : (
                    <div className="w-10 h-10 mx-auto rounded-full bg-gold/20 flex items-center justify-center mb-2">
                      <span className="text-xs font-bold text-gold">{club.name.charAt(0)}</span>
                    </div>
                  )}
                  <div className="text-xs font-semibold truncate">{club.name}</div>
                  <div className="text-xs text-gold mt-1">{club.totalPoints} pts</div>
                </Link>
              ))}
            </div>
          </section>
        )}

        {news.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-6">
              <span className="gold-text">Últimas Notícias</span>
              <Link href="/noticias" className="text-xs text-muted ml-3 hover:text-gold transition-colors">Ver todas →</Link>
            </h2>
            <div className="grid md:grid-cols-3 gap-4">
              {news.map((n) => (
                <Link key={n.id} href={`/noticias/${n.id}`} className="glass rounded-xl overflow-hidden hover:bg-card/60 transition-all hover:scale-[1.02]">
                  {n.image && <img src={n.image} alt={n.title} className="w-full h-40 object-cover" />}
                  <div className="p-4">
                    <span className="text-xs text-gold font-semibold uppercase">{n.category}</span>
                    <h3 className="text-sm font-bold mt-1 line-clamp-2">{n.title}</h3>
                    <p className="text-xs text-muted mt-2 line-clamp-2">{n.content}</p>
                    <div className="flex items-center gap-2 mt-3 text-xs text-muted">
                      <span>{n.author}</span><span>-</span><span>{formatDate(n.createdAt)}</span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}