"use client";

import { useState } from "react";

export default function SimularMundoButton() {
  const [simulando, setSimulando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const simular = async () => {
    if (!confirm("Iniciar simulação de TODAS as confederações, países, ligas e copas? Esta ação pode demorar.")) return;
    setSimulando(true);
    setResultado(null);
    try {
      const res = await fetch(`/api/simulate/world`, { method: "POST" });
      const data = await res.json();
      setResultado(`${data.message} (${data.total} países no total)`);
    } catch (e) {
      setResultado("Erro: " + (e instanceof Error ? e.message : String(e)));
    } finally {
      setSimulando(false);
    }
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <button
        onClick={simular}
        disabled={simulando}
        className="px-8 py-4 text-base font-bold rounded-xl bg-gradient-to-r from-gold to-yellow-300 text-black hover:shadow-2xl transition-all disabled:opacity-50 hover:scale-105"
      >
        {simulando ? "🌍 Simulando mundo..." : "🌍 Simular Mundo"}
      </button>
      {resultado && <p className="text-xs text-gold">{resultado}</p>}
    </div>
  );
}