"use client";

import { DashboardLayout, StatCard, Table } from "@/components/ui";

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
  avgTime: number;
  satisfaction: number;
}

const MOCK_STATS: DailyStats[] = [
  { date: "Lun 17/04", orders: 45, revenue: 1250, avgTime: 22, satisfaction: 4.8 },
  { date: "Mar 18/04", orders: 52, revenue: 1480, avgTime: 20, satisfaction: 4.9 },
  { date: "Mer 19/04", orders: 38, revenue: 1100, avgTime: 25, satisfaction: 4.6 },
  { date: "Jeu 20/04", orders: 61, revenue: 1720, avgTime: 19, satisfaction: 4.9 },
  { date: "Ven 21/04", orders: 78, revenue: 2150, avgTime: 21, satisfaction: 4.7 },
];

export default function StatsDashboard() {
  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: 0 },
    { id: "stats", icon: "📊", label: "Statistiques", badge: 0 },
    { id: "commandes", icon: "📋", label: "Commandes", badge: 0 },
    { id: "menu", icon: "🍽️", label: "Menu", badge: 0 },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: 0 },
    { id: "reservations", icon: "📅", label: "Réservations", badge: 0 },
  ];

  const totalOrders = MOCK_STATS.reduce((sum, s) => sum + s.orders, 0);
  const totalRevenue = MOCK_STATS.reduce((sum, s) => sum + s.revenue, 0);
  const avgOrderTime = Math.round(
    MOCK_STATS.reduce((sum, s) => sum + s.avgTime, 0) / MOCK_STATS.length
  );
  const avgSatisfaction = (
    MOCK_STATS.reduce((sum, s) => sum + s.satisfaction, 0) / MOCK_STATS.length
  ).toFixed(1);

  return (
    <DashboardLayout
      activeTabId="stats"
      tabs={tabs}
      onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
      restaurantName="Restaurant La Bella Vista"
      title="Statistiques"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Statistiques</h2>
          <p className="text-white/50">Performance des 7 derniers jours</p>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon="📋"
            label="Commandes"
            value={totalOrders}
            trend={{ direction: "up", percentage: 12 }}
            subtitle="7 derniers jours"
          />
          <StatCard
            icon="💶"
            label="Chiffre d'affaires"
            value={`${(totalRevenue / 100).toFixed(0)}€`}
            trend={{ direction: "up", percentage: 8 }}
            subtitle="7 derniers jours"
          />
          <StatCard
            icon="⏱️"
            label="Temps moyen"
            value={`${avgOrderTime}m`}
            trend={{ direction: "down", percentage: 3 }}
            subtitle="Plus rapide = mieux"
          />
          <StatCard
            icon="⭐"
            label="Satisfaction"
            value={avgSatisfaction}
            trend={{ direction: "up", percentage: 2 }}
            subtitle="Sur 5 étoiles"
          />
        </div>

        {/* Historical Data Table */}
        <div>
          <h3 className="text-lg font-bold text-white mb-4">Historique quotidien</h3>
          <Table
            columns={[
              { header: "Date", key: "date", width: "20%" },
              {
                header: "Commandes",
                key: "orders",
                width: "20%",
                render: (value) => <span className="font-semibold">{value}</span>,
              },
              {
                header: "Chiffre",
                key: "revenue",
                width: "20%",
                render: (value) => <span className="text-orange-400 font-semibold">{(value / 100).toFixed(2)}€</span>,
              },
              {
                header: "Temps moy",
                key: "avgTime",
                width: "20%",
                render: (value) => <span>{value}min</span>,
              },
              {
                header: "Note",
                key: "satisfaction",
                width: "20%",
                render: (value) => (
                  <div className="flex items-center gap-2">
                    <span>⭐ {value}</span>
                  </div>
                ),
              },
            ]}
            data={MOCK_STATS}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}
