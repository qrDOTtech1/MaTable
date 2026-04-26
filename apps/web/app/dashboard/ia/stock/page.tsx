"use client";
import { useState } from "react";
import { api } from "@/lib/api";
import { downloadShoppingListPdf } from "@/lib/downloadShoppingListPdf";

// ── Types ─────────────────────────────────────────────────────────────────────
type StockItem = {
  name: string;
  unit: string;
  category: string;
  isFresh: boolean;
  linkedDishes: string[];
  weeklyEstimate: number;
  currentQty?: string; // saisi par l'utilisateur
  freshExpiry?: string; // date DLC si produit frais
};

type Alert      = { item: string; issue: string; urgency: string };
type Reorder    = { item: string; currentStock: number; suggestedOrder: number; reason: string };
type TopSeller  = { item: string; qtySold: number; trend: string };
type DeadItem   = { item: string; qtySold: number; suggestion: string };
type Forecast   = { item: string; estimatedDemand: number };
type ShopItem   = { ingredient: string; estimatedNeeded: number; alreadyHave: number; toBuy: number; unit: string; priority: string; estimatedCost?: number; reason: string };
type Promotion  = { item: string; reason: string; suggestedDiscount: string; urgency: string; action: string };
type FreshAlert = { product: string; expiresIn: string; qty: string; recommendation: string; affectedDishes: string[] };

type Analysis = {
  summary: string;
  alerts: Alert[];
  reorderSuggestions: Reorder[];
  topSellers: TopSeller[];
  deadStock: DeadItem[];
  forecastNextWeek: Forecast[];
  shoppingList: ShopItem[];
  promotions: Promotion[];
  freshProductAlerts: FreshAlert[];
  supplierOrderNote: string;
  costSavings: string;
  totalShoppingBudget?: number;
};

// ── Styles ────────────────────────────────────────────────────────────────────
const URGENCY_CLS: Record<string, string> = {
  HIGH:   "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW:    "bg-white/10 text-white/40 border-white/10",
};
const PRIORITY_CLS: Record<string, string> = {
  HIGH:   "bg-red-500/20 text-red-400",
  MEDIUM: "bg-amber-500/20 text-amber-400",
  LOW:    "bg-white/10 text-white/40",
};
const CAT_COLOR: Record<string, string> = {
  "Viandes":           "text-red-400",
  "Poissons":          "text-blue-400",
  "Légumes":           "text-emerald-400",
  "Fruits":            "text-yellow-400",
  "Produits laitiers": "text-sky-400",
  "Boissons":          "text-purple-400",
  "Épicerie":          "text-orange-400",
  "Boulangerie":       "text-amber-400",
};
const TREND_ICON: Record<string, string> = { UP: "📈", STABLE: "➡️", DOWN: "📉" };

// ── Grouper par catégorie ──────────────────────────────────────────────────────
function groupByCategory(items: StockItem[]): Record<string, StockItem[]> {
  return items.reduce((acc, item) => {
    const cat = item.category || "Autres";
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(item);
    return acc;
  }, {} as Record<string, StockItem[]>);
}

