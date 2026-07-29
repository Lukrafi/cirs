"use client";

import { useState, useEffect } from "react";

export default function AdminSimulador() {
  const [matches, setMatches] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState<string | null>(null);
  const [result, setResult] = useState<Record<string, string | number | boolean | Array<Record<string, unknown>> | null> | null>(null);

  const fetchMatches = async () => {
    setLoading(true);
    const res = await fetch("/api/matches");
    const data = await res.json();
    setMatches(data.filter((m: Record<string, unknown>) => m.status !== "finished"));
    setLoading(false);
  };

  useEffect(() => { fetchMatches(); }, []);

  const handleSimulate = async (matchId: string) => {
    setSimulating(matchId);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult(data);
        fetchMatches();
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSimulating(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Simulador de Partidas</h1>

      <div className="glass rounded-2xl p-6 mb-6">
        <p className="text-sm text-muted mb-4">
          O simulador utiliza os atributos de cada clube (Ataque, Meio, Defesa, Goleiro, Entrosamento, Forma e Moral) para gerar resultados automaticamente.
          Os resultados NÃO são totalmente aleatórios — as forças influenciam diretamente na simulação.
        </p>
      </div>

      {result && (
        <div className="glass rounded-2xl p-6 mb-6 gold-border">
          <h2 className="text-lg font-bold gold-text mb-4">Resultado da Simulação</h2>
          <div className="text-center text-4xl font-black gold-text mb-4">
            {String(result.homeScore)} x {String(result.awayScore)}
          </div>
          {Array.isArray(result.homeGoals) && result.homeGoals.length > 0 && (
            <div className="text-sm text-muted mb-2">
              ⚽ Gols Mandante: {(result.homeGoals as Array<{scorer: string; minute: number}>).map(g => `${g.scorer} (${g.minute}')`).join(", ")}
            </div>
          )}
          {Array.isArray(result.awayGoals) && result.awayGoals.length > 0 && (
            <div className="text-sm text-muted mb-2">
              ⚽ Gols Visitante: {(result.awayGoals as Array<{scorer: string; minute: number}>).map(g => `${g.scorer} (${g.minute}')`).join(", ")}
            </div>
          )}
          {result.mvpPlayerId && (
            <div className="text-sm text-gold">🏆 MVP Rating: {String(result.mvpRating)}</div>
          )}
          {(result.homePowerShot || result.awayPowerShot) && (
            <div className="text-sm text-gold">⚡ PowerShot detectado!</div>
          )}
        </div>
      )}

      {loading ? (
        <p className="text-muted">Carregando partidas...</p>
      ) : matches.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Nenhuma partida agendada para simular.</p>
          <p className="text-muted text-sm mt-2">Crie partidas na seção "Partidas" primeiro.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {matches.map((m) => (
            <div key={String(m.id)} className="glass rounded-xl p-4 flex items-center justify-between">
              <div className="flex-1 text-right text-sm font-medium">
                {(m.homeTeam as { name: string })?.name || "—"}
              </div>
              <div className="px-4 text-muted text-xs">vs</div>
              <div className="flex-1 text-sm font-medium">
                {(m.awayTeam as { name: string })?.name || "—"}
              </div>
              <button
                onClick={() => handleSimulate(String(m.id))}
                disabled={simulating === m.id}
                className="ml-4 btn-primary text-sm py-2 px-4 disabled:opacity-50"
              >
                {simulating === m.id ? "Simulando..." : "⚡ Simular"}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
