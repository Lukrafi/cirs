"use client";

import { useState } from "react";

export default function SyncDataButton({ competitionId }: { competitionId: string }) {
  const [syncing, setSyncing] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleSync = async () => {
    if (!confirm("Sincronizar dados desta competição com fontes externas?")) return;
    setSyncing(true);
    setResult(null);
    try {
      const res = await fetch(`/api/sync/${competitionId}`, { method: "POST" });
      const data = await res.json();
      if (data.error) {
        setResult("Erro: " + data.error);
      } else {
        setResult(
          `Sincronizado: ${data.flagsUpdated} bandeiras, ${data.emblemsUpdated} escudos, ${data.competitionsUpdated} formatos`
        );
      }
    } catch (e: any) {
      setResult("Erro: " + e.message);
    } finally {
      setSyncing(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-2">
      <button
        onClick={handleSync}
        disabled={syncing}
        className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-glow/20 text-blue-glow hover:bg-blue-glow/30 transition-all disabled:opacity-50 border border-blue-glow/30"
      >
        {syncing ? "Sincronizando..." : "Sincronizar Dados"}
      </button>
      {result && <p className="text-[10px] text-gold bg-gold/5 px-3 py-1 rounded-lg max-w-[300px] text-center">{result}</p>}
    </div>
  );
}