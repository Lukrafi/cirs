import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { formatDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const club = await prisma.club.findUnique({
    where: { id },
    include: {
      players: { orderBy: { overall: "desc" } },
      coach: true,
      stadiumRel: true,
      standings: { include: { group: { include: { competition: true } } } },
      sponsors: true,
      awards: { include: { season: true }, orderBy: { date: "desc" } },
      homeMatches: { include: { awayTeam: true, homeTeam: true }, where: { status: "finished" }, orderBy: { updatedAt: "desc" }, take: 5 },
      awayMatches: { include: { awayTeam: true, homeTeam: true }, where: { status: "finished" }, orderBy: { updatedAt: "desc" }, take: 5 },
    },
  });

  if (!club) return notFound();

  const recentMatches = [...(club.homeMatches || []), ...(club.awayMatches || [])]
    .sort((a, b) => (b.updatedAt?.getTime() || 0) - (a.updatedAt?.getTime() || 0))
    .slice(0, 5);

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/times" className="text-sm text-muted hover:text-gold transition-colors">← Voltar para Times</Link>

      <div className="flex items-center gap-4 mb-8 mt-4">
        {club.emblem ? (
          <img src={club.emblem} alt={club.name} className="w-20 h-20 rounded-xl object-cover" />
        ) : (
          <div className="w-20 h-20 rounded-xl bg-blue-deep flex items-center justify-center text-3xl font-bold text-gold">
            {club.name.charAt(0)}
          </div>
        )}
        <div>
          <h1 className="text-3xl font-black">{club.name}</h1>
          <p className="text-muted">{club.city}, {club.country} • Fundado em {club.founded}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm uppercase text-gold tracking-wider mb-4">Atributos</h2>
          <div className="space-y-3">
            {[
              { label: "Ataque", value: club.attack },
              { label: "Meio-Campo", value: club.midfield },
              { label: "Defesa", value: club.defense },
              { label: "Goleiro", value: club.goalkeeper },
              { label: "Entrosamento", value: club.chemistry },
              { label: "Forma", value: club.form },
              { label: "Moral", value: club.morale },
            ].map((attr) => (
              <div key={attr.label}>
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted">{attr.label}</span>
                  <span className="font-bold gold-text">{attr.value}</span>
                </div>
                <div className="w-full bg-blue-deep rounded-full h-2">
                  <div className="bg-gradient-to-r from-gold to-yellow-300 h-2 rounded-full" style={{ width: `${attr.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm uppercase text-gold tracking-wider mb-4">Informações</h2>
          <dl className="space-y-3 text-sm">
            <div><dt className="text-muted">Técnico</dt><dd className="font-medium">{club.coach?.name || "—"}</dd></div>
            <div><dt className="text-muted">Estádio</dt><dd className="font-medium">{club.stadiumRel?.name || "—"}</dd></div>
            <div><dt className="text-muted">Uniforme Primário</dt><dd className="font-medium">{club.primaryKit || "—"}</dd></div>
            <div><dt className="text-muted">Uniforme Secundário</dt><dd className="font-medium">{club.secondaryKit || "—"}</dd></div>
            <div><dt className="text-muted">Patrocinadores</dt><dd className="font-medium">{club.sponsors.length || 0}</dd></div>
          </dl>
        </div>

        <div className="glass rounded-2xl p-6">
          <h2 className="text-sm uppercase text-gold tracking-wider mb-4">Classificações</h2>
          {club.standings.length === 0 ? (
            <p className="text-muted text-sm">Sem classificações ainda.</p>
          ) : (
            <div className="space-y-2">
              {club.standings.map((s) => (
                <div key={s.id} className="text-sm">
                  <div className="text-muted text-xs">{s.group?.competition?.name || "—"}</div>
                  <div className="flex gap-4 mt-1">
                    <span>{s.points} pts</span>
                    <span className="text-muted">{s.wins}V {s.draws}E {s.losses}D</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Títulos */}
      {club.awards.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold uppercase text-gold mb-4">Títulos e Premiações</h2>
          <div className="glass rounded-2xl p-6 space-y-2">
            {club.awards.map((a) => (
              <div key={a.id} className="flex items-center gap-3 text-sm border-b border-border last:border-0 pb-2 last:pb-0">
                <span className="text-2xl">🏆</span>
                <div className="flex-1">
                  <span className="font-bold">{a.title}</span>
                  <span className="text-muted ml-2">({a.category})</span>
                </div>
                {a.season && <span className="text-xs text-muted">{a.season.name}</span>}
                <span className="text-xs text-muted">{formatDate(a.date)}</span>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Últimos Jogos */}
      {recentMatches.length > 0 && (
        <section className="mb-8">
          <h2 className="text-xl font-bold uppercase text-gold mb-4">Últimos Jogos</h2>
          <div className="space-y-2">
            {recentMatches.map((m) => {
              const isHome = m.homeTeamId === club.id;
              const opp = isHome ? m.awayTeam : m.homeTeam;
              const ourScore = isHome ? m.homeScore : m.awayScore;
              const oppScore = isHome ? m.awayScore : m.homeScore;
              const result = (ourScore ?? 0) > (oppScore ?? 0) ? "V" : (ourScore ?? 0) < (oppScore ?? 0) ? "D" : "E";
              return (
                <Link key={m.id} href={`/simulacoes/${m.id}`} className="glass rounded-lg p-3 flex items-center gap-4 hover:bg-card/60 transition-colors text-sm">
                  <span className={`font-bold w-6 text-center ${result === "V" ? "text-green-500" : result === "D" ? "text-red-500" : "text-muted"}`}>{result}</span>
                  <span className="flex-1">{isHome ? "vs" : "@"} {opp?.name || "TBD"}</span>
                  <span className="font-bold gold-text">{ourScore} - {oppScore}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Elenco */}
      <h2 className="text-xl font-bold uppercase text-gold mb-4">Elenco</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {club.players.map((p) => (
          <Link key={p.id} href={`/jogadores/${p.id}`} className="glass rounded-xl p-4 hover:gold-border transition-all duration-300 group flex items-center gap-3">
            {p.photo ? (
              <img src={p.photo} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-deep flex items-center justify-center font-bold text-gold">{p.name.charAt(0)}</div>
            )}
            <div className="flex-1">
              <h3 className="text-sm font-bold group-hover:text-gold transition-colors">{p.name}</h3>
              <p className="text-xs text-muted">{p.position} #{p.number}</p>
            </div>
            <div className="text-right">
              <div className="text-xl font-bold gold-text">{p.overall}</div>
            </div>
          </Link>
        ))}
      </div>
      {club.players.length === 0 && <p className="text-muted">Nenhum jogador no elenco.</p>}
    </div>
  );
}
