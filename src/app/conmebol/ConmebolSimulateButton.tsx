"use client";

import { useState } from "react";

type Props = {
  competitionId: string;
  action?: string;
  phase?: string;
  label: string;
  body?: Record<string, unknown>;
  onDone?: () => void;
};

export default function ConmebolSimulateButton({ competitionId, action, phase, label, body, onDone }: Props) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ simulated?: number; created?: number; thirdPlaceTeamIds?: string[]; winners?: string[]; error?: string } | null>(null);

  const handle = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/conmebol/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, action, phase, ...body }),
      });
      const data = await res.json();
      if (!res.ok) setResult({ error: data.error || "Erro" });
      else { setResult(data); if (onDone) onDone(); }
    } catch { setResult({ error: "Falha ao conectar" }); }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button onClick={handle} disabled={loading} className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed">
        {loading ? "Simulando..." : `⚡ ${label}`}
      </button>
      {result?.error && <span className="text-red-400 text-xs">{result.error}</span>}
      {result?.simulated !== undefined && !result.error && <span className="text-gold text-xs">{result.simulated} partida(s)</span>}
      {result?.created !== undefined && !result.error && <span className="text-gold text-xs">{result.created} partida(s) criada(s)</span>}
      {result?.thirdPlaceTeamIds?.length && <span className="text-orange-400 text-xs">{result.thirdPlaceTeamIds.length} 3º colocados → Sul-Americana</span>}
    </div>
  );
}
