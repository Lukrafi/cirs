import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function Home() {
  const [
    upcomingMatches,
    recentMatches,
    realMatchCount,
    clubsCount,
    playerCountDB,
    competitionCount,
    topScorers,
    topAssists,
    topGKs,
    latestNews,
    activeCompetitionSetting,
    activeCompetitionUpdatedAt,
  ] = await Promise.all([
    prisma.match.findMany({
      where: { status: "scheduled", isSimulated: false },
      include: { homeTeam: { select: { name: true, emblem: true } }, awayTeam: { select: { name: true, emblem: true } } },
      orderBy: { matchDate: "asc" },
      take: 5,
    }),
    prisma.match.findMany({
      where: { status: "finished", isSimulated: false },
      include: { homeTeam: { select: { name: true } }, awayTeam: { select: { name: true } } },
      orderBy: { updatedAt: "desc" },
      take: 5,
    }),
    prisma.match.count({ where: { status: "finished", isSimulated: false } }),
    prisma.club.count(),
    prisma.player.count(),
    prisma.competition.count(),
    prisma.matchStat.groupBy({
      by: ["playerId"],
      where: {
        match: { isSimulated: false },
        goals: { gt: 0 },
      },
      _sum: { goals: true },
      orderBy: { _sum: { goals: "desc" } },
      take: 5,
    }),
    prisma.$queryRawUnsafe(`SELECT "playerId", SUM("assists") as assists FROM "MatchStat" WHERE "assists" > 0 AND "matchId" IN (SELECT id FROM "Match" WHERE "isSimulated" = false) GROUP BY "playerId" ORDER BY assists DESC LIMIT 5`),
    prisma.$queryRawUnsafe(`SELECT "playerId", SUM("saves") as saves FROM "MatchStat" WHERE "saves" > 0 AND "matchId" IN (SELECT id FROM "Match" WHERE "isSimulated" = false) GROUP BY "playerId" ORDER BY saves DESC LIMIT 5`),
    prisma.news.findMany({ where: { published: true }, orderBy: { createdAt: "desc" }, take: 3 }),
    prisma.settings.findUnique({ where: { key: "active_competition" } }),
    prisma.settings.findUnique({ where: { key: "active_competition_updated_at" } }),
  ]);

  const activeCompetitionName = activeCompetitionSetting?.value ?? null;

  let nextMatchInfo: {
    homeTeam: string;
    awayTeam: string;
    homeEmblem: string;
    awayEmblem: string;
    round: string | null;
    groupName: string | null;
    competitionName: string;
    matchDate: Date | null;
  } | null = null;

  if (activeCompetitionName) {
    const competitions = await prisma.competition.findMany({
      include: {
        groups: {
          include: {
            matches: {
              where: { status: "scheduled", isSimulated: false },
              include: {
                homeTeam: { select: { name: true, emblem: true } },
                awayTeam: { select: { name: true, emblem: true } },
              },
              orderBy: [{ round: "asc" }, { matchDate: "asc" }],
              take: 1,
            },
          },
        },
      },
    });

    const competition = competitions.find(
      (c) => c.name.toLowerCase() === activeCompetitionName.toLowerCase()
    );

    if (competition) {
      for (const group of competition.groups) {
        if (group.matches.length > 0) {
          const m = group.matches[0];
          nextMatchInfo = {
            homeTeam: m.homeTeam?.name ?? "TBD",
            awayTeam: m.awayTeam?.name ?? "TBD",
            homeEmblem: m.homeTeam?.emblem ?? "",
            awayEmblem: m.awayTeam?.emblem ?? "",
            round: m.round,
            groupName: group.name,
            competitionName: competition.name,
            matchDate: m.matchDate,
          };
          break;
        }
      }
    }
  }

  const stats = [
    { label: "Partidas", value: realMatchCount, icon: "⚽" },
    { label: "Clubes", value: clubsCount, icon: "🛡" },
    { label: "Jogadores", value: playerCountDB, icon: "👤" },
    { label: "Campeonatos", value: competitionCount, icon: "🏆" },
  ];

  type RankRow = { playerId: string; goals?: number; assists?: number; saves?: number };
  const assistsList = (topAssists as RankRow[]) || [];
  const gksList = (topGKs as RankRow[]) || [];

  const rankIds = [
    ...topScorers.map((s) => s.playerId),
    ...assistsList.map((s) => s.playerId),
    ...gksList.map((s) => s.playerId),
  ].filter((id): id is string => id != null);
  const topPlayers = rankIds.length > 0
    ? await prisma.player.findMany({ where: { id: { in: rankIds } } })
    : [];
  const playerName = (id: string | null) =>
    topPlayers.find((p) => p.id === id)?.name || "Jogador";

  return (
    <div className="relative min-h-screen overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-glow/20 rounded-full blur-[120px] z-0 animate-pulse-slow" />
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-gold/10 rounded-full blur-[120px] z-0" />

      {/* Hero */}
      <section className="relative z-10 flex flex-col items-center text-center px-6 max-w-4xl mx-auto pt-32 pb-12 animate-fade-in">
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
          O portal oficial do servidor Real Soccer PowerShot x5. Partidas reais, estatísticas e competições.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 items-center">
          <Link href="/jogar" className="btn-primary text-base sm:text-lg px-10 py-4 animate-glow">
            Jogar Agora
          </Link>
          <Link href="/discord" target="_blank" rel="noopener noreferrer"
            className="btn-secondary text-base sm:text-lg px-10 py-4 flex items-center gap-2">
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.872-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
            </svg>
            Entrar no Discord
          </Link>
        </div>
      </section>

      {/* Stats Dashboard */}
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

      {/* Competição Ativa + Próxima Partida */}
      {activeCompetitionName && (
        <section className="relative z-10 w-full max-w-3xl mx-auto px-6 mb-12">
          <div className="glass rounded-2xl p-6 border border-blue-deep/50">
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
              <h2 className="text-lg font-bold">
                <span className="gold-text">Ao Vivo no Servidor</span>
              </h2>
            </div>
            <div className="flex items-center gap-2 mb-4">
              <span className="text-xs uppercase tracking-wider text-blue-light font-semibold px-2 py-1 bg-blue-deep/40 rounded">
                {activeCompetitionName}
              </span>
              {activeCompetitionUpdatedAt?.value && (
                <span className="text-[10px] text-muted/60">
                  atualizado {formatDate(new Date(activeCompetitionUpdatedAt.value))}
                </span>
              )}
            </div>

            {nextMatchInfo ? (
              <div className="flex items-center justify-center gap-4 py-4">
                <div className="flex-1 text-right">
                  <div className="flex items-center justify-end gap-2">
                    {nextMatchInfo.homeEmblem && (
                      <img src={nextMatchInfo.homeEmblem} alt="" className="w-8 h-8 object-contain" />
                    )}
                    <span className="font-bold text-foreground">{nextMatchInfo.homeTeam}</span>
                  </div>
                </div>
                <div className="text-center px-4">
                  <div className="text-xs text-muted uppercase font-semibold">VS</div>
                  {nextMatchInfo.round && (
                    <div className="text-[10px] text-muted/70 mt-1">{nextMatchInfo.round}</div>
                  )}
                  {nextMatchInfo.groupName && (
                    <div className="text-[10px] text-muted/50">{nextMatchInfo.groupName}</div>
                  )}
                  {nextMatchInfo.matchDate && (
                    <div className="text-[10px] text-gold/70 mt-1">{formatDate(nextMatchInfo.matchDate)}</div>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{nextMatchInfo.awayTeam}</span>
                    {nextMatchInfo.awayEmblem && (
                      <img src={nextMatchInfo.awayEmblem} alt="" className="w-8 h-8 object-contain" />
                    )}
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted text-center py-2">
                Nenhuma partida agendada para esta competição.
              </p>
            )}
          </div>
        </section>
      )}

      {/* Conteúdo Principal: Resultados + Notícias + Rankings */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pb-20">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Coluna 1 + 2 */}
          <div className="lg:col-span-2 space-y-8">
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
                    <Link key={m.id} href="/partidas" className="glass rounded-xl p-3.5 flex items-center gap-3 hover:bg-card/60 transition-colors group">
                      <span className="text-sm font-medium flex-1 text-right text-foreground/80 group-hover:text-gold transition-colors">{m.homeTeam?.name || "TBD"}</span>
                      <div className="text-center px-3 py-1 bg-blue-deep rounded-lg gold-border min-w-[70px]">
                        <span className="text-lg font-bold gold-text">{m.homeScore} - {m.awayScore}</span>
                      </div>
                      <span className="text-sm font-medium flex-1 text-foreground/80 group-hover:text-gold transition-colors">{m.awayTeam?.name || "TBD"}</span>
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
                    <Link key={m.id} href="/partidas" className="glass rounded-xl p-3.5 flex items-center gap-3 hover:bg-card/60 transition-colors group">
                      <span className="text-sm font-medium flex-1 text-right text-foreground/80 group-hover:text-gold transition-colors">{m.homeTeam?.name || "TBD"}</span>
                      <div className="text-center px-3 py-1 min-w-[70px]">
                        <div className="text-xs text-muted font-semibold uppercase">VS</div>
                        {m.matchDate && <div className="text-[10px] text-muted/70 mt-0.5">{formatDate(m.matchDate)}</div>}
                      </div>
                      <span className="text-sm font-medium flex-1 text-foreground/80 group-hover:text-gold transition-colors">{m.awayTeam?.name || "TBD"}</span>
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Rankings */}
            <div className="grid sm:grid-cols-3 gap-6">
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-gold text-sm">⚽</span>
                  <span className="gold-text">Artilheiros</span>
                </h3>
                <div className="glass rounded-xl p-3 space-y-1.5">
                  {topScorers.length === 0 ? (
                    <p className="text-xs text-muted text-center p-3">Nenhum dado ainda.</p>
                  ) : (
                    topScorers.map((s, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <span className="w-5 text-center font-bold text-gold text-xs">{i + 1}.</span>
                        <span className="flex-1 text-sm">{playerName(s.playerId)}</span>
                        <span className="text-xs text-muted">{s._sum.goals} gol</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-gold text-sm">🅰️</span>
                  <span className="gold-text">Assistências</span>
                </h3>
                <div className="glass rounded-xl p-3 space-y-1.5">
                  {assistsList.length === 0 ? (
                    <p className="text-xs text-muted text-center p-3">Nenhum dado ainda.</p>
                  ) : (
                    assistsList.map((s, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <span className="w-5 text-center font-bold text-gold text-xs">{i + 1}.</span>
                        <span className="flex-1 text-sm">{playerName(s.playerId)}</span>
                        <span className="text-xs text-muted">{Number(s.assists) || 0} assist.</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
              <div>
                <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                  <span className="text-gold text-sm">🧤</span>
                  <span className="gold-text">Goleiros</span>
                </h3>
                <div className="glass rounded-xl p-3 space-y-1.5">
                  {gksList.length === 0 ? (
                    <p className="text-xs text-muted text-center p-3">Nenhum dado ainda.</p>
                  ) : (
                    gksList.map((s, i: number) => (
                      <div key={i} className="flex items-center gap-2 p-2 rounded-lg hover:bg-white/5 transition-colors">
                        <span className="w-5 text-center font-bold text-gold text-xs">{i + 1}.</span>
                        <span className="flex-1 text-sm">{playerName(s.playerId)}</span>
                        <span className="text-xs text-muted">{Number(s.saves) || 0} defesas</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Coluna 3: Notícias */}
          <div className="space-y-8">
            <div>
              <h2 className="text-xl font-bold mb-5 flex items-center gap-2">
                <span className="w-1 h-5 bg-gold rounded-full" />
                <span className="gold-text">Últimas Notícias</span>
              </h2>
              {latestNews.length === 0 ? (
                <div className="glass rounded-xl p-8 text-center">
                  <p className="text-muted text-sm">Nenhuma notícia publicada ainda.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {latestNews.map((n) => (
                    <Link key={n.id} href={`/noticias`} className="glass rounded-xl p-4 block hover:bg-card/60 transition-colors group">
                      <span className="text-[10px] uppercase tracking-wider text-gold">{n.category}</span>
                      <h3 className="text-sm font-semibold mt-1 group-hover:text-gold transition-colors">{n.title}</h3>
                      <p className="text-xs text-muted mt-1 line-clamp-2">{n.content}</p>
                      <span className="text-[10px] text-muted/50 mt-2 block">{formatDate(n.createdAt)}</span>
                    </Link>
                  ))}
                </div>
              )}
              <Link href="/noticias" className="inline-block mt-4 text-xs text-gold hover:underline">Ver todas as notícias →</Link>
            </div>

            {/* Últimos Eventos de Partida */}
            <div>
              <h3 className="text-lg font-bold mb-3 flex items-center gap-2">
                <span className="w-1 h-4 bg-gold rounded-full" />
                <span className="text-foreground">Últimos Campeões</span>
              </h3>
              <div className="glass rounded-xl p-4 text-sm text-muted text-center">
                <p>Em breve...</p>
              </div>
            </div>

            {/* Jogador destaque */}
            <div className="glass rounded-xl p-4 text-sm text-muted text-center">
              <p className="text-gold font-semibold mb-1">🌟 Jogador destaque</p>
              <p>Em breve...</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}