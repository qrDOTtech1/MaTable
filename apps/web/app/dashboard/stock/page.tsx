"use client";
import { useEffect, useState, useCallback } from "react";
import { api } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type StockProduct = {
  id: string;
  name: string;
  unit: string;
  category: string;
  isFresh: boolean;
  currentQty: number;
  lowThreshold: number;
  weeklyEstimate: number;
  notes: string | null;
  linkedDishes: string[];
  updatedAt: string;
};

const UNITS = ["kg", "g", "L", "cL", "mL", "unité(s)", "portion(s)", "botte(s)", "boîte(s)", "sachet(s)", "bouteille(s)", "flacon(s)"];
const CATEGORIES = ["Viandes & Poissons", "Fruits & Légumes", "Produits laitiers", "Épicerie sèche", "Boissons", "Condiments & Sauces", "Surgelés", "Boulangerie", "Autre"];

const EMPTY_FORM = {
  name: "",
  unit: "kg",
  category: "Autre",
  isFresh: false,
  currentQty: 0,
  lowThreshold: 0,
  weeklyEstimate: 0,
  notes: "",
  linkedDishes: [] as string[],
};

function isLow(p: StockProduct) {
  return p.lowThreshold > 0 && p.currentQty <= p.lowThreshold;
}

function categoryIcon(c: string) {
  const icons: Record<string, string> = {
    "Viandes & Poissons": "🥩",
    "Fruits & Légumes": "🥦",
    "Produits laitiers": "🥛",
    "Épicerie sèche": "🌾",
    "Boissons": "🍶",
    "Condiments & Sauces": "🫙",
    "Surgelés": "🧊",
    "Boulangerie": "🥐",
    "Autre": "📦",
  };
  return icons[c] ?? "📦";
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function StockPage() {
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [modal, setModal] = useState<"create" | "edit" | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [linkedDishInput, setLinkedDishInput] = useState("");

  // Delete confirm
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Inline qty edit
  const [qtyEditing, setQtyEditing] = useState<string | null>(null);
  const [qtyValue, setQtyValue] = useState<string>("");
  const [qtySaving, setQtySaving] = useState(false);

  // Filter / search
  const [search, setSearch] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterLow, setFilterLow] = useState(false);

  // ── Data ─────────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ products: StockProduct[] }>("/api/pro/stock");
      setProducts(res.products);
    } catch {
      setError("Impossible de charger le stock.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Computed ──────────────────────────────────────────────────────────────
  const categories = Array.from(new Set(products.map((p) => p.category))).sort();
  const lowCount = products.filter(isLow).length;

  const filtered = products.filter((p) => {
    if (filterLow && !isLow(p)) return false;
    if (filterCategory !== "all" && p.category !== filterCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  // Group by category
  const grouped: Record<string, StockProduct[]> = {};
  for (const p of filtered) {
    (grouped[p.category] ??= []).push(p);
  }

  // ── Form helpers ─────────────────────────────────────────────────────────
  function openCreate() {
    setForm(EMPTY_FORM);
    setLinkedDishInput("");
    setEditId(null);
    setModal("create");
  }

  function openEdit(p: StockProduct) {
    setForm({
      name: p.name,
      unit: p.unit,
      category: p.category,
      isFresh: p.isFresh,
      currentQty: p.currentQty,
      lowThreshold: p.lowThreshold,
      weeklyEstimate: p.weeklyEstimate,
      notes: p.notes ?? "",
      linkedDishes: p.linkedDishes ?? [],
    });
    setLinkedDishInput("");
    setEditId(p.id);
    setModal("edit");
  }

  function addLinkedDish() {
    if (!linkedDishInput.trim()) return;
    if (!form.linkedDishes.includes(linkedDishInput.trim())) {
      setForm((f) => ({ ...f, linkedDishes: [...f.linkedDishes, linkedDishInput.trim()] }));
    }
    setLinkedDishInput("");
  }

  async function saveForm() {
    if (!form.name.trim()) return;
    setSaving(true);
    try {
      const payload = {
        ...form,
        notes: form.notes || null,
        currentQty: Number(form.currentQty),
        lowThreshold: Number(form.lowThreshold),
        weeklyEstimate: Number(form.weeklyEstimate),
      };
      if (modal === "create") {
        await api("/api/pro/stock", { method: "POST", body: JSON.stringify(payload) });
      } else if (editId) {
        await api(`/api/pro/stock/${editId}`, { method: "PUT", body: JSON.stringify(payload) });
      }
      await load();
      setModal(null);
    } catch {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  async function deleteProduct(id: string) {
    setDeletingId(id);
    try {
      await api(`/api/pro/stock/${id}`, { method: "DELETE" });
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch {
      alert("Erreur lors de la suppression.");
    } finally {
      setDeletingId(null);
    }
  }

  async function saveQty(id: string) {
    const qty = parseFloat(qtyValue);
    if (isNaN(qty) || qty < 0) return;
    setQtySaving(true);
    try {
      await api(`/api/pro/stock/${id}/qty`, { method: "PATCH", body: JSON.stringify({ qty }) });
      setProducts((prev) => prev.map((p) => p.id === id ? { ...p, currentQty: qty } : p));
      setQtyEditing(null);
    } catch {
      alert("Erreur lors de la mise à jour.");
    } finally {
      setQtySaving(false);
    }
  }

  // ── Render ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-6 h-6 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">📦 Stock & Ingrédients</h1>
          <p className="text-sm text-white/40 mt-1">
            {products.length} produit{products.length !== 1 ? "s" : ""} · {" "}
            {lowCount > 0 ? (
              <span className="text-red-400 font-semibold">{lowCount} en stock bas</span>
            ) : (
              <span className="text-emerald-400">Tout est bien approvisionné</span>
            )}
          </p>
        </div>
        <button
          onClick={openCreate}
          className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-all flex items-center gap-2"
        >
          + Ajouter un produit
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/30 p-4 text-sm text-red-400">{error}</div>
      )}

      {/* Filters */}
      <div className="flex gap-3 flex-wrap items-center">
        <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher…"
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2 text-sm text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 w-52"
        />
        <select
          value={filterCategory}
          onChange={(e) => setFilterCategory(e.target.value)}
          className="bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
        >
          <option value="all">Toutes catégories</option>
          {categories.map((c) => (
            <option key={c} value={c}>{categoryIcon(c)} {c}</option>
          ))}
        </select>
        <button
          onClick={() => setFilterLow((v) => !v)}
          className={`px-3 py-2 rounded-xl text-sm font-semibold border transition-all ${
            filterLow
              ? "bg-red-500/20 border-red-500/40 text-red-300"
              : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/70"
          }`}
        >
          🔴 Stock bas{lowCount > 0 ? ` (${lowCount})` : ""}
        </button>
      </div>

      {/* Empty state */}
      {products.length === 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-12 text-center">
          <p className="text-5xl mb-4">📦</p>
          <p className="text-white/50 text-lg font-semibold">Aucun produit en stock</p>
          <p className="text-white/30 text-sm mt-2 mb-6">
            Ajoutez vos ingrédients et matières premières pour suivre vos niveaux de stock.
          </p>
          <button
            onClick={openCreate}
            className="px-6 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-bold transition-all"
          >
            + Ajouter le premier produit
          </button>
        </div>
      )}

      {/* Product grid grouped by category */}
      {Object.keys(grouped).sort().map((cat) => (
        <div key={cat}>
          <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
            <span>{categoryIcon(cat)}</span> {cat}
            <span className="text-white/20 font-normal normal-case">· {grouped[cat].length}</span>
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {grouped[cat].map((p) => {
              const low = isLow(p);
              const pct = p.lowThreshold > 0
                ? Math.min(100, Math.round((p.currentQty / (p.lowThreshold * 2)) * 100))
                : null;

              return (
                <div
                  key={p.id}
                  className={`rounded-2xl border p-4 flex flex-col gap-3 transition-all ${
                    low
                      ? "bg-red-500/5 border-red-500/30"
                      : "bg-white/[0.02] border-white/[0.06]"
                  }`}
                >
                  {/* Name + badges */}
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-bold truncate ${low ? "text-red-300" : "text-white"}`}>
                        {p.name}
                      </p>
                      <p className="text-xs text-white/30 mt-0.5">{p.unit}{p.isFresh ? " · 🌿 Frais" : ""}</p>
                    </div>
                    {low && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/20 border border-red-500/30 text-red-300 font-bold shrink-0">
                        Stock bas
                      </span>
                    )}
                  </div>

                  {/* Quantity — inline edit */}
                  <div className="flex items-center gap-2">
                    {qtyEditing === p.id ? (
                      <>
                        <input
                          type="number"
                          min="0"
                          step="0.1"
                          value={qtyValue}
                          onChange={(e) => setQtyValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") saveQty(p.id);
                            if (e.key === "Escape") setQtyEditing(null);
                          }}
                          autoFocus
                          className="flex-1 bg-white/[0.06] border border-orange-500/50 rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none"
                        />
                        <button
                          onClick={() => saveQty(p.id)}
                          disabled={qtySaving}
                          className="px-3 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white text-xs font-bold transition-all"
                        >
                          {qtySaving ? "…" : "✓"}
                        </button>
                        <button
                          onClick={() => setQtyEditing(null)}
                          className="px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 text-xs transition-all"
                        >
                          ✕
                        </button>
                      </>
                    ) : (
                      <button
                        onClick={() => { setQtyEditing(p.id); setQtyValue(String(p.currentQty)); }}
                        className={`flex-1 text-left px-3 py-2 rounded-xl border transition-all group ${
                          low ? "bg-red-500/10 border-red-500/20" : "bg-white/[0.03] border-white/[0.06] hover:border-orange-500/30"
                        }`}
                      >
                        <span className={`text-xl font-black ${low ? "text-red-300" : "text-white"}`}>
                          {p.currentQty % 1 === 0 ? p.currentQty : p.currentQty.toFixed(2)}
                        </span>
                        <span className="text-xs text-white/30 ml-1">{p.unit}</span>
                        <span className="text-[10px] text-white/20 ml-2 group-hover:text-orange-400/60 transition-colors">✏️</span>
                      </button>
                    )}
                  </div>

                  {/* Progress bar (only if threshold set) */}
                  {pct !== null && (
                    <div className="space-y-1">
                      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all ${
                            low ? "bg-red-500" : pct < 60 ? "bg-yellow-500" : "bg-emerald-500"
                          }`}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-white/25">
                        <span>Seuil: {p.lowThreshold} {p.unit}</span>
                        {p.weeklyEstimate > 0 && <span>~{p.weeklyEstimate} {p.unit}/sem.</span>}
                      </div>
                    </div>
                  )}

                  {/* Linked dishes */}
                  {p.linkedDishes.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {p.linkedDishes.map((d) => (
                        <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-white/40">
                          {d}
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1">
                    <button
                      onClick={() => openEdit(p)}
                      className="flex-1 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.08] text-white/50 text-xs font-semibold hover:text-white hover:border-white/20 transition-all"
                    >
                      ✏️ Modifier
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Supprimer "${p.name}" ?`)) deleteProduct(p.id);
                      }}
                      disabled={deletingId === p.id}
                      className="py-1.5 px-3 rounded-lg bg-white/[0.02] border border-white/[0.06] text-white/25 text-xs hover:text-red-400 hover:border-red-500/30 transition-all disabled:opacity-40"
                    >
                      {deletingId === p.id ? "…" : "🗑️"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ))}

      {filtered.length === 0 && products.length > 0 && (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 text-center">
          <p className="text-white/40 text-sm">Aucun résultat pour ces filtres</p>
        </div>
      )}

      {/* ── Create / Edit Modal ────────────────────────────────────────────────── */}
      {modal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setModal(null)}
        >
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="text-lg font-black text-white">
                {modal === "create" ? "➕ Nouveau produit" : "✏️ Modifier le produit"}
              </h2>
              <button
                onClick={() => setModal(null)}
                className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="px-6 py-5 space-y-4">
              {/* Name */}
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                  Nom du produit *
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Ex: Filet de saumon, Farine T55…"
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 text-sm"
                  autoFocus
                />
              </div>

              {/* Unit + Category */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Unité</label>
                  <select
                    value={form.unit}
                    onChange={(e) => setForm((f) => ({ ...f, unit: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">Catégorie</label>
                  <select
                    value={form.category}
                    onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                  >
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              {/* Fresh toggle */}
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  onClick={() => setForm((f) => ({ ...f, isFresh: !f.isFresh }))}
                  className={`relative w-10 h-5.5 rounded-full border transition-all ${
                    form.isFresh ? "bg-emerald-500/30 border-emerald-500/50" : "bg-white/[0.06] border-white/10"
                  }`}
                  style={{ height: "22px", width: "40px" }}
                >
                  <div className={`absolute top-0.5 w-4 h-4 rounded-full transition-all ${
                    form.isFresh ? "left-5 bg-emerald-400" : "left-0.5 bg-white/30"
                  }`} />
                </div>
                <span className="text-sm text-white/60">🌿 Produit frais (périme vite)</span>
              </label>

              {/* Quantities */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Qté actuelle
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={form.currentQty}
                    onChange={(e) => setForm((f) => ({ ...f, currentQty: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Seuil alerte
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={form.lowThreshold}
                    onChange={(e) => setForm((f) => ({ ...f, lowThreshold: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                    Conso/semaine
                  </label>
                  <input
                    type="number" min="0" step="0.1"
                    value={form.weeklyEstimate}
                    onChange={(e) => setForm((f) => ({ ...f, weeklyEstimate: parseFloat(e.target.value) || 0 }))}
                    className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-3 py-3 text-white text-sm focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Linked dishes */}
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                  Plats liés (optionnel)
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    value={linkedDishInput}
                    onChange={(e) => setLinkedDishInput(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addLinkedDish())}
                    placeholder="Ex: Saumon grillé…"
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500"
                  />
                  <button
                    type="button"
                    onClick={addLinkedDish}
                    className="px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-white/50 text-sm hover:text-white transition-all"
                  >
                    +
                  </button>
                </div>
                {form.linkedDishes.length > 0 && (
                  <div className="flex flex-wrap gap-1.5">
                    {form.linkedDishes.map((d) => (
                      <span key={d} className="flex items-center gap-1 text-xs px-2 py-1 rounded-full bg-white/[0.06] border border-white/10 text-white/60">
                        {d}
                        <button
                          type="button"
                          onClick={() => setForm((f) => ({ ...f, linkedDishes: f.linkedDishes.filter((x) => x !== d) }))}
                          className="text-white/30 hover:text-red-400 transition-colors ml-0.5"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                )}
              </div>

              {/* Notes */}
              <div>
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-1.5 block">
                  Notes internes (optionnel)
                </label>
                <textarea
                  value={form.notes}
                  onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Fournisseur, remarques, conditions de stockage…"
                  rows={2}
                  className="w-full bg-white/[0.04] border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500 text-sm resize-none"
                />
              </div>

              {/* Buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setModal(null)}
                  className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-sm font-semibold hover:text-white/70 transition-all"
                >
                  Annuler
                </button>
                <button
                  type="button"
                  onClick={saveForm}
                  disabled={saving || !form.name.trim()}
                  className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {saving ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Enregistrement…</>
                  ) : modal === "create" ? "➕ Ajouter" : "✓ Sauvegarder"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
