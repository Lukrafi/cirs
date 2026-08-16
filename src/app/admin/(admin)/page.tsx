import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [clubs, players, matches, news, recentLogs] = await Promise.all([
    prisma.club.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.news.count(),
    prisma.log.findMany({ orderBy: { createdAt: "desc" }, take: 8 }),
  ]);

  const stats = [
    { label: "Clubes", value: clubs, href: "/admin/clubes", icon: "⚽" },
    { label: "Jogadores", value: players, href: "/admin/jogadores", icon: "👤" },
    { label: "Partidas", value: matches, href: "/admin/partidas", icon: "🏟️" },
    { label: "Notícias", value: news, href: "/admin/noticias", icon: "📰" },
  ];

  const actions = [
    { label: "Novo Clube", href: "/admin/clubes" },
    { label: "Novo Jogador", href: "/admin/jogadores" },
    { label: "Nova Notícia", href: "/admin/noticias" },
    { label: "Nova Partida", href: "/admin/partidas" },
    { label: "Nova Liga", href: "/admin/ligas" },
    { label: "Simulador", href: "/admin/simulador" },
    { label: "Logs", href: "/admin/logs" },
  ];

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-black gold-text">Dashboard Admin</h1>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="glass rounded-xl p-4 text-center hover:bg-card/60 transition-colors">
            <div className="text-3xl mb-1">{s.icon}</div>
            <div className="text-2xl font-black gold-text">{s.value}</div>
            <div className="text-xs text-muted uppercase">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section>
          <h2 className="text-xl font-bold mb-4">Ações Rápidas</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {actions.map((a) => (
              <Link key={a.label} href={a.href} className="btn-secondary text-center text-sm py-3 px-4">{a.label}</Link>
            ))}
          </div>
        </section>

        <section>
          <h2 className="text-xl font-bold mb-4">Logs Recentes</h2>
          <div className="glass rounded-xl overflow-hidden">
            {recentLogs.length === 0 ? (
              <p className="text-muted text-sm p-4">Nenhum log ainda.</p>
            ) : (
              <div className="divide-y divide-border">
                {recentLogs.map((l: { id: string; action: string; createdAt: Date; entity: string; entityId?: string | null; details?: string | null }) => (
                  <div key={l.id} className="p-3 text-xs">
                    <div className="flex justify-between">
                      <span className="text-gold font-medium">{l.action}</span>
                      <span className="text-muted">{formatDateTime(l.createdAt)}</span>
                    </div>
                    <div className="text-muted mt-0.5">{l.entity}{l.entityId ? ` (${l.entityId.slice(0, 8)}...)` : ""}</div>
                    {l.details && <div className="text-foreground/70 mt-1">{l.details}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
