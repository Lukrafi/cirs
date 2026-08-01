import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [upcomingMatches, recentMatches] = await Promise.all([
    prisma.match.findMany({
      where: { status: "scheduled" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { matchDate: "asc" },
      take: 5,
    }),
    prisma.match.findMany({
      where: { status: "finished" },
      include: { homeTeam: true, awayTeam: true },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
  ]);

  const [matchCount, clubsCount, playerCountDB, competitionCount] = await Promise.all([
    prisma.match.count({ where: { status: "finished" } }),
    prisma.club.count(),
    prisma.player.count(),
    prisma.competition.count(),
  ]);

  const stats = [
    { label: "Partidas", value: matchCount, icon: "⚽" },
    { label: "Clubes", value: clubsCount, icon: "🛡" },
    { label: "Jogadores", value: playerCountDB, icon: "👤" },
    { label: "Campeonatos", value: competitionCount, icon: "🏆" },
  ];

  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background gradient orbs */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-glow/20 rounded-full blur-[120px] z-0 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] z-0" />

      {/* Hero Section Minimalista */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto pt-32 pb-16 animate-fade-in">
        <div className="mb-3">
          <span className="text-xs sm:text-sm uppercase tracking-[0.4em] text-gold font-semibold">
            Confederação Internacional
          </span>
        </div>
        <h1 className="text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tight mb-4">
          <span className="gold-text">CIRS</span>
        </h1>
        <p className="text-lg sm:text-xl text-foreground/80 mb-2 tracking-wide">
          Confederação Internacional Real Soccer
        </p>
        <p className="text-sm sm:text-base text-muted mb-10 max-w-xl leading-relaxed">
          O maior servidor de Real Soccer X5 com PowerShot.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/jogar" className="btn-primary text-base sm:text-lg px-10 py-4 animate-glow">
            Jogar Agora
          </Link>
          <Link
            href="/discord"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-secondary text-base sm:text-lg px-10 py-4 flex items-center gap-2"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.872-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.055c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Entrar no Discord
          </Link>
        </div>
      </section>

      {/* Dashboard de Metricas-Chave */}
      <section className="relative z-10 w-full max-w-3xl mx-auto px-6 mb-20">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 glass rounded-2xl p-6">
          {stats.map((stat) => (
            <div key={stat.label} className="text-center">
              <div className="text-2xl mb-1 opacity-70">{stat.icon}</div>
              <div className="text-3xl font-bold gold-text">{stat.value}</div>
              <div className="text-xs text-muted uppercase mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Feed de Destaques — Últimos Resultados + Próximos Jogos */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <div className="grid md:grid-cols-2 gap-8">
          {/* Últimos Resultados */}
          <div>
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-gold rounded-full" />
              <span className="gold-text">Últimos Resultados</span>
            </h2>
            {recentMatches.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-muted text-sm">Nenhum resultado ainda.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {recentMatches.map((m) => (
                  <Link
                    key={m.id}
                    href="/partidas"
                    className="glass rounded-xl p-3.5 flex items-center gap-3 hover:bg-card/60 transition-colors group"
                  >
                    <span className="text-sm font-medium flex-1 text-right text-foreground/80 group-hover:text-gold transition-colors">
                      {m.homeTeam?.name || "TBD"}
                    </span>
                    <div className="text-center px-3 py-1 bg-blue-deep rounded-lg gold-border min-w-[70px]">
                      <span className="text-lg font-bold gold-text">{m.homeScore} - {m.awayScore}</span>
                    </div>
                    <span className="text-sm font-medium flex-1 text-foreground/80 group-hover:text-gold transition-colors">
                      {m.awayTeam?.name || "TBD"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Próximos Jogos */}
          <div>
            <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
              <span className="w-1 h-5 bg-gold rounded-full" />
              <span className="gold-text">Próximos Jogos</span>
            </h2>
            {upcomingMatches.length === 0 ? (
              <div className="glass rounded-xl p-8 text-center">
                <p className="text-muted text-sm">Nenhum jogo agendado.</p>
              </div>
            ) : (
              <div className="space-y-2.5">
                {upcomingMatches.map((m) => (
                  <Link
                    key={m.id}
                    href="/partidas"
                    className="glass rounded-xl p-3.5 flex items-center gap-3 hover:bg-card/60 transition-colors group"
                  >
                    <span className="text-sm font-medium flex-1 text-right text-foreground/80 group-hover:text-gold transition-colors">
                      {m.homeTeam?.name || "TBD"}
                    </span>
                    <div className="text-center px-3 py-1 min-w-[70px]">
                      <div className="text-xs text-muted font-semibold uppercase">VS</div>
                      {m.matchDate && (
                        <div className="text-[10px] text-muted/70 mt-0.5">{formatDate(m.matchDate)}</div>
                      )}
                    </div>
                    <span className="text-sm font-medium flex-1 text-foreground/80 group-hover:text-gold transition-colors">
                      {m.awayTeam?.name || "TBD"}
                    </span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
