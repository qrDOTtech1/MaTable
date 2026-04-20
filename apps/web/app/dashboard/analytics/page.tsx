"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Analytics = {
  revenueCents: number;
  ordersCount: number;
  avgTicketCents: number;
  topItems: Array<{ name: string; qty: number; revenueCents: number }>;
  revenueByServer: Array<{ name: string; revenueCents: number; orders: number }>;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [days, setDays] = useState(7);

  useEffect(() => {
    api<Analytics>(`/api/pro/analytics?days=${days}`)
      .then(setAnalytics)
      .catch(() => {});
  }, [days]);

  if (!analytics) return <div>Chargement...</div>;

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Statistiques</h1>
      <div className="mb-4">
        <label className="text-sm">Période : </label>
        <select className="border rounded px-2 py-1" value={days} onChange={(e) => setDays(+e.target.value)}>
          <option value={7}>7 jours</option>
          <option value={30}>30 jours</option>
          <option value={90}>90 jours</option>
        </select>
      </div>

      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="card">
          <div className="text-sm text-slate-500">Chiffre d'affaires</div>
          <div className="text-3xl font-bold">{(analytics.revenueCents / 100).toFixed(2)} €</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Commandes</div>
          <div className="text-3xl font-bold">{analytics.ordersCount}</div>
        </div>
        <div className="card">
          <div className="text-sm text-slate-500">Ticket moyen</div>
          <div className="text-3xl font-bold">{(analytics.avgTicketCents / 100).toFixed(2)} €</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-6">
        <div>
          <h2 className="font-bold mb-3">Top 10 plats</h2>
          <div className="space-y-2">
            {analytics.topItems.map((it) => (
              <div key={it.name} className="card flex justify-between text-sm">
                <div>{it.name} ({it.qty})</div>
                <div className="font-medium">{(it.revenueCents / 100).toFixed(2)} €</div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <h2 className="font-bold mb-3">Par serveur</h2>
          <div className="space-y-2">
            {analytics.revenueByServer.map((s) => (
              <div key={s.name} className="card text-sm">
                <div className="font-medium">{s.name}</div>
                <div className="text-slate-600">{s.orders} commandes · {(s.revenueCents / 100).toFixed(2)} €</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
