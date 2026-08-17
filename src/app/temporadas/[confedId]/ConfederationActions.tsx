"use client";

import { useState } from "react";

interface Props {
  confederationId: string;
  confederationName: string;
  hasCountries: boolean;
  hasIntl: boolean;
}

export default function ConfederationActions({
  confederationId,
  confederationName,
  hasCountries,
  hasIntl,
}: Props) {
  const [loading, setLoading] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const call = async (action: string, url: string) => {
    setLoading(action);
    setResult(null);
    try {
      const res = await fetch(url, { method: "POST" });
      const data = await res.json();
      setResult(data.message || `${data.matchesSimulated || 0} partidas processadas`);
    } catch {
      setResult("Erro de conexão");
    }
    setLoading(null);
  };

  return (
    <div className="glass rounded-2xl p-4 mb-8">
      <div className="flex flex-wrap gap-3">
        {hasCountries && (
          <button
            onClick={() => call("confed", `/api/simulate/confederation?id=${confederationId}`)}
            disabled={loading !== null}
            className="btn-primary text-xs py-2 px-4 disabled:opacity-50"
          >
            {loading === "confed" ? "..." : `Simular ${confederationName}`}
          </button>
        )}
        {hasIntl && (
          <button
            onClick={() => call("intl", `/api/simulate/confederation?id=${confederationId}`)}
            disabled={loading !== null}
            className="btn-secondary text-xs py-2 px-4 disabled:opacity-50"
          >
            {loading === "intl" ? "..." : "Simular Competições Continentais"}
          </button>
        )}
      </div>
      {result && (
        <p className="text-sm text-green-400 mt-3">{result}</p>
      )}
    </div>
  );
}
