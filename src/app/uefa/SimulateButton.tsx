"use client";

import { useState } from "react";

type SimulateButtonProps = {
  competitionId: string;
  phase: string;
  label: string;
  onDone?: () => void;
};

export default function SimulateButton({ competitionId, phase, label, onDone }: SimulateButtonProps) {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ simulated?: number; champion?: string | null; error?: string } | null>(null);

  const handleSimulate = async () => {
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/uefa/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId, phase }),
      });
      const data = await res.json();
      if (!res.ok) {
        setResult({ error: data.error || "Erro na simulação" });
      } else {
        setResult(data);
        if (onDone) onDone();
      }
    } catch {
      setResult({ error: "Falha ao conectar" });
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleSimulate}
        disabled={loading}
        className="btn-primary text-sm py-2 px-4 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? "Simulando..." : `⚡ ${label}`}
      </button>
      {result?.error && (
        <span className="text-red-400 text-xs">{result.error}</span>
      )}
      {result?.simulated !== undefined && !result.error && (
        <span className="text-gold text-xs">
          {result.simulated} partida(s) simulada(s)
          {result.champion && " • Campeão definido!"}
        </span>
      )}
    </div>
  );
}
