"use client";

import { useEffect, useMemo, useState } from "react";
import { api } from "@/lib/api";
import { DashboardLayout, StatCard, Table } from "@/components/ui";

interface DailyStats {
  date: string;
  orders: number;
  revenueCents: number;
  reservations: number;
  covers: number;
}

interface OverviewStats {
  orders: { count: number; revenueCents: number; avgTicketCents: number };
  reservations: { count: number; covers: number; honored: number; noShows: number; cancelled: number };
  loyalty: { customers: number; points: number; visits: number; activeOffers: number; redemptions: number };
  reviews: { count: number; avgRating: number };
  daily: DailyStats[];
}

const fallbackStats: OverviewStats = {
  orders: { count: 0, revenueCents: 0, avgTicketCents: 0 },
  reservations: { count: 0, covers: 0, honored: 0, noShows: 0, cancelled: 0 },
  loyalty: { customers: 0, points: 0, visits: 0, activeOffers: 0, redemptions: 0 },
  reviews: { count: 0, avgRating: 0 },
  daily: [],
};

function euro(cents: number) {
  return `${(cents / 100).toFixed(0)}€`;
}

export default function StatsDashboard() {
  const [stats, setStats] = useState<OverviewStats>(fallbackStats);
  const [loading, setLoading] = useState(true);
  const [days, setDays] = useState(30);

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: 0 },
    { id: "stats", icon: "📊", label: "Statistiques", badge: 0 },
    { id: "commandes", icon: "📋", label: "Commandes", badge: 0 },
    { id: "menu", icon: "🍽️", label: "Menu", badge: 0 },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: 0 },
    { id: "reservations", icon: "📅", label: "Réservations", badge: 0 },
  ];

  useEffect(() => {
    setLoading(true);
    api<OverviewStats>(`/api/pro/stats/overview?days=${days}`)
      .then(setStats)
      .catch(() => setStats(fallbackStats))
      .finally(() => setLoading(false));
  }, [days]);

  const reservationRate = stats.reservations.count
    ? Math.round((stats.reservations.honored / stats.reservations.count) * 100)
    : 0;

  const loyaltyEngagement = stats.loyalty.customers
    ? Math.round((stats.loyalty.visits / stats.loyalty.customers) * 10) / 10
    : 0;

  const tableData = useMemo(() => stats.daily.map((d) => ({
    ...d,
    label: new Date(d.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "2-digit" }),
  })), [stats.daily]);

  return (
    <DashboardLayout
      activeTabId="stats"
      tabs={tabs}
      onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
      restaurantName="MaTable Pro"
      title="Statistiques"
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Statistiques</h2>
            <p className="text-white/50">Commandes, réservations, fidélité et satisfaction client.</p>
          </div>
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-2 text-sm text-white"
          >
            <option value={7} className="bg-[#1a1a1a]">7 derniers jours</option>
            <option value={30} className="bg-[#1a1a1a]">30 derniers jours</option>
            <option value={90} className="bg-[#1a1a1a]">90 derniers jours</option>
          </select>
        </div>

        {loading && <p className="text-sm text-white/35">Chargement des statistiques…</p>}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon="📋" label="Commandes" value={stats.orders.count} trend={{ direction: "up", percentage: 0 }} subtitle={`${euro(stats.orders.revenueCents)} encaissés`} />
          <StatCard icon="💶" label="Ticket moyen" value={euro(stats.orders.avgTicketCents)} trend={{ direction: "neutral", percentage: 0 }} subtitle="Commandes payées" />
          <StatCard icon="⭐" label="Satisfaction" value={stats.reviews.avgRating ? stats.reviews.avgRating.toFixed(1) : "—"} trend={{ direction: "up", percentage: 0 }} subtitle={`${stats.reviews.count} avis vérifiés`} />
          <StatCard icon="📅" label="Réservations" value={stats.reservations.count} trend={{ direction: "up", percentage: 0 }} subtitle={`${stats.reservations.covers} couverts réservés`} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <div className="rounded-xl border border-white/[0.06] bg-[#111] p-6">
            <h3 className="text-lg font-black text-white mb-4">📅 Réservations</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Honorées / installées" value={stats.reservations.honored} />
              <Info label="Taux présence" value={`${reservationRate}%`} />
              <Info label="No-show" value={stats.reservations.noShows} danger />
              <Info label="Annulées" value={stats.reservations.cancelled} />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#111] p-6">
            <h3 className="text-lg font-black text-white mb-4">💎 Fidélité</h3>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <Info label="Clients fidélité" value={stats.loyalty.customers} />
              <Info label="Points en circulation" value={stats.loyalty.points.toLocaleString("fr-FR")} />
              <Info label="Visites / client" value={loyaltyEngagement} />
              <Info label="Offres actives" value={stats.loyalty.activeOffers} />
            </div>
          </div>

          <div className="rounded-xl border border-white/[0.06] bg-[#111] p-6">
            <h3 className="text-lg font-black text-white mb-4">🎁 Récompenses</h3>
            <p className="text-4xl font-black text-orange-400">{stats.loyalty.redemptions}</p>
            <p className="text-sm text-white/40 mt-2">offres utilisées par les clients fidélité.</p>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-bold text-white mb-4">Historique quotidien</h3>
          <Table
            columns={[
              { header: "Date", key: "label", width: "20%" },
              { header: "Commandes", key: "orders", width: "20%", render: (value) => <span className="font-semibold">{value}</span> },
              { header: "Chiffre", key: "revenueCents", width: "20%", render: (value) => <span className="text-orange-400 font-semibold">{euro(value as number)}</span> },
              { header: "Réservations", key: "reservations", width: "20%", render: (value) => <span>{value}</span> },
              { header: "Couverts", key: "covers", width: "20%", render: (value) => <span>{value}</span> },
            ]}
            data={tableData}
          />
        </div>
      </div>
    </DashboardLayout>
  );
}

function Info({ label, value, danger = false }: { label: string; value: string | number; danger?: boolean }) {
  return (
    <div className="rounded-lg bg-white/[0.04] border border-white/[0.06] p-3">
      <p className="text-white/35 text-xs mb-1">{label}</p>
      <p className={`text-xl font-black ${danger ? "text-red-300" : "text-white"}`}>{value}</p>
    </div>
  );
}
