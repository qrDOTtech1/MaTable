"use client";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import Link from "next/link";

type ShopItem = {
  ingredient: string;
  category: string;
  estimatedNeeded: number;
  alreadyHave: number;
  toBuy: number;
  unit: string;
  priority: string;
  estimatedCost?: number;
  reason: string;
};

type ShoppingDetail = {
  id: string;
  title: string;
  itemCount: number;
  estimatedBudget: number;
  realCost: number | null;
  shoppingList: ShopItem[];
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
};

const PRIORITY_CLS: Record<string, string> = {
  HIGH:   "bg-red-500/20 text-red-400",
  MEDIUM: "bg-amber-500/20 text-amber-400",
  LOW:    "bg-white/10 text-white/40",
};

const CAT_ICON: Record<string, string> = {
  "Viandes": "🥩", "Poissons": "🐟", "Légumes": "🥦", "Fruits": "🍋",
  "Produits laitiers": "🧀", "Alcools": "🍾", "Dilutants & Mixers": "🧃",
  "Sirops & Liqueurs": "🍯", "Fruits & Garnitures": "🍓", "Épicerie": "🧂",
  "Boulangerie": "🍞", "Consommables": "🧻", "Condiments": "🫙",
};

export default function ShoppingDetailPage() {
  const { id } = useParams() as { id: string };
  const router = useRouter();
  const [data, setData] = useState<ShoppingDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Formulaire de complétion
  const [realCost, setRealCost] = useState("");
  const [notes, setNotes] = useState("");
  const [completing, setCompleting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    api<ShoppingDetail>(`/api/pro/shopping-history/${id}`)
      .then(r => { setData(r); if (r.completedAt) { setDone(true); setRealCost(String(r.realCost ?? "")); setNotes(r.notes ?? ""); } })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, [id]);

  const complete = async () => {
    const cost = parseFloat(realCost);
    if (isNaN(cost) || cost < 0) { setError("Entrez un coût HT valide."); return; }
    setCompleting(true); setError(null);
    try {
      const r = await api<{ ok: boolean; stockUpdated: number }>(`/api/pro/shopping-history/${id}/complete`, {
        method: "PATCH",
        body: JSON.stringify({ realCost: cost, notes: notes || undefined }),
      });
      setDone(true);
      setData(prev => prev ? { ...prev, completedAt: new Date().toISOString(), realCost: cost, notes } : prev);
      // Petite confirmation
      alert(`Courses confirmées ! ${r.stockUpdated} article${r.stockUpdated > 1 ? "s" : ""} mis à jour dans votre stock.`);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setCompleting(false);
    }
  };

  if (loading) return (
    <div className="p-8 flex items-center gap-3 text-white/40 text-sm">
      <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
      Chargement...
    </div>
  );

  if (error && !data) return (
    <div className="p-8">
      <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
    </div>
  );

  if (!data) return null;

  // Grouper par catégorie
  const grouped = data.shoppingList.reduce((acc, item) => {
    const cat = item.category || "Autres";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, ShopItem[]>);

  const totalEstimated = data.estimatedBudget;
  const totalToBuy = data.shoppingList.reduce((s, i) => s + (i.toBuy || 0), 0);

  return (
    <div className="p-6 max-w-4xl space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-white/30">
        <Link href="/dashboard/shopping" className="hover:text-white/60 transition-colors">Listes de courses</Link>
        <span>/</span>
        <span className="text-white/50 truncate max-w-[300px]">{data.title}</span>
      </div>

      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-white flex items-center gap-2">
            <span>🛒</span> {data.title}
          </h1>
          <div className="flex items-center gap-4 mt-1 text-xs text-white/40">
            <span>Générée le {new Date(data.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>{data.itemCount} articles</span>
            <span>Budget estimé : <strong className="text-white/70">~{totalEstimated.toFixed(0)}€</strong></span>
          </div>
        </div>
        {done ? (
          <span className="px-4 py-2 rounded-full bg-emerald-500/20 text-emerald-400 text-sm font-semibold">
            Courses effectuées
          </span>
        ) : (
          <span className="px-4 py-2 rounded-full bg-orange-500/20 text-orange-400 text-sm font-semibold">
            En attente
          </span>
        )}
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Résumé chiffré */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <p className="text-xs text-white/40">Articles à acheter</p>
          <p className="text-2xl font-bold text-white">{data.itemCount}</p>
        </div>
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <p className="text-xs text-white/40">Budget estimé</p>
          <p className="text-2xl font-bold text-orange-400">~{totalEstimated.toFixed(0)}€</p>
        </div>
        {done && data.realCost != null && (
          <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
            <p className="text-xs text-white/40">Coût réel HT</p>
            <p className="text-2xl font-bold text-emerald-400">{data.realCost.toFixed(2)}€</p>
          </div>
        )}
        {done && data.realCost != null && (
          <div className={`rounded-xl p-4 border ${data.realCost <= totalEstimated ? "bg-emerald-500/5 border-emerald-500/20" : "bg-red-500/5 border-red-500/20"}`}>
            <p className="text-xs text-white/40">Écart budget</p>
            <p className={`text-2xl font-bold ${data.realCost <= totalEstimated ? "text-emerald-400" : "text-red-400"}`}>
              {data.realCost <= totalEstimated ? "-" : "+"}{Math.abs(data.realCost - totalEstimated).toFixed(0)}€
            </p>
          </div>
        )}
      </div>

      {/* Formulaire "Courses faites" si pas encore complété */}
      {!done && (
        <div className="bg-orange-500/5 border border-orange-500/20 rounded-2xl p-6 space-y-4">
          <h2 className="text-base font-bold text-orange-400 flex items-center gap-2">
            ✅ Confirmer les courses effectuées
          </h2>
          <p className="text-xs text-white/50">
            En confirmant, les quantités achetées (<strong className="text-white/70">colonne "À acheter"</strong>) seront ajoutées à votre stock automatiquement.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2">💶 Coût total HT réel (€) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={realCost}
                onChange={e => setRealCost(e.target.value)}
                placeholder={`ex: ${totalEstimated.toFixed(0)}`}
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-white/50 mb-2">📝 Notes (optionnel)</label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder="ex: Métro, prix négocié, substitutions..."
                className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50"
              />
            </div>
          </div>
          <button
            onClick={complete}
            disabled={completing || !realCost}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl transition-colors text-sm disabled:opacity-50"
          >
            {completing ? "Enregistrement..." : "✅ Courses effectuées — Mettre à jour le stock"}
          </button>
        </div>
      )}

      {/* Notes si complété */}
      {done && data.notes && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
          <p className="text-xs text-white/40 mb-1">Notes</p>
          <p className="text-sm text-white/70">{data.notes}</p>
        </div>
      )}

      {/* Liste par catégorie */}
      <div className="space-y-4">
        <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Détail des achats</h2>
        {Object.entries(grouped).map(([cat, items]) => {
          const catTotal = items.reduce((s, i) => s + (i.estimatedCost || 0), 0);
          return (
            <div key={cat} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
              <div className="px-5 py-3 border-b border-white/[0.07] flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span>{CAT_ICON[cat] ?? "📦"}</span>
                  <span className="text-sm font-bold text-white/80">{cat}</span>
                  <span className="text-xs text-white/30">{items.length} article{items.length > 1 ? "s" : ""}</span>
                </div>
                {catTotal > 0 && (
                  <span className="text-xs text-white/40">~{catTotal.toFixed(0)}€</span>
                )}
              </div>
              <div className="divide-y divide-white/[0.04]">
                {items.map((item, idx) => (
                  <div key={idx} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                    <div className={`shrink-0 px-2 py-0.5 rounded text-[10px] font-bold ${PRIORITY_CLS[item.priority] ?? PRIORITY_CLS.LOW}`}>
                      {item.priority}
                    </div>
                    <div className="flex-1 min-w-[140px]">
                      <p className="text-sm font-semibold text-white">{item.ingredient}</p>
                      {item.reason && (
                        <p className="text-xs text-white/30 truncate max-w-[280px]">{item.reason}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-6 text-xs text-right">
                      {item.alreadyHave > 0 && (
                        <div>
                          <p className="text-white/30">En stock</p>
                          <p className="text-white/60 font-mono">{item.alreadyHave} {item.unit}</p>
                        </div>
                      )}
                      <div>
                        <p className="text-white/30">Besoin</p>
                        <p className="text-white/60 font-mono">{item.estimatedNeeded} {item.unit}</p>
                      </div>
                      <div>
                        <p className="text-orange-400/80">À acheter</p>
                        <p className="text-orange-400 font-bold font-mono">{item.toBuy} {item.unit}</p>
                      </div>
                      {item.estimatedCost != null && item.estimatedCost > 0 && (
                        <div>
                          <p className="text-white/30">Coût est.</p>
                          <p className="text-white/60 font-mono">~{item.estimatedCost}€</p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Bouton retour */}
      <div className="pt-4">
        <Link href="/dashboard/shopping" className="text-sm text-white/30 hover:text-white/60 transition-colors">
          ← Retour aux listes de courses
        </Link>
      </div>
    </div>
  );
}
