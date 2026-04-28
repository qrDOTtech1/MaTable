"use client";
import { useEffect, useState, useMemo } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  BarChart, Bar, Cell
} from "recharts";

type Analytics = {
  revenueCents: number;
  ordersCount: number;
  avgTicketCents: number;
  topItems: Array<{ name: string; qty: number; revenueCents: number }>;
  revenueByServer: Array<{ name: string; revenueCents: number; orders: number }>;
  revenueByDay: Array<{ date: string; cents: number }>;
};

type ShoppingEntry = {
  id: string;
  estimatedBudget: number;
  realCost: number | null;
  completedAt: string | null;
  createdAt: string;
};

function fmtEur(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);

  // Shopping cost data
  const [shoppingHistory, setShoppingHistory] = useState<ShoppingEntry[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<Analytics>(`/api/pro/analytics?days=${days}`),
      api<{ history: ShoppingEntry[] }>("/api/pro/shopping-history"),
    ])
      .then(([a, s]) => {
        setAnalytics(a);
        setShoppingHistory(s.history);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  // Compute purchase cost over selected period
  const cutoff = new Date(Date.now() - parseInt(days) * 86400_000);
  const shoppingInPeriod = shoppingHistory.filter(h => h.completedAt && new Date(h.completedAt) >= cutoff);
  const totalRealCost = shoppingInPeriod.reduce((s, h) => s + (h.realCost ?? 0), 0);
  const totalEstimated = shoppingInPeriod.reduce((s, h) => s + h.estimatedBudget, 0);
  const pendingCount = shoppingHistory.filter(h => !h.completedAt).length;

  // Food cost % = real purchase cost / revenue * 100
  const revenueCents = analytics?.revenueCents ?? 0;
  const realFoodCostPct = revenueCents > 0 && totalRealCost > 0
    ? ((totalRealCost / (revenueCents / 100)) * 100)
    : null;

  // Prepare chart data
  const revenueChartData = useMemo(() => {
    if (!analytics?.revenueByDay) return [];
    return analytics.revenueByDay.map(d => ({
      date: new Date(d.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      ca: d.cents / 100,
    }));
  }, [analytics]);

  const serverRadarData = useMemo(() => {
    if (!analytics?.revenueByServer) return [];
    return analytics.revenueByServer.map(s => ({
      subject: s.name,
      A: s.revenueCents / 100,
      fullMark: Math.max(...analytics.revenueByServer.map(x => x.revenueCents / 100)) || 1
    }));
  }, [analytics]);

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">📊 Statistiques</h1>
          <p className="text-sm text-white/40 mt-1">Analyse des performances · Coûts d'achats réels</p>
        </div>
        <div className="flex items-center gap-2">
          {(["7", "30", "90"] as const).map(d => (
            <button
              key={d}
              onClick={() => setDays(d)}
              className={`px-4 py-2 rounded-xl border text-sm font-semibold transition-all ${
                days === d
                  ? "bg-orange-500/20 border-orange-500/40 text-orange-400"
                  : "bg-white/[0.03] border-white/[0.08] text-white/50 hover:text-white/80"
              }`}
            >
              {d}j
            </button>
          ))}
        </div>
      </div>

      {loading && (
        <div className="flex items-center gap-3 text-white/40 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Chargement...
        </div>
      )}

      {!loading && analytics && (
        <>
          {/* ── KPIs CA ─────────────────────────────────────────────────────── */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Chiffre d'affaires</p>
              <p className="text-2xl font-black text-emerald-400">{fmtEur(analytics.revenueCents)}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{days} jours</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Commandes</p>
              <p className="text-2xl font-black text-white">{analytics.ordersCount}</p>
              <p className="text-[10px] text-white/25 mt-0.5">{days} jours</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">Ticket moyen</p>
              <p className="text-2xl font-black text-orange-400">{fmtEur(analytics.avgTicketCents)}</p>
              <p className="text-[10px] text-white/25 mt-0.5">par commande</p>
            </div>
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
              <p className="text-xs text-white/40 mb-1">CA / jour</p>
              <p className="text-2xl font-black text-white">
                {parseInt(days) > 0 ? fmtEur(Math.round(analytics.revenueCents / parseInt(days))) : "—"}
              </p>
              <p className="text-[10px] text-white/25 mt-0.5">moyenne</p>
            </div>
          </div>

          {/* ── Graphiques (Recharts) ─────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            
            {/* Main Area Chart */}
            <div className="lg:col-span-2 bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">
                📈 Évolution du CA ({days} jours)
              </h2>
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={revenueChartData}>
                    <defs>
                      <linearGradient id="colorCA" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="date" stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#ffffff40" fontSize={10} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}€`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20', borderRadius: '12px' }}
                      itemStyle={{ color: '#10b981', fontWeight: 'bold' }}
                      formatter={(value: any) => [`${Number(value).toFixed(2)} €`, "CA"]}
                    />
                    <Area type="monotone" dataKey="ca" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorCA)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Radar Chart (Serveurs) */}
            <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6 flex flex-col">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-2 text-center">
                🌟 Performance Serveurs
              </h2>
              {serverRadarData.length > 2 ? (
                <div className="flex-1 min-h-[220px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="65%" data={serverRadarData}>
                      <PolarGrid stroke="#ffffff20" />
                      <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff60', fontSize: 10 }} />
                      <Radar name="CA" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.4} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20', borderRadius: '12px' }}
                        formatter={(value: any) => [`${Number(value).toFixed(0)} €`, "CA généré"]}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center text-white/30 text-sm p-4 text-center">
                  <span className="text-3xl mb-2">🍽️</span>
                  Pas assez de serveurs différents pour afficher un radar (min 3 requis).
                </div>
              )}
            </div>

          </div>

          {/* ── Coûts d'achats réels ─────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">
                Coûts d'achats HT · {shoppingInPeriod.length} liste{shoppingInPeriod.length !== 1 ? "s" : ""} confirmée{shoppingInPeriod.length !== 1 ? "s" : ""}
              </h2>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && (
                  <Link
                    href="/dashboard/shopping"
                    className="text-xs px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 hover:bg-orange-500/25 transition-colors"
                  >
                    {pendingCount} liste{pendingCount > 1 ? "s" : ""} en attente →
                  </Link>
                )}
                <Link
                  href="/dashboard/ia/finance"
                  className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 transition-colors"
                >
                  💹 Analyse financière →
                </Link>
              </div>
            </div>

            {shoppingInPeriod.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/[0.06] rounded-2xl p-8 text-center">
                <p className="text-white/30 text-sm">Aucun achat confirmé sur cette période.</p>
                <p className="text-white/20 text-xs mt-1">
                  Confirmez vos listes de courses pour voir le coût d'achat réel vs CA.
                </p>
                <Link href="/dashboard/shopping" className="mt-3 inline-block text-xs text-orange-400 hover:text-orange-300 transition-colors">
                  Voir les listes de courses →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <div className={`rounded-xl p-4 border ${totalRealCost > 0 ? "bg-red-500/5 border-red-500/20" : "bg-white/[0.03] border-white/[0.07]"}`}>
                  <p className="text-xs text-white/40 mb-1">Achats réels HT</p>
                  <p className={`text-2xl font-black ${totalRealCost > 0 ? "text-red-400" : "text-white/40"}`}>
                    {totalRealCost > 0 ? totalRealCost.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €" : "—"}
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5">coût réel confirmé</p>
                </div>
                <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4">
                  <p className="text-xs text-white/40 mb-1">Budget estimé</p>
                  <p className="text-2xl font-black text-white/60">
                    {totalEstimated > 0 ? totalEstimated.toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €" : "—"}
                  </p>
                  <p className="text-[10px] text-white/25 mt-0.5">prévu par Nova Stock</p>
                </div>
                {totalRealCost > 0 && totalEstimated > 0 && (
                  <div className={`rounded-xl p-4 border ${totalRealCost <= totalEstimated ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                    <p className="text-xs text-white/40 mb-1">Écart budget</p>
                    <p className={`text-2xl font-black ${totalRealCost <= totalEstimated ? "text-emerald-400" : "text-amber-400"}`}>
                      {totalRealCost <= totalEstimated ? "-" : "+"}{Math.abs(totalRealCost - totalEstimated).toLocaleString("fr-FR", { maximumFractionDigits: 0 })} €
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {totalRealCost <= totalEstimated ? "sous le budget" : "dépassement"}
                    </p>
                  </div>
                )}
                {realFoodCostPct !== null && (
                  <div className={`rounded-xl p-4 border ${realFoodCostPct > 35 ? "bg-red-500/5 border-red-500/20" : realFoodCostPct > 28 ? "bg-amber-500/5 border-amber-500/20" : "bg-emerald-500/5 border-emerald-500/20"}`}>
                    <p className="text-xs text-white/40 mb-1">Food Cost réel</p>
                    <p className={`text-2xl font-black ${realFoodCostPct > 35 ? "text-red-400" : realFoodCostPct > 28 ? "text-amber-400" : "text-emerald-400"}`}>
                      {realFoodCostPct.toFixed(1)} %
                    </p>
                    <p className="text-[10px] text-white/25 mt-0.5">
                      {realFoodCostPct > 35 ? "Au-dessus de la norme (≤35%)" : realFoodCostPct > 28 ? "Dans la norme" : "Excellent (objectif ≤30%)"}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Détail des courses confirmées */}
            {shoppingInPeriod.length > 0 && (
              <div className="mt-3 space-y-1.5">
                {shoppingInPeriod.slice(0, 5).map(h => (
                  <Link key={h.id} href={`/dashboard/shopping/${h.id}`}>
                    <div className="flex items-center gap-4 px-4 py-2.5 bg-white/[0.02] border border-white/[0.06] hover:border-white/[0.12] rounded-xl transition-all text-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shrink-0" />
                      <span className="text-white/50 shrink-0">
                        {new Date(h.completedAt!).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                      <span className="flex-1 text-white/30">Budget estimé : ~{h.estimatedBudget.toFixed(0)}€</span>
                      {h.realCost != null && (
                        <span className="font-semibold text-red-400">{h.realCost.toFixed(2)}€ réel</span>
                      )}
                    </div>
                  </Link>
                ))}
                {shoppingInPeriod.length > 5 && (
                  <Link href="/dashboard/shopping" className="block text-xs text-center text-white/30 hover:text-white/50 py-1 transition-colors">
                    + {shoppingInPeriod.length - 5} autre{shoppingInPeriod.length - 5 > 1 ? "s" : ""} liste{shoppingInPeriod.length - 5 > 1 ? "s" : ""} →
                  </Link>
                )}
              </div>
            )}
          </div>

          {/* ── Top plats + Par serveur (avec mini charts) ──────────────────────────────────────── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div>
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>🔥</span> Top 10 plats
              </h2>
              <div className="space-y-2 relative">
                {analytics.topItems.slice(0, 10).map((item, idx) => {
                  const maxQty = Math.max(...analytics.topItems.map(i => i.qty)) || 1;
                  const pct = (item.qty / maxQty) * 100;
                  return (
                    <div
                      key={item.name}
                      className="relative overflow-hidden flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3"
                    >
                      <div className="absolute left-0 top-0 bottom-0 bg-orange-500/10 pointer-events-none" style={{ width: `${pct}%` }} />
                      <span className="text-xs font-bold text-white/30 w-6 text-right shrink-0 relative z-10">
                        {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                      </span>
                      <span className="flex-1 text-sm font-semibold text-white truncate relative z-10">{item.name}</span>
                      <span className="text-xs text-white/50 shrink-0 relative z-10">{item.qty} ventes</span>
                      <span className="text-sm font-black text-orange-400 shrink-0 relative z-10">
                        {fmtEur(item.revenueCents)}
                      </span>
                    </div>
                  );
                })}
                {analytics.topItems.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-6">Aucune vente sur la période</p>
                )}
              </div>
            </div>

            <div>
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-3 flex items-center gap-2">
                <span>👥</span> Top Serveurs
              </h2>
              <div className="space-y-2">
                {analytics.revenueByServer.map((server, idx) => {
                   const maxRev = Math.max(...analytics.revenueByServer.map(s => s.revenueCents)) || 1;
                   const pct = (server.revenueCents / maxRev) * 100;
                   return (
                    <div
                      key={server.name}
                      className="relative overflow-hidden flex items-center gap-3 bg-white/[0.02] border border-white/[0.05] rounded-xl px-4 py-3"
                    >
                      <div className="absolute left-0 top-0 bottom-0 bg-emerald-500/10 pointer-events-none" style={{ width: `${pct}%` }} />
                      <span className="text-xs font-bold text-white/30 w-4 text-right shrink-0 relative z-10">{idx + 1}</span>
                      <div className="flex-1 relative z-10">
                        <p className="text-sm font-semibold text-white truncate">{server.name}</p>
                        <p className="text-[10px] text-white/40">
                          {server.orders} commande{server.orders > 1 ? "s" : ""}
                        </p>
                      </div>
                      <p className="text-sm font-black text-emerald-400 relative z-10">
                        {fmtEur(server.revenueCents)}
                      </p>
                    </div>
                  );
                })}
                {analytics.revenueByServer.length === 0 && (
                  <p className="text-white/30 text-sm text-center py-6">Aucun serveur sur la période</p>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {!loading && !analytics && (
        <div className="flex items-center justify-center h-64 text-white/30">
          <p>Aucune donnée disponible.</p>
        </div>
      )}
    </div>
  );
}
