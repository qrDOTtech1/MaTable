"use client";
import { useState, useEffect } from "react";
import { api } from "@/lib/api";
import { IaHistoryPanel, type HistoryEntry } from "@/components/ia/IaHistoryPanel";

// ── Types ─────────────────────────────────────────────────────────────────────
type KPIs = {
  totalRevenue: number;
  avgRevenuePerDay: number;
  avgTicket: number;
  projectedMonthly: number;
  projectedAnnual: number;
  estimatedFoodCost: number;
  estimatedMargin: number;
  marginPercent: number;
};

type WeekTrend = { week: string; revenue: number; orders: number };
type TopDish   = { name: string; revenue: number; qty: number; revenueShare: number };
type UnderDish = { name: string; revenue: number; qty: number; issue: string; action: string };
type Reco      = { type: string; title: string; detail: string; impact: "HIGH"|"MEDIUM"|"LOW"; effort: "EASY"|"MEDIUM"|"HARD" };
type Forecast  = { nextWeekRevenue: number; nextMonthRevenue: number; confidence: number; risks: string[]; opportunities: string[] };
type Offer     = { dish: string; type: string; description: string; discountPercent: number; estimatedRevenueBoost: string; rationale: string };

type FinanceAdvice = {
  kpis: KPIs;
  weeklyTrend: WeekTrend[];
  topDishes: TopDish[];
  underperformers: UnderDish[];
  recommendations: Reco[];
  forecast: Forecast;
  offersProposed: Offer[];
  summary: string;
};

type Meta = { ordersAnalyzed: number; totalRevenueCents: number; period: string; restaurantName?: string };

// ── Styles ────────────────────────────────────────────────────────────────────
const IMPACT_CLS: Record<string, string> = {
  HIGH:   "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW:    "bg-white/10 text-white/40 border-white/10",
};
const EFFORT_CLS: Record<string, string> = {
  EASY:   "text-emerald-400",
  MEDIUM: "text-amber-400",
  HARD:   "text-red-400",
};
const OFFER_ICON: Record<string, string> = {
  HAPPY_HOUR:     "🕐",
  COMBO:          "🍱",
  PROMO_SEMAINE:  "📅",
  FORMULE:        "🎯",
};
const RECO_ICON: Record<string, string> = {
  PRICING:    "💰",
  MENU:       "🍽️",
  MARKETING:  "📣",
  COSTS:      "✂️",
  FORECAST:   "📈",
};

function fmt(cents: number) { return (cents / 100).toFixed(2).replace(".", ",") + " €"; }
function fmtK(euros: number) {
  if (euros >= 1000) return (euros / 1000).toFixed(1).replace(".", ",") + " k€";
  return euros.toFixed(0) + " €";
}

type ShoppingEntry = {
  realCost: number | null;
  estimatedBudget: number;
  completedAt: string | null;
};

