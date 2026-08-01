"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect, useRef } from "react";

type NavLink = { href: string; label: string };

const primaryLinks: NavLink[] = [
  { href: "/", label: "Início" },
  { href: "/partidas", label: "Partidas" },
  { href: "/temporadas", label: "Temporadas" },
  { href: "/times", label: "Times" },
  { href: "/jogadores", label: "Jogadores" },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/simulacoes", label: "Simulações" },
];

const secondaryLinks: NavLink[] = [
  { href: "/noticias", label: "Notícias" },
  { href: "/downloads", label: "Downloads" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activePath, setActivePath] = useState("/");
  const closeTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      setActivePath(window.location.pathname);
    }
  }, []);

  const isActive = (href: string) => {
    if (href === "/") return activePath === "/";
    return activePath.startsWith(href);
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-lg" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group shrink-0">
            <span className="text-2xl font-black gold-text tracking-wider">CIRS</span>
            <span className="hidden sm:block text-[10px] text-muted uppercase tracking-widest">
              Real Soccer
            </span>
          </Link>

          {/* Desktop: navegação principal */}
          <div className="hidden lg:flex items-center gap-0.5">
            {primaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm font-medium transition-colors relative group rounded-lg ${
                  isActive(link.href)
                    ? "text-gold"
                    : "text-foreground/70 hover:text-gold"
                }`}
              >
                {link.label}
                <span
                  className={`absolute bottom-0 left-1/2 -translate-x-1/2 h-0.5 bg-gold transition-all duration-300 ${
                    isActive(link.href) ? "w-6" : "w-0 group-hover:w-6"
                  }`}
                />
              </Link>
            ))}

            {/* Separador visual */}
            <div className="w-px h-5 bg-border/60 mx-2" />

            {secondaryLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`px-3 py-2 text-sm transition-colors relative group rounded-lg ${
                  isActive(link.href)
                    ? "text-gold font-medium"
                    : "text-foreground/50 hover:text-gold font-normal"
                }`}
              >
                {link.label}
              </Link>
            ))}

            {/* Separador visual */}
            <div className="w-px h-5 bg-border/60 mx-2" />

            <Link
              href="/discord"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-1 px-4 py-2 text-sm font-semibold text-white bg-[#5865F2] rounded-lg hover:bg-[#4752C4] transition-colors flex items-center gap-1.5"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.872-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
              </svg>
              Discord
            </Link>
          </div>

          {/* Mobile: hamburger */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 text-foreground"
            aria-label="Menu"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {mobileOpen && (
          <div className="lg:hidden glass border-t border-white/10 pb-4 animate-fade-in">
            <div className="flex flex-col pt-2">
              <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-muted/60">
                Navegação
              </div>
              {primaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={`px-4 py-2.5 text-sm font-medium rounded-lg transition-colors ${
                    isActive(link.href)
                      ? "text-gold bg-gold/5"
                      : "text-foreground/80 hover:text-gold hover:bg-white/5"
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-white/5 my-2" />

              <div className="px-4 py-1.5 text-[10px] uppercase tracking-widest text-muted/60">
                Comunidade
              </div>
              {secondaryLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm text-foreground/70 hover:text-gold hover:bg-white/5 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}

              <div className="border-t border-white/10 my-2" />

              <Link
                href="/discord"
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setMobileOpen(false)}
                className="mx-4 mt-2 mb-1 px-4 py-2.5 text-sm font-semibold text-white bg-[#5865F2] rounded-lg text-center flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.872-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.06.06 0 0 0-.031-.028zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z" />
                </svg>
                Discord
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
