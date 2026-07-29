import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-blue-deep/50 mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="md:col-span-2">
            <h3 className="text-2xl font-black gold-text mb-2">CIRS</h3>
            <p className="text-sm text-muted max-w-md">
              Confederação Internacional Real Soccer — O maior servidor de Real Soccer X5 com PowerShot.
            </p>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase text-gold mb-3 tracking-wider">Navegação</h4>
            <div className="flex flex-col gap-2">
              <Link href="/campeonatos" className="text-sm text-muted hover:text-foreground transition-colors">Campeonatos</Link>
              <Link href="/ranking" className="text-sm text-muted hover:text-foreground transition-colors">Ranking</Link>
              <Link href="/times" className="text-sm text-muted hover:text-foreground transition-colors">Times</Link>
              <Link href="/jogadores" className="text-sm text-muted hover:text-foreground transition-colors">Jogadores</Link>
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold uppercase text-gold mb-3 tracking-wider">Comunidade</h4>
            <div className="flex flex-col gap-2">
              <Link href="/discord" className="text-sm text-muted hover:text-foreground transition-colors">Discord</Link>
              <Link href="/downloads" className="text-sm text-muted hover:text-foreground transition-colors">Downloads</Link>
              <Link href="/noticias" className="text-sm text-muted hover:text-foreground transition-colors">Notícias</Link>
              <Link href="/hall-da-fama" className="text-sm text-muted hover:text-foreground transition-colors">Hall da Fama</Link>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-border text-center">
          <p className="text-xs text-muted">
            &copy; {new Date().getFullYear()} CIRS — Confederação Internacional Real Soccer. Todos os direitos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
