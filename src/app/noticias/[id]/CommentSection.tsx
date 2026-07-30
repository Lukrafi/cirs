"use client";

import { useState } from "react";
import { formatDate } from "@/lib/utils";

type Comment = {
  id: string;
  authorName: string;
  content: string;
  createdAt: string | Date;
};

export default function CommentSection({
  newsId,
  initialComments,
}: {
  newsId: string;
  initialComments: Comment[];
}) {
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [name, setName] = useState("");
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setLoading(true);
    try {
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newsId, authorName: name || "Anonimo", content }),
      });
      if (res.ok) {
        const comment = await res.json();
        setComments([comment, ...comments]);
        setContent("");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="mt-12">
      <h2 className="text-2xl font-bold mb-6">
        <span className="gold-text">Comentários</span>
        <span className="text-sm text-muted ml-2">({comments.length})</span>
      </h2>

      <form onSubmit={submit} className="glass rounded-xl p-4 mb-6">
        <input
          type="text"
          placeholder="Seu nome (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-transparent border border-border rounded-lg px-4 py-2 text-sm mb-3 focus:border-gold focus:outline-none"
        />
        <textarea
          placeholder="Escreva seu comentário..."
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={3}
          className="w-full bg-transparent border border-border rounded-lg px-4 py-2 text-sm resize-none focus:border-gold focus:outline-none"
        />
        <button
          type="submit"
          disabled={loading || !content.trim()}
          className="btn-primary px-6 py-2 text-sm mt-3 disabled:opacity-50"
        >
          {loading ? "Enviando..." : "Comentar"}
        </button>
      </form>

      {comments.length === 0 ? (
        <p className="text-muted text-sm">Seja o primeiro a comentar!</p>
      ) : (
        <div className="space-y-3">
          {comments.map((c) => (
            <div key={c.id} className="glass rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="font-semibold text-sm text-gold">{c.authorName}</span>
                <span className="text-xs text-muted">{formatDate(c.createdAt)}</span>
              </div>
              <p className="text-sm text-foreground/80">{c.content}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
