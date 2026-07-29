import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function HallDaFamaPage() {
  const [topChampions, topScorers, topAssists, topGk] = await Promise.all([
    prisma.award.findMany({
      where: { category: { contains: "champion" } },
      include: { club: true, player: true, season: true },
      take: 20,
      orderBy: { date: "desc" },
    }),
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
      _sum: { saves: true },
      orderBy: { _sum: { saves: "desc" } },
      take: 10,
    }),
  ]);

  const playerIds = new Set<string>();
  [...topScorers, ...topAssists, ...topGk].forEach((s) => s.playerId && playerIds.add(s.playerId));
  const players = await prisma.player.findMany({
    where: { id: { in: Array.from(playerIds) } },
    include: { club: true },
  });
  const playerMap = new Map(players.map((p) => [p.id, p]));

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Hall da Fama</span>
      </h1>
      <p className="text-muted mb-8">Maiores campeões, artilheiros e recordes da CIRS.</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {[
          { title: "Maiores Artilheiros", data: topScorers, stat: "goals" },
          { title: "Maiores Assistentes", data: topAssists, stat: "assists" },
        ].map((section) => (
          <div key={section.title} className="glass rounded-2xl p-6">
            <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-gold">{section.title}</h2>
            {section.data.length === 0 ? (
              <p className="text-muted text-sm">Nenhum dado disponível ainda.</p>
            ) : (
              <div className="space-y-2">
                {section.data.map((item, idx) => {
                  const player = item.playerId ? playerMap.get(item.playerId) : null;
                  const val = (item._sum as Record<string, number>)[section.stat] || 0;
                  return (
                    <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                      <span className="text-lg w-8 text-gold">{idx + 1}</span>
                      {player?.photo && <img src={player.photo} alt="" className="w-8 h-8 rounded-full" />}
                      <div className="flex-1">
                        <span className="text-sm font-medium">{player?.name || "—"}</span>
                        <span className="block text-xs text-muted">{player?.club?.name || ""}</span>
                      </div>
                      <span className="text-lg font-bold gold-text">{val}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-gold">Maiores Campeões</h2>
        {topChampions.length === 0 ? (
          <p className="text-muted text-sm">Nenhum campeão registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {topChampions.map((a, idx) => (
              <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                <span className="text-2xl">🏆</span>
                <div className="flex-1">
                  <span className="text-sm font-medium">{a.title}</span>
                  <span className="block text-xs text-muted">{a.player?.name || a.club?.name} • {a.season?.name || ""}</span>
                </div>
                <span className="text-xs text-muted">{new Date(a.date).toLocaleDateString("pt-BR")}</span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-gold">Melhores Goleiros</h2>
        {topGk.length === 0 ? (
          <p className="text-muted text-sm">Nenhum dado disponível ainda.</p>
        ) : (
          <div className="space-y-2">
            {topGk.map((item, idx) => {
              const player = item.playerId ? playerMap.get(item.playerId) : null;
              const val = item._sum.saves || 0;
              return (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className="text-lg w-8 text-muted">{idx + 1}</span>
                  <span className="text-sm font-medium flex-1">{player?.name || "—"}</span>
                  <span className="text-sm text-muted">{val} defesas</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
