"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const links = [
  { href: "/admin", label: "Dashboard", icon: "📊" },
  { href: "/admin/paises", label: "Países", icon: "🌍" },
  { href: "/admin/divisoes", label: "Divisões", icon: "📋" },
  { href: "/admin/clubes", label: "Clubes", icon: "🛡️" },
  { href: "/admin/jogadores", label: "Jogadores", icon: "⚽" },
  { href: "/admin/tecnicos", label: "Técnicos", icon: "📋" },
  { href: "/admin/arbitros", label: "Árbitros", icon: "🟨" },
  { href: "/admin/ligas", label: "Ligas", icon: "🏆" },
  { href: "/admin/temporadas", label: "Temporadas", icon: "📅" },
  { href: "/admin/campeonatos", label: "Campeonatos", icon: "🎖️" },
  { href: "/admin/partidas", label: "Partidas", icon: "⚽" },
  { href: "/admin/simulador", label: "Simulador", icon: "⚡" },
  { href: "/admin/sincronizacao", label: "Sincronização", icon: "🔄" },
  { href: "/admin/estadios", label: "Estádios", icon: "🏟️" },
  { href: "/admin/patrocinadores", label: "Patrocinadores", icon: "💰" },
  { href: "/admin/noticias", label: "Notícias", icon: "📰" },
  { href: "/admin/downloads", label: "Downloads", icon: "📦" },
  { href: "/admin/logs", label: "Logs", icon: "📜" },
];

export default function AdminSidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.push("/admin/login");
  };

  return (
    <aside className={`${collapsed ? "w-16" : "w-64"} glass border-r border-border min-h-[calc(100vh-4rem)] transition-all duration-300 flex flex-col`}>
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="p-3 text-muted hover:text-gold transition-colors text-sm"
      >
        {collapsed ? "▶" : "◀ Minimizar"}
      </button>

      <nav className="flex-1 overflow-y-auto scrollbar-thin">
        {links.map((link) => {
          const active = pathname === link.href || (link.href !== "/admin" && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                active ? "text-gold bg-gold/10 border-r-2 border-gold" : "text-foreground/70 hover:text-gold hover:bg-white/5"
              }`}
            >
              <span className="text-lg">{link.icon}</span>
              {!collapsed && <span>{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={handleLogout}
        className="p-4 text-sm text-red-400 hover:text-red-300 transition-colors text-left"
      >
        {collapsed ? "🚪" : "🚪 Sair"}
      </button>
    </aside>
  );
}
