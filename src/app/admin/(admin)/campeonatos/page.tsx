"use client";

import { useState, useEffect } from "react";

type Club = { id: string; name: string; strength: number };
type Season = { id: string; name: string; league?: { name: string } };
type Competition = Record<string, unknown> & { id: string; name: string; format: string };

export default function AdminCampeonatos() {
  const [mode, setMode] = useState<"list" | "create" | "edit">("list");
  const [competitions, setCompetitions] = useState<Competition[]>([]);
  const [clubs, setClubs] = useState<Club[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [editId, setEditId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [type, setType] = useState("Liga");
  const [logo, setLogo] = useState("");
  const [seasonId, setSeasonId] = useState("");
  const [format, setFormat] = useState("round-robin");
  const [numTurns, setNumTurns] = useState(2);
  const [selectedClubs, setSelectedClubs] = useState<string[]>([]);
  const [relegated, setRelegated] = useState(0);
  const [qualifiedLibertadores, setQualifiedLibertadores] = useState(0);
  const [qualifiedSulAmericana, setQualifiedSulAmericana] = useState(0);
  const [pointsPerWin, setPointsPerWin] = useState(3);
  const [pointsPerDraw, setPointsPerDraw] = useState(1);
  const [hasExtraTime, setHasExtraTime] = useState(false);
  const [hasPenalties, setHasPenalties] = useState(false);
  const [maxSubstitutions, setMaxSubstitutions] = useState(5);
  const [maxCards, setMaxCards] = useState(3);

  const fetchCompetitions = async () => {
    const res = await fetch("/api/competitions");
    const data = await res.json();
    setCompetitions(data);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCompetitions();
  }, []);

  const fetchFormData = async () => {
    setLoading(true);
    const [cRes, sRes] = await Promise.all([
      fetch("/api/clubs"),
      fetch("/api/seasons"),
    ]);
    const [cData, sData] = await Promise.all([cRes.json(), sRes.json()]);
    setClubs(cData);
    setSeasons(sData);
    setLoading(false);
  };

  const handleCreate = async () => {
    await fetchFormData();
    setMode("create");
    resetForm();
  };

  const handleEdit = async (comp: Competition) => {
    await fetchFormData();
    setEditId(comp.id);
    setName(String(comp.name ?? ""));
    setType(String(comp.type ?? "Liga"));
    setLogo(String(comp.logo ?? ""));
    setSeasonId(String(comp.seasonId ?? ""));
    setFormat(String(comp.format ?? "round-robin"));
    setNumTurns(Number(comp.numTurns ?? 2));
    setRelegated(Number(comp.relegated ?? 0));
    setQualifiedLibertadores(Number(comp.qualifiedLibertadores ?? 0));
    setQualifiedSulAmericana(Number(comp.qualifiedSulAmericana ?? 0));
    setPointsPerWin(Number(comp.pointsPerWin ?? 3));
    setPointsPerDraw(Number(comp.pointsPerDraw ?? 1));
    setHasExtraTime(Boolean(comp.hasExtraTime));
    setHasPenalties(Boolean(comp.hasPenalties));
    setMaxSubstitutions(Number(comp.maxSubstitutions ?? 5));
    setMaxCards(Number(comp.maxCardsBeforeSuspension ?? 3));
    setMode("edit");
  };

  const resetForm = () => {
    setEditId(null);
    setName("");
    setType("Liga");
    setLogo("");
    setSeasonId("");
    setFormat("round-robin");
    setNumTurns(2);
    setSelectedClubs([]);
    setRelegated(0);
    setQualifiedLibertadores(0);
    setQualifiedSulAmericana(0);
    setPointsPerWin(3);
    setPointsPerDraw(1);
    setHasExtraTime(false);
    setHasPenalties(false);
    setMaxSubstitutions(5);
    setMaxCards(3);
  };

  const toggleClub = (id: string) => {
    setSelectedClubs((prev) =>
      prev.includes(id) ? prev.filter((c) => c !== id) : [...prev, id]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedClubs.length < 2) {
      alert("Selecione pelo menos 2 clubes para a competição.");
      return;
    }
    setSubmitting(true);
    try {
      const body: Record<string, unknown> = {
        name,
        type,
        logo,
        seasonId: seasonId || null,
        format,
        numTeams: selectedClubs.length,
        numTurns,
        relegated,
        qualifiedLibertadores,
        qualifiedSulAmericana,
        pointsPerWin,
        pointsPerDraw,
        hasExtraTime,
        hasPenalties,
        maxSubstitutions,
        maxCardsBeforeSuspension: maxCards,
        clubIds: selectedClubs,
      };
      if (editId) {
        body.id = editId;
      }
      const method = editId ? "PUT" : "POST";
      const res = await fetch("/api/competitions", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        resetForm();
        setMode("list");
        fetchCompetitions();
      } else {
        const err = await res.json();
        alert("Erro: " + (err.error || "Falha ao salvar"));
      }
    } catch {
      alert("Erro de conexão");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir esta competição e todos os jogos gerados?")) return;
    await fetch(`/api/competitions?id=${id}`, { method: "DELETE" });
    fetchCompetitions();
  };

  const selectAllClubs = () => setSelectedClubs(clubs.map((c) => c.id));
  const deselectAllClubs = () => setSelectedClubs([]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">Campeonatos</h1>
        {mode === "list" && (
          <button onClick={handleCreate} className="btn-primary text-sm py-2 px-4">
            + Nova Competição
          </button>
        )}
        {mode !== "list" && (
          <button
            onClick={() => { setMode("list"); resetForm(); }}
            className="btn-secondary text-sm py-2 px-4"
          >
            ← Voltar
          </button>
        )}
      </div>

      {mode === "list" && (
        <div className="glass rounded-2xl overflow-x-auto">
          {competitions.length === 0 ? (
            <div className="p-12 text-center text-muted">Nenhuma competição criada ainda.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-muted text-xs">
                  <th className="p-3">Nome</th>
                  <th className="p-3">Tipo</th>
                  <th className="p-3">Formato</th>
                  <th className="p-3">Times</th>
                  <th className="p-3">Temporada</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {competitions.map((comp) => (
                  <tr key={comp.id} className="border-b border-border last:border-0 hover:bg-white/5">
                    <td className="p-3 font-medium">{comp.name}</td>
                    <td className="p-3">{String(comp.type)}</td>
                    <td className="p-3 text-muted">{String(comp.format ?? "round-robin")}</td>
                    <td className="p-3">{String(comp.numTeams ?? 0)}</td>
                    <td className="p-3 text-muted">
                      {(comp.season as { name?: string } | undefined)?.name || "—"}
                    </td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => handleEdit(comp)} className="text-gold hover:underline text-xs">
                        Editar
                      </button>
                      <button onClick={() => handleDelete(comp.id)} className="text-red-400 hover:underline text-xs">
                        Excluir
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      {mode === "create" || mode === "edit" ? (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold gold-text mb-4">Dados Básicos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Nome *</label>
                <input type="text" value={name} onChange={(e) => setName(e.target.value)} required
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Tipo</label>
                <input type="text" value={type} onChange={(e) => setType(e.target.value)}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">URL do Logo</label>
                <input type="text" value={logo} onChange={(e) => setLogo(e.target.value)}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Temporada</label>
                <select value={seasonId} onChange={(e) => setSeasonId(e.target.value)}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold">
                  <option value="">— Nenhuma —</option>
                  {seasons.map((s) => (
                    <option key={s.id} value={s.id}>{s.name} {s.league ? `(${s.league.name})` : ""}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Formato</label>
                <select value={format} onChange={(e) => setFormat(e.target.value)}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold">
                  <option value="round-robin">Turno e Returno</option>
                  <option value="single-round">Turno Único</option>
                  <option value="groups">Grupos</option>
                  <option value="knockout">Mata-mata</option>
                  <option value="swiss">Fase Suíça</option>
                </select>
              </div>
              {!["knockout", "swiss"].includes(format) && (
                <div>
                  <label className="text-sm text-muted mb-1 block">Número de Turnos</label>
                  <input type="number" min={1} max={4} value={numTurns} onChange={(e) => setNumTurns(Number(e.target.value))}
                    className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
                </div>
              )}
            </div>
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold gold-text mb-4">2. Selecionar Clubes Participantes</h2>
            <p className="text-sm text-muted mb-3">
              Selecione os clubes que participarão desta competição. Mínimo 2 clubes.
              <span className="text-gold ml-2">{selectedClubs.length} selecionado(s)</span>
            </p>
            <div className="flex gap-2 mb-4">
              <button type="button" onClick={selectAllClubs} className="text-xs text-gold hover:underline">
                Selecionar Todos
              </button>
              <button type="button" onClick={deselectAllClubs} className="text-xs text-muted hover:underline">
                Limpar
              </button>
            </div>
            {loading ? (
              <p className="text-muted text-sm">Carregando clubes...</p>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2 max-h-60 overflow-y-auto">
                {clubs.map((club) => (
                  <button
                    key={club.id}
                    type="button"
                    onClick={() => toggleClub(club.id)}
                    className={`text-sm px-3 py-2 rounded-lg text-left transition-colors ${
                      selectedClubs.includes(club.id)
                        ? "bg-gold/20 text-gold gold-border"
                        : "bg-blue-deep text-muted hover:bg-white/5"
                    }`}
                  >
                    {club.name} <span className="text-xs opacity-60">{club.strength}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="glass rounded-2xl p-6">
            <h2 className="text-lg font-bold gold-text mb-4">3. Configurações da Competição</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <label className="text-sm text-muted mb-1 block">Pontos por Vitória</label>
                <input type="number" value={pointsPerWin} onChange={(e) => setPointsPerWin(Number(e.target.value))}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Pontos por Empate</label>
                <input type="number" value={pointsPerDraw} onChange={(e) => setPointsPerDraw(Number(e.target.value))}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Nº de Rebaixados</label>
                <input type="number" value={relegated} onChange={(e) => setRelegated(Number(e.target.value))}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Vagas Libertadores</label>
                <input type="number" value={qualifiedLibertadores} onChange={(e) => setQualifiedLibertadores(Number(e.target.value))}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Vagas Sul-Americana</label>
                <input type="number" value={qualifiedSulAmericana} onChange={(e) => setQualifiedSulAmericana(Number(e.target.value))}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Máx. Substituições</label>
                <input type="number" value={maxSubstitutions} onChange={(e) => setMaxSubstitutions(Number(e.target.value))}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
              <div>
                <label className="text-sm text-muted mb-1 block">Cartões p/ Suspensão</label>
                <input type="number" value={maxCards} onChange={(e) => setMaxCards(Number(e.target.value))}
                  className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
              </div>
            </div>
            <div className="flex gap-4 mt-4">
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={hasExtraTime} onChange={(e) => setHasExtraTime(e.target.checked)}
                  className="accent-gold w-5 h-5" />
                Prorrogação
              </label>
              <label className="flex items-center gap-2 text-sm text-muted">
                <input type="checkbox" checked={hasPenalties} onChange={(e) => setHasPenalties(e.target.checked)}
                  className="accent-gold w-5 h-5" />
                Pênaltis
              </label>
            </div>
          </div>

          <div className="flex gap-3">
            <button type="submit" disabled={submitting}
              className="btn-primary text-sm py-3 px-8 disabled:opacity-50">
              {submitting ? "Gerando jogos..." : editId ? "Salvar Alterações" : "Criar Competição e Gerar Jogos"}
            </button>
            <button type="button" onClick={() => { setMode("list"); resetForm(); }}
              className="btn-secondary text-sm py-3 px-8">
              Cancelar
            </button>
          </div>
        </form>
      ) : null}
    </div>
  );
}