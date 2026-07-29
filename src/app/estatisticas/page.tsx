import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function EstatisticasPage() {
  const [totalMatches, totalClubs, totalPlayers, totalGoals] = await Promise.all([
    prisma.match.count({ where: { status: "finished" } }),
    prisma.club.count(),
    prisma.player.count(),
    prisma.matchStat.aggregate({ _sum: { goals: true } }),
  ]);

  const stats = [
    { label: "Partidas", value: totalMatches },
    { label: "Clubes", value: totalClubs },
    { label: "Jogadores", value: totalPlayers },
    { label: "Gols Totais", value: totalGoals._sum.goals || 0 },
  ];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Estatísticas</span>
      </h1>
      <p className="text-muted mb-8">Estatísticas gerais da CIRS.</p>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-10">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6 text-center">
            <div className="text-4xl font-bold gold-text">{s.value}</div>
            <div className="text-xs text-muted uppercase mt-2 tracking-wider">{s.label}</div>
          </div>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-xl font-bold mb-4 uppercase tracking-wider text-gold">Estatísticas Detalhadas</h2>
        <DetailedStats />
      </div>
    </div>
  );
}

async function DetailedStats() {
  const stats = await prisma.matchStat.aggregate({
    _sum: {
      goals: true,
      assists: true,
      powerShots: true,
      shots: true,
      shotsOnTarget: true,
      passes: true,
      tackles: true,
      interceptions: true,
      saves: true,
      yellowCards: true,
      redCards: true,
    },
  });

  const items = [
    { label: "Gols", value: stats._sum.goals || 0 },
    { label: "Assistências", value: stats._sum.assists || 0 },
    { label: "PowerShots", value: stats._sum.powerShots || 0 },
    { label: "Chutes", value: stats._sum.shots || 0 },
    { label: "Chutes no gol", value: stats._sum.shotsOnTarget || 0 },
    { label: "Passes", value: stats._sum.passes || 0 },
    { label: "Desarmes", value: stats._sum.tackles || 0 },
    { label: "Interceptações", value: stats._sum.interceptions || 0 },
    { label: "Defesas", value: stats._sum.saves || 0 },
    { label: "Cartões amarelos", value: stats._sum.yellowCards || 0 },
    { label: "Cartões vermelhos", value: stats._sum.redCards || 0 },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
      {items.map((item) => (
        <div key={item.label} className="border border-border rounded-lg p-3 text-center">
          <div className="text-2xl font-bold gold-text">{item.value}</div>
          <div className="text-xs text-muted mt-1">{item.label}</div>
        </div>
      ))}
    </div>
  );
}
