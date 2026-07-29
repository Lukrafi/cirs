import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";

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
    },
  });

  if (!club) notFound();

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="flex items-center gap-4 mb-8">
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
                  <div
                    className="bg-gradient-to-r from-gold to-yellow-300 h-2 rounded-full"
                    style={{ width: `${attr.value}%` }}
                  />
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

      <h2 className="text-xl font-bold uppercase text-gold mb-4">Elenco</h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {club.players.map((p) => (
          <Link
            key={p.id}
            href={`/jogadores/${p.id}`}
            className="glass rounded-xl p-4 hover:gold-border transition-all duration-300 group flex items-center gap-3"
          >
            {p.photo ? (
              <img src={p.photo} alt={p.name} className="w-12 h-12 rounded-full object-cover" />
            ) : (
              <div className="w-12 h-12 rounded-full bg-blue-deep flex items-center justify-center font-bold text-gold">
                {p.name.charAt(0)}
              </div>
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
