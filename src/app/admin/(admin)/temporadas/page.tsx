"use client";

import { useState, useEffect } from "react";

type League = { id: string; name: string };

const PAGE_SIZE = 50;

export default function AdminTemporadas() {
  const [seasons, setSeasons] = useState<Record<string, unknown>[]>([]);
  const [leagues, setLeagues] = useState<League[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [year, setYear] = useState(2026);
  const [leagueId, setLeagueId] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [filterYear, setFilterYear] = useState("");
  const [filterLeague, setFilterLeague] = useState("");

  const fetchSeasons = async (p: number, fy: string, fl: string) => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(p), limit: String(PAGE_SIZE) });
    if (fy) params.set("year", fy);
    if (fl) params.set("leagueId", fl);
    const res = await fetch(`/api/seasons?${params}`);
    const data = await res.json();
    setSeasons(data.seasons ?? data);
    setTotalPages(data.totalPages ?? 1);
    setLoading(false);
  };

  useEffect(() => {
    fetchSeasons(page, filterYear, filterLeague);
    fetch("/api/leagues").then((r) => r.json()).then(setLeagues);
  }, [page, filterYear, filterLeague]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const body: Record<string, unknown> = {
      name: `${year}`,
      year,
      leagueId: leagueId || null,
    };
    const method = editingId ? "PUT" : "POST";
    if (editingId) body.id = editingId;
    await fetch("/api/seasons", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    setEditingId(null);
    setYear(2026);
    setLeagueId("");
    fetchSeasons(1, filterYear, filterLeague);
    setPage(1);
  };

  const handleEdit = (item: Record<string, unknown>) => {
    setEditingId(String(item.id));
    setYear(Number(item.year || 2026));
    setLeagueId(String(item.leagueId || ""));
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    await fetch(`/api/seasons?id=${id}`, { method: "DELETE" });
    fetchSeasons(page, filterYear, filterLeague);
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">Temporadas</h1>
        {!showForm && (
          <button
            onClick={() => { setShowForm(true); setEditingId(null); setYear(2026); setLeagueId(""); }}
            className="btn-primary text-sm py-2 px-4"
          >
            + Nova Temporada
          </button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? "Editar" : "Criar"} Temporada</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Ano da Temporada *</label>
              <input
                type="number"
                value={year}
                onChange={(e) => setYear(Number(e.target.value))}
                min={2000}
                max={2100}
                required
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              />
              <p className="text-xs text-muted mt-1">Apenas o ano. O sistema gera tudo automaticamente.</p>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Liga (opcional)</label>
              <select
                value={leagueId}
                onChange={(e) => setLeagueId(e.target.value)}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
              >
                <option value="">— Nenhuma —</option>
                {leagues.map((l) => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary text-sm py-2 px-6">
              {editingId ? "Salvar" : "Criar"}
            </button>
            <button
              type="button"
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="btn-secondary text-sm py-2 px-6"
            >
              Cancelar
            </button>
          </div>
        </form>
      )}

      {/* Filtros */}
      <div className="flex gap-3 mb-4 flex-wrap">
        <input
          type="number"
          placeholder="Filtrar por ano..."
          value={filterYear}
          onChange={(e) => { setFilterYear(e.target.value); setPage(1); }}
          className="bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm w-40 focus:outline-none focus:border-gold"
        />
        <select
          value={filterLeague}
          onChange={(e) => { setFilterLeague(e.target.value); setPage(1); }}
          className="bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
        >
          <option value="">Todas as ligas</option>
          {leagues.map((l) => (
            <option key={l.id} value={l.id}>{l.name}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : seasons.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Nenhuma temporada encontrada.</p>
        </div>
      ) : (
        <>
          <div className="glass rounded-2xl overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr className="text-left text-muted text-xs">
                  <th className="p-3">Ano</th>
                  <th className="p-3">Liga</th>
                  <th className="p-3 text-right">Ações</th>
                </tr>
              </thead>
              <tbody>
                {seasons.map((s) => (
                  <tr key={String(s.id)} className="border-b border-border last:border-0">
                    <td className="p-3 font-bold text-lg gold-text">{String(s.year || s.name)}</td>
                    <td className="p-3 text-muted">{(s.league as { name?: string })?.name || "—"}</td>
                    <td className="p-3 text-right space-x-2">
                      <button onClick={() => handleEdit(s)} className="text-gold hover:underline text-xs">Editar</button>
                      <button onClick={() => handleDelete(String(s.id))} className="text-red-400 hover:underline text-xs">Excluir</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Paginação */}
          <div className="flex justify-center items-center gap-3 mt-6">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="btn-secondary text-xs py-1 px-3 disabled:opacity-30"
            >
              Anterior
            </button>
            <span className="text-sm text-muted">
              Página {page} de {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
              className="btn-secondary text-xs py-1 px-3 disabled:opacity-30"
            >
              Próxima
            </button>
          </div>
        </>
      )}
    </div>
  );
}
