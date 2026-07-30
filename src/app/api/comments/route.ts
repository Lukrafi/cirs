import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

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
  const body = await req.json();
  const { newsId, authorName, content } = body;
  if (!newsId || !content) {
    return NextResponse.json({ error: "newsId and content required" }, { status: 400 });
  }

  const comment = await prisma.comment.create({
    data: {
      newsId,
      authorName: authorName || "Anonimo",
      content: content.slice(0, 1000),
    },
  });

  return NextResponse.json(comment, { status: 201 });
}