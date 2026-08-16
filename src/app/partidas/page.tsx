import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Partidas — CIRS",
  description: "Partidas jogadas ativamente no Haxball pelo servidor CIRS.",
};

export default async function PartidasPage() {
  const [finished, scheduled] = await Promise.all([
    prisma.match.findMany({
      where: { status: "finished", isSimulated: false },
      include: {
        homeTeam: true,
        awayTeam: true,
        group: { include: { competition: true } },
      },
      orderBy: { updatedAt: "desc" },
      take: 30,
    }),
    prisma.match.findMany({
      where: { status: "scheduled", isSimulated: false },
      include: {
        homeTeam: true,
        awayTeam: true,
        group: { include: { competition: true } },
      },
      orderBy: { matchDate: "asc" },
      take: 10,
    }),
  ]);

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="mb-2">
        <span className="text-xs uppercase tracking-[0.3em] text-gold font-semibold">
          Jogadas no Haxball
        </span>
      </div>
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Partidas</span>
      </h1>
      <p className="text-muted mb-8 max-w-3xl">
        Partidas ativas disputadas no servidor CIRS via Haxball. As simulações de bastidores ficam em{" "}
        <Link href="/simulacoes" className="text-gold hover:underline">Simulações</Link>.
      </p>

      {scheduled.length > 0 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold gold-text mb-4">Próximos Jogos</h2>
          <div className="space-y-2">
            {scheduled.map((m) => (
              <Link
                key={m.id}
                href={`/simulacoes/match/${m.id}`}
                className="glass rounded-lg p-3 flex items-center gap-3 hover:bg-card/60 transition-colors text-sm"
              >
                <div className="flex-1 flex items-center justify-end gap-2">
                  <span className="font-medium text-right">{m.homeTeam?.name || "—"}</span>
                  {m.homeTeam?.emblem && (
                    <img src={m.homeTeam.emblem} alt="" className="w-6 h-6 rounded object-contain" />
                  )}
                </div>
                <div className="text-center px-3 py-1 bg-blue-deep rounded gold-border min-w-[80px]">
                  <span className="text-xs text-muted uppercase">vs</span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  {m.awayTeam?.emblem && (
                    <img src={m.awayTeam.emblem} alt="" className="w-6 h-6 rounded object-contain" />
                  )}
                  <span className="font-medium">{m.awayTeam?.name || "—"}</span>
                </div>
                {m.matchDate && (
                  <span className="text-xs text-muted min-w-[60px] text-right">
                    {new Date(m.matchDate).toLocaleDateString("pt-BR", {
                      day: "2-digit",
                      month: "2-digit",
                    })}
                  </span>
                )}
              </Link>
            ))}
          </div>
        </section>
      )}

      <section>
        <h2 className="text-xl font-bold gold-text mb-4">Resultados</h2>
        {finished.length === 0 ? (
          <div className="glass rounded-2xl p-12 text-center">
            <p className="text-muted text-lg">Nenhuma partida disputada ainda.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {finished.map((m) => (
              <Link
                key={m.id}
                href={`/simulacoes/match/${m.id}`}
                className="glass rounded-lg p-3 flex items-center gap-3 hover:bg-card/60 transition-colors text-sm"
              >
                <div className="flex-1 flex items-center justify-end gap-2">
                  <span className="font-medium text-right">{m.homeTeam?.name || "—"}</span>
                  {m.homeTeam?.emblem && (
                    <img src={m.homeTeam.emblem} alt="" className="w-6 h-6 rounded object-contain" />
                  )}
                </div>
                <div className="text-center px-3 py-1 bg-blue-deep rounded gold-border min-w-[80px]">
                  <span className="font-bold gold-text">
                    {m.homeScore} - {m.awayScore}
                  </span>
                </div>
                <div className="flex-1 flex items-center gap-2">
                  {m.awayTeam?.emblem && (
                    <img src={m.awayTeam.emblem} alt="" className="w-6 h-6 rounded object-contain" />
                  )}
                  <span className="font-medium">{m.awayTeam?.name || "—"}</span>
                </div>
                {m.group?.competition && (
                  <span className="text-xs text-muted min-w-[80px] text-right truncate">
                    {m.group.competition.name}
                  </span>
                )}
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
