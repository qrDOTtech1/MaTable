"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

const ALLERGENS = [
  "GLUTEN","CRUSTACEANS","EGGS","FISH","PEANUTS","SOYBEANS","MILK","NUTS",
  "CELERY","MUSTARD","SESAME","SULPHITES","LUPIN","MOLLUSCS",
] as const;
const ALLERGEN_LABELS: Record<string, string> = {
  GLUTEN:"Gluten", CRUSTACEANS:"Crustacés", EGGS:"Oeufs", FISH:"Poisson",
  PEANUTS:"Arachides", SOYBEANS:"Soja", MILK:"Lait", NUTS:"Fruits à coque",
  CELERY:"Céleri", MUSTARD:"Moutarde", SESAME:"Sésame", SULPHITES:"Sulfites",
  LUPIN:"Lupin", MOLLUSCS:"Mollusques",
};
const DIETS = ["VEGETARIAN","VEGAN","GLUTEN_FREE","LACTOSE_FREE","HALAL","KOSHER","SPICY"] as const;
const DIET_LABELS: Record<string, string> = {
  VEGETARIAN:"🌿 Végétarien", VEGAN:"🌱 Vegan", GLUTEN_FREE:"🌾 Sans gluten",
  LACTOSE_FREE:"🥛 Sans lactose", HALAL:"☪️ Halal", KOSHER:"✡️ Casher", SPICY:"🌶️ Épicé",
};

type ModifierOption = { id: string; name: string; priceDeltaCents: number };
type ModifierGroup = { id: string; name: string; required: boolean; multiple: boolean; options: ModifierOption[] };
type Item = {
  id: string; name: string; description?: string | null; priceCents: number;
  category?: string | null; available: boolean; imageUrl?: string | null;
  allergens: string[]; diets: string[];
  stockEnabled: boolean; stockQty?: number | null; lowStockThreshold?: number | null;
  modifierGroups: ModifierGroup[];
};

const emptyForm = {
  name: "", price: "", category: "", description: "", imageUrl: "",
  allergens: [] as string[], diets: [] as string[],
  stockEnabled: false, stockQty: "", lowStockThreshold: "5",
};

