"use client";

import { useState, useEffect } from "react";

type Club = {
  id: string;
  name: string;
  city: string;
  countryId?: string;
  associationId?: string;
  divisionId?: string;
  founded: string;
  emblem: string;
  strength: number;
};
type Country = { id: string; name: string; code: string; confederation?: { name: string } };
type Division = { id: string; name: string; level: number };
type League = { id: string; name: string };
type Association = { id: string; name: string };

export default function AdminClubes() {
  const [clubs, setClubs] = useState<Club[]>([]);
  const [countries, setCountries] = useState<Country[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [associations, setAssociations] = useState<Association[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});

  const fetchClubs = async () => {
    setLoading(true);
    const res = await fetch("/api/clubs");
    const data = await res.json();
    setClubs(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchClubs();
    fetch("/api/countries").then((r) => r.json()).then(setCountries);
    fetch("/api/divisions").then((r) => r.json()).then(setDivisions);
  }, []);

  useEffect(() => {
    if (form.countryId) {
      fetch("/api/countries")
        .then((r) => r.json())
        .then((data: Country[]) => {
          setAssociations(data.filter((c) => c.id === form.countryId).map((c) => ({ id: c.id, name: c.name + " FA" })));
        });
    }
  }, [form.countryId]);

  const handleNew = () => {
    setForm({
      name: "",
      city: "",
      countryId: "",
      associationId: "",
      divisionId: "",
      founded: "",
      emblem: "",
      primaryKit: "",
      secondaryKit: "",
      strength: "5.0",
    });
    setEditingId(null);
    setShowForm(true);
  };

  const handleEdit = (club: Club) => {
    setForm({
      id: club.id,
      name: club.name,
      city: club.city,
      countryId: club.countryId || "",
      associationId: club.associationId || "",
      divisionId: club.divisionId || "",
      founded: club.founded,
      emblem: club.emblem,
      strength: String(club.strength),
    });
    setEditingId(club.id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.countryId) {
      alert("Nome e País são obrigatórios!");
      return;
    }
    const method = editingId ? "PUT" : "POST";
    const body = editingId ? { id: editingId, ...form } : form;
    await fetch("/api/clubs", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    setEditingId(null);
    setForm({});
    fetchClubs();
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza?")) return;
    await fetch(`/api/clubs?id=${id}`, { method: "DELETE" });
    fetchClubs();
  };

  const strengthOptions: { value: string; label: string }[] = [];
  for (let i = 1.0; i <= 10.0; i += 0.5) {
    strengthOptions.push({ value: String(i), label: `⭐ ${i.toFixed(1)}` });
  }

  const getCountryName = (id?: string) => countries.find((c) => c.id === id)?.name || "—";
  const getDivisionName = (id?: string) => divisions.find((d) => d.id === id)?.name || "—";

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">Clubes</h1>
        {!showForm && (
          <button onClick={handleNew} className="btn-primary text-sm py-2 px-4">+ Novo Clube</button>
        )}
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{editingId ? "Editar" : "Criar"} Clube</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <label className="text-sm text-muted mb-1 block">Nome *</label>
              <input type="text" value={String(form.name || "")} onChange={(e) => setForm({ ...form, name: e.target.value })} required
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Cidade</label>
              <input type="text" value={String(form.city || "")} onChange={(e) => setForm({ ...form, city: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">País *</label>
              <select value={String(form.countryId || "")} onChange={(e) => setForm({ ...form, countryId: e.target.value })} required
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold">
                <option value="">— Selecione —</option>
                {countries.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Divisão</label>
              <select value={String(form.divisionId || "")} onChange={(e) => setForm({ ...form, divisionId: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold">
                <option value="">— Nenhuma —</option>
                {divisions.map((d) => (
                  <option key={d.id} value={d.id}>{d.name} (Nível {d.level})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Fundação</label>
              <input type="text" value={String(form.founded || "")} onChange={(e) => setForm({ ...form, founded: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">URL do Escudo</label>
              <input type="text" value={String(form.emblem || "")} onChange={(e) => setForm({ ...form, emblem: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Força (1.0 a 10.0)</label>
              <select value={String(form.strength || "5.0")} onChange={(e) => setForm({ ...form, strength: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold">
                {strengthOptions.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Uniforme Primário</label>
              <input type="text" value={String(form.primaryKit || "")} onChange={(e) => setForm({ ...form, primaryKit: e.target.value })}
                className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold" />
            </div>
            <div>
              <label className="text-sm text-muted mb-1 block">Uniforme Secundário</label>
              <input type="text" value={String(form.secondaryKit || "")} onChange={(e) => setForm({ ...form, secondaryKit: e.target.value })}
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
      ) : clubs.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Nenhum clube cadastrado.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-muted text-xs">
                <th className="p-3">Escudo</th>
                <th className="p-3">Nome</th>
                <th className="p-3">País</th>
                <th className="p-3">Divisão</th>
                <th className="p-3">Força</th>
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {clubs.map((club) => (
                <tr key={club.id} className="border-b border-border last:border-0 hover:bg-white/5">
                  <td className="p-3">
                    {club.emblem ? (
                      <img src={club.emblem} alt="" className="w-8 h-8 rounded object-cover" />
                    ) : (
                      "—"
                    )}
                  </td>
                  <td className="p-3 font-medium">{club.name}</td>
                  <td className="p-3 text-muted">{getCountryName(club.countryId)}</td>
                  <td className="p-3 text-muted">{getDivisionName(club.divisionId)}</td>
                  <td className="p-3 gold-text font-bold">{club.strength}</td>
                  <td className="p-3 text-right space-x-2">
                    <button onClick={() => handleEdit(club)} className="text-gold hover:underline text-xs">Editar</button>
                    <button onClick={() => handleDelete(club.id)} className="text-red-400 hover:underline text-xs">Excluir</button>
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