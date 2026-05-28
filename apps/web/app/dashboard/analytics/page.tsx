"use client";
import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer,
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  BarChart, Bar, Cell, ComposedChart, Line, CartesianGrid, Legend,
  PieChart, Pie
} from "recharts";

type Analytics = {
  revenueCents: number;
  tipsCents: number;
  ordersCount: number;
  avgTicketCents: number;
  itemsSold: number;
  topItems: Array<{ name: string; qty: number; revenueCents: number }>;
  topCategories: Array<{ name: string; qty: number; revenueCents: number }>;
  revenueByServer: Array<{ name: string; revenueCents: number; orders: number }>;
  revenueByDay: Array<{ date: string; cents: number }>;
  reservations: { count: number; covers: number; pending: number; confirmed: number; seated: number; honored: number; noShows: number; cancelled: number };
  reservationsByDay: Array<{ date: string; reservations: number; covers: number }>;
  reservationsByZone: Array<{ zone: string; reservations: number; covers: number }>;
  reviews: { count: number; avgRating: number };
  loyalty: { customers: number; points: number; visits: number; activeOffers: number; redemptions: number };
};

type ShoppingEntry = { id: string; estimatedBudget: number; realCost: number | null; completedAt: string | null; createdAt: string };

const COLORS = ["#f97316", "#10b981", "#38bdf8", "#a78bfa", "#f43f5e", "#eab308", "#14b8a6"];