export default function MenuPage() {
  const [items, setItems] = useState<Item[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editId, setEditId] = useState<string | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [newGroup, setNewGroup] = useState({ name: "", required: false, multiple: false, options: "" });
  const [restockMap, setRestockMap] = useState<Record<string, string>>({});

  const reload = async () => {
    const r = await api<{ items: Item[] }>("/api/pro/menu");
    setItems(r.items);
  };

  useEffect(() => {
    reload().catch(() => (window.location.href = "/login"));
  }, []);

  const toggleAllergen = (a: string) =>
    setForm((f) => ({
      ...f,
      allergens: f.allergens.includes(a) ? f.allergens.filter((x) => x !== a) : [...f.allergens, a],
    }));
  const toggleDiet = (d: string) =>
    setForm((f) => ({
      ...f,
      diets: f.diets.includes(d) ? f.diets.filter((x) => x !== d) : [...f.diets, d],
    }));

  const openEdit = (it: Item) => {
    setEditId(it.id);
    setForm({
      name: it.name, price: (it.priceCents / 100).toFixed(2),
      category: it.category ?? "", description: it.description ?? "",
      imageUrl: it.imageUrl ?? "", allergens: it.allergens ?? [], diets: it.diets ?? [],
      stockEnabled: it.stockEnabled, stockQty: it.stockQty?.toString() ?? "",
      lowStockThreshold: it.lowStockThreshold?.toString() ?? "5",
    });
  };

  const cancelEdit = () => { setEditId(null); setForm(emptyForm); };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    const payload = {
      name: form.name,
      priceCents: Math.round(parseFloat(form.price) * 100),
      category: form.category || undefined,
      description: form.description || undefined,
      imageUrl: form.imageUrl || undefined,
      allergens: form.allergens,
      diets: form.diets,
      stockEnabled: form.stockEnabled,
      stockQty: form.stockEnabled && form.stockQty !== "" ? parseInt(form.stockQty) : null,
      lowStockThreshold: form.stockEnabled && form.lowStockThreshold !== "" ? parseInt(form.lowStockThreshold) : null,
    };
    if (editId) {
      await api(`/api/pro/menu/${editId}`, { method: "PATCH", body: JSON.stringify(payload) });
      setEditId(null);
    } else {
      await api("/api/pro/menu", { method: "POST", body: JSON.stringify(payload) });
    }
    setForm(emptyForm);
    reload();
  };

  const toggle = async (it: Item) => {
    await api(`/api/pro/menu/${it.id}`, { method: "PATCH", body: JSON.stringify({ available: !it.available }) });
    reload();
  };
  const del = async (id: string) => {
    if (!confirm("Supprimer ce plat ?")) return;
    await api(`/api/pro/menu/${id}`, { method: "DELETE" });
    reload();
  };

  const restock = async (id: string) => {
    const delta = parseInt(restockMap[id] || "0");
    if (!delta) return;
    await api(`/api/pro/menu/${id}/restock`, { method: "POST", body: JSON.stringify({ delta }) });
    setRestockMap((m) => ({ ...m, [id]: "" }));
    reload();
  };

  const addModifierGroup = async (itemId: string) => {
    const opts = newGroup.options.split("\n")
      .map((l) => l.trim()).filter(Boolean)
      .map((l) => {
        const parts = l.split("|");
        return { name: parts[0].trim(), priceDeltaCents: parts[1] ? Math.round(parseFloat(parts[1]) * 100) : 0 };
      });
    if (!newGroup.name || opts.length === 0) return;
    await api(`/api/pro/menu/${itemId}/modifiers`, {
      method: "POST",
      body: JSON.stringify({ name: newGroup.name, required: newGroup.required, multiple: newGroup.multiple, options: opts }),
    });
    setNewGroup({ name: "", required: false, multiple: false, options: "" });
    reload();
  };
  const delGroup = async (gid: string) => {
    await api(`/api/pro/menu/modifier-group/${gid}`, { method: "DELETE" });
    reload();
  };

  const byCat = items.reduce<Record<string, Item[]>>((acc, it) => {
    const k = it.category || "Sans catégorie";
    (acc[k] ||= []).push(it);
    return acc;
  }, {});

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Menu</h1>

      {/* ── Formulaire ajout / édition ── */}
      <form onSubmit={save} className="card mb-6 space-y-3">
        <h2 className="font-semibold text-slate-700">{editId ? "✏️ Modifier le plat" : "➕ Nouveau plat"}</h2>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
          <div className="col-span-2">
            <label className="label">Nom *</label>
            <input className="w-full border rounded px-2 py-1" value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          </div>
          <div>
            <label className="label">Prix (€) *</label>
            <input className="w-full border rounded px-2 py-1" type="number" step="0.01"
              value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required />
          </div>
          <div>
            <label className="label">Catégorie</label>
            <input className="w-full border rounded px-2 py-1" value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })} />
          </div>
        </div>

        <div>
          <label className="label">Description</label>
          <input className="w-full border rounded px-2 py-1" value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })} />
        </div>
        <div>
          <label className="label">URL photo</label>
          <input className="w-full border rounded px-2 py-1" placeholder="https://..." value={form.imageUrl}
            onChange={(e) => setForm({ ...form, imageUrl: e.target.value })} />
        </div>

        {/* Allergènes */}
        <div>
          <label className="label">Allergènes (règlement UE)</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {ALLERGENS.map((a) => (
              <button key={a} type="button"
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  form.allergens.includes(a) ? "bg-red-100 border-red-400 text-red-700 font-semibold" : "border-slate-300 text-slate-500"
                }`}
                onClick={() => toggleAllergen(a)}
              >{ALLERGEN_LABELS[a]}</button>
            ))}
          </div>
        </div>

        {/* Régimes */}
        <div>
          <label className="label">Régimes</label>
          <div className="flex flex-wrap gap-1 mt-1">
            {DIETS.map((d) => (
              <button key={d} type="button"
                className={`px-2 py-0.5 rounded text-xs border transition-colors ${
                  form.diets.includes(d) ? "bg-green-100 border-green-400 text-green-700 font-semibold" : "border-slate-300 text-slate-500"
                }`}
                onClick={() => toggleDiet(d)}
              >{DIET_LABELS[d]}</button>
            ))}
          </div>
        </div>

        {/* Stock */}
        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.stockEnabled}
              onChange={(e) => setForm({ ...form, stockEnabled: e.target.checked })} />
            <span className="text-sm font-medium">Gestion du stock</span>
          </label>
          {form.stockEnabled && (
            <>
              <div>
                <label className="label">Quantité</label>
                <input className="w-20 border rounded px-2 py-1" type="number" min="0"
                  value={form.stockQty} onChange={(e) => setForm({ ...form, stockQty: e.target.value })} />
              </div>
              <div>
                <label className="label">Alerte si ≤</label>
                <input className="w-16 border rounded px-2 py-1" type="number" min="0"
                  value={form.lowStockThreshold} onChange={(e) => setForm({ ...form, lowStockThreshold: e.target.value })} />
              </div>
            </>
          )}
        </div>

        <div className="flex gap-2">
          <button className="btn-primary" type="submit">{editId ? "Enregistrer" : "Ajouter"}</button>
          {editId && <button type="button" className="btn-ghost" onClick={cancelEdit}>Annuler</button>}
        </div>
      </form>

      {/* ── Liste des plats par catégorie ── */}
      {Object.entries(byCat).map(([cat, catItems]) => (
        <div key={cat} className="mb-6">
          <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wide mb-2">{cat}</h2>
          <div className="space-y-2">
            {catItems.map((it) => {
              const lowStock = it.stockEnabled && it.stockQty != null && it.lowStockThreshold != null && it.stockQty <= it.lowStockThreshold;
              const outOfStock = it.stockEnabled && it.stockQty != null && it.stockQty === 0;
              return (
                <div key={it.id} className={`card ${!it.available ? "opacity-60" : ""}`}>
                  {/* Ligne principale */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex gap-3 items-start flex-1 min-w-0">
                      {it.imageUrl && (
                        <img src={it.imageUrl} alt={it.name}
                          className="w-14 h-14 object-cover rounded shrink-0" />
                      )}
                      <div className="min-w-0">
                        <div className="font-medium flex items-center gap-2 flex-wrap">
                          {it.name}
                          {!it.available && <span className="text-xs px-1.5 py-0.5 bg-slate-100 text-slate-500 rounded">Désactivé</span>}
                          {outOfStock && <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 rounded font-semibold">Rupture</span>}
                          {lowStock && !outOfStock && <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 rounded">Stock faible ({it.stockQty})</span>}
                          {it.stockEnabled && !lowStock && it.stockQty != null && (
                            <span className="text-xs text-slate-400">📦 {it.stockQty}</span>
                          )}
                        </div>
                        {it.description && <div className="text-xs text-slate-500 truncate">{it.description}</div>}
                        <div className="text-sm font-semibold mt-0.5">{(it.priceCents / 100).toFixed(2)} €</div>
                        {/* Badges allergènes */}
                        {it.allergens?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {it.allergens.map((a) => (
                              <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-200">
                                ⚠️ {ALLERGEN_LABELS[a] ?? a}
                              </span>
                            ))}
                          </div>
                        )}
                        {it.diets?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {it.diets.map((d) => (
                              <span key={d} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                                {DIET_LABELS[d] ?? d}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                    {/* Actions */}
                    <div className="flex flex-col gap-1 shrink-0">
                      <button className="btn-ghost text-xs" onClick={() => openEdit(it)}>✏️ Modifier</button>
                      <button className="btn-ghost text-xs" onClick={() => toggle(it)}>
                        {it.available ? "Désactiver" : "Activer"}
                      </button>
                      <button className="btn-ghost text-xs text-red-600" onClick={() => del(it.id)}>Supprimer</button>
                      <button className="btn-ghost text-xs"
                        onClick={() => setExpandedId(expandedId === it.id ? null : it.id)}>
                        {expandedId === it.id ? "▲ Fermer" : "▼ Options"}
                      </button>
                    </div>
                  </div>

                  {/* Panneau expansible : stock + modifiers */}
                  {expandedId === it.id && (
                    <div className="mt-3 pt-3 border-t border-slate-100 space-y-4">
                      {/* Réassort */}
                      {it.stockEnabled && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">📦 Réassort</p>
                          <div className="flex gap-2 items-center">
                            <input
                              type="number"
                              className="w-20 border rounded px-2 py-1 text-sm"
                              placeholder="Qté"
                              value={restockMap[it.id] ?? ""}
                              onChange={(e) => setRestockMap((m) => ({ ...m, [it.id]: e.target.value }))}
                            />
                            <button className="btn-primary text-xs" onClick={() => restock(it.id)}>
                              Ajouter
                            </button>
                            <span className="text-xs text-slate-500">
                              Stock actuel : <strong>{it.stockQty ?? "—"}</strong>
                            </span>
                          </div>
                        </div>
                      )}

                      {/* Modifier groups existants */}
                      {it.modifierGroups.length > 0 && (
                        <div>
                          <p className="text-xs font-semibold text-slate-600 mb-1">⚙️ Variantes & options</p>
                          <div className="space-y-1">
                            {it.modifierGroups.map((g) => (
                              <div key={g.id} className="bg-slate-50 rounded p-2 text-xs flex items-start justify-between gap-2">
                                <div>
                                  <span className="font-semibold">{g.name}</span>
                                  {g.required && <span className="ml-1 text-red-600">(obligatoire)</span>}
                                  {g.multiple && <span className="ml-1 text-slate-400">(multiple)</span>}
                                  <div className="mt-0.5 text-slate-600">
                                    {g.options.map((o) => (
                                      <span key={o.id} className="mr-2">
                                        {o.name}{o.priceDeltaCents !== 0 ? ` +${(o.priceDeltaCents/100).toFixed(2)}€` : ""}
                                      </span>
                                    ))}
                                  </div>
                                </div>
                                <button className="text-red-500 hover:text-red-700 shrink-0" onClick={() => delGroup(g.id)}>✕</button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Ajouter un groupe */}
                      <div>
                        <p className="text-xs font-semibold text-slate-600 mb-1">➕ Ajouter un groupe d'options</p>
                        <div className="space-y-2">
                          <input className="w-full border rounded px-2 py-1 text-xs"
                            placeholder='Nom du groupe ex: "Cuisson"'
                            value={newGroup.name}
                            onChange={(e) => setNewGroup({ ...newGroup, name: e.target.value })} />
                          <textarea
                            className="w-full border rounded px-2 py-1 text-xs font-mono"
                            rows={3}
                            placeholder={"Une option par ligne :\nSaignant\nBacon | 1.50\nDouble steak | 4.00"}
                            value={newGroup.options}
                            onChange={(e) => setNewGroup({ ...newGroup, options: e.target.value })}
                          />
                          <div className="flex gap-4 text-xs">
                            <label className="flex gap-1 items-center cursor-pointer">
                              <input type="checkbox" checked={newGroup.required}
                                onChange={(e) => setNewGroup({ ...newGroup, required: e.target.checked })} />
                              Obligatoire
                            </label>
                            <label className="flex gap-1 items-center cursor-pointer">
                              <input type="checkbox" checked={newGroup.multiple}
                                onChange={(e) => setNewGroup({ ...newGroup, multiple: e.target.checked })} />
                              Choix multiple
                            </label>
                          </div>
                          <button className="btn-primary text-xs" onClick={() => addModifierGroup(it.id)}>
                            Créer le groupe
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
