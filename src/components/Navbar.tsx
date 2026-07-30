"use client";

import Link from "next/link";
import { useState, useEffect } from "react";

const navLinks = [
  { href: "/", label: "Início" },
  { href: "/campeonatos", label: "Campeonatos" },
  { href: "/ligas", label: "Ligas" },
  { href: "/temporadas", label: "Temporadas" },
  { href: "/ranking", label: "Ranking" },
  { href: "/estatisticas", label: "Estatísticas" },
  { href: "/times", label: "Times" },
  { href: "/jogadores", label: "Jogadores" },
  { href: "/simulacoes", label: "Simulações" },
  { href: "/noticias", label: "Notícias" },
  { href: "/hall-da-fama", label: "Hall da Fama" },
  { href: "/downloads", label: "Downloads" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const handler = () => setScrolled(window.scrollY > 30);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled ? "glass shadow-lg" : "bg-transparent"
      }`}
    >
      <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2 group">
            <span className="text-2xl font-black gold-text tracking-wider">CIRS</span>
            <span className="hidden sm:block text-[10px] text-muted uppercase tracking-widest">
              Real Soccer
            </span>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-foreground/80 hover:text-gold transition-colors relative group"
              >
                {link.label}
                <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-gold transition-all duration-300 group-hover:w-full" />
              </Link>
            ))}
            <Link
              href="/discord"
              target="_blank"
              rel="noopener noreferrer"
              className="ml-2 px-4 py-2 text-sm font-semibold text-white bg-[#5865F2] rounded-lg hover:bg-[#4752C4] transition-colors"
            >
              Discord
            </Link>
          </div>

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

        {mobileOpen && (
          <div className="lg:hidden glass border-t border-border pb-4 animate-fade-in">
            <div className="flex flex-col gap-1 pt-2">
              {navLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="px-4 py-2.5 text-sm font-medium text-foreground/80 hover:text-gold hover:bg-white/5 rounded-lg transition-colors"
                >
                  {link.label}
                </Link>
              ))}
              <Link
                href="/discord"
                target="_blank"
                rel="noopener noreferrer"
                className="mx-4 mt-2 px-4 py-2.5 text-sm font-semibold text-white bg-[#5865F2] rounded-lg text-center"
              >
                Discord
              </Link>
            </div>
          </div>
        )}
      </nav>
    </header>
  );
}