function fmtEur(cents: number) {
  return (cents / 100).toLocaleString("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " €";
}

function fmtMoney(value: number) {
  return value.toLocaleString("fr-FR", { maximumFractionDigits: 0 }) + " €";
}

function pct(value: number) {
  return Number.isFinite(value) ? `${value.toFixed(1)} %` : "—";
}

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [days, setDays] = useState("30");
  const [loading, setLoading] = useState(true);
  const [shoppingHistory, setShoppingHistory] = useState<ShoppingEntry[]>([]);

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api<Analytics>(`/api/pro/analytics?days=${days}`),
      api<{ history: ShoppingEntry[] }>("/api/pro/shopping-history"),
    ])
      .then(([a, s]) => { setAnalytics(a); setShoppingHistory(s.history); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [days]);

  const cutoff = new Date(Date.now() - parseInt(days) * 86400_000);
  const shoppingInPeriod = shoppingHistory.filter(h => h.completedAt && new Date(h.completedAt) >= cutoff);
  const totalRealCost = shoppingInPeriod.reduce((s, h) => s + (h.realCost ?? 0), 0);
  const totalEstimated = shoppingInPeriod.reduce((s, h) => s + h.estimatedBudget, 0);
  const pendingCount = shoppingHistory.filter(h => !h.completedAt).length;
  const revenueCents = analytics?.revenueCents ?? 0;
  const realFoodCostPct = revenueCents > 0 && totalRealCost > 0 ? ((totalRealCost / (revenueCents / 100)) * 100) : null;
  const grossMargin = revenueCents / 100 - totalRealCost;
  const grossMarginPct = revenueCents > 0 ? (grossMargin / (revenueCents / 100)) * 100 : 0;
  const noShowRate = analytics?.reservations.count ? (analytics.reservations.noShows / analytics.reservations.count) * 100 : 0;
  const reservationConversion = analytics?.reservations.count ? ((analytics.reservations.seated + analytics.reservations.honored) / analytics.reservations.count) * 100 : 0;
  const visitsPerCustomer = analytics?.loyalty.customers ? analytics.loyalty.visits / analytics.loyalty.customers : 0;

  const revenueChartData = useMemo(() => {
    const revenue = new Map((analytics?.revenueByDay ?? []).map(d => [d.date, d.cents]));
    const resas = new Map((analytics?.reservationsByDay ?? []).map(d => [d.date, d]));
    const dates = Array.from(new Set([...revenue.keys(), ...resas.keys()])).sort();
    return dates.map(date => ({
      date,
      label: new Date(date).toLocaleDateString("fr-FR", { day: "numeric", month: "short" }),
      ca: (revenue.get(date) ?? 0) / 100,
      reservations: resas.get(date)?.reservations ?? 0,
      covers: resas.get(date)?.covers ?? 0,
    }));
  }, [analytics]);

  const serverRadarData = useMemo(() => {
    if (!analytics?.revenueByServer) return [];
    const max = Math.max(...analytics.revenueByServer.map(x => x.revenueCents / 100), 1);
    return analytics.revenueByServer.slice(0, 8).map(s => ({ subject: s.name, A: s.revenueCents / 100, fullMark: max }));
  }, [analytics]);

  const statusData = analytics ? [
    { name: "Confirmées", value: analytics.reservations.confirmed + analytics.reservations.seated + analytics.reservations.honored },
    { name: "En attente", value: analytics.reservations.pending },
    { name: "No-show", value: analytics.reservations.noShows },
    { name: "Annulées", value: analytics.reservations.cancelled },
  ].filter(x => x.value > 0) : [];

  return (
    <div className="space-y-8 max-w-[1800px]">
      <div className="relative overflow-hidden rounded-[2rem] border border-orange-500/20 bg-[radial-gradient(circle_at_10%_10%,rgba(249,115,22,0.22),transparent_35%),radial-gradient(circle_at_90%_20%,rgba(16,185,129,0.15),transparent_30%),#080808] p-8">
        <div className="flex items-start justify-between gap-6 flex-wrap relative z-10">
          <div>
            <p className="text-xs uppercase tracking-[0.35em] text-orange-300 font-black mb-3">Command Center</p>
            <h1 className="text-4xl md:text-6xl font-black text-white tracking-tight">Toutes vos stats</h1>
            <p className="text-white/50 mt-3 max-w-2xl">Vue complète : chiffre, marges, achats, réservations, fidélité, avis, serveurs, plats et zones.</p>
          </div>
          <div className="flex items-center gap-2 bg-black/30 border border-white/10 rounded-2xl p-2">
            {(["7", "30", "90"] as const).map(d => (
              <button key={d} onClick={() => setDays(d)} className={`px-5 py-3 rounded-xl text-sm font-black transition-all ${days === d ? "bg-orange-500 text-white" : "text-white/45 hover:text-white hover:bg-white/5"}`}>{d}j</button>
            ))}
          </div>
        </div>
      </div>

      {loading && <div className="flex items-center gap-3 text-white/40 text-sm"><div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />Chargement...</div>}

      {!loading && analytics && (
        <>
          <section className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-3">
            <Kpi label="CA" value={fmtEur(analytics.revenueCents)} sub={`${days} jours`} tone="emerald" />
            <Kpi label="Commandes" value={analytics.ordersCount} sub={`${analytics.itemsSold} articles`} />
            <Kpi label="Ticket moyen" value={fmtEur(analytics.avgTicketCents)} sub="par commande" tone="orange" />
            <Kpi label="Pourboires" value={fmtEur(analytics.tipsCents)} sub="tips inclus CA" tone="sky" />
            <Kpi label="Food cost" value={realFoodCostPct === null ? "—" : pct(realFoodCostPct)} sub="achats réels" tone={realFoodCostPct && realFoodCostPct > 35 ? "red" : "emerald"} />
            <Kpi label="Marge brute" value={fmtMoney(grossMargin)} sub={pct(grossMarginPct)} tone="emerald" />
            <Kpi label="Réservations" value={analytics.reservations.count} sub={`${analytics.reservations.covers} couverts`} tone="violet" />
            <Kpi label="Fidélité" value={analytics.loyalty.customers} sub={`${analytics.loyalty.points.toLocaleString("fr-FR")} pts`} tone="rose" />
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[1.35fr_0.65fr] gap-6">
            <Panel title={`📈 CA + Réservations (${days} jours)`}>
              <div className="h-[390px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={revenueChartData}>
                    <defs><linearGradient id="caMassif" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.35}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
                    <CartesianGrid stroke="#ffffff10" />
                    <XAxis dataKey="label" stroke="#ffffff45" fontSize={11} tickLine={false} />
                    <YAxis yAxisId="left" stroke="#10b981" fontSize={11} tickFormatter={(v) => `${v}€`} />
                    <YAxis yAxisId="right" orientation="right" stroke="#f97316" fontSize={11} />
                    <Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20', borderRadius: '14px' }} />
                    <Legend />
                    <Area yAxisId="left" type="monotone" dataKey="ca" name="CA" stroke="#10b981" strokeWidth={3} fill="url(#caMassif)" />
                    <Bar yAxisId="right" dataKey="reservations" name="Réservations" fill="#f97316" radius={[8,8,0,0]} />
                    <Line yAxisId="right" dataKey="covers" name="Couverts" stroke="#38bdf8" strokeWidth={2} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </Panel>

            <Panel title="🧠 Synthèse opérateur">
              <div className="space-y-3">
                <Insight label="Taux présence réservation" value={pct(reservationConversion)} good={reservationConversion >= 80} />
                <Insight label="No-show" value={pct(noShowRate)} good={noShowRate <= 8} />
                <Insight label="Avis moyen" value={analytics.reviews.avgRating ? `${analytics.reviews.avgRating.toFixed(1)}/5` : "—"} good={analytics.reviews.avgRating >= 4.5} />
                <Insight label="Visites / client fidélité" value={visitsPerCustomer.toFixed(1)} good={visitsPerCustomer >= 2} />
                <Insight label="Récompenses utilisées" value={analytics.loyalty.redemptions} good={analytics.loyalty.redemptions > 0} />
              </div>
            </Panel>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <Panel title="🥧 Réservations par statut">
              <div className="h-[260px]"><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={statusData} dataKey="value" nameKey="name" outerRadius={95} label>{statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}</Pie><Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20' }} /></PieChart></ResponsiveContainer></div>
            </Panel>
            <Panel title="🗺️ Zones les plus demandées">
              <BarList data={analytics.reservationsByZone.map(z => ({ name: z.zone, value: z.reservations, sub: `${z.covers} couverts` }))} color="bg-sky-500/20" />
            </Panel>
            <Panel title="💎 Fidélité client">
              <div className="grid grid-cols-2 gap-3">
                <Mini label="Clients" value={analytics.loyalty.customers} />
                <Mini label="Points" value={analytics.loyalty.points.toLocaleString("fr-FR")} />
                <Mini label="Offres actives" value={analytics.loyalty.activeOffers} />
                <Mini label="Utilisations" value={analytics.loyalty.redemptions} />
              </div>
              <Link href="/dashboard/loyalty" className="mt-4 inline-block text-xs text-orange-300 hover:text-orange-200">Piloter la fidélité →</Link>
            </Panel>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-[0.9fr_1.1fr] gap-6">
            <Panel title="🌟 Radar serveurs">
              {serverRadarData.length > 2 ? <div className="h-[330px]"><ResponsiveContainer width="100%" height="100%"><RadarChart data={serverRadarData}><PolarGrid stroke="#ffffff20" /><PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff75', fontSize: 11 }} /><Radar name="CA" dataKey="A" stroke="#f97316" fill="#f97316" fillOpacity={0.35} /><Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20' }} formatter={(value: any) => [`${Number(value).toFixed(0)} €`, "CA"]} /></RadarChart></ResponsiveContainer></div> : <Empty text="Pas assez de serveurs différents pour afficher un radar." />}
            </Panel>
            <Panel title="🍽️ CA par catégorie">
              <div className="h-[330px]"><ResponsiveContainer width="100%" height="100%"><BarChart data={analytics.topCategories}><XAxis dataKey="name" stroke="#ffffff45" fontSize={10} /><YAxis stroke="#ffffff45" fontSize={10} tickFormatter={(v) => `${v}€`} /><Tooltip contentStyle={{ backgroundColor: '#111', borderColor: '#ffffff20' }} formatter={(v: any) => [`${Number(v / 100).toFixed(0)} €`, "CA"]} /><Bar dataKey="revenueCents" fill="#10b981" radius={[8,8,0,0]} /></BarChart></ResponsiveContainer></div>
            </Panel>
          </section>

          <section className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            <Panel title="🔥 Top 10 plats">
              <BarList data={analytics.topItems.slice(0, 10).map(i => ({ name: i.name, value: i.qty, sub: fmtEur(i.revenueCents) }))} color="bg-orange-500/20" />
            </Panel>
            <Panel title="👥 Top serveurs">
              <BarList data={analytics.revenueByServer.map(s => ({ name: s.name, value: s.orders, sub: fmtEur(s.revenueCents) }))} color="bg-emerald-500/20" />
            </Panel>
          </section>

          <section>
            <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-widest">Coûts d'achats HT · {shoppingInPeriod.length} liste{shoppingInPeriod.length !== 1 ? "s" : ""} confirmée{shoppingInPeriod.length !== 1 ? "s" : ""}</h2>
              <div className="flex items-center gap-2">
                {pendingCount > 0 && <Link href="/dashboard/shopping" className="text-xs px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/25 text-orange-400 hover:bg-orange-500/25">{pendingCount} liste{pendingCount > 1 ? "s" : ""} en attente →</Link>}
                <Link href="/dashboard/ia/finance" className="text-xs px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25">💹 Analyse financière →</Link>
              </div>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Kpi label="Achats réels HT" value={totalRealCost ? fmtMoney(totalRealCost) : "—"} sub="confirmé" tone="red" />
              <Kpi label="Budget estimé" value={totalEstimated ? fmtMoney(totalEstimated) : "—"} sub="Nova Stock" />
              <Kpi label="Écart budget" value={(totalRealCost || totalEstimated) ? `${totalRealCost <= totalEstimated ? "-" : "+"}${Math.abs(totalRealCost - totalEstimated).toFixed(0)} €` : "—"} sub={totalRealCost <= totalEstimated ? "sous budget" : "dépassement"} tone={totalRealCost <= totalEstimated ? "emerald" : "red"} />
              <Kpi label="Food Cost réel" value={realFoodCostPct === null ? "—" : pct(realFoodCostPct)} sub="objectif ≤ 30-35%" tone={realFoodCostPct && realFoodCostPct > 35 ? "red" : "emerald"} />
            </div>
          </section>
        </>
      )}
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-6"><h2 className="text-sm font-bold text-white/60 uppercase tracking-widest mb-4">{title}</h2>{children}</div>;
}

