"use client";

import { useState, useEffect } from "react";

type Division = {
  id: string;
  name: string;
  level: number;
  countryId?: string;
  country?: { id: string; name: string } | null;
};
type Country = { id: string; name: string };

export default function AdminDivisoes() {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const fetchDivisions = async () => {
    setLoading(true);
    const res = await fetch("/api/divisions");
    const data = await res.json();
    setDivisions(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchDivisions();
    fetch("/api/countries").then((r) => r.json()).then(setCountries);
  }, []);

  const handleNew = () => {
    setForm({
      name: "",
      countryId: "",
      level: 1,
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (division: Division) => {
    setForm({
      id: division.id,
      name: division.name,
      countryId: division.countryId || "",
      level: division.level,
    });
    setEditingId(division.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name) {
      alert("Nome é obrigatório!");
      return;
    }
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { id: editingId, ...form } : form;
    await fetch("/api/divisions", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    setEditingId(null);
    setForm({});
    fetchDivisions();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    await fetch(`/api/divisions?id=${id}`, { method: "DELETE" });
    fetchDivisions();
  };

  const getCountryName = (id?: string) => {
    if (!id) return "—";
    return countries.find((c) => c.id === id)?.name || "—";
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">Divisões</h1>
        {!showForm && (
          <button onClick={handleNew} className="btn-primary text-sm py-2 px-4">+ Nova Divisão</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? "Editar" : "Criar"} Divisão</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Nome *</label>
              <input type="text" value={String(form.name || "")} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">País</label>
              <select value={String(form.countryId || "")} onChange={(e) => setForm({ ...form, countryId: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold">
                <option value="">— Nenhuma —</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Nível</label>
              <input type="number" value={String(form.level ?? 1)} onChange={(e) => setForm({ ...form, level: Number(e.target.value) })} min={1}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary text-sm py-2 px-6">{editingId ? "Salvar" : "Criar"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditingId(null); }} className="btn-secondary text-sm py-2 px-6">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : divisions.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Nenhuma divisão cadastrada.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-muted text-xs">
                <th className="p-3">Nome</th>
                <th className="p-3">País</th>
                <th className="p-3">Nível</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {divisions.map((division) => (
                <tr key={division.id} className="border-b border-border last:border-0 hover:bg-white/5">
                  <td className="p-3 font-medium">{division.name}</td>
                  <td className="p-3 text-muted">{division.country?.name || getCountryName(division.countryId)}</td>
                  <td className="p-3 gold-text font-bold">{division.level}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleEdit(division)} className="text-gold hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(division.id)} className="text-red-400 hover:underline text-xs">Excluir</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
