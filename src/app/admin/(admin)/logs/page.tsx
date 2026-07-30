import { prisma } from "@/lib/prisma";
import { formatDateTime } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminLogsPage() {
  const logs = await prisma.log.findMany({
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-black gold-text">Logs do Sistema</h1>
      <p className="text-muted text-sm">Últimos 100 eventos registrados.</p>

      <div className="glass rounded-xl overflow-hidden">
        {logs.length === 0 ? (
          <p className="text-muted text-sm p-6 text-center">Nenhum log registrado.</p>
        ) : (
          <div className="divide-y divide-border">
            {logs.map((l: typeof logs[number]) => (
              <div key={l.id} className="p-4">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-3">
                    <span className="text-xs px-2 py-1 rounded bg-gold/10 text-gold font-mono">{l.action}</span>
                    <span className="text-xs text-muted">{l.entity}</span>
                    {l.entityId && <span className="text-xs text-muted">#{l.entityId.slice(0, 8)}</span>}
                  </div>
                  <span className="text-xs text-muted">{formatDateTime(l.createdAt)}</span>
                </div>
                {l.details && <div className="text-sm mt-2">{l.details}</div>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
