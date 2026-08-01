"use client";

import { useState } from "react";

export default function SimularButtons({
  countryId,
  confederationId,
  canSimulateCountry,
  canSimulateConfederation,
}: {
  countryId: string;
  confederationId: string;
  canSimulateCountry: boolean;
  canSimulateConfederation: boolean;
}) {
  const [simulando, setSimulando] = useState(false);
  const [resultado, setResultado] = useState<string | null>(null);

  const simular = async (tipo: "country" | "confederation") => {
    setSimulando(true);
    setResultado(null);
    try {
      const url =
        tipo === "country"
          ? `/api/simulate/country?id=${countryId}`
          : `/api/simulate/confederation?id=${confederationId}`;
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      setResultado(data.message || JSON.stringify(data));
    } catch (e: any) {
      setResultado("Erro: " + e.message);
    } finally {
      setSimulando(false);
    }
  };

  return (
    <div className="flex flex-col items-end gap-2 ml-4">
      <div className="flex gap-2">
        {canSimulateCountry && (
          <button
            onClick={() => simular("country")}
            disabled={simulando}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-gold text-black hover:bg-gold/80 transition-all disabled:opacity-50"
          >
            {simulando ? "Simulando..." : "Simular País"}
          </button>
        )}
        {canSimulateConfederation && (
          <button
            onClick={() => simular("confederation")}
            disabled={simulando}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-blue-glow text-white hover:bg-blue-glow/80 transition-all disabled:opacity-50 border border-blue-glow/30"
          >
            Simular Confederação
          </button>
        )}
      </div>
      {resultado && (
        <p className="text-[10px] text-gold bg-gold/5 px-3 py-1 rounded-lg max-w-[250px] text-center">{resultado}</p>
      )}
    </div>
  );
}