"use client";
import { useState } from "react";
import { api } from "@/lib/api";

type Alert = { item: string; issue: string; urgency: string };
type Reorder = { item: string; currentStock: number; suggestedOrder: number; reason: string };
type TopSeller = { item: string; qtySold: number; trend: string };
type DeadItem = { item: string; qtySold: number; suggestion: string };
type Forecast = { item: string; estimatedDemand: number };
type Analysis = {
  summary: string;
  alerts: Alert[];
  reorderSuggestions: Reorder[];
  topSellers: TopSeller[];
  deadStock: DeadItem[];
  forecastNextWeek: Forecast[];
  costSavings: string;
};

const URGENCY_CLS: Record<string, string> = {
  HIGH: "bg-red-500/20 text-red-400 border-red-500/30",
  MEDIUM: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  LOW: "bg-white/10 text-white/40 border-white/10",
};

const TREND_ICON: Record<string, string> = { UP: "📈", STABLE: "➡️", DOWN: "📉" };

export default function NovaStockPage() {
  const [loading, setLoading] = useState(false);
  const [analysis, setAnalysis] = useState<Analysis | null>(null);
  const [meta, setMeta] = useState<{ ordersAnalyzed: number; menuItemsCount: number; period: string } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const runAnalysis = async () => {
    setLoading(true); setError(null);
    try {
      const r = await api<{ analysis: Analysis; meta: any }>("/api/pro/ia/stock-analysis", { method: "POST" });
      setAnalysis(r.analysis);
      setMeta(r.meta);
    } catch (e: any) {
      if (e.message?.includes("403")) setError("Abonnement PRO_IA requis pour cette fonctionnalite.");
      else if (e.message?.includes("503")) setError("Cle API IA non configuree. Contactez l'admin.");
      else setError("Erreur: " + e.message);
    } finally { setLoading(false); }
  };

  return (
    <div className="p-8 max-w-5xl">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">📦</span> Nova Stock IA
          </h1>
          <p className="text-sm text-white/40 mt-1">Analyse intelligente de votre stock et previsions de demande</p>
        </div>
        <button onClick={runAnalysis} disabled={loading}
          className="px-6 py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors flex items-center gap-2">
          {loading ? (
            <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyse en cours...</>
          ) : "Lancer l'analyse IA"}
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 mb-6 text-red-400 text-sm">{error}</div>
      )}

      {analysis && (
        <div className="space-y-6">
          {/* Summary */}
          <div className="bg-gradient-to-r from-orange-500/10 to-amber-500/10 border border-orange-500/20 rounded-2xl p-6">
            <p className="text-white font-medium">{analysis.summary}</p>
            {meta && (
              <p className="text-xs text-white/40 mt-2">
                {meta.ordersAnalyzed} commandes analysees | {meta.menuItemsCount} plats | Periode: {meta.period}
              </p>
            )}
          </div>

          {/* Alerts */}
          {analysis.alerts?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Alertes</h2>
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

          {/* Reorder suggestions */}
          {analysis.reorderSuggestions?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Reapprovisionnement suggere</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {analysis.reorderSuggestions.map((r, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-bold text-white text-sm">{r.item}</span>
                      <span className="text-xs text-orange-400 font-bold">+{r.suggestedOrder} unites</span>
                    </div>
                    <p className="text-xs text-white/40">Stock actuel: {r.currentStock}</p>
                    <p className="text-xs text-white/50 mt-1">{r.reason}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top sellers */}
            {analysis.topSellers?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-3">Meilleures ventes</h2>
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

            {/* Dead stock */}
            {analysis.deadStock?.length > 0 && (
              <div>
                <h2 className="text-lg font-bold text-white mb-3">Stock dormant</h2>
                <div className="space-y-2">
                  {analysis.deadStock.map((d, i) => (
                    <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-lg px-4 py-2">
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

          {/* Forecast */}
          {analysis.forecastNextWeek?.length > 0 && (
            <div>
              <h2 className="text-lg font-bold text-white mb-3">Previsions semaine prochaine</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {analysis.forecastNextWeek.map((f, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-3 text-center">
                    <p className="text-sm text-white font-medium truncate">{f.item}</p>
                    <p className="text-2xl font-black text-orange-400 mt-1">{f.estimatedDemand}</p>
                    <p className="text-[10px] text-white/30">demande estimee</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Cost savings */}
          {analysis.costSavings && (
            <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-5">
              <h2 className="text-sm font-bold text-emerald-400 mb-1">Conseil economies</h2>
              <p className="text-sm text-white/70">{analysis.costSavings}</p>
            </div>
          )}
        </div>
      )}

      {!analysis && !loading && !error && (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">📦</div>
          <h2 className="text-xl font-bold text-white mb-2">Analysez votre stock intelligemment</h2>
          <p className="text-sm text-white/40 max-w-md mx-auto">
            Nova Stock IA analyse vos 14 derniers jours de commandes, detecte les ruptures, 
            prevoit la demande et suggere les reapprovisionnements optimaux.
          </p>
        </div>
      )}
    </div>
  );
}
