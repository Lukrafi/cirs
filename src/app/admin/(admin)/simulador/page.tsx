"use client";

import { useState, useEffect } from "react";

type Competition = {
  id: string;
  name: string;
  format: string;
  numTeams: number;
  groups: { id: string; name: string; matches: Match[] }[];
};

type Match = {
  id: string;
  homeTeam?: { name: string; strength: number };
  awayTeam?: { name: string; strength: number };
  round: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  isKnockout: boolean;
};

export default function AdminSimulador() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState<string>("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<{ simulated: number; message: string } | null>(null);
  const [simulateMatchId, setSimulateMatchId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/competitions")
      .then((r) => r.json())
      .then((data) => {
        setCompetitions(data);
        setLoading(false);
      });
  }, []);

  const loadMatches = async (compId: string) => {
    setSelectedComp(compId);
    setResult(null);
    const res = await fetch("/api/matches");
    const allMatches = await res.json();
    const compMatches = allMatches.filter(
      (m: Match & { group?: { competitionId: string } }) =>
        m.group?.competitionId === compId
    );
    setMatches(compMatches);
  };

  const comp = competitions.find((c) => c.id === selectedComp);

  const scheduledMatches = matches.filter((m) => m.status === "scheduled");
  const finishedMatches = matches.filter((m) => m.status === "finished");

  const rounds = [...new Set(scheduledMatches.map((m) => m.round))].sort(
    (a, b) => {
      const na = parseInt(a.replace("R", ""));
      const nb = parseInt(b.replace("R", ""));
      return na - nb;
    }
  );

  const handleSimulateRound = async (round: string) => {
    if (!confirm(`Simular TODAS as partidas da rodada ${round}?`)) return;
    setSimulating(true);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId: selectedComp, round, action: "rodada" }),
      });
      const data = await res.json();
      setResult({ simulated: data.simulated, message: `Rodada ${round}: ${data.simulated} partidas simuladas` });
      loadMatches(selectedComp);
    } catch {
      alert("Erro na simulação");
    }
    setSimulating(false);
  };

  const handleSimulateSeason = async () => {
    if (!confirm("SIMULAR TODA a temporada? Todas as partidas agendadas serão processadas.")) return;
    setSimulating(true);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ competitionId: selectedComp, action: "temporada" }),
      });
      const data = await res.json();
      setResult({ simulated: data.simulated, message: `Temporada completa: ${data.simulated} partidas simuladas!` });
      loadMatches(selectedComp);
    } catch {
      alert("Erro na simulação");
    }
    setSimulating(false);
  };

  const handleSimulateMatch = async (matchId: string) => {
    setSimulateMatchId(matchId);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ matchId }),
      });
      const data = await res.json();
      if (res.ok) {
        setResult({ simulated: 1, message: `Partida simulada: ${data.homeScore} x ${data.awayScore}` });
        loadMatches(selectedComp);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch {
      alert("Erro de conexão");
    }
    setSimulateMatchId(null);
  };

  const getStrengthStars = (strength: number) => {
    const full = Math.floor(strength);
    const half = strength % 1 >= 0.5;
    return "⭐".repeat(full) + (half ? "½" : "");
  };

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Simulador</h1>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold gold-text mb-4">Selecionar Competição</h2>
        <p className="text-sm text-muted mb-4">
          O simulador usa a <b>Força do Clube</b> (⭐ 1.0 a 10.0) como único fator de cálculo.
          Clubes mais fortes vencem mais, mas surpresas são possíveis.
        </p>

        {loading ? (
          <p className="text-muted">Carregando...</p>
        ) : competitions.length === 0 ? (
          <div className="text-muted">
            <p>Nenhuma competição encontrada.</p>
            <p className="text-sm mt-2">Crie uma competição primeiro em <strong>Campeonatos</strong>.</p>
          </div>
        ) : (
          <select
            value={selectedComp}
            onChange={(e) => loadMatches(e.target.value)}
            className="w-full bg-blue-deep border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
          >
            <option value="">— Selecione uma competição —</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.numTeams} times, {c.format})
              </option>
            ))}
          </select>
        )}
      </div>

      {result && (
        <div className="glass rounded-2xl p-6 mb-6 gold-border text-center">
          <p className="text-lg font-bold gold-text">{result.message}</p>
        </div>
      )}

      {comp && !simulating && (
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{comp.name}</h2>
            <div className="flex gap-3">
              {rounds.length > 0 && rounds.map((round) => (
                <button
                  key={round}
                  onClick={() => handleSimulateRound(round)}
                  disabled={simulating}
                  className="btn-secondary text-xs py-2 px-4 disabled:opacity-50"
                >
                  Simular Rodada {round}
                </button>
              ))}
              {scheduledMatches.length > 0 && (
                <button
                  onClick={handleSimulateSeason}
                  disabled={simulating}
                  className="btn-primary text-xs py-2 px-6 disabled:opacity-50"
                >
                  Simular Temporada
                </button>
              )}
            </div>
          </div>

          <div className="flex gap-6 text-xs text-muted mb-4">
            <span>{matches.length} partidas total</span>
            <span className="text-gold">{scheduledMatches.length} agendadas</span>
            <span>{finishedMatches.length} concluídas</span>
          </div>
        </div>
      )}

      {simulating && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-gold text-lg">Simulando...</p>
          <p className="text-muted text-sm mt-2">As partidas estão sendo processadas.</p>
        </div>
      )}

      {comp && matches.length > 0 && !simulating && (
        <div className="space-y-2">
          {[...scheduledMatches, ...finishedMatches].slice(0, 50).map((m) => (
            <div
              key={m.id}
              className={`glass rounded-xl p-4 flex items-center justify-between ${
                m.status === "finished" ? "opacity-80" : ""
              }`}
            >
              <div className="flex-1 text-right text-sm">
                <div className="font-medium">{m.homeTeam?.name || "—"}</div>
                <div className="text-xs text-muted">{getStrengthStars(m.homeTeam?.strength || 0)}</div>
              </div>
              <div className="px-4 text-center min-w-[80px]">
                {m.status === "finished" ? (
                  <span className="text-lg font-bold gold-text">{m.homeScore} - {m.awayScore}</span>
                ) : (
                  <span className="text-xs text-muted">Rod.{m.round}</span>
                )}
              </div>
              <div className="flex-1 text-sm">
                <div className="font-medium">{m.awayTeam?.name || "—"}</div>
                <div className="text-xs text-muted">{getStrengthStars(m.awayTeam?.strength || 0)}</div>
              </div>
              {m.status === "scheduled" && (
                <button
                  onClick={() => handleSimulateMatch(m.id)}
                  disabled={simulateMatchId === m.id}
                  className="ml-4 btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                >
                  {simulateMatchId === m.id ? "..." : "Simular"}
                </button>
              )}
              {m.status === "finished" && (
                <span className="ml-4 text-xs text-muted">
                  {m.isKnockout ? "Mata-mata" : ""}
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}