import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function PlayerDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const player = await prisma.player.findUnique({
    where: { id },
    include: {
      club: true,
      matchStats: { include: { match: { include: { homeTeam: true, awayTeam: true } } }, orderBy: { createdAt: "desc" } },
    },
  });

  if (!player) notFound();

  const totalStats = player.matchStats.reduce(
    (acc, s) => ({
      goals: acc.goals + s.goals,
      assists: acc.assists + s.assists,
      powerShots: acc.powerShots + s.powerShots,
      shots: acc.shots + s.shots,
      passes: acc.passes + s.passes,
      mvp: acc.mvp + (s.mvp ? 1 : 0),
      yellow: acc.yellow + s.yellowCards,
      red: acc.red + s.redCards,
      matches: acc.matches + 1,
    }),
    { goals: 0, assists: 0, powerShots: 0, shots: 0, passes: 0, mvp: 0, yellow: 0, red: 0, matches: 0 }
  );

  const attrs = [
    { label: "Pace", value: player.pace },
    { label: "Shooting", value: player.shooting },
    { label: "Passing", value: player.passing },
    { label: "Dribbling", value: player.dribbling },
    { label: "Defending", value: player.defending },
    { label: "Physical", value: player.physical },
    { label: "Goalkeeper", value: player.goalkeeperStats },
  ];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
        {player.photo ? (
          <img src={player.photo} alt={player.name} className="w-20 h-20 rounded-full object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-full bg-blue-deep flex items-center justify-center text-3xl font-bold text-gold">
            {player.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-black">{player.name}</h1>
          <p className="text-muted">
            {player.club && <Link href={`/times/${player.club.id}`} className="hover:text-gold">{player.club.name}</Link>}
            {" • "}
            {player.position} #{player.number}
          </p>
        </div>
        <div className="ml-auto glass rounded-xl px-6 py-3 text-center">
          <div className="text-4xl font-bold gold-text">{player.overall}</div>
          <div className="text-xs text-muted uppercase">Overall</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm uppercase text-gold tracking-wider mb-4">Atributos</h2>
          <div className="space-y-3">
            {attrs.map((a) => (
              <div key={a.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">{a.label}</span>
                  <span className="font-bold gold-text">{a.value}</span>
                </div>
                <div className="w-full bg-blue-deep rounded-full h-2">
                  <div className="bg-gradient-to-r from-gold to-yellow-300 h-2 rounded-full" style={{ width: `${a.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm uppercase text-gold tracking-wider mb-4">Informações</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between"><dt className="text-muted">Idade</dt><dd>{player.age} anos</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Nacionalidade</dt><dd>{player.nationality}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Pé dominante</dt><dd>{player.dominantFoot}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Altura</dt><dd>{player.height} m</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Peso</dt><dd>{player.weight} kg</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Partidas</dt><dd>{totalStats.matches}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Gols</dt><dd className="font-bold gold-text">{totalStats.goals}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Assistências</dt><dd className="font-bold gold-text">{totalStats.assists}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">MVPs</dt><dd className="font-bold gold-text">{totalStats.mvp}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">PowerShots</dt><dd>{totalStats.powerShots}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Amarelos</dt><dd>{totalStats.yellow}</dd></div>
            <div className="flex justify-between"><dt className="text-muted">Vermelhos</dt><dd>{totalStats.red}</dd></div>
          </dl>
        </div>
      </div>

      {player.matchStats.length > 0 && (
        <div>
          <h2 className="text-xl font-bold uppercase text-gold mb-4">Partidas Recentes</h2>
          <div className="glass rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-muted">
                  <th className="p-3">Partida</th>
                  <th className="p-3 text-center">Gols</th>
                  <th className="p-3 text-center">Assists</th>
                  <th className="p-3 text-center">Nota</th>
                  <th className="p-3 text-center">MVP</th>
                </tr>
              </thead>
              <tbody>
                {player.matchStats.slice(0, 10).map((s) => (
                  <tr key={s.id} className="border-b border-border last:border-0">
                    <td className="p-3">
                      {s.match?.homeTeam?.name} vs {s.match?.awayTeam?.name}
                    </td>
                    <td className="p-3 text-center">{s.goals}</td>
                    <td className="p-3 text-center">{s.assists}</td>
                    <td className="p-3 text-center gold-text font-bold">{s.rating.toFixed(1)}</td>
                    <td className="p-3 text-center">{s.mvp ? "🏆" : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
