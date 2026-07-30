import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import LiveCompetitionView from "@/components/LiveCompetitionView";

export const dynamic = "force-dynamic";

export default async function CentralTemporadaPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const season = await prisma.season.findUnique({
    where: { id },
    include: {
      league: true,
      competitions: {
        include: {
          groups: {
            include: {
              matches: { select: { id: true, status: true, round: true } },
            },
          },
        },
      },
    },
  });

  if (!season) notFound();

  const allComps = season.competitions;
  const totalMatches = allComps.reduce(
    (sum, c) => sum + c.groups.reduce((s, g) => s + g.matches.length, 0),
    0
  );
  const finishedMatches = allComps.reduce(
    (sum, c) =>
      sum + c.groups.reduce((s, g) => s + g.matches.filter((m) => m.status === "finished").length, 0),
    0
  );
  const scheduledMatches = totalMatches - finishedMatches;
  const pct = totalMatches > 0 ? Math.round((finishedMatches / totalMatches) * 100) : 0;

  const pendingComps = allComps.filter(
    (c) => c.groups.some((g) => g.matches.some((m) => m.status === "scheduled"))
  );
  const completedComps = allComps.filter(
    (c) => !c.groups.some((g) => g.matches.some((m) => m.status === "scheduled"))
  );

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/temporadas" className="text-sm text-muted hover:text-gold transition-colors">
        ← Voltar para Temporadas
      </Link>

      <header className="mt-6 glass rounded-2xl p-8 mb-8">
        <div className="flex items-center justify-between flex-wrap gap-4">
          <div>
            <h1 className="text-5xl font-black gold-text">{season.year}</h1>
            <p className="text-muted mt-1">
              {season.league?.name || "Multiplas competicoes"} • {allComps.length} competicoes
            </p>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-2xl font-bold gold-text">{finishedMatches}</div>
              <div className="text-xs text-muted uppercase">Disputadas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gold-text">{scheduledMatches}</div>
              <div className="text-xs text-muted uppercase">Restantes</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gold-text">{completedComps.length}</div>
              <div className="text-xs text-muted uppercase">Concluidas</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold gold-text">{pct}%</div>
              <div className="text-xs text-muted uppercase">Conclusao</div>
            </div>
          </div>
        </div>
        <div className="w-full bg-blue-deep rounded-full h-3 mt-4">
          <div
            className="bg-gradient-to-r from-gold to-yellow-300 h-3 rounded-full transition-all duration-500"
            style={{ width: `${pct}%` }}
          />
        </div>
      </header>

      {pendingComps.length > 0 && (
        <div className="glass rounded-2xl p-6 mb-6 border-l-4 border-yellow-400">
          <h2 className="text-lg font-bold text-yellow-400 mb-3">Pendencias ({pendingComps.length})</h2>
          <p className="text-sm text-muted mb-3">
            Competicoes com partidas pendentes. Nao e possivel avancar para a proxima temporada enquanto houver pendencias.
          </p>
          <div className="space-y-2">
            {pendingComps.map((c) => {
              const compTotal = c.groups.reduce((s, g) => g.matches.length, 0);
              const compFinished = c.groups.reduce(
                (s, g) => g.matches.filter((m) => m.status === "finished").length,
                0
              );
              const compPct = compTotal > 0 ? Math.round((compFinished / compTotal) * 100) : 0;
              return (
                <Link
                  key={c.id}
                  href={`/campeonatos/${c.id}`}
                  className="flex items-center justify-between text-sm p-2 bg-blue-deep/50 rounded-lg hover:bg-white/5 transition-colors"
                >
                  <span className="font-medium">{c.name}</span>
                  <span className="text-muted text-xs">
                    {compFinished}/{compTotal} jogos ({compPct}%) • {c.format}
                  </span>
                </Link>
              );
            })}
          </div>
        </div>
      )}

      <section className="mb-8">
        <h2 className="text-2xl font-bold gold-text mb-4">Todas as Competicoes</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {allComps.map((c) => {
            const compTotal = c.groups.reduce((s, g) => g.matches.length, 0);
            const compFinished = c.groups.reduce(
              (s, g) => g.matches.filter((m) => m.status === "finished").length,
              0
            );
            const compPct = compTotal > 0 ? Math.round((compFinished / compTotal) * 100) : 0;
            const status = compPct === 100 ? "Concluida" : compPct > 0 ? "Em andamento" : "Nao iniciada";
            const statusColor = compPct === 100 ? "text-green-400" : compPct > 0 ? "text-yellow-400" : "text-muted";
            return (
              <Link
                key={c.id}
                href={`/campeonatos/${c.id}`}
                className="glass rounded-xl p-5 hover:gold-border transition-all duration-300"
              >
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-bold">{c.name}</h3>
                  <span className={`text-xs ${statusColor}`}>{status}</span>
                </div>
                <div className="text-xs text-muted mb-3">
                  {c.format} • {c.numTeams} times • {c.type}
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-blue-deep rounded-full h-1.5">
                    <div
                      className="bg-gold h-1.5 rounded-full transition-all"
                      style={{ width: `${compPct}%` }}
                    />
                  </div>
                  <span className="text-xs text-muted w-10 text-right">{compPct}%</span>
                </div>
              </Link>
            );
          })}
        </div>
      </section>

      {allComps.length > 0 && (
        <section>
          <h2 className="text-2xl font-bold gold-text mb-4">Classificacao em Tempo Real</h2>
          <LiveCompetitionView competitionId={allComps[0].id} />
        </section>
      )}
    </div>
  );
}