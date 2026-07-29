import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function SimulacoesPage() {
  const matches = await prisma.match.findMany({
    include: {
      homeTeam: true,
      awayTeam: true,
      group: { include: { competition: true } },
    },
    orderBy: { matchDate: "desc" },
    take: 50,
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Simulações</span>
      </h1>
      <p className="text-muted mb-8">Resultados de partidas simuladas e próximas simulações.</p>

      {matches.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhuma partida encontrada.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <Link
              key={m.id}
              href={`/simulacoes/${m.id}`}
              className="glass rounded-xl p-4 hover:gold-border transition-all duration-300 flex items-center justify-between gap-4"
            >
              <div className="flex items-center gap-3 flex-1 justify-end">
                <span className="text-sm font-medium text-right">{m.homeTeam?.name || "—"}</span>
                {m.homeTeam?.emblem && <img src={m.homeTeam.emblem} alt="" className="w-8 h-8 rounded object-cover" />}
              </div>

              <div className="text-center px-4 py-2 bg-blue-deep rounded-lg gold-border min-w-[100px]">
                {m.status === "finished" ? (
                  <span className="text-xl font-bold gold-text">
                    {m.homeScore} - {m.awayScore}
                  </span>
                ) : (
                  <span className="text-xs text-muted uppercase">{m.status}</span>
                )}
                {m.isSimulated && <div className="text-[10px] text-muted mt-0.5">Simulado</div>}
              </div>

              <div className="flex items-center gap-3 flex-1">
                {m.awayTeam?.emblem && <img src={m.awayTeam.emblem} alt="" className="w-8 h-8 rounded object-cover" />}
                <span className="text-sm font-medium">{m.awayTeam?.name || "—"}</span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
