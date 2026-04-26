"use client";
import { useState } from "react";
import { api } from "@/lib/api";

type MenuItem = {
  name: string; description?: string; priceCents: number;
  category?: string; allergens?: string[]; diets?: string[];
  waitMinutes?: number;
};

const CUISINE_PRESETS = [
  "Francais traditionnel", "Bistrot parisien", "Italien", "Japonais / Sushi",
  "Libanais / Mediterraneen", "Burger gourmet", "Pizzeria", "Thailandais",
  "Mexicain", "Indien", "Brasserie", "Creperie bretonne", "Fruits de mer",
  "Vegetarien / Vegan", "Street food fusion",
];

export default function NovaMenuGeneratorPage() {
  const [cuisineType, setCuisineType] = useState("");
  const [priceRange, setPriceRange] = useState<"budget" | "mid" | "premium" | "gastronomique">("mid");
  const [itemCount, setItemCount] = useState(12);
  const [style, setStyle] = useState("");
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const generate = async () => {
    if (!cuisineType.trim()) return;
    setLoading(true); setError(null); setItems([]); setSelected(new Set()); setApplied(false);
    try {
      const r = await api<{ menu: { items: MenuItem[] } }>("/api/pro/ia/menu-generate", {
        method: "POST",
        body: JSON.stringify({ cuisineType, priceRange, itemCount, style: style || undefined }),
      });
      setItems(r.menu.items);
      setSelected(new Set(r.menu.items.map((_, i) => i)));
    } catch (e: any) {
      if (e.message?.includes("403")) setError("Abonnement PRO_IA requis.");
      else if (e.message?.includes("503")) setError("Cle API IA non configuree.");
      else setError("Erreur: " + e.message);
    } finally { setLoading(false); }
  };

  const toggleItem = (i: number) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(i) ? next.delete(i) : next.add(i);
      return next;
    });
  };

  const selectAll = () => setSelected(new Set(items.map((_, i) => i)));
  const selectNone = () => setSelected(new Set());

  const applyMenu = async () => {
    const toApply = items.filter((_, i) => selected.has(i));
    if (toApply.length === 0) return;
    setApplying(true);
    try {
      await api("/api/pro/ia/menu-generate/apply", {
        method: "POST",
        body: JSON.stringify({ items: toApply }),
      });
      setApplied(true);
    } catch (e: any) { alert("Erreur: " + e.message); }
    finally { setApplying(false); }
  };

  return (
    <div className="p-8 max-w-5xl">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-1">
        <span className="text-3xl">🍽️</span> Nova Menu IA
      </h1>
      <p className="text-sm text-white/40 mb-6">Generez un menu complet en quelques secondes</p>

      {/* Config form */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-4 mb-8">
        <div>
          <label className="block text-sm font-medium text-white/60 mb-2">Type de cuisine *</label>
          <div className="flex flex-wrap gap-2 mb-2">
            {CUISINE_PRESETS.map(c => (
              <button key={c} type="button" onClick={() => setCuisineType(c)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  cuisineType === c
                    ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                    : "bg-white/[0.04] border-white/[0.08] text-white/50 hover:text-white/70"
                }`}>
                {c}
              </button>
            ))}
          </div>
          <input value={cuisineType} onChange={e => setCuisineType(e.target.value)}
            placeholder="Ou tapez votre propre style..."
            className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Gamme de prix</label>
            <select value={priceRange} onChange={e => setPriceRange(e.target.value as any)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50">
              <option value="budget">Budget (5-12 EUR)</option>
              <option value="mid">Moyen (12-22 EUR)</option>
              <option value="premium">Premium (22-45 EUR)</option>
              <option value="gastronomique">Gastronomique (35-80 EUR)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Nombre de plats</label>
            <input type="number" min={3} max={50} value={itemCount} onChange={e => setItemCount(+e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500/50"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-white/60 mb-1">Notes / style</label>
            <input value={style} onChange={e => setStyle(e.target.value)} placeholder="Ex: produits locaux, sans porc..."
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50"
            />
          </div>
        </div>

        <button onClick={generate} disabled={loading || !cuisineType.trim()}
          className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-base flex items-center justify-center gap-2">
          {loading ? (
            <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Generation en cours (20-30s)...</>
          ) : "Generer le menu avec Nova IA"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">{error}</div>
      )}

      {/* Generated menu */}
      {items.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h2 className="text-lg font-bold text-white">{items.length} plats generes</h2>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs text-white/50 hover:text-white/80 px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08]">Tout selectionner</button>
              <button onClick={selectNone} className="text-xs text-white/50 hover:text-white/80 px-3 py-1 rounded-lg bg-white/[0.05] border border-white/[0.08]">Tout deselectionner</button>
            </div>
          </div>

          {/* Group by category */}
          {(() => {
            const cats: Record<string, (MenuItem & { idx: number })[]> = {};
            items.forEach((item, idx) => {
              const cat = item.category || "Autres";
              (cats[cat] ||= []).push({ ...item, idx });
            });
            return Object.entries(cats).map(([cat, catItems]) => (
              <div key={cat}>
                <h3 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-2 flex items-center gap-3">
                  <span className="flex-1 h-px bg-orange-500/20" />
                  {cat}
                  <span className="flex-1 h-px bg-orange-500/20" />
                </h3>
                <div className="space-y-2">
                  {catItems.map(item => {
                    const isSelected = selected.has(item.idx);
                    return (
                      <div key={item.idx}
                        onClick={() => toggleItem(item.idx)}
                        className={`cursor-pointer rounded-xl border p-4 transition-all ${
                          isSelected
                            ? "bg-orange-500/5 border-orange-500/30"
                            : "bg-white/[0.02] border-white/[0.05] opacity-50"
                        }`}>
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                              isSelected ? "bg-orange-500 border-orange-500 text-white" : "border-white/20"
                            }`}>
                              {isSelected && <span className="text-xs">✓</span>}
                            </div>
                            <div className="min-w-0">
                              <h4 className="font-bold text-white text-sm">{item.name}</h4>
                              {item.description && <p className="text-xs text-white/50 mt-0.5 line-clamp-2">{item.description}</p>}
                              <div className="flex flex-wrap gap-1 mt-1">
                                {(item.waitMinutes ?? 0) > 0 && (
                                  <span className="text-[10px] px-1.5 py-0.5 bg-blue-500/10 text-blue-400 rounded border border-blue-500/20">⏱ {item.waitMinutes} min</span>
                                )}
                                {item.allergens?.map(a => (
                                  <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">{a}</span>
                                ))}
                                {item.diets?.map(d => (
                                  <span key={d} className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">{d}</span>
                                ))}
                              </div>
                            </div>
                          </div>
                          <span className="font-black text-orange-400 text-sm shrink-0">{(item.priceCents / 100).toFixed(2)} EUR</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ));
          })()}

          {/* Apply button */}
          {!applied ? (
            <button onClick={applyMenu} disabled={applying || selected.size === 0}
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-base">
              {applying ? "Ajout en cours..." : `Ajouter ${selected.size} plats au menu`}
            </button>
          ) : (
            <div className="text-center py-6 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl">
              <div className="text-4xl mb-2">✅</div>
              <h3 className="text-lg font-bold text-emerald-400">{selected.size} plats ajoutes au menu !</h3>
              <p className="text-sm text-white/40 mt-1">Retrouvez-les dans l'onglet Menu pour les personnaliser.</p>
            </div>
          )}
        </div>
      )}

      {!items.length && !loading && !error && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🍽️</div>
          <h2 className="text-xl font-bold text-white mb-2">Creez votre menu en 30 secondes</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Choisissez un type de cuisine et Nova IA genere un menu complet avec descriptions, 
            prix, allergenes, regimes et temps de preparation. Selectionnez et ajoutez en 1 clic.
          </p>
        </div>
      )}
    </div>
  );
}
