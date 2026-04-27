"use client";
import { useEffect, useState } from "react";
import { api, apiStream } from "@/lib/api";
import { downloadShoppingListPdf } from "@/lib/downloadShoppingListPdf";
import { IaHistoryPanel, type HistoryEntry } from "@/components/ia/IaHistoryPanel";

// ── Messages dynamiques pendant le chargement ─────────────────────────────────
const LOADING_MESSAGES = [
  { icon: "📦", text: "Nova analyse votre menu plat par plat, catégorie par catégorie..." },
  { icon: "🔍", text: "Saviez-vous ? Un restaurant moyen gaspille 15% de ses achats alimentaires." },
  { icon: "🧊", text: "Le premier réfrigérateur commercial date de 1913. Avant, on utilisait la glace naturelle." },
  { icon: "📋", text: "Nova décompose chaque plat en ingrédients bruts pour ne rien oublier..." },
  { icon: "🥕", text: "La France jette 10 millions de tonnes de nourriture par an. Nova aide à réduire ce chiffre." },
  { icon: "🧮", text: "Estimation des quantités en cours — Nova croise vos ventes avec votre menu..." },
  { icon: "🛒", text: "Un bon chef fait ses courses 2 à 3 fois par semaine pour garantir la fraîcheur." },
  { icon: "💡", text: "Astuce : les produits frais représentent 35% du budget courses d'un restaurant." },
  { icon: "🏪", text: "Nova identifie les fournisseurs optimaux et les jours de livraison idéaux." },
  { icon: "📊", text: "L'IA calcule les prévisions de demande basées sur vos 14 derniers jours de ventes." },
  { icon: "🥬", text: "Les produits frais ont une durée de vie de 2-5 jours. Nova surveille les DLC." },
  { icon: "💶", text: "Nova estime le coût de chaque ingrédient pour optimiser votre budget courses." },
  { icon: "🎯", text: "Dernière ligne droite... Nova finalise votre liste de courses personnalisée." },
];

