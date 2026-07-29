import { prisma } from "@/lib/prisma";
import Link from "next/link";

export const dynamic = "force-dynamic";

export default async function NoticiasPage() {
  const news = await prisma.news.findMany({
    where: { published: true },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Notícias</span>
      </h1>
      <p className="text-muted mb-8">Últimas notícias da CIRS.</p>

      {news.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhuma notícia publicada ainda.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {news.map((n) => (
            <Link
              key={n.id}
              href={`/noticias/${n.id}`}
              className="glass rounded-2xl overflow-hidden hover:gold-border transition-all duration-300 group"
            >
              {n.image && (
                <div className="aspect-video overflow-hidden">
                  <img src={n.image} alt={n.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
              )}
              <div className="p-5">
                <span className="text-xs text-gold uppercase tracking-wider">{n.category}</span>
                <h3 className="text-lg font-bold mt-1 group-hover:text-gold transition-colors">{n.title}</h3>
                <p className="text-sm text-muted mt-2 line-clamp-2">{n.content.slice(0, 120)}...</p>
                <p className="text-xs text-muted mt-3">{n.author} • {new Date(n.createdAt).toLocaleDateString("pt-BR")}</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