// ── Composant principal ───────────────────────────────────────────────────────
export default function NovaStockPage() {
  // Wizard step: "idle" | "loading-items" | "fill-qty" | "loading-analysis" | "results"
  const [step, setStep]         = useState<"idle"|"loading-items"|"fill-qty"|"loading-analysis"|"results">("idle");
  const [error, setError]       = useState<string | null>(null);

  // Step 2
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [budget, setBudget]         = useState("");
  const [constraints, setConstraints] = useState("");

  // Step 3
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [meta, setMeta]         = useState<{ ordersAnalyzed: number; menuItemsCount: number; period: string; restaurantName?: string } | null>(null);
  const [copied, setCopied]     = useState(false);

  // ── Étape 1 : IA identifie les articles ──────────────────────────────────────
  const detectItems = async () => {
    setStep("loading-items"); setError(null);
    try {
      const r = await api<{ items: StockItem[]; meta: any }>("/api/pro/ia/stock-items", { method: "POST" });
      setStockItems(r.items.map(it => ({ ...it, currentQty: "", freshExpiry: "" })));
      setStep("fill-qty");
    } catch (e: any) {
      if (e.message?.includes("403")) setError("Abonnement PRO_IA requis.");
      else if (e.message?.includes("503")) setError("Clé API IA non configurée. Contactez l'admin.");
      else setError("Erreur : " + e.message);
      setStep("idle");
    }
  };

  // Mettre tout à 0 d'un coup
  const setAllToZero = () => {
    setStockItems(prev => prev.map(it => ({ ...it, currentQty: "0" })));
  };

  // ── Étape 2 → 3 : Lancer l'analyse avec les quantités ─────────────────────
  const runAnalysis = async () => {
    setStep("loading-analysis"); setError(null);

    // Construire le texte de stock (0 explicite si vide = vraiment 0)
    const stockNotes = stockItems
      .map(it => `- ${it.name}: ${it.currentQty?.trim() || "0"} ${it.unit}${it.freshExpiry ? ` (DLC: ${it.freshExpiry})` : ""}`)
      .join("\n");

    const freshNotes = stockItems
      .filter(it => it.isFresh && it.freshExpiry?.trim())
      .map(it => `- ${it.name}: expire le ${it.freshExpiry}, quantité: ${it.currentQty || "??"} ${it.unit}`)
      .join("\n");

    try {
      const r = await api<{ analysis: Analysis; meta: any }>("/api/pro/ia/stock-analysis", {
        method: "POST",
        body: JSON.stringify({
          existingStockNotes:  stockNotes  || undefined,
          freshProducts:       freshNotes  || undefined,
          purchaseConstraints: constraints || undefined,
          budget:              budget ? parseFloat(budget) : undefined,
        }),
      });
      setAnalysis(r.analysis);
      setMeta(r.meta);
      setStep("results");
    } catch (e: any) {
      setError("Erreur lors de l'analyse : " + e.message);
      setStep("fill-qty");
    }
  };

  const copyShoppingList = () => {
    if (!analysis?.shoppingList?.length) return;
    const text = analysis.shoppingList
      .map(s => `[ ] ${s.toBuy} ${s.unit} — ${s.ingredient}${s.estimatedCost ? ` (~${s.estimatedCost}€)` : ""} · ${s.reason}`)
      .join("\n");
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const grouped = groupByCategory(stockItems);

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: IDLE
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "idle") return (
    <div className="p-8 max-w-3xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">📦</span> Nova Stock IA
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Gestion intelligente · Liste de courses · Promos excédents · Alertes produits frais
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">{error}</div>
      )}

      <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-2xl p-8 text-center">
        <div className="text-5xl mb-4">🤖</div>
        <h2 className="text-xl font-bold text-white mb-2">Comment ça marche ?</h2>
        <div className="grid grid-cols-3 gap-4 my-6 text-left">
          {[
            { step: "1", icon: "🔍", title: "Détection auto", desc: "L'IA analyse votre menu et vos ventes pour identifier les articles à gérer" },
            { step: "2", icon: "✏️", title: "Vous déclarez", desc: "L'IA vous demande : \"combien avez-vous de chaque ingrédient en ce moment ?\"" },
            { step: "3", icon: "📋", title: "L'IA fait le reste", desc: "Liste de courses, promos excédents, alertes produits frais, prévisions" },
          ].map(f => (
            <div key={f.step} className="bg-white/[0.04] border border-white/[0.07] rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="w-5 h-5 rounded-full bg-orange-500/30 text-orange-400 text-xs font-black flex items-center justify-center">{f.step}</span>
                <span className="text-lg">{f.icon}</span>
              </div>
              <p className="text-sm font-bold text-white mb-1">{f.title}</p>
              <p className="text-xs text-white/40">{f.desc}</p>
            </div>
          ))}
        </div>
        <button onClick={detectItems}
          className="px-8 py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-colors text-base">
          🔍 Lancer l'analyse IA
        </button>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: LOADING ITEMS
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "loading-items") return (
    <div className="p-8 max-w-3xl flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-white font-bold text-lg">L'IA analyse votre menu...</p>
        <p className="text-white/40 text-sm mt-1">Identification des ingrédients et articles à gérer</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: FILL QUANTITIES
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "fill-qty") return (
    <div className="p-8 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">✏️</span> Combien avez-vous en ce moment ?
          </h1>
          <p className="text-sm text-white/40 mt-1">
            L'IA a identifié <strong className="text-white">{stockItems.length} articles</strong> à suivre.
            Renseignez vos quantités ou cliquez sur <span className="text-orange-400 font-semibold">Tout à 0</span> si vous partez de zéro.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={setAllToZero}
            className="text-xs px-4 py-2 bg-orange-500/20 hover:bg-orange-500/30 text-orange-400 border border-orange-500/30 rounded-lg transition-colors font-semibold"
          >
            📦 Tout à 0 (stock vide)
          </button>
          <button onClick={() => setStep("idle")} className="text-xs px-3 py-2 text-white/30 hover:text-white/60 transition-colors">
            ← Recommencer
          </button>
        </div>
      </div>

      {/* Bannière si aucune quantité saisie */}
      <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 flex items-start gap-3">
        <span className="text-xl shrink-0">💡</span>
        <div>
          <p className="text-sm text-amber-400 font-semibold">Astuce : stock complètement vide ?</p>
          <p className="text-xs text-white/40 mt-0.5">
            Cliquez sur <strong className="text-orange-400">Tout à 0</strong> puis <strong className="text-white">Générer</strong> — l'IA produira une liste de courses <strong className="text-white">complète</strong> pour repartir de zéro.
            Vous pouvez aussi laisser les champs vides, le résultat sera identique.
          </p>
        </div>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* Articles groupés par catégorie */}
      <div className="space-y-4">
        {Object.entries(grouped).map(([cat, items]) => (
          <div key={cat} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
            <div className="px-5 py-3 border-b border-white/[0.07] flex items-center gap-2">
              <span className={`text-sm font-bold ${CAT_COLOR[cat] ?? "text-white/60"}`}>{cat}</span>
              <span className="text-xs text-white/30">{items.length} article{items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {items.map((item) => {
                const idx = stockItems.findIndex(s => s.name === item.name);
                return (
                  <div key={item.name} className="px-5 py-4 flex items-center gap-4 flex-wrap">
                    <div className="flex-1 min-w-[160px]">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-white">{item.name}</span>
                        {item.isFresh && (
                          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded font-bold">FRAIS</span>
                        )}
                      </div>
                      {item.linkedDishes?.length > 0 && (
                        <p className="text-xs text-white/30 mt-0.5 truncate max-w-[250px]">
                          Pour : {item.linkedDishes.slice(0, 3).join(", ")}
                          {item.linkedDishes.length > 3 ? ` +${item.linkedDishes.length - 3}` : ""}
                        </p>
                      )}
                      <p className="text-xs text-orange-400/70 mt-0.5">
                        Estimation semaine : ~{item.weeklyEstimate} {item.unit}
                      </p>
                    </div>

                    {/* Quantité actuelle */}
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        min="0"
                        step="0.5"
                        value={stockItems[idx]?.currentQty ?? ""}
                        onChange={e => {
                          const updated = [...stockItems];
                          updated[idx] = { ...updated[idx], currentQty: e.target.value };
                          setStockItems(updated);
                        }}
                        placeholder="0"
                        className="w-24 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white text-sm text-right focus:outline-none focus:border-orange-500/50"
                      />
                      <span className="text-xs text-white/40 w-10">{item.unit}</span>
                    </div>

                    {/* Date DLC si frais */}
                    {item.isFresh && (
                      <div className="flex items-center gap-2">
                        <input
                          type="date"
                          value={stockItems[idx]?.freshExpiry ?? ""}
                          onChange={e => {
                            const updated = [...stockItems];
                            updated[idx] = { ...updated[idx], freshExpiry: e.target.value };
                            setStockItems(updated);
                          }}
                          className="bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-white/60 text-xs focus:outline-none focus:border-emerald-500/50"
                        />
                        <span className="text-[10px] text-white/20">DLC</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Budget + contraintes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-2">💶 Budget maximum courses (EUR)</label>
          <input
            type="number" value={budget} onChange={e => setBudget(e.target.value)}
            placeholder="Ex: 500"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-2">🛒 Contraintes fournisseur</label>
          <input
            type="text" value={constraints} onChange={e => setConstraints(e.target.value)}
            placeholder="Ex: Livraison Métro le mercredi"
            className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50"
          />
        </div>
      </div>

      {/* Bouton générer */}
      <button onClick={runAnalysis}
        className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl transition-colors text-base shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
        📋 Générer la liste de courses & recommandations
      </button>

      <p className="text-xs text-white/20 text-center">
        Vous pouvez laisser des champs vides — l'IA fera des estimations basées sur vos ventes.
      </p>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: LOADING ANALYSIS
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "loading-analysis") return (
    <div className="p-8 max-w-3xl flex flex-col items-center justify-center min-h-[400px] gap-6">
      <div className="w-16 h-16 border-4 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      <div className="text-center">
        <p className="text-white font-bold text-lg">Génération en cours...</p>
        <p className="text-white/40 text-sm mt-1">Liste de courses · Promotions · Alertes produits frais</p>
      </div>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: RESULTS
  // ═══════════════════════════════════════════════════════════════════════════
  return (
    <div className="p-8 max-w-5xl space-y-6">

      {/* Header résultats */}
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📦</span> Nova Stock IA — Résultats
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {meta && `${meta.ordersAnalyzed} commandes analysées · ${meta.menuItemsCount} plats`}
          </p>
        </div>
        <button
          onClick={() => { setStep("fill-qty"); setAnalysis(null); }}
          className="text-xs px-4 py-2 bg-white/10 hover:bg-white/20 text-white/60 rounded-lg transition-colors"
        >
          ✏️ Modifier le stock
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {analysis && (
        <div className="space-y-6">

          {/* Résumé */}
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6">
            <p className="text-white font-medium">{analysis.summary}</p>
            {analysis.totalShoppingBudget ? (
              <p className="text-sm text-emerald-400 font-bold mt-2">
                💶 Budget courses estimé : {analysis.totalShoppingBudget}€
                {budget ? (analysis.totalShoppingBudget > parseFloat(budget)
                  ? <span className="text-red-400 ml-2 font-normal">(dépasse votre budget de {(analysis.totalShoppingBudget - parseFloat(budget)).toFixed(0)}€)</span>
                  : <span className="text-white/40 ml-2 font-normal">(dans le budget)</span>
                ) : null}
              </p>
            ) : null}
          </div>

          {/* 🥬 Alertes produits frais */}
          {analysis.freshProductAlerts?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                🥬 Alertes produits frais
                <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full">Action immédiate</span>
              </h2>
              <div className="space-y-2">
                {analysis.freshProductAlerts.map((f, i) => (
                  <div key={i} className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-white text-sm">{f.product}</span>
                          <span className="text-xs bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full font-bold">⏱ {f.expiresIn}</span>
                          {f.qty && <span className="text-xs text-white/40">Qté : {f.qty}</span>}
                        </div>
                        <p className="text-sm text-amber-400 mt-1 font-medium">{f.recommendation}</p>
                        {f.affectedDishes?.length > 0 && (
                          <p className="text-xs text-white/40 mt-1">Plats concernés : {f.affectedDishes.join(", ")}</p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🏷️ Promotions */}
          {analysis.promotions?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                🏷️ Promotions recommandées
                <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">Écouler les excédents</span>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.promotions.map((p, i) => (
                  <div key={i} className={`rounded-xl border p-4 ${URGENCY_CLS[p.urgency] ?? URGENCY_CLS.LOW}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-bold text-sm">{p.item}</span>
                      <span className="text-xl font-black text-emerald-400">{p.suggestedDiscount}</span>
                    </div>
                    <p className="text-xs opacity-70 mb-2">{p.reason}</p>
                    <p className="text-xs font-semibold border-t border-white/10 pt-2">{p.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ⚠️ Alertes stock */}
          {analysis.alerts?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">⚠️ Alertes stock</h2>
              <div className="space-y-2">
                {analysis.alerts.map((a, i) => (
                  <div key={i} className={`flex items-center gap-3 px-4 py-3 rounded-xl border ${URGENCY_CLS[a.urgency] ?? URGENCY_CLS.LOW}`}>
                    <span className="font-bold text-sm">{a.item}</span>
                    <span className="text-xs flex-1">{a.issue}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase">{a.urgency}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 🛒 Liste de courses */}
          {analysis.shoppingList?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-lg font-bold text-white">🛒 Liste de courses</h2>
                <div className="flex items-center gap-2">
                  {/* Télécharger PDF */}
                  <button
                    onClick={() => downloadShoppingListPdf({
                      restaurantName:    meta?.restaurantName,
                      shoppingList:      analysis.shoppingList,
                      freshProductAlerts: analysis.freshProductAlerts,
                      promotions:        analysis.promotions,
                      supplierOrderNote: analysis.supplierOrderNote,
                      costSavings:       analysis.costSavings,
                      totalShoppingBudget: analysis.totalShoppingBudget,
                      budget,
                    })}
                    className="text-xs px-3 py-1.5 bg-orange-600/20 hover:bg-orange-600/30 text-orange-400 border border-orange-500/30 rounded-lg transition-colors flex items-center gap-1 font-semibold"
                  >
                    📄 Télécharger PDF
                  </button>
                  {/* Copier texte */}
                  <button onClick={copyShoppingList}
                    className="text-xs px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white/60 rounded-lg transition-colors">
                    {copied ? "✓ Copié !" : "📋 Copier"}
                  </button>
                </div>
              </div>
              <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/[0.07] text-left">
                      <th className="px-4 py-3 text-xs text-white/40 font-semibold">Ingrédient</th>
                      <th className="px-4 py-3 text-xs text-white/40 font-semibold text-center">En stock</th>
                      <th className="px-4 py-3 text-xs text-white/40 font-semibold text-center">Besoin</th>
                      <th className="px-4 py-3 text-xs text-white/40 font-semibold text-center">À acheter</th>
                      <th className="px-4 py-3 text-xs text-white/40 font-semibold text-center">Priorité</th>
                      <th className="px-4 py-3 text-xs text-white/40 font-semibold hidden md:table-cell">Pour</th>
                    </tr>
                  </thead>
                  <tbody>
                    {analysis.shoppingList.map((s, i) => (
                      <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                        <td className="px-4 py-3 text-white font-medium">
                          {s.ingredient}
                          {s.estimatedCost ? <span className="ml-2 text-xs text-emerald-400">~{s.estimatedCost}€</span> : null}
                        </td>
                        <td className="px-4 py-3 text-center text-white/50">{s.alreadyHave} {s.unit}</td>
                        <td className="px-4 py-3 text-center text-white/50">{s.estimatedNeeded} {s.unit}</td>
                        <td className="px-4 py-3 text-center">
                          <span className="font-black text-orange-400">{s.toBuy} {s.unit}</span>
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${PRIORITY_CLS[s.priority] ?? PRIORITY_CLS.LOW}`}>
                            {s.priority}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-xs text-white/40 max-w-[180px] truncate hidden md:table-cell">{s.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Stats 2 colonnes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {analysis.topSellers?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-3">🏆 Meilleures ventes</h2>
                <div className="space-y-2">
                  {analysis.topSellers.map((t, i) => (
                    <div key={i} className="flex items-center justify-between bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2">
                      <span className="text-sm text-white">{t.item}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-white/50">{t.qtySold} vendus</span>
                        <span>{TREND_ICON[t.trend] ?? "➡️"}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            {analysis.deadStock?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-3">💤 Stock dormant</h2>
                <div className="space-y-2">
                  {analysis.deadStock.map((d, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-white">{d.item}</span>
                        <span className="text-xs text-red-400">{d.qtySold} vendus</span>
                      </div>
                      <p className="text-xs text-white/40 mt-1">{d.suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Prévisions */}
          {analysis.forecastNextWeek?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">📅 Prévisions semaine prochaine</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analysis.forecastNextWeek.map((f, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 text-center">
                    <p className="text-sm text-white font-medium truncate">{f.item}</p>
                    <p className="text-2xl font-black text-orange-400 mt-1">{f.estimatedDemand}</p>
                    <p className="text-[10px] text-white/30">demande estimée</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Conseils */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {analysis.supplierOrderNote && (
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-blue-400 mb-2">🏪 Stratégie fournisseur</h2>
                <p className="text-sm text-white/70">{analysis.supplierOrderNote}</p>
              </div>
            )}
            {analysis.costSavings && (
              <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-emerald-400 mb-2">💡 Anti-gaspillage & économies</h2>
                <p className="text-sm text-white/70">{analysis.costSavings}</p>
              </div>
            )}
          </div>

        </div>
      )}
    </div>
  );
}
