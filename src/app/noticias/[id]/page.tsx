import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import { formatDate } from "@/lib/utils";
import Link from "next/link";
import CommentSection from "./CommentSection";
import ShareButtons from "./ShareButtons";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await prisma.news.findUnique({
    where: { id },
    include: {
      club: true,
      comments: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });

  if (!news || !news.published) return notFound();

  const related = await prisma.news.findMany({
    where: { published: true, category: news.category, NOT: { id: news.id } },
    take: 3,
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="pt-20 min-h-screen max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <Link href="/noticias" className="text-sm text-muted hover:text-gold transition-colors">← Voltar para Notícias</Link>

      <article className="mt-6">
        <span className="text-xs text-gold uppercase tracking-wider">{news.category}</span>
        <h1 className="text-3xl sm:text-4xl font-black mt-2 mb-3">{news.title}</h1>
        <div className="flex items-center gap-3 text-sm text-muted mb-6">
          <span>Por {news.author}</span>
          <span>•</span>
          <span>{formatDate(news.createdAt)}</span>
          {news.club && (
            <>
              <span>•</span>
              <Link href={`/times/${news.clubId}`} className="hover:text-gold transition-colors">{news.club.name}</Link>
            </>
          )}
        </div>

        {news.image && (
          <img src={news.image} alt={news.title} className="w-full rounded-2xl mb-8 max-h-[500px] object-cover" />
        )}

        <div className="prose prose-invert max-w-none">
          {news.content.split("\n").map((line, idx) => (
            <p key={idx} className="text-foreground/80 leading-relaxed mb-4">{line}</p>
          ))}
        </div>

        <ShareButtons title={news.title} />
      </article>

      <CommentSection newsId={news.id} initialComments={news.comments} />

      {related.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl font-bold mb-6"><span className="gold-text">Notícias Relacionadas</span></h2>
          <div className="grid md:grid-cols-3 gap-4">
            {related.map((n) => (
              <Link key={n.id} href={`/noticias/${n.id}`} className="glass rounded-xl overflow-hidden hover:bg-card/60 transition-all hover:scale-[1.02]">
                {n.image && <img src={n.image} alt={n.title} className="w-full h-32 object-cover" />}
                <div className="p-4">
                  <span className="text-xs text-gold uppercase">{n.category}</span>
                  <h3 className="text-sm font-bold mt-1 line-clamp-2">{n.title}</h3>
                  <span className="text-xs text-muted mt-2 block">{formatDate(n.createdAt)}</span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
