"use client";

import { useState, useEffect } from "react";

type Competition = {
  id: string;
  name: string;
  format: string;
  numTeams: number;
  seasonId?: string | null;
};

type Match = {
  id: string;
  homeTeam?: { name: string; strength: number };
  awayTeam?: { name: string; strength: number };
  round: string;
  status: string;
  homeScore?: number;
  awayScore?: number;
  matchDate?: string;
};

export default function AdminSimulador() {
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [selectedComp, setSelectedComp] = useState("");
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [simulating, setSimulating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [simulateMatchId, setSimulateMatchId] = useState<string | null>(null);
  const [maxRound, setMaxRound] = useState("");
  const [dataLimite, setDataLimite] = useState("");
  const [seasonId, setSeasonId] = useState("");

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
    setMatches(
      allMatches.filter(
        (m: Match & { group?: { competitionId?: string } }) =>
          m.group?.competitionId === compId
      )
    );
  };

  const comp = competitions.find((c) => c.id === selectedComp);
  const scheduledMatches = matches.filter((m) => m.status !== "finished");
  const finishedMatches = matches.filter((m) => m.status === "finished");

  const rounds = [...new Set(scheduledMatches.map((m) => m.round))].sort((a, b) =>
    parseInt((a || "0").replace(/\D/g, "")) - parseInt((b || "0").replace(/\D/g, ""))
  );

  const callSimulate = async (payload: Record<string, unknown>) => {
    setSimulating(true);
    setResult(null);
    try {
      const res = await fetch("/api/simulate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (res.ok) {
        const msg = data.simulated !== undefined
          ? `${data.simulated} partidas simuladas!`
          : `Partida: ${data.homeScore} x ${data.awayScore}`;
        setResult(msg);
        if (selectedComp) loadMatches(selectedComp);
      } else {
        alert(`Erro: ${data.error}`);
      }
    } catch {
      alert("Erro de conexão");
    }
    setSimulating(false);
  };

  const handleSimulateAction = (action: string) => {
    if (!selectedComp) return;
    switch (action) {
      case "rodada":
        if (rounds.length === 0) return;
        callSimulate({ competitionId: selectedComp, round: rounds[0], action: "rodada" });
        break;
      case "temporada":
        callSimulate({ competitionId: selectedComp, action: "temporada" });
        break;
      case "ate-rodada":
        if (!maxRound) { alert("Informe a rodada limite"); return; }
        callSimulate({ competitionId: selectedComp, maxRound, action: "ate-rodada" });
        break;
      case "turno-ida":
        callSimulate({ competitionId: selectedComp, turno: "ida", action: "turno" });
        break;
      case "turno-volta":
        callSimulate({ competitionId: selectedComp, turno: "volta", action: "turno" });
        break;
      case "ate-data":
        if (!dataLimite) { alert("Informe a data limite"); return; }
        callSimulate({ competitionId: selectedComp, dataLimite, action: "ate-data" });
        break;
      case "todas-temporada":
        if (!comp?.seasonId) { alert("Esta competição não está vinculada a uma temporada"); return; }
        callSimulate({ seasonId: comp.seasonId, action: "todas-temporada" });
        break;
    }
  };

  const handleSimulateMatch = (matchId: string) => {
    setSimulateMatchId(matchId);
    callSimulate({ matchId });
    setSimulateMatchId(null);
  };

  const getStars = (s: number) => "⭐".repeat(Math.floor(s)) + (s % 1 >= 0.5 ? "½" : "");

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Simulador</h1>

      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold gold-text mb-4">Selecionar Competição</h2>
        <p className="text-sm text-muted mb-4">
          O simulador usa a <b>Força do Clube</b> (⭐ 1.0 a 10.0) como fator de cálculo.
        </p>
        {loading ? (
          <p className="text-muted">Carregando...</p>
        ) : competitions.length === 0 ? (
          <p className="text-muted">Nenhuma competição encontrada. Crie uma em Campeonatos.</p>
        ) : (
          <select
            value={selectedComp}
            onChange={(e) => loadMatches(e.target.value)}
            className="w-full bg-blue-deep border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
          >
            <option value="">— Selecione —</option>
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
          <p className="text-lg font-bold gold-text">{result}</p>
        </div>
      )}

      {comp && !simulating && (
        <div className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">Opções de Simulação</h2>
          <p className="text-xs text-muted mb-4">
            {scheduledMatches.length} agendadas &bull; {finishedMatches.length} concluídas
          </p>

          <div className="flex flex-wrap gap-3">
            {rounds.length > 0 && (
              rounds.map((round) => (
                <button
                  key={round}
                  onClick={() => callSimulate({ competitionId: selectedComp, round, action: "rodada" })}
                  className="btn-secondary text-xs py-2 px-4"
                >
                  Rodada {round}
                </button>
              ))
            )}
            <button
              onClick={() => handleSimulateAction("temporada")}
              className="btn-primary text-xs py-2 px-4"
            >
              Competição Inteira
            </button>
            {comp.seasonId && (
              <button
                onClick={() => handleSimulateAction("todas-temporada")}
                className="btn-primary text-xs py-2 px-4"
              >
                Todas Competições da Temporada
              </button>
            )}
            <button
              onClick={() => handleSimulateAction("turno-ida")}
              className="btn-secondary text-xs py-2 px-4"
            >
              Turno (Ida)
            </button>
            <button
              onClick={() => handleSimulateAction("turno-volta")}
              className="btn-secondary text-xs py-2 px-4"
            >
              Returno (Volta)
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
            <div className="flex gap-2">
              <input
                type="text"
                value={maxRound}
                onChange={(e) => setMaxRound(e.target.value)}
                placeholder="Rodada limite (ex: 10)"
                className="flex-1 bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <button
                onClick={() => handleSimulateAction("ate-rodada")}
                className="btn-secondary text-xs py-2 px-4 whitespace-nowrap"
              >
                Até Rodada
              </button>
            </div>
            <div className="flex gap-2">
              <input
                type="date"
                value={dataLimite}
                onChange={(e) => setDataLimite(e.target.value)}
                className="flex-1 bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <button
                onClick={() => handleSimulateAction("ate-data")}
                className="btn-secondary text-xs py-2 px-4 whitespace-nowrap"
              >
                Até Data
              </button>
            </div>
          </div>
        </div>
      )}

      {simulating && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-gold text-lg">Simulando...</p>
        </div>
      )}

      {comp && matches.length > 0 && !simulating && (
        <div className="space-y-2">
          {[...scheduledMatches, ...finishedMatches].slice(0, 60).map((m) => (
            <div
              key={m.id}
              className={`glass rounded-xl p-3 flex items-center justify-between text-sm ${
                m.status === "finished" ? "opacity-70" : ""
              }`}
            >
              <div className="flex-1 text-right">
                <div>{m.homeTeam?.name || "—"}</div>
                <div className="text-xs text-muted">{getStars(m.homeTeam?.strength || 0)}</div>
              </div>
              <div className="px-4 text-center min-w-[80px]">
                {m.status === "finished" ? (
                  <span className="text-lg font-bold gold-text">{m.homeScore} - {m.awayScore}</span>
                ) : (
                  <span className="text-xs text-muted">Rod. {m.round}</span>
                )}
              </div>
              <div className="flex-1">
                <div>{m.awayTeam?.name || "—"}</div>
                <div className="text-xs text-muted">{getStars(m.awayTeam?.strength || 0)}</div>
              </div>
              {m.status === "scheduled" && (
                <button
                  onClick={() => handleSimulateMatch(m.id)}
                  disabled={simulateMatchId === m.id}
                  className="ml-3 btn-primary text-xs py-1.5 px-3 disabled:opacity-50"
                >
                  {simulateMatchId === m.id ? "..." : "Simular"}
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}