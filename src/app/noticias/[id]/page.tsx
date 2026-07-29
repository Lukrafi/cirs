import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function NewsDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const news = await prisma.news.findUnique({ where: { id } });

  if (!news || !news.published) notFound();

  return (
    <div className="pt-20 min-h-screen max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <article>
        <span className="text-xs text-gold uppercase tracking-wider">{news.category}</span>
        <h1 className="text-3xl font-black mt-2 mb-3">{news.title}</h1>
        <p className="text-sm text-muted mb-6">Por {news.author} • {new Date(news.createdAt).toLocaleDateString("pt-BR")}</p>

        {news.image && (
          <img src={news.image} alt={news.title} className="w-full rounded-2xl mb-8 max-h-[500px] object-cover" />
        )}

        <div className="prose prose-invert max-w-none">
          {news.content.split("\n").map((line, idx) => (
            <p key={idx} className="text-foreground/80 leading-relaxed mb-4">{line}</p>
          ))}
        </div>
      </article>
    </div>
  );
}
