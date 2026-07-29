import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const [clubs, players, matches, competitions, news, coaches, referees] = await Promise.all([
    prisma.club.count(),
    prisma.player.count(),
    prisma.match.count(),
    prisma.competition.count(),
    prisma.news.count(),
    prisma.coach.count(),
    prisma.referee.count(),
  ]);

  const stats = [
    { label: "Clubes", value: clubs, href: "/admin/clubes", color: "text-gold" },
    { label: "Jogadores", value: players, href: "/admin/jogadores", color: "text-gold" },
    { label: "Partidas", value: matches, href: "/admin/partidas", color: "text-gold" },
    { label: "Campeonatos", value: competitions, href: "/admin/campeonatos", color: "text-gold" },
    { label: "Notícias", value: news, href: "/admin/noticias", color: "text-gold" },
    { label: "Técnicos", value: coaches, href: "/admin/tecnicos", color: "text-gold" },
    { label: "Árbitros", value: referees, href: "/admin/arbitros", color: "text-gold" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Dashboard</h1>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((s) => (
          <Link key={s.label} href={s.href} className="glass rounded-xl p-5 hover:gold-border transition-all">
            <div className={`text-3xl font-bold ${s.color}`}>{s.value}</div>
            <div className="text-xs text-muted uppercase mt-1">{s.label}</div>
          </Link>
        ))}
      </div>

      <div className="glass rounded-2xl p-6">
        <h2 className="text-lg font-bold mb-4">Ações Rápidas</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <Link href="/admin/clubes" className="btn-secondary text-sm text-center">+ Novo Clube</Link>
          <Link href="/admin/jogadores" className="btn-secondary text-sm text-center">+ Novo Jogador</Link>
          <Link href="/admin/campeonatos" className="btn-secondary text-sm text-center">+ Novo Campeonato</Link>
          <Link href="/admin/noticias" className="btn-secondary text-sm text-center">+ Nova Notícia</Link>
          <Link href="/admin/partidas" className="btn-secondary text-sm text-center">+ Nova Partida</Link>
          <Link href="/admin/downloads" className="btn-secondary text-sm text-center">+ Novo Download</Link>
          <Link href="/admin/estadios" className="btn-secondary text-sm text-center">+ Novo Estádio</Link>
          <Link href="/admin/simulador" className="btn-secondary text-sm text-center">⚡ Simular</Link>
        </div>
      </div>
    </div>
  );
}
