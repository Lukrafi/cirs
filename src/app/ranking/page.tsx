import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function RankingPage() {
  const [topScorers, topAssists, topMvp, topGk] = await Promise.all([
    prisma.matchStat.groupBy({
      by: ["playerId"],
      _sum: { goals: true },
      orderBy: { _sum: { goals: "desc" } },
      take: 10,
    }),
    prisma.matchStat.groupBy({
      by: ["playerId"],
      _sum: { assists: true },
      orderBy: { _sum: { assists: "desc" } },
      take: 10,
    }),
    prisma.matchStat.groupBy({
      by: ["playerId"],
      _count: { mvp: true },
      where: { mvp: true },
      orderBy: { _count: { mvp: "desc" } },
      take: 10,
    }),
    prisma.matchStat.groupBy({
      by: ["playerId"],
      _sum: { saves: true },
      orderBy: { _sum: { saves: "desc" } },
      take: 10,
    }),
  ]);

  const playerIds = new Set<string>();
  topScorers.forEach((s) => s.playerId && playerIds.add(s.playerId));
  topAssists.forEach((s) => s.playerId && playerIds.add(s.playerId));
  topMvp.forEach((s) => s.playerId && playerIds.add(s.playerId));
  topGk.forEach((s) => s.playerId && playerIds.add(s.playerId));

  const players = await prisma.player.findMany({
    where: { id: { in: Array.from(playerIds) } },
    include: { club: true },
  });

  const playerMap = new Map(players.map((p) => [p.id, p]));

  const sections = [
    { title: "Artilharia", data: topScorers, stat: "goals", label: "Gols" },
    { title: "Assistências", data: topAssists, stat: "assists", label: "Assists" },
    { title: "MVP", data: topMvp, stat: "mvp", label: "MVPs", isCount: true },
    { title: "Goleiros", data: topGk, stat: "saves", label: "Defesas" },
  ];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Ranking</span>
      </h1>
      <p className="text-muted mb-8">Rankings automáticos de jogadores e clubes.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => (
          <div key={section.title} className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-gold">{section.title}</h2>
            {section.data.length === 0 ? (
              <p className="text-muted text-sm">Nenhum dado disponível ainda.</p>
            ) : (
              <div className="space-y-2">
                {section.data.map((item, idx) => {
                  const player = item.playerId ? playerMap.get(item.playerId) : null;
                  const statValue = section.isCount
                    ? ((item as { _count: Record<string, number> })._count?.[section.stat] || 0)
                    : ((item as { _sum: Record<string, number> })._sum?.[section.stat] || 0);
                  return (
                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className="text-lg font-bold text-muted w-8">{idx + 1}</span>
                      <div className="flex-1">
                        <span className="font-medium text-sm">{player?.name || "—"}</span>
                        <span className="block text-xs text-muted">{player?.club?.name || "Sem clube"}</span>
                      </div>
                      <span className="text-lg font-bold gold-text">{statValue}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Club Ranking */}
      <div className="glass rounded-2xl p-6 mt-6">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-gold">Ranking de Clubes</h2>
        <ClubsRanking />
      </div>
    </div>
  );
}

async function ClubsRanking() {
  const clubs = await prisma.club.findMany({
    orderBy: { name: "asc" },
  });
  const standings = await prisma.standing.findMany({
    where: { clubId: { in: clubs.map((c) => c.id) } },
    include: { club: true },
  });

  const clubPoints = new Map<string, number>();
  standings.forEach((s) => {
    if (s.clubId) clubPoints.set(s.clubId, (clubPoints.get(s.clubId) || 0) + s.points);
  });

  const ranked = clubs
    .map((c) => ({ ...c, totalPoints: clubPoints.get(c.id) || 0 }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  if (ranked.length === 0 || ranked.every((r) => r.totalPoints === 0)) {
    return <p className="text-muted text-sm">Nenhum dado disponível ainda.</p>;
  }

  return (
    <div className="space-y-2">
      {ranked.map((c, idx) => (
        <div key={c.id} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
          <span className="text-lg font-bold text-muted w-8">{idx + 1}</span>
          {c.emblem && <img src={c.emblem} alt={c.name} className="w-8 h-8 rounded object-cover" />}
          <span className="flex-1 font-medium text-sm">{c.name}</span>
          <span className="text-lg font-bold gold-text">{c.totalPoints} pts</span>
        </div>
      ))}
    </div>
  );
}
