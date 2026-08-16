"use client";

import { useState, useEffect, useCallback } from "react";

type Competition = {
  id: string;
  name: string;
  format: string;
  numTeams: number;
  seasonId?: string | null;
  isSimulated: boolean;
  isKnockout: boolean;
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
  const [editingScore, setEditingScore] = useState<string | null>(null);
  const [editHome, setEditHome] = useState(0);
  const [editAway, setEditAway] = useState(0);
  const [editingComp, setEditingComp] = useState<string | null>(null);
  const [editCompName, setEditCompName] = useState("");
  const [editCompTeams, setEditCompTeams] = useState(0);

  const fetchCompetitions = useCallback(() => {
    fetch("/api/competitions")
      .then((r) => r.json())
      .then((data) => {
        setCompetitions(data);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    fetchCompetitions();
  }, [fetchCompetitions]);

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

  // Toggle isSimulated
  const toggleSimulated = async (compId: string, value: boolean) => {
    await fetch("/api/admin/competitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "toggle-simulated", id: compId, isSimulated: value }),
    });
    fetchCompetitions();
    if (compId === selectedComp) loadMatches(compId);
  };

  // Edit score
  const saveScore = async (matchId: string) => {
    await fetch("/api/admin/competitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit-score", matchId, homeScore: editHome, awayScore: editAway }),
    });
    setEditingScore(null);
    if (selectedComp) loadMatches(selectedComp);
  };

  // Cancel simulation
  const cancelSimulation = async (matchId: string) => {
    if (!confirm("Cancelar simulação desta partida?")) return;
    await fetch("/api/admin/competitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel-simulation", matchId }),
    });
    if (selectedComp) loadMatches(selectedComp);
  };

  // Cancel all simulation for competition
  const cancelAllSimulation = async () => {
    if (!selectedComp) return;
    if (!confirm("Cancelar TODAS as simulações desta competição?")) return;
    const res = await fetch("/api/admin/competitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "cancel-all-simulation", competitionId: selectedComp }),
    });
    const data = await res.json();
    setResult(`${data.cancelled} simulações canceladas`);
    loadMatches(selectedComp);
  };

  // Edit competition
  const saveCompEdit = async () => {
    if (!editingComp) return;
    await fetch("/api/admin/competitions", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "edit-competition", id: editingComp, name: editCompName, numTeams: editCompTeams }),
    });
    setEditingComp(null);
    fetchCompetitions();
  };

  const getStars = (s: number) => "⭐".repeat(Math.floor(s)) + (s % 1 >= 0.5 ? "½" : "");

  return (
    <div>
      <h1 className="text-2xl font-black mb-6">Simulador</h1>

      {/* Seletor de Competição */}
      <div className="glass rounded-2xl p-6 mb-6">
        <h2 className="text-lg font-bold gold-text mb-4">Selecionar Competição</h2>
        <p className="text-sm text-muted mb-4">
          O simulador usa a <b>Força do Clube</b> (⭐ 1.0 a 10.0) como fator de cálculo.
        </p>
        {loading ? (
          <p className="text-muted">Carregando...</p>
        ) : competitions.length === 0 ? (
          <p className="text-muted">Nenhuma competição encontrada.</p>
        ) : (
          <select
            value={selectedComp}
            onChange={(e) => loadMatches(e.target.value)}
            className="w-full bg-blue-deep border border-border rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-gold"
          >
            <option value="">— Selecione —</option>
            {competitions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.numTeams} times) {c.isSimulated ? "🤖 Simulável" : "🎮 Jogável"}
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

      {/* Painel da Competição Selecionada */}
      {comp && (
        <div className="glass rounded-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold">{comp.name}</h2>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditingComp(comp.id);
                  setEditCompName(comp.name);
                  setEditCompTeams(comp.numTeams);
                }}
                className="text-xs text-gold hover:underline"
              >
                Editar
              </button>
              <button
                onClick={() => toggleSimulated(comp.id, !comp.isSimulated)}
                className={`text-xs px-3 py-1 rounded-lg font-semibold ${
                  comp.isSimulated
                    ? "bg-green-500/20 text-green-400 border border-green-500/40"
                    : "bg-blue-500/20 text-blue-400 border border-blue-500/40"
                }`}
              >
                {comp.isSimulated ? "🤖 Simulável" : "🎮 Jogável (HaxBall)"}
              </button>
            </div>
          </div>

          {/* Form de edição de competição */}
          {editingComp === comp.id && (
            <div className="bg-blue-deep/40 rounded-xl p-4 mb-4 flex gap-3 items-end">
              <div className="flex-1">
                <label className="text-xs text-muted block mb-1">Nome</label>
                <input value={editCompName} onChange={(e) => setEditCompName(e.target.value)}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div className="w-24">
                <label className="text-xs text-muted block mb-1">Times</label>
                <input type="number" value={editCompTeams} onChange={(e) => setEditCompTeams(Number(e.target.value))}
                  className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <button onClick={saveCompEdit} className="btn-primary text-xs py-2 px-4">Salvar</button>
              <button onClick={() => setEditingComp(null)} className="btn-secondary text-xs py-2 px-4">Cancelar</button>
            </div>
          )}

          <p className="text-xs text-muted mb-4">
            {scheduledMatches.length} agendadas &bull; {finishedMatches.length} concluídas
          </p>

          {/* Botões de simulação */}
          {comp.isSimulated && !simulating && (
            <>
              <div className="flex flex-wrap gap-3 mb-4">
                {rounds.map((round) => (
                  <button key={round} onClick={() => callSimulate({ competitionId: selectedComp, round, action: "rodada" })}
                    className="btn-secondary text-xs py-2 px-4">
                    Rodada {round}
                  </button>
                ))}
                <button onClick={() => handleSimulateAction("temporada")} className="btn-primary text-xs py-2 px-4">
                  Competição Inteira
                </button>
                {comp.seasonId && (
                  <button onClick={() => handleSimulateAction("todas-temporada")} className="btn-primary text-xs py-2 px-4">
                    Simular Temporada (todas)
                  </button>
                )}
                <button onClick={() => handleSimulateAction("turno-ida")} className="btn-secondary text-xs py-2 px-4">
                  Turno (Ida)
                </button>
                <button onClick={() => handleSimulateAction("turno-volta")} className="btn-secondary text-xs py-2 px-4">
                  Returno (Volta)
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="flex gap-2">
                  <input type="text" value={maxRound} onChange={(e) => setMaxRound(e.target.value)}
                    placeholder="Rodada limite (ex: 10)"
                    className="flex-1 bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
                  <button onClick={() => handleSimulateAction("ate-rodada")} className="btn-secondary text-xs py-2 px-4 whitespace-nowrap">
                    Até Rodada
                  </button>
                </div>
                <div className="flex gap-2">
                  <input type="date" value={dataLimite} onChange={(e) => setDataLimite(e.target.value)}
                    className="flex-1 bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
                  <button onClick={() => handleSimulateAction("ate-data")} className="btn-secondary text-xs py-2 px-4 whitespace-nowrap">
                    Até Data
                  </button>
                </div>
              </div>
              {finishedMatches.length > 0 && (
                <button onClick={cancelAllSimulation} className="text-xs text-red-400 hover:underline">
                  Cancelar todas as simulações desta competição
                </button>
              )}
            </>
          )}

          {!comp.isSimulated && (
            <p className="text-sm text-blue-light bg-blue-deep/40 rounded-lg p-3">
              🎮 Esta competição é <b>jogável</b> — as partidas serão disputadas no HaxBall e os resultados enviados via API.
              NÃO será simulada quando clicar em "Simular Temporada".
            </p>
          )}
        </div>
      )}

      {simulating && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-gold text-lg">Simulando...</p>
        </div>
      )}

      {/* Lista de partidas */}
      {comp && matches.length > 0 && !simulating && (
        <div className="space-y-2">
          {[...scheduledMatches, ...finishedMatches].slice(0, 60).map((m) => (
            <div key={m.id}
              className={`glass rounded-xl p-3 flex items-center justify-between text-sm ${m.status === "finished" ? "opacity-80" : ""}`}>
              <div className="flex-1 text-right">
                <div>{m.homeTeam?.name || "—"}</div>
                <div className="text-xs text-muted">{getStars(m.homeTeam?.strength || 0)}</div>
              </div>
              <div className="px-4 text-center min-w-[120px]">
                {editingScore === m.id ? (
                  <div className="flex items-center gap-1">
                    <input type="number" value={editHome} onChange={(e) => setEditHome(Number(e.target.value))}
                      className="w-12 bg-card border border-border rounded px-1 py-1 text-sm text-center" />
                    <span className="text-muted">x</span>
                    <input type="number" value={editAway} onChange={(e) => setEditAway(Number(e.target.value))}
                      className="w-12 bg-card border border-border rounded px-1 py-1 text-sm text-center" />
                    <button onClick={() => saveScore(m.id)} className="text-green-400 text-xs ml-1">✓</button>
                    <button onClick={() => setEditingScore(null)} className="text-red-400 text-xs">✕</button>
                  </div>
                ) : m.status === "finished" ? (
                  <div className="flex items-center gap-2">
                    <span className="text-lg font-bold gold-text">{m.homeScore} - {m.awayScore}</span>
                    <button onClick={() => { setEditingScore(m.id); setEditHome(m.homeScore ?? 0); setEditAway(m.awayScore ?? 0); }}
                      className="text-xs text-gold hover:underline">editar</button>
                    {m.matchDate && (
                      <button onClick={() => cancelSimulation(m.id)}
                        className="text-xs text-red-400 hover:underline">cancelar</button>
                    )}
                  </div>
                ) : (
                  <span className="text-xs text-muted">Rod. {m.round}</span>
                )}
              </div>
              <div className="flex-1">
                <div>{m.awayTeam?.name || "—"}</div>
                <div className="text-xs text-muted">{getStars(m.awayTeam?.strength || 0)}</div>
              </div>
              {m.status === "scheduled" && (
                <button onClick={() => handleSimulateMatch(m.id)} disabled={simulateMatchId === m.id}
                  className="ml-3 btn-primary text-xs py-1.5 px-3 disabled:opacity-50">
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
