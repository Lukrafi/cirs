import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function DownloadsPage() {
  const files = await prisma.mapFile.findMany({
    orderBy: { createdAt: "desc" },
  });

  const categories = ["script", "map", "update", "file"];

  return (
    <div className="pt-20 min-h-screen max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <h1 className="text-4xl font-black mb-2">
        <span className="gold-text">Downloads</span>
      </h1>
      <p className="text-muted mb-8">Scripts, mapas, atualizações e arquivos da CIRS.</p>

      {files.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted text-lg">Nenhum arquivo disponível ainda.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {categories.map((cat) => {
            const catFiles = files.filter((f) => f.category === cat);
            if (catFiles.length === 0) return null;
            return (
              <div key={cat}>
                <h2 className="text-lg font-bold uppercase tracking-wider text-gold mb-4">{cat}s</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {catFiles.map((f) => (
                    <div key={f.id} className="glass rounded-xl p-5 hover:gold-border transition-all duration-300">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="font-bold">{f.name}</h3>
                        <span className="text-xs text-muted bg-blue-deep px-2 py-1 rounded">v{f.version}</span>
                      </div>
                      {f.description && <p className="text-sm text-muted mb-3">{f.description}</p>}
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-muted">{f.downloads} downloads</span>
                        <a
                          href={f.fileUrl}
                          className="text-sm font-semibold text-gold hover:underline"
                          download
                        >
                          Baixar →
                        </a>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
