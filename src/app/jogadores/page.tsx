import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Jogadores & Ranking — CIRS",
  description: "Ranking completo de jogadores por Overall e estatísticas da temporada.",
};

export default async function JogadoresPage() {
  const [players, topScorers, topAssists, topMvp, topGk, topPowerShots, topCleanSheets] =
    await Promise.all([
      prisma.player.findMany({
        include: { club: true },
        orderBy: { overall: "desc" },
        take: 50,
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
      prisma.matchStat.groupBy({
        by: ["playerId"],
        _sum: { powerShots: true },
        orderBy: { _sum: { powerShots: "desc" } },
        take: 10,
      }),
      prisma.matchStat.groupBy({
        by: ["playerId"],
        _count: { cleanSheet: true },
        where: { cleanSheet: true },
        orderBy: { _count: { cleanSheet: "desc" } },
        take: 10,
      }),
    ]);

  const statPlayerIds = new Set<string>();
  [topScorers, topAssists, topMvp, topGk, topPowerShots, topCleanSheets].forEach((arr) =>
    arr.forEach((s) => s.playerId && statPlayerIds.add(s.playerId))
  );

  const statPlayers = await prisma.player.findMany({
    where: { id: { in: Array.from(statPlayerIds) } },
    include: { club: true },
  });
  const statPlayerMap = new Map(statPlayers.map((p) => [p.id, p]));

  const rankingSections = [
    { title: "Artilharia", data: topScorers, getValue: (item: { _sum: Record<string, number> }) => item._sum.goals || 0 },
    { title: "Assistências", data: topAssists, getValue: (item: { _sum: Record<string, number> }) => item._sum.assists || 0 },
    { title: "MVP", data: topMvp, getValue: (item: { _count: Record<string, number> }) => item._count?.mvp || 0 },
    { title: "Goleiros", data: topGk, getValue: (item: { _sum: Record<string, number> }) => item._sum.saves || 0 },
    { title: "Power Shots", data: topPowerShots, getValue: (item: { _sum: Record<string, number> }) => item._sum.powerShots || 0 },
    { title: "Clean Sheets", data: topCleanSheets, getValue: (item: { _count: Record<string, number> }) => item._count?.cleanSheet || 0 },
  ];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Jogadores</span>
      </h1>
      <p className="text-muted mb-8">
        Ranking por Overall e estatísticas da temporada. Clique em um jogador para ver o card completo.
      </p>

      {/* Ranking de Overall */}
      <section className="mb-10">
        <h2 className="text-xl font-bold gold-text mb-4 flex items-center gap-2">
          <span className="w-1 h-5 bg-gold rounded-full" />
          Ranking Overall
        </h2>
        {players.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-muted text-lg">Nenhum jogador cadastrado ainda.</p>
          </div>
        ) : (
          <div className="glass rounded-2xl overflow-hidden">
            <div className="flex text-xs text-muted uppercase px-6 py-3 border-b border-border">
              <span className="w-10">#</span>
              <span className="flex-1">Jogador</span>
              <span className="hidden sm:block flex-1">Clube</span>
              <span className="w-16 text-center">Pos</span>
              <span className="w-16 text-right">OVR</span>
            </div>
            {players.map((p, i) => (
              <Link
                key={p.id}
                href={`/jogadores/${p.id}`}
                className={`flex items-center px-6 py-3 text-sm border-b border-border/50 last:border-0 hover:bg-white/5 transition-colors group ${
                  i < 3 ? "bg-gold/5" : ""
                }`}
              >
                <span
                  className={`w-10 font-bold ${
                    i === 0
                      ? "text-gold"
                      : i === 1
                      ? "text-muted/80"
                      : i === 2
                      ? "text-amber-700"
                      : "text-muted"
                  }`}
                >
                  {i + 1}
                </span>
                {p.photo ? (
                  <img src={p.photo} alt="" className="w-8 h-8 rounded-full object-cover mr-3" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-blue-deep flex items-center justify-center text-xs font-bold text-gold mr-3 shrink-0">
                    {p.name.charAt(0)}
                  </div>
                )}
                <span className="flex-1 font-medium group-hover:text-gold transition-colors">{p.name}</span>
                <span className="hidden sm:block flex-1 text-muted text-xs">{p.club?.name || "Sem clube"}</span>
                <span className="w-16 text-center text-xs text-muted">{p.position}</span>
                <span className="w-16 text-right font-bold gold-text text-lg">{p.overall}</span>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Rankings Estatísticos */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {rankingSections.map((section) => (
          <div key={section.title} className="glass rounded-2xl p-6">
            <h3 className="text-lg font-bold uppercase tracking-wider text-gold mb-4">
              {section.title}
            </h3>
            {section.data.length === 0 ? (
              <p className="text-muted text-sm">Nenhum dado disponível.</p>
            ) : (
              <div className="space-y-2">
                {section.data.map((item, idx) => {
                  const playerId = item.playerId;
                  if (!playerId) return null;
                  const player = statPlayerMap.get(playerId);
                  const statValue = section.getValue(item as { _sum: Record<string, number>; _count: Record<string, number> });
                  return (
                    <div
                      key={idx}
                      className="flex items-center gap-3 py-2 border-b border-border last:border-0"
                    >
                      <span
                        className={`text-lg font-bold w-8 ${
                          idx === 0 ? "text-gold" : "text-muted"
                        }`}
                      >
                        {idx + 1}
                      </span>
                      <div className="flex-1">
                        <Link
                          href={`/jogadores/${playerId}`}
                          className="font-medium text-sm hover:text-gold transition-colors"
                        >
                          {player?.name || "—"}
                        </Link>
                        <span className="block text-xs text-muted">
                          {player?.club?.name || "Sem clube"}
                        </span>
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
    </div>
  );
}
