"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { DashboardLayout, StatCard, Card, Select } from "@/components/ui";

type Analytics = {
  revenueCents: number;
  ordersCount: number;
  avgTicketCents: number;
  topItems: Array<{ name: string; qty: number; revenueCents: number }>;
  revenueByServer: Array<{ name: string; revenueCents: number; orders: number }>;
};

export default function AnalyticsPage() {
  const [analytics, setAnalytics] = useState<Analytics | null>(null);
  const [days, setDays] = useState("7");

  useEffect(() => {
    api<Analytics>(`/api/pro/analytics?days=${days}`)
      .then(setAnalytics)
      .catch(() => {});
  }, [days]);

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: 0 },
    { id: "stats", icon: "📊", label: "Statistiques", badge: 0 },
    { id: "commandes", icon: "📋", label: "Commandes", badge: 0 },
    { id: "menu", icon: "🍽️", label: "Menu", badge: 0 },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: 0 },
    { id: "reservations", icon: "📅", label: "Réservations", badge: 0 },
  ];

  return (
    <DashboardLayout
      activeTabId="stats"
      tabs={tabs}
      onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
      restaurantName="Restaurant"
      title="Statistiques"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Statistiques</h2>
            <p className="text-white/50">Analyse des performances</p>
          </div>
          <Select
            options={[
              { value: "7", label: "7 jours" },
              { value: "30", label: "30 jours" },
              { value: "90", label: "90 jours" },
            ]}
            value={days}
            onChange={(val) => setDays(val as string)}
          />
        </div>

        {/* KPI Cards */}
        {analytics ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <StatCard
                icon="💶"
                label="Chiffre d'affaires"
                value={`${(analytics.revenueCents / 100).toFixed(0)}€`}
                subtitle={`${days} jours`}
              />
              <StatCard
                icon="📋"
                label="Commandes"
                value={analytics.ordersCount}
                subtitle={`${days} jours`}
              />
              <StatCard
                icon="🎯"
                label="Ticket moyen"
                value={`${(analytics.avgTicketCents / 100).toFixed(2)}€`}
                subtitle={`${days} jours`}
              />
            </div>

            {/* Top Items & Revenue by Server */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Top Items */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">🔥 Top 10 plats</h3>
                <div className="space-y-2">
                  {analytics.topItems.slice(0, 10).map((item, idx) => (
                    <Card key={item.name} variant="default">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-white flex items-center gap-2">
                            <span className="text-sm">
                              {idx === 0 ? "🥇" : idx === 1 ? "🥈" : idx === 2 ? "🥉" : `#${idx + 1}`}
                            </span>
                            {item.name}
                          </p>
                          <p className="text-xs text-white/50">{item.qty} ventes</p>
                        </div>
                        <p className="text-sm font-bold text-orange-400">
                          {(item.revenueCents / 100).toFixed(2)}€
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>

              {/* Revenue by Server */}
              <div>
                <h3 className="text-lg font-bold text-white mb-4">👥 Par serveur</h3>
                <div className="space-y-2">
                  {analytics.revenueByServer.map((server) => (
                    <Card key={server.name} variant="default">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <p className="font-semibold text-white">{server.name}</p>
                          <p className="text-xs text-white/50">
                            {server.orders} commande{server.orders > 1 ? "s" : ""}
                          </p>
                        </div>
                        <p className="text-sm font-bold text-emerald-400">
                          {(server.revenueCents / 100).toFixed(2)}€
                        </p>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-96 text-white/30">
            <p className="text-lg">Chargement des statistiques...</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
