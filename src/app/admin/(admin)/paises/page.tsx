"use client";

import { useState, useEffect } from "react";

type Country = {
  id: string;
  name: string;
  code: string;
  flag: string;
  confederationId?: string;
  confederation?: { id: string; name: string } | null;
};
type Confederation = { id: string; name: string };

export default function AdminPaises() {
  const [countries, setCountries] = useState<Country[]>([]);
  const [confederations, setConfederations] = useState<Confederation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [search, setSearch] = useState("");

  const fetchCountries = async () => {
    setLoading(true);
    const res = await fetch("/api/countries");
    const data = await res.json();
    setCountries(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchCountries();
    fetch("/api/confederations").then((r) => r.json()).then(setConfederations);
  }, []);

  const handleNew = () => {
    setForm({
      name: "",
      code: "",
      flag: "",
      confederationId: "",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (country: Country) => {
    setForm({
      id: country.id,
      name: country.name,
      code: country.code,
      flag: country.flag,
      confederationId: country.confederationId || "",
    });
    setEditingId(country.id);
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
    await fetch("/api/countries", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    setEditingId(null);
    setForm({});
    fetchCountries();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    await fetch(`/api/countries?id=${id}`, { method: "DELETE" });
    fetchCountries();
  };

  const getConfederationName = (id?: string) => {
    if (!id) return "—";
    return confederations.find((c) => c.id === id)?.name || "—";
  };

  const filtered = countries.filter((c) => {
    const q = search.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name.toLowerCase().includes(q) ||
      c.code.toLowerCase().includes(q) ||
      (c.confederation?.name || getConfederationName(c.confederationId)).toLowerCase().includes(q)
    );
  });

  return (
    <div>
      <div className="flex justify-between items-center mb-6 gap-4">
        <h1 className="text-2xl font-black">Países</h1>
        <div className="flex gap-3 items-center">
          <input
            type="text"
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold w-48"
          />
          {!showForm && (
            <button onClick={handleNew} className="btn-primary text-sm py-2 px-4">+ Novo País</button>
          )}
        </div>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? "Editar" : "Criar"} País</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Nome *</label>
              <input type="text" value={String(form.name || "")} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Bandeira (URL)</label>
              <input type="text" value={String(form.flag || "")} onChange={(e) => setForm({ ...form, flag: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Confederação</label>
              <select value={String(form.confederationId || "")} onChange={(e) => setForm({ ...form, confederationId: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold">
                <option value="">— Nenhuma —</option>
                {confederations.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
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
      ) : filtered.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Nenhum país encontrado.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-muted text-xs">
                <th className="p-3">Bandeira</th>
                <th className="p-3">Nome</th>
                <th className="p-3">Confederação</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((country) => (
                <tr key={country.id} className="border-b border-border last:border-0 hover:bg-white/5">
                  <td className="p-3">
                    {country.flag ? (
                      <img src={country.flag} alt="" className="w-8 h-8 rounded object-contain" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 font-medium">{country.name}</td>
                  <td className="p-3 text-muted">{country.confederation?.name || getConfederationName(country.confederationId)}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleEdit(country)} className="text-gold hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(country.id)} className="text-red-400 hover:underline text-xs">Excluir</button>
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