// ── Composant principal ───────────────────────────────────────────────────────
export default function NovaFinancePage() {
  const [period, setPeriod]   = useState<"7d"|"30d"|"90d">("30d");
  const [fixedCosts, setFixedCosts] = useState("");
  const [foodCostTarget, setFoodCostTarget] = useState("");
  const [notes, setNotes]     = useState("");

  // Real purchase costs banner
  const [shoppingData, setShoppingData] = useState<{ totalReal: number; count: number; foodCostPct: number | null } | null>(null);

  useEffect(() => {
    Promise.all([
      api<{ history: ShoppingEntry[] }>("/api/pro/shopping-history"),
      api<{ revenueCents: number }>(`/api/pro/analytics?days=${period === "7d" ? 7 : period === "30d" ? 30 : 90}`),
    ]).then(([sh, analytics]) => {
      const days = period === "7d" ? 7 : period === "30d" ? 30 : 90;
      const cutoff = new Date(Date.now() - days * 86400_000);
      const inPeriod = sh.history.filter(h => h.completedAt && new Date(h.completedAt) >= cutoff);
      const totalReal = inPeriod.reduce((s, h) => s + (h.realCost ?? 0), 0);
      const revEur = (analytics.revenueCents ?? 0) / 100;
      const pct = revEur > 0 && totalReal > 0 ? (totalReal / revEur) * 100 : null;
      setShoppingData({ totalReal, count: inPeriod.length, foodCostPct: pct });
    }).catch(() => {});
  }, [period]);

  const [loading, setLoading] = useState(false);
  const [advice, setAdvice]   = useState<FinanceAdvice | null>(null);
  const [meta, setMeta]       = useState<Meta | null>(null);
  const [error, setError]     = useState<string | null>(null);
  const [historyKey, setHistoryKey] = useState(0);

  const onRestoreHistory = (entry: HistoryEntry) => {
    if (entry.outputData?.advice) {
      setAdvice(entry.outputData.advice as FinanceAdvice);
      setMeta(entry.outputData.meta ?? null);
    }
  };

  // Deploy offers
  const [deployingOffer, setDeployingOffer] = useState<number | null>(null);
  const [deployedOffers, setDeployedOffers] = useState<Set<number>>(new Set());

  const deployOffer = async (idx: number, offer: Offer) => {
    setDeployingOffer(idx);
    try {
      await api("/api/pro/ia/offers/deploy", {
        method: "POST",
        body: JSON.stringify({
          dish: offer.dish,
          type: offer.type,
          description: offer.description,
          discountPercent: offer.discountPercent,
          rationale: offer.rationale,
        }),
      });
      setDeployedOffers(prev => new Set(prev).add(idx));
    } catch (e: any) {
      setError("Erreur déploiement offre : " + e.message);
    } finally {
      setDeployingOffer(null);
    }
  };

  const runAnalysis = async () => {
    setLoading(true); setError(null); setAdvice(null); setDeployedOffers(new Set());
    try {
      const r = await api<{ advice: FinanceAdvice; meta: Meta }>("/api/pro/ia/financial-advice", {
        method: "POST",
        body: JSON.stringify({
          period,
          fixedCosts:      fixedCosts      ? parseFloat(fixedCosts)      : undefined,
          foodCostTarget:  foodCostTarget  ? parseFloat(foodCostTarget)  : undefined,
          notes:           notes || undefined,
        }),
      });
      setAdvice(r.advice);
      setMeta(r.meta);
      setHistoryKey(k => k + 1);
    } catch (e: any) {
      if (e.message?.includes("403")) setError("Application non activee.");
      else if (e.message?.includes("503")) setError("Clé API IA non configurée. Contactez l'admin.");
      else setError("Erreur : " + e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-8 max-w-6xl space-y-6">

      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">💹</span> Nova Finance IA
          </h1>
          <p className="text-sm text-white/40 mt-1">
            Analyse financière · KPIs · Prévisions · Offres recommandées
          </p>
        </div>
        <IaHistoryPanel type="FINANCE" onRestore={onRestoreHistory} refreshKey={historyKey} />
      </div>

      {/* Config */}
      <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 space-y-5">

        {/* Période */}
        <div>
          <label className="block text-xs font-semibold text-white/50 mb-3">Période d'analyse</label>
          <div className="flex gap-2">
            {(["7d","30d","90d"] as const).map(p => (
              <button key={p} onClick={() => setPeriod(p)}
                className={`px-5 py-2.5 rounded-xl border text-sm font-semibold transition-all ${
                  period === p
                    ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-400"
                    : "border-white/[0.08] bg-white/[0.02] text-white/50 hover:text-white/80"
                }`}>
                {p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : "90 jours"}
              </button>
            ))}
          </div>
        </div>

        {/* Paramètres optionnels */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2">💶 Charges fixes / mois (€)</label>
            <input type="number" value={fixedCosts} onChange={e => setFixedCosts(e.target.value)}
              placeholder="Ex: 3500 (loyer + salaires…)"
              className="w-full bg-black/20 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2">🎯 Objectif food cost (%)</label>
            <input type="number" value={foodCostTarget} onChange={e => setFoodCostTarget(e.target.value)}
              placeholder="Ex: 30"
              className="w-full bg-black/20 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50" />
          </div>
          <div>
            <label className="block text-xs font-semibold text-white/50 mb-2">📝 Notes (saisonnalité, événements…)</label>
            <input type="text" value={notes} onChange={e => setNotes(e.target.value)}
              placeholder="Ex: Fête des mères semaine prochaine"
              className="w-full bg-black/20 border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50" />
          </div>
        </div>

        {/* Real cost insight banner */}
        {shoppingData && shoppingData.count > 0 && (
          <div className={`rounded-xl border px-4 py-3 flex items-center justify-between gap-4 flex-wrap text-sm ${
            shoppingData.foodCostPct != null && shoppingData.foodCostPct > 35
              ? "bg-red-500/8 border-red-500/20"
              : "bg-emerald-500/8 border-emerald-500/20"
          }`}>
            <div className="flex items-center gap-3">
              <span className="text-lg">🛒</span>
              <div>
                <p className="font-semibold text-white/80">
                  Achats confirmés sur la période : <span className="text-red-400">{shoppingData.totalReal.toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €</span>
                  <span className="text-white/30 font-normal ml-2">({shoppingData.count} liste{shoppingData.count > 1 ? "s" : ""})</span>
                </p>
                {shoppingData.foodCostPct != null && (
                  <p className={`text-xs mt-0.5 ${shoppingData.foodCostPct > 35 ? "text-red-400" : shoppingData.foodCostPct > 28 ? "text-amber-400" : "text-emerald-400"}`}>
                    Food cost réel : {shoppingData.foodCostPct.toFixed(1)}% du CA
                    {shoppingData.foodCostPct > 35 ? " · Au-dessus de la norme (≤35%)" : shoppingData.foodCostPct > 28 ? " · Dans la norme" : " · Excellent"}
                  </p>
                )}
              </div>
            </div>
            <span className="text-xs text-white/30">Nova Finance intègre ces données automatiquement</span>
          </div>
        )}

        <button onClick={runAnalysis} disabled={loading}
          className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-xl transition-colors flex items-center justify-center gap-2">
          {loading
            ? <><span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyse en cours (20–30s)…</>
            : "💹 Lancer l'analyse financière"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {/* ── Résultats ─────────────────────────────────────────────────────────── */}
      {advice && (
        <div className="space-y-6">

          {/* Résumé exécutif */}
          <div className="bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border border-emerald-500/20 rounded-2xl p-6">
            <p className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2">Résumé exécutif</p>
            <p className="text-white font-medium leading-relaxed">{advice.summary}</p>
            {meta && (
              <p className="text-xs text-white/30 mt-3">
                {meta.ordersAnalyzed} commandes · {meta.period === "7d" ? "7" : meta.period === "30d" ? "30" : "90"} jours analysés
                {meta.restaurantName ? ` · ${meta.restaurantName}` : ""}
              </p>
            )}
          </div>

          {/* KPIs */}
          {advice.kpis && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">📊 KPIs Financiers</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[
                  { label: "CA Période", value: fmtK(advice.kpis.totalRevenue ?? 0), color: "text-emerald-400", sub: "chiffre réel" },
                  { label: "CA / Jour", value: fmtK(advice.kpis.avgRevenuePerDay ?? 0), color: "text-emerald-400", sub: "moyenne" },
                  { label: "Ticket Moyen", value: fmtK(advice.kpis.avgTicket ?? 0), color: "text-orange-400", sub: "par commande" },
                  { label: "Projection Mois", value: fmtK(advice.kpis.projectedMonthly ?? 0), color: "text-blue-400", sub: "extrapolé 30j" },
                  { label: "Projection Année", value: fmtK(advice.kpis.projectedAnnual ?? 0), color: "text-purple-400", sub: "extrapolé 12 mois" },
                  { label: "Food Cost estimé", value: `${(advice.kpis.estimatedFoodCost ?? 0).toFixed(1)} %`, color: (advice.kpis.estimatedFoodCost ?? 0) > 35 ? "text-red-400" : "text-emerald-400", sub: "% CA" },
                  { label: "Marge brute", value: fmtK(advice.kpis.estimatedMargin ?? 0), color: "text-emerald-400", sub: "après food cost" },
                  { label: "Taux de marge", value: `${(advice.kpis.marginPercent ?? 0).toFixed(1)} %`, color: (advice.kpis.marginPercent ?? 0) < 60 ? "text-amber-400" : "text-emerald-400", sub: "marge brute %" },
                ].map((kpi, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                    <p className="text-xs text-white/40 mb-1">{kpi.label}</p>
                    <p className={`text-2xl font-black ${kpi.color}`}>{kpi.value}</p>
                    <p className="text-[10px] text-white/25 mt-0.5">{kpi.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Prévisions */}
          {advice.forecast && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-blue-500/5 border border-blue-500/20 rounded-2xl p-5">
                <h2 className="text-sm font-bold text-blue-400 mb-3">🔮 Prévisions</h2>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <p className="text-xs text-white/40">Semaine prochaine</p>
                    <p className="text-xl font-black text-blue-400">{fmtK(advice.forecast.nextWeekRevenue ?? 0)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/40">Mois prochain</p>
                    <p className="text-xl font-black text-blue-400">{fmtK(advice.forecast.nextMonthRevenue ?? 0)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex-1 bg-white/10 rounded-full h-1.5">
                    <div className="bg-blue-400 h-1.5 rounded-full" style={{ width: `${advice.forecast.confidence ?? 70}%` }} />
                  </div>
                  <span className="text-xs text-blue-400 font-bold">{advice.forecast.confidence ?? 70}% confiance</span>
                </div>
              </div>
              <div className="space-y-3">
                {advice.forecast.risks?.length > 0 && (
                  <div className="bg-red-500/5 border border-red-500/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-red-400 mb-2">⚠️ Risques</p>
                    <ul className="space-y-1">
                      {advice.forecast.risks.map((r, i) => <li key={i} className="text-xs text-white/50">• {r}</li>)}
                    </ul>
                  </div>
                )}
                {advice.forecast.opportunities?.length > 0 && (
                  <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-xl p-4">
                    <p className="text-xs font-bold text-emerald-400 mb-2">🚀 Opportunités</p>
                    <ul className="space-y-1">
                      {advice.forecast.opportunities.map((o, i) => <li key={i} className="text-xs text-white/50">• {o}</li>)}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Top plats + Sous-performeurs */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {advice.topDishes?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-3">🏆 Top plats par CA</h2>
                <div className="space-y-2">
                  {advice.topDishes.slice(0, 8).map((d, i) => (
                    <div key={i} className="flex items-center gap-3 bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2.5">
                      <span className="text-xs text-white/30 w-5 text-right">{i + 1}</span>
                      <span className="flex-1 text-sm text-white truncate">{d.name}</span>
                      <span className="text-xs text-white/40">{d.qty} ventes</span>
                      <span className="text-sm font-black text-emerald-400">{fmtK(d.revenue)}</span>
                      {d.revenueShare > 0 && (
                        <span className="text-[10px] text-white/30">{d.revenueShare.toFixed(0)}%</span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {advice.underperformers?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-3">💤 Sous-performeurs</h2>
                <div className="space-y-2">
                  {advice.underperformers.map((d, i) => (
                    <div key={i} className="bg-amber-500/5 border border-amber-500/20 rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-semibold text-white">{d.name}</span>
                        <span className="text-xs text-white/40">{d.qty} ventes · {fmtK(d.revenue)}</span>
                      </div>
                      <p className="text-xs text-amber-400/80">{d.issue}</p>
                      <p className="text-xs text-white/40 mt-0.5">→ {d.action}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Offres proposées */}
          {advice.offersProposed?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                🏷️ Offres recommandées par Nova
                <a href="/dashboard/ia/offers" className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full hover:bg-purple-500/30 transition-colors">
                  Voir les offres actives →
                </a>
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {advice.offersProposed.map((o, i) => {
                  const isDeployed = deployedOffers.has(i);
                  return (
                    <div key={i} className={`border rounded-xl p-4 transition-all ${isDeployed ? "bg-emerald-500/10 border-emerald-500/30" : "bg-purple-500/5 border-purple-500/20"}`}>
                      <div className="flex items-start justify-between gap-2 mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{OFFER_ICON[o.type] ?? "🎯"}</span>
                          <span className="font-bold text-white text-sm">{o.dish}</span>
                        </div>
                        <span className="text-xl font-black text-emerald-400">-{o.discountPercent}%</span>
                      </div>
                      <p className="text-sm text-white/70 mb-2">{o.description}</p>
                      <p className="text-xs text-white/40 mb-1">{o.rationale}</p>
                      <p className="text-xs text-emerald-400 font-semibold mb-3">📈 Impact estimé : {o.estimatedRevenueBoost}</p>

                      {isDeployed ? (
                        <div className="flex items-center gap-2 text-xs text-emerald-400 font-bold">
                          <span>✅</span> Offre déployée !
                        </div>
                      ) : (
                        <button
                          onClick={() => deployOffer(i, o)}
                          disabled={deployingOffer === i}
                          className="w-full py-2.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-sm font-bold rounded-lg transition-colors flex items-center justify-center gap-2"
                        >
                          {deployingOffer === i
                            ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Déploiement...</>
                            : "🚀 Déployer cette offre (7 jours)"}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Recommandations */}
          {advice.recommendations?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">💡 Recommandations Nova Finance</h2>
              <div className="space-y-3">
                {advice.recommendations.map((r, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-xl shrink-0">{RECO_ICON[r.type] ?? "💡"}</span>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="font-bold text-white text-sm">{r.title}</span>
                          <span className={`text-[10px] px-2 py-0.5 rounded-full border font-bold uppercase ${IMPACT_CLS[r.impact] ?? IMPACT_CLS.LOW}`}>
                            {r.impact}
                          </span>
                          <span className={`text-[10px] font-semibold ${EFFORT_CLS[r.effort] ?? ""}`}>
                            Effort : {r.effort === "EASY" ? "Facile" : r.effort === "MEDIUM" ? "Moyen" : "Complexe"}
                          </span>
                        </div>
                        <p className="text-sm text-white/60 leading-relaxed">{r.detail}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bouton relancer */}
          <div className="flex justify-center pt-2">
            <button onClick={() => { setAdvice(null); setMeta(null); }}
              className="text-sm px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white/60 rounded-xl transition-colors">
              🔄 Nouvelle analyse
            </button>
          </div>
        </div>
      )}

      {/* Empty state */}
      {!advice && !loading && !error && (
        <div className="text-center py-16 text-white/30">
          <div className="text-5xl mb-3">💹</div>
          <p className="text-sm">Configurez la période et lancez l'analyse pour voir vos KPIs et recommandations.</p>
        </div>
      )}
    </div>
  );
}
