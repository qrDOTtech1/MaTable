"use client";

import { useState } from "react";
import { DashboardLayout, Table, Badge, Button } from "@/components/ui";

interface Order {
  id: string;
  number: number;
  table: string | number;
  date: string;
  status: "pending" | "cooking" | "served" | "paid";
  items: string;
  total: number;
  customer?: string;
}

const MOCK_ORDERS: Order[] = [
  { id: "1", number: 1001, table: "5", date: "14:32", status: "paid", items: "2× Burger, 2× Frites", total: 3400, customer: "Table 5" },
  { id: "2", number: 1002, table: "8", date: "14:45", status: "served", items: "1× Salade, 2× Eau", total: 2100, customer: "Table 8" },
  { id: "3", number: 1003, table: "3", date: "14:52", status: "cooking", items: "1× Steak, 1× Légumes", total: 2800, customer: "Table 3" },
  { id: "4", number: 1004, table: "12", date: "15:01", status: "pending", items: "2× Pizza, 2× Tiramisu", total: 3600, customer: "Table 12" },
  { id: "5", number: 1005, table: "7", date: "15:03", status: "cooking", items: "1× Poisson Grillé", total: 1900, customer: "Table 7" },
];

export default function CommandesDashboard() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [filter, setFilter] = useState<"all" | "pending" | "cooking" | "served" | "paid">("all");

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: 0 },
    { id: "stats", icon: "📊", label: "Statistiques", badge: 0 },
    { id: "commandes", icon: "📋", label: "Commandes", badge: 0 },
    { id: "menu", icon: "🍽️", label: "Menu", badge: 0 },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: 0 },
    { id: "reservations", icon: "📅", label: "Réservations", badge: 0 },
  ];

  const filteredOrders =
    filter === "all" ? orders : orders.filter((order) => order.status === filter);

  const statusConfig = {
    pending: { badge: "pending", icon: "⏳" },
    cooking: { badge: "cooking", icon: "👨‍🍳" },
    served: { badge: "served", icon: "✅" },
    paid: { badge: "served", icon: "💳" },
  };

  return (
    <DashboardLayout
      activeTabId="commandes"
      tabs={tabs}
      onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
      restaurantName="Restaurant La Bella Vista"
      title="Commandes"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Commandes</h2>
          <p className="text-white/50">{filteredOrders.length} résultat(s)</p>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2">
          {["all", "pending", "cooking", "served", "paid"].map((status) => (
            <button
              key={status}
              onClick={() => setFilter(status as any)}
              className={`px-4 py-2 rounded-lg whitespace-nowrap font-medium transition-all ${
                filter === status
                  ? "bg-orange-500 text-white"
                  : "bg-white/5 text-white/50 hover:bg-white/10 hover:text-white/70"
              }`}
            >
              {status === "all"
                ? "Toutes"
                : status === "pending"
                  ? "⏳ À préparer"
                  : status === "cooking"
                    ? "👨‍🍳 En préparation"
                    : status === "served"
                      ? "✅ Servies"
                      : "💳 Payées"}
            </button>
          ))}
        </div>

        {/* Orders Table */}
        <Table
          columns={[
            { header: "#", key: "number", width: "10%", render: (value) => `#${value}` },
            { header: "Table", key: "table", width: "12%" },
            { header: "Heure", key: "date", width: "12%" },
            {
              header: "Articles",
              key: "items",
              width: "35%",
              render: (value) => <span className="text-white/60 text-sm">{value}</span>,
            },
            {
              header: "Montant",
              key: "total",
              width: "13%",
              render: (value) => <span className="font-semibold text-orange-400">{(value / 100).toFixed(2)}€</span>,
            },
            {
              header: "Statut",
              key: "status",
              width: "18%",
              render: (value) => {
                const config = statusConfig[value as keyof typeof statusConfig];
                return <Badge variant={config.badge as any}>{config.icon} {value}</Badge>;
              },
            },
          ]}
          data={filteredOrders}
        />
      </div>
    </DashboardLayout>
  );
}