function Kpi({ label, value, sub, tone = "white" }: { label: string; value: React.ReactNode; sub?: string; tone?: "white" | "emerald" | "orange" | "sky" | "red" | "violet" | "rose" }) {
  const colors: Record<string, string> = { white: "text-white", emerald: "text-emerald-400", orange: "text-orange-400", sky: "text-sky-400", red: "text-red-400", violet: "text-violet-400", rose: "text-rose-400" };
  return <div className="bg-white/[0.03] border border-white/[0.07] rounded-xl p-4"><p className="text-xs text-white/40 mb-1">{label}</p><p className={`text-2xl font-black ${colors[tone]}`}>{value}</p>{sub && <p className="text-[10px] text-white/25 mt-0.5">{sub}</p>}</div>;
}

function Mini({ label, value }: { label: string; value: React.ReactNode }) {
  return <div className="rounded-xl bg-white/[0.04] border border-white/[0.06] p-4"><p className="text-xs text-white/35 mb-1">{label}</p><p className="text-xl font-black text-white">{value}</p></div>;
}

function Insight({ label, value, good }: { label: string; value: React.ReactNode; good: boolean }) {
  return <div className="flex items-center justify-between rounded-xl bg-white/[0.04] border border-white/[0.06] p-3"><span className="text-sm text-white/55">{label}</span><span className={`font-black ${good ? "text-emerald-400" : "text-orange-400"}`}>{value}</span></div>;
}

function Empty({ text }: { text: string }) {
  return <div className="h-[220px] flex items-center justify-center text-center text-white/30 text-sm">{text}</div>;
}

function BarList({ data, color }: { data: Array<{ name: string; value: number; sub?: string }>; color: string }) {
  const max = Math.max(...data.map(d => d.value), 1);
  if (data.length === 0) return <Empty text="Aucune donnée sur cette période." />;
  return <div className="space-y-2">{data.map((d, idx) => <div key={`${d.name}-${idx}`} className="relative overflow-hidden rounded-xl border border-white/[0.06] bg-white/[0.025] px-4 py-3"><div className={`absolute inset-y-0 left-0 ${color}`} style={{ width: `${(d.value / max) * 100}%` }} /><div className="relative z-10 flex items-center gap-3"><span className="text-xs font-black text-white/30 w-7">#{idx + 1}</span><span className="flex-1 truncate text-sm font-bold text-white">{d.name}</span><span className="text-xs text-white/45">{d.value}</span>{d.sub && <span className="text-sm font-black text-orange-300">{d.sub}</span>}</div></div>)}</div>;
}
