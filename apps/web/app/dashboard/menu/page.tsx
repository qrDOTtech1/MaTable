"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Item = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  category?: string | null;
  available: boolean;
};

export default function MenuPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState({ name: "", price: "", category: "" });

  async function reload() {
    const r = await api<{ items: Item[] }>(`/api/pro/menu`);
    setItems(r.items);
  }

  useEffect(() => {
    reload().catch(() => (window.location.href = "/login"));
  }, []);

  async function add(e: React.FormEvent) {
    e.preventDefault();
    await api(`/api/pro/menu`, {
      method: "POST",
      body: JSON.stringify({
        name: form.name,
        priceCents: Math.round(parseFloat(form.price) * 100),
        category: form.category || undefined,
      }),
    });
    setForm({ name: "", price: "", category: "" });
    reload();
  }

  async function toggle(it: Item) {
    await api(`/api/pro/menu/${it.id}`, {
      method: "PATCH",
      body: JSON.stringify({ available: !it.available }),
    });
    reload();
  }

  async function del(id: string) {
    if (!confirm("Supprimer ce plat ?")) return;
    await api(`/api/pro/menu/${id}`, { method: "DELETE" });
    reload();
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Menu</h1>

      <form onSubmit={add} className="card flex flex-wrap gap-2 items-end mb-6">
        <div className="flex-1 min-w-[160px]">
          <label className="block text-xs text-slate-500">Nom</label>
          <input
            className="w-full border rounded px-2 py-1"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Prix (€)</label>
          <input
            className="w-24 border rounded px-2 py-1"
            type="number"
            step="0.01"
            value={form.price}
            onChange={(e) => setForm({ ...form, price: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="block text-xs text-slate-500">Catégorie</label>
          <input
            className="w-40 border rounded px-2 py-1"
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.target.value })}
          />
        </div>
        <button className="btn-primary">Ajouter</button>
      </form>

      <div className="space-y-2">
        {items.map((it) => (
          <div key={it.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">
                {it.name}{" "}
                <span className="text-xs text-slate-400">
                  {it.category ? `· ${it.category}` : ""}
                </span>
              </div>
              <div className="text-sm">{(it.priceCents / 100).toFixed(2)} €</div>
            </div>
            <div className="flex gap-2">
              <button className="btn-ghost text-sm" onClick={() => toggle(it)}>
                {it.available ? "Désactiver" : "Activer"}
              </button>
              <button className="btn-ghost text-sm text-red-600" onClick={() => del(it.id)}>
                Suppr
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