function useLoadingMessages(isLoading: boolean) {
  const [msgIdx, setMsgIdx] = useState(0);
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (!isLoading) { setMsgIdx(0); setElapsed(0); return; }
    const msgTimer = setInterval(() => setMsgIdx(i => (i + 1) % LOADING_MESSAGES.length), 6000);
    const tickTimer = setInterval(() => setElapsed(e => e + 1), 1000);
    return () => { clearInterval(msgTimer); clearInterval(tickTimer); };
  }, [isLoading]);

  return { msg: LOADING_MESSAGES[msgIdx], elapsed };
}

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

  // Loading messages
  const isLoading = step === "loading-items" || step === "loading-analysis";
  const { msg: loadingMsg, elapsed: loadingElapsed } = useLoadingMessages(isLoading);

  // Step 2
  const [stockItems, setStockItems] = useState<StockItem[]>([]);
  const [budget, setBudget]         = useState("");
  const [constraints, setConstraints] = useState("");

  // Step 3
  const [analysis, setAnalysis]   = useState<Analysis | null>(null);
  const [meta, setMeta]           = useState<{ ordersAnalyzed: number; menuItemsCount: number; period: string; restaurantName?: string } | null>(null);
  const [copied, setCopied]       = useState(false);
  const [historyKey, setHistoryKey] = useState(0);
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState<string | null>(null);

  const importToStock = async () => {
    if (!stockItems.length) return;
    setImporting(true); setImportResult(null);
    try {
      const products = stockItems.map(it => ({
        name: it.name,
        unit: it.unit,
        category: it.category || "Autre",
        isFresh: it.isFresh,
        currentQty: parseFloat(it.currentQty || "0") || 0,
        lowThreshold: Math.ceil((it.weeklyEstimate || 0) * 0.3),
        weeklyEstimate: it.weeklyEstimate || 0,
        linkedDishes: it.linkedDishes || [],
      }));
      const res = await api<{ created: number }>("/api/pro/stock/import-ia", {
        method: "POST",
        body: JSON.stringify({ products }),
      });
      setImportResult(`${res.created} articles importes dans votre stock`);
    } catch (e: any) {
      setImportResult("Erreur : " + e.message);
    } finally {
      setImporting(false);
    }
  };

  const onRestoreHistory = (entry: HistoryEntry) => {
    if (entry.outputData?.analysis) {
      setAnalysis(entry.outputData.analysis as Analysis);
      setMeta(entry.outputData.meta ?? null);
      setStep("results");
    }
  };

  // ── Étape 1 : IA identifie les articles via SSE (connexion persistante, pas de timeout)
  const detectItems = async () => {
    setStep("loading-items"); setError(null);
    try {
      let items: StockItem[] = [];
      const stream = await apiStream("/api/pro/ia/stock-items/stream", {});
      for await (const event of stream) {
        if (event.type === "result") {
          items = (event.items as StockItem[]) ?? [];
        } else if (event.type === "error") {
          throw new Error((event.message as string) || "Erreur IA");
        }
      }

      if (items.length === 0) {
        setError("L'IA n'a retourné aucun article. Vérifiez que votre menu contient des plats.");
        setStep("idle");
        return;
      }

      setStockItems(items.map(it => ({ ...it, currentQty: "", freshExpiry: "" })));
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

  // ── Étape 2 → 3 : Lancer l'analyse via SSE (connexion persistante, pas de timeout)
  const runAnalysis = async () => {
    setStep("loading-analysis"); setError(null);

    const stockNotes = stockItems
      .map(it => `- ${it.name}: ${it.currentQty?.trim() || "0"} ${it.unit}${it.freshExpiry ? ` (DLC: ${it.freshExpiry})` : ""}`)
      .join("\n");

    const freshNotes = stockItems
      .filter(it => it.isFresh && it.freshExpiry?.trim())
      .map(it => `- ${it.name}: expire le ${it.freshExpiry}, quantité: ${it.currentQty || "??"} ${it.unit}`)
      .join("\n");

    const payload = {
      existingStockNotes:  stockNotes  || undefined,
      freshProducts:       freshNotes  || undefined,
      purchaseConstraints: constraints || undefined,
      budget:              budget ? parseFloat(budget) : undefined,
    };

    try {
      let resultAnalysis: Analysis | null = null;
      let resultMeta: any = null;
      const stream = await apiStream("/api/pro/ia/stock-analysis/stream", payload);
      for await (const event of stream) {
        if (event.type === "result") {
          resultAnalysis = event.analysis as Analysis;
          resultMeta = event.meta;
        } else if (event.type === "error") {
          throw new Error((event.message as string) || "Erreur IA");
        }
      }

      if (resultAnalysis) {
        setAnalysis(resultAnalysis);
        setMeta(resultMeta);
        setStep("results");
        setHistoryKey(k => k + 1);
      } else {
        throw new Error("L'IA n'a pas retourné de résultat.");
      }
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
      <div className="flex items-start justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📦</span> Nova Stock IA
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Gestion intelligente · Liste de courses · Promos excédents · Alertes produits frais
          </p>
        </div>
        <IaHistoryPanel type="STOCK" onRestore={onRestoreHistory} refreshKey={historyKey} />
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
  // STEP: LOADING ITEMS (with dynamic messages)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "loading-items") return (
    <div className="p-8 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <span className="text-3xl">📦</span> Nova Stock IA — Détection
      </h1>

      <div className="bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5 border border-white/[0.08] rounded-2xl p-6 space-y-4">
        {/* Barre de progression animée */}
        <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-yellow-500 rounded-full animate-loading-bar" />
        </div>

        {/* Temps écoulé */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs text-white/50 font-mono">
              {Math.floor(loadingElapsed / 60)}:{String(loadingElapsed % 60).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] text-white/30">Ne fermez pas cette page</span>
        </div>

        {/* Message dynamique */}
        <div className="flex items-start gap-3 min-h-[48px]" key={loadingMsg.text}>
          <span className="text-2xl shrink-0 animate-bounce-slow">{loadingMsg.icon}</span>
          <p className="text-sm text-white/60 leading-relaxed animate-fade-in">{loadingMsg.text}</p>
        </div>

        {/* Phases */}
        <div className="grid grid-cols-3 gap-1.5">
          {["Chargement menu", "Analyse IA", "Extraction articles"].map((phase, i) => {
            const phaseActive = loadingElapsed >= i * 20;
            const phaseDone = loadingElapsed >= (i + 1) * 20;
            return (
              <div key={phase} className={`text-center py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-500 ${
                phaseDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : phaseActive ? "bg-orange-500/15 text-orange-400 border border-orange-500/25 animate-pulse"
                : "bg-white/[0.03] text-white/25 border border-white/[0.05]"
              }`}>
                {phaseDone ? "✓ " : phaseActive ? "⏳ " : ""}{phase}
              </div>
            );
          })}
        </div>
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
                        value={item.currentQty ?? ""}
                        onChange={e => {
                          const updated = [...stockItems];
                          const realIdx = updated.findIndex(u => u.name === item.name);
                          if (realIdx !== -1) {
                            updated[realIdx] = { ...updated[realIdx], currentQty: e.target.value };
                            setStockItems(updated);
                          }
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
                          value={item.freshExpiry ?? ""}
                          onChange={e => {
                            const updated = [...stockItems];
                            const realIdx = updated.findIndex(u => u.name === item.name);
                            if (realIdx !== -1) {
                              updated[realIdx] = { ...updated[realIdx], freshExpiry: e.target.value };
                              setStockItems(updated);
                            }
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

      {/* Bouton générer + import */}
      <div className="space-y-3">
        <button onClick={runAnalysis}
          className="w-full py-4 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-2xl transition-colors text-base shadow-lg shadow-orange-500/20 flex items-center justify-center gap-2">
          📋 Générer la liste de courses & recommandations
        </button>

        <button
          onClick={importToStock}
          disabled={importing || !stockItems.length}
          className="w-full py-3 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 font-bold rounded-2xl transition-colors text-sm border border-emerald-500/30 flex items-center justify-center gap-2 disabled:opacity-40"
        >
          {importing ? "Import en cours..." : "📥 Importer ces articles dans mon Stock"}
        </button>

        {importResult && (
          <div className={`rounded-xl p-3 text-sm text-center ${importResult.startsWith("Erreur") ? "bg-red-500/10 border border-red-500/20 text-red-400" : "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"}`}>
            {importResult}
          </div>
        )}
      </div>

      <p className="text-xs text-white/20 text-center">
        Vous pouvez laisser des champs vides — l'IA fera des estimations basées sur vos ventes.
      </p>
    </div>
  );

  // ═══════════════════════════════════════════════════════════════════════════
  // STEP: LOADING ANALYSIS (with dynamic messages)
  // ═══════════════════════════════════════════════════════════════════════════
  if (step === "loading-analysis") return (
    <div className="p-8 max-w-3xl space-y-6">
      <h1 className="text-2xl font-bold text-white flex items-center gap-3">
        <span className="text-3xl">📋</span> Nova Stock IA — Génération
      </h1>

      <div className="bg-gradient-to-r from-orange-500/5 via-amber-500/5 to-yellow-500/5 border border-white/[0.08] rounded-2xl p-6 space-y-4">
        {/* Barre de progression animée */}
        <div className="relative h-2 bg-white/[0.06] rounded-full overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500 via-amber-500 to-emerald-500 rounded-full animate-loading-bar" />
        </div>

        {/* Temps écoulé */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-xs text-white/50 font-mono">
              {Math.floor(loadingElapsed / 60)}:{String(loadingElapsed % 60).padStart(2, "0")}
            </span>
          </div>
          <span className="text-[10px] text-white/30">Ne fermez pas cette page</span>
        </div>

        {/* Message dynamique */}
        <div className="flex items-start gap-3 min-h-[48px]" key={loadingMsg.text}>
          <span className="text-2xl shrink-0 animate-bounce-slow">{loadingMsg.icon}</span>
          <p className="text-sm text-white/60 leading-relaxed animate-fade-in">{loadingMsg.text}</p>
        </div>

        {/* Phases */}
        <div className="grid grid-cols-4 gap-1.5">
          {["Chargement données", "Analyse IA", "Liste de courses", "Recommandations"].map((phase, i) => {
            const phaseActive = loadingElapsed >= i * 20;
            const phaseDone = loadingElapsed >= (i + 1) * 20;
            return (
              <div key={phase} className={`text-center py-1.5 rounded-lg text-[10px] font-semibold transition-all duration-500 ${
                phaseDone ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                : phaseActive ? "bg-orange-500/15 text-orange-400 border border-orange-500/25 animate-pulse"
                : "bg-white/[0.03] text-white/25 border border-white/[0.05]"
              }`}>
                {phaseDone ? "✓ " : phaseActive ? "⏳ " : ""}{phase}
              </div>
            );
          })}
        </div>
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
        <div className="flex gap-2 flex-wrap">
          <IaHistoryPanel type="STOCK" onRestore={onRestoreHistory} refreshKey={historyKey} />
          <button
            onClick={() => { setStep("fill-qty"); setAnalysis(null); }}
            className="text-xs px-4 py-2 bg-white/10 hover:bg-white/20 text-white/60 rounded-lg transition-colors"
          >
            ✏️ Modifier le stock
          </button>
        </div>
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

          {/* 🛒 Liste de courses — groupée par catégorie */}
          {analysis.shoppingList?.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-3 flex-wrap gap-2">
                <h2 className="text-lg font-bold text-white">
                  🛒 Liste de courses
                  <span className="text-xs text-white/30 font-normal ml-2">{analysis.shoppingList.length} articles</span>
                </h2>
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

              {/* Group shopping list by category */}
              {(() => {
                const SHOP_CAT_COLORS: Record<string, string> = {
                  "Alcools":             "text-purple-400 border-purple-500/30 bg-purple-500/5",
                  "Dilutants & Mixers":  "text-sky-400 border-sky-500/30 bg-sky-500/5",
                  "Sirops & Liqueurs":   "text-pink-400 border-pink-500/30 bg-pink-500/5",
                  "Fruits & Garnitures": "text-yellow-400 border-yellow-500/30 bg-yellow-500/5",
                  "Viandes":             "text-red-400 border-red-500/30 bg-red-500/5",
                  "Poissons":            "text-blue-400 border-blue-500/30 bg-blue-500/5",
                  "Légumes":             "text-emerald-400 border-emerald-500/30 bg-emerald-500/5",
                  "Épicerie":            "text-orange-400 border-orange-500/30 bg-orange-500/5",
                  "Produits laitiers":   "text-cyan-400 border-cyan-500/30 bg-cyan-500/5",
                  "Consommables":        "text-gray-400 border-gray-500/30 bg-gray-500/5",
                  "Boulangerie":         "text-amber-400 border-amber-500/30 bg-amber-500/5",
                  "Boissons":            "text-indigo-400 border-indigo-500/30 bg-indigo-500/5",
                };
                const DEFAULT_CAT_COLOR = "text-white/60 border-white/10 bg-white/[0.03]";

                // Group items by their category field
                const shopCats: Record<string, ShopItem[]> = {};
                for (const s of analysis.shoppingList) {
                  const cat = (s as any).category || "Autres";
                  (shopCats[cat] ||= []).push(s);
                }

                // Sort categories: prioritize ones with HIGH items first
                const catOrder = Object.entries(shopCats).sort(([, a], [, b]) => {
                  const highA = a.filter(i => i.priority === "HIGH").length;
                  const highB = b.filter(i => i.priority === "HIGH").length;
                  return highB - highA;
                });

                return (
                  <div className="space-y-4">
                    {catOrder.map(([cat, catItems]) => {
                      const colorCls = SHOP_CAT_COLORS[cat] ?? DEFAULT_CAT_COLOR;
                      const catCost = catItems.reduce((sum, s) => sum + (s.estimatedCost ?? 0), 0);
                      return (
                        <div key={cat} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden">
                          {/* Category header */}
                          <div className={`px-5 py-3 border-b border-white/[0.07] flex items-center justify-between ${colorCls.split(" ").find(c => c.startsWith("bg-")) ?? ""}`}>
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${colorCls.split(" ").find(c => c.startsWith("text-")) ?? "text-white/60"}`}>{cat}</span>
                              <span className="text-xs text-white/30">{catItems.length} article{catItems.length > 1 ? "s" : ""}</span>
                            </div>
                            {catCost > 0 && (
                              <span className="text-xs text-emerald-400 font-semibold">~{catCost.toFixed(0)}€</span>
                            )}
                          </div>
                          {/* Items table */}
                          <table className="w-full text-sm">
                            <thead>
                              <tr className="border-b border-white/[0.05] text-left">
                                <th className="px-4 py-2 text-[10px] text-white/30 font-semibold">Ingrédient</th>
                                <th className="px-4 py-2 text-[10px] text-white/30 font-semibold text-center">Stock</th>
                                <th className="px-4 py-2 text-[10px] text-white/30 font-semibold text-center">Besoin</th>
                                <th className="px-4 py-2 text-[10px] text-white/30 font-semibold text-center">À acheter</th>
                                <th className="px-4 py-2 text-[10px] text-white/30 font-semibold text-center">Priorité</th>
                                <th className="px-4 py-2 text-[10px] text-white/30 font-semibold hidden md:table-cell">Pour</th>
                              </tr>
                            </thead>
                            <tbody>
                              {catItems.map((s, i) => (
                                <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02]">
                                  <td className="px-4 py-2.5 text-white font-medium">
                                    {s.ingredient}
                                    {s.estimatedCost ? <span className="ml-2 text-xs text-emerald-400">~{s.estimatedCost}€</span> : null}
                                  </td>
                                  <td className="px-4 py-2.5 text-center text-white/50 text-xs">{s.alreadyHave} {s.unit}</td>
                                  <td className="px-4 py-2.5 text-center text-white/50 text-xs">{s.estimatedNeeded} {s.unit}</td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className="font-black text-orange-400">{s.toBuy} {s.unit}</span>
                                  </td>
                                  <td className="px-4 py-2.5 text-center">
                                    <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${PRIORITY_CLS[s.priority] ?? PRIORITY_CLS.LOW}`}>
                                      {s.priority}
                                    </span>
                                  </td>
                                  <td className="px-4 py-2.5 text-xs text-white/40 max-w-[180px] truncate hidden md:table-cell">{s.reason}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
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
