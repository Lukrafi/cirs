import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function HallOfFamePage() {
  const [champions, topScorers, topAssists, topGk, topMvp, topPowerShots, topCleanSheets] = await Promise.all([
    prisma.award.findMany({
      where: { OR: [{ category: { contains: "champion" } }, { category: { contains: "campeao" } }, { category: { contains: "titulo" } }] },
      include: { club: true, player: { include: { club: true } }, season: true },
      orderBy: { date: "desc" },
      take: 20,
    }),
    prisma.matchStat.groupBy({ by: ["playerId"], _sum: { goals: true }, orderBy: { _sum: { goals: "desc" } }, take: 10 }),
    prisma.matchStat.groupBy({ by: ["playerId"], _sum: { assists: true }, orderBy: { _sum: { assists: "desc" } }, take: 10 }),
    prisma.matchStat.groupBy({ by: ["playerId"], _sum: { saves: true }, orderBy: { _sum: { saves: "desc" } }, take: 5 }),
    prisma.matchStat.groupBy({ by: ["playerId"], _count: { mvp: true }, where: { mvp: true }, orderBy: { _count: { mvp: "desc" } }, take: 10 }),
    prisma.matchStat.groupBy({ by: ["playerId"], _sum: { powerShots: true }, orderBy: { _sum: { powerShots: "desc" } }, take: 5 }),
    prisma.matchStat.groupBy({ by: ["playerId"], _count: { cleanSheet: true }, where: { cleanSheet: true }, orderBy: { _count: { cleanSheet: "desc" } }, take: 5 }),
  ]);

  const allPlayerIds = new Set<string>();
  [topScorers, topAssists, topGk, topMvp, topPowerShots, topCleanSheets].forEach((arr) =>
    arr.forEach((s) => s.playerId && allPlayerIds.add(s.playerId))
  );
  const players = await prisma.player.findMany({ where: { id: { in: Array.from(allPlayerIds) } }, include: { club: true } });
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  function renderRanking(title: string, data: any[], statKey: string, isCount = false) {
    return (
      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-gold">{title}</h2>
        {data.length === 0 ? (
          <p className="text-muted text-sm">Nenhum dado disponível.</p>
        ) : (
          <div className="space-y-2">
            {data.map((item, idx) => {
              const playerId = item.playerId;
              if (!playerId) return null;
              const player = playerMap.get(playerId);
              const val = isCount ? (item._count?.[statKey] || 0) : (item._sum?.[statKey] || 0);
              return (
                <div key={idx} className="flex items-center gap-3 py-2 border-b border-border last:border-0">
                  <span className={`text-lg font-bold w-8 ${idx === 0 ? "text-gold" : "text-muted"}`}>{idx + 1}</span>
                  {player?.photo ? (
                    <img src={player.photo} alt={player.name} className="w-8 h-8 rounded-full object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-blue-deep flex items-center justify-center text-xs font-bold text-gold">{player?.name?.charAt(0) || "?"}</div>
                  )}
                  <div className="flex-1">
                    <Link href={`/jogadores/${playerId}`} className="font-medium text-sm hover:text-gold transition-colors">{player?.name || "—"}</Link>
                    <span className="block text-xs text-muted">{player?.club?.name || "Sem clube"}</span>
                  </div>
                  <span className="text-lg font-bold gold-text">{val}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2"><span className="gold-text">Hall da Fama</span></h1>
      <p className="text-muted mb-8">Os maiores nomes da história da CIRS.</p>

      {/* Maiores Campeões */}
      <section className="mb-10">
        <h2 className="text-2xl font-bold mb-6"><span className="gold-text">Maiores Campeões</span></h2>
        {champions.length === 0 ? (
          <p className="text-muted">Nenhum campeão registrado ainda.</p>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {champions.map((a) => (
              <div key={a.id} className="glass rounded-xl p-5 flex items-center gap-4">
                <span className="text-4xl">🏆</span>
                <div className="flex-1">
                  <h3 className="font-bold">{a.title}</h3>
                  <p className="text-xs text-muted mt-1">
                    {a.player?.name || ""}{a.player && a.club ? " • " : ""}{a.club?.name || ""}
                  </p>
                  <p className="text-xs text-muted">{a.season?.name || formatDate(a.date)}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Rankings históricos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {renderRanking("Maiores Artilheiros", topScorers, "goals")}
        {renderRanking("Maiores Assistentes", topAssists, "assists")}
        {renderRanking("Mais MVPs", topMvp, "mvp", true)}
        {renderRanking("Melhores Goleiros", topGk, "saves")}
        {renderRanking("Power Shots", topPowerShots, "powerShots")}
        {renderRanking("Clean Sheets", topCleanSheets, "cleanSheet", true)}
      </div>
    </div>
  );
}
