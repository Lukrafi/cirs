"use client";

import { useState, useEffect } from "react";

type Field = {
  name: string;
  label: string;
  type: "text" | "number" | "textarea" | "select" | "checkbox" | "date";
  options?: { value: string; label: string }[];
  fetchOptionsFrom?: string;
  optionLabel?: string;
  default?: string | number | boolean;
};

type DisplayField = { key: string; label: string; ref?: string; refLabel?: string };

type CrudTableProps = {
  apiPath: string;
  fields: Field[];
  title: string;
  displayFields?: DisplayField[];
};

export default function CrudManager({ apiPath, fields, title, displayFields }: CrudTableProps) {
  const [items, setItems] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<Record<string, unknown> | null>(null);
  const [form, setForm] = useState<Record<string, unknown>>({});
  const [dynamicOptions, setDynamicOptions] = useState<Record<string, { value: string; label: string }[]>>({});

  const fetchItems = async () => {
    setLoading(true);
    const res = await fetch(apiPath);
    const data = await res.json();
    setItems(data);
    setLoading(false);
  };

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchItems();
    fields.forEach(async (f) => {
      if (f.fetchOptionsFrom) {
        const res = await fetch(f.fetchOptionsFrom);
        const data = await res.json();
        const opts = data.map((item: Record<string, unknown>) => ({
          value: String(item.id),
          label: String(item[f.optionLabel || "name"] || item.name || item.title || "—"),
        }));
        setDynamicOptions((prev) => ({ ...prev, [f.name]: opts }));
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const body = editing ? { id: editing.id, ...form } : form;
    await fetch(apiPath, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setShowForm(false);
    setEditing(null);
    setForm({});
    fetchItems();
  };

  const handleEdit = (item: Record<string, unknown>) => {
    setEditing(item);
    const formData: Record<string, unknown> = {};
    fields.forEach((f) => { formData[f.name] = item[f.name] ?? f.default ?? ""; });
    setForm(formData);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Tem certeza que deseja excluir?")) return;
    await fetch(`${apiPath}?id=${id}`, { method: "DELETE" });
    fetchItems();
  };

  const handleNew = () => {
    const formData: Record<string, unknown> = {};
    fields.forEach((f) => { formData[f.name] = f.default ?? (f.type === "number" ? 0 : f.type === "checkbox" ? false : ""); });
    setForm(formData);
    setEditing(null);
    setShowForm(true);
  };

  const fieldsToShow: DisplayField[] = (displayFields || fields.filter(f => f.type !== "textarea" && f.type !== "checkbox").slice(0, 6).map(f => ({ key: f.name, label: f.label })));

  function getDisplayValue(item: Record<string, unknown>, f: DisplayField): string {
    if (f.ref && f.refLabel) {
      const refObj = item[f.ref] as Record<string, unknown> | undefined;
      if (refObj && refObj[f.refLabel]) return String(refObj[f.refLabel]);
    }
    const val = item[f.key];
    if (val === null || val === undefined || val === "") return "—";
    if (typeof val === "string" && (f.key === "createdAt" || f.key === "updatedAt" || f.key === "date" || f.key === "matchDate" || f.key === "startDate" || f.key === "endDate")) {
      try { return new Date(val).toLocaleDateString("pt-BR"); } catch { return String(val); }
    }
    if (typeof val === "boolean") return val ? "Sim" : "Não";
    return String(val);
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-black">{title}</h1>
        <button onClick={handleNew} className="btn-primary text-sm py-2 px-4">+ Novo</button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="glass rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold mb-4">{editing ? "Editar" : "Criar"} {title}</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {fields.map((f) => (
              <div key={f.name}>
                <label className="text-sm text-muted mb-1 block">{f.label}</label>
                {f.type === "textarea" ? (
                  <textarea
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                    rows={4}
                  />
                ) : f.type === "select" ? (
                  <select
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  >
                    <option value="">—</option>
                    {(f.options || dynamicOptions[f.name] || []).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                ) : f.type === "checkbox" ? (
                  <input
                    type="checkbox"
                    checked={Boolean(form[f.name])}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.checked })}
                    className="w-5 h-5 accent-gold"
                  />
                ) : f.type === "date" ? (
                  <input
                    type="date"
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => setForm({ ...form, [f.name]: e.target.value })}
                    className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  />
                ) : (
                  <input
                    type={f.type === "number" ? "number" : "text"}
                    value={String(form[f.name] ?? "")}
                    onChange={(e) => setForm({ ...form, [f.name]: f.type === "number" ? Number(e.target.value) : e.target.value })}
                    step={f.name === "height" || f.name === "weight" || f.name === "rating" ? "0.1" : "1"}
                    className="w-full bg-blue-deep border border-border rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-gold"
                  />
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-3 mt-4">
            <button type="submit" className="btn-primary text-sm py-2 px-6">{editing ? "Salvar" : "Criar"}</button>
            <button type="button" onClick={() => { setShowForm(false); setEditing(null); }} className="btn-secondary text-sm py-2 px-6">Cancelar</button>
          </div>
        </form>
      )}

      {loading ? (
        <p className="text-muted">Carregando...</p>
      ) : items.length === 0 ? (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-muted">Nenhum registro encontrado.</p>
        </div>
      ) : (
        <div className="glass rounded-2xl overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="border-b border-border">
              <tr className="text-left text-muted text-xs">
                {fieldsToShow.map((f) => <th key={f.key} className="p-3">{f.label}</th>)}
                <th className="p-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => (
                <tr key={String(item.id)} className="border-b border-border last:border-0 hover:bg-white/5">
                  {fieldsToShow.map((f) => (
                    <td key={f.key} className="p-3">
                      {f.key === "emblem" || f.key === "photo" || f.key === "logo" || f.key === "image" ? (
                        item[f.key] ? <img src={String(item[f.key])} alt="" className="w-8 h-8 rounded object-cover" /> : "—"
                      ) : (
                        getDisplayValue(item, f)
                      )}
                    </td>
                  ))}
                  <td className="p-3 text-right">
                    <button onClick={() => handleEdit(item)} className="text-gold hover:underline text-xs mr-2">Editar</button>
                    <button onClick={() => handleDelete(String(item.id))} className="text-red-400 hover:underline text-xs">Excluir</button>
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
