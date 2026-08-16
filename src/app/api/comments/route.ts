import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { rateLimit, clientIp } from "@/lib/rateLimit";

export const dynamic = "force-dynamic";

function sanitizeText(value: string): string {
  return value
    .replace(/<[^>]*>/g, "") // remove qualquer tag HTML
    .replace(/[\u0000-\u001F\u007F]/g, "") // remove caracteres de controle
    .trim()
    .slice(0, 1000);
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const newsId = searchParams.get("newsId");
  if (!newsId) return NextResponse.json({ error: "newsId required" }, { status: 400 });

  const comments = await prisma.comment.findMany({
    where: { newsId },
    include: { user: { select: { username: true, avatar: true } } },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(comments);
}

export async function POST(req: NextRequest) {
  const ip = clientIp(req);
  if (!rateLimit(`comments:${ip}`, 10, 60_000)) {
    return NextResponse.json({ error: "Muitos comentários em pouco tempo. Aguarde um instante." }, { status: 429 });
  }

  let body: Record<string, unknown>;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const newsId = typeof body.newsId === "string" ? body.newsId.trim() : "";
  const rawAuthor = typeof body.authorName === "string" ? body.authorName : "";
  const rawContent = typeof body.content === "string" ? body.content : "";

  if (!newsId || !rawContent.trim()) {
    return NextResponse.json({ error: "newsId and content required" }, { status: 400 });
  }

  const news = await prisma.news.findUnique({ where: { id: newsId } });
  if (!news) {
    return NextResponse.json({ error: "Notícia não encontrada" }, { status: 404 });
  }

  const content = sanitizeText(rawContent);
  if (!content) {
    return NextResponse.json({ error: "Conteúdo inválido" }, { status: 400 });
  }
  const authorName = sanitizeText(rawAuthor).slice(0, 40) || "Anonimo";

  const comment = await prisma.comment.create({
    data: {
      newsId,
      authorName,
      content,
    },
  });

  return NextResponse.json(comment, { status: 201 });
}
