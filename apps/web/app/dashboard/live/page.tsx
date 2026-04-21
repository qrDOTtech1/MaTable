"use client";

import { useState } from "react";
import { DashboardLayout, KanbanColumn, OrderCard } from "@/components/ui";

interface Order {
  id: string;
  tableNumber: number;
  status: "pending" | "cooking" | "served";
  items: Array<{ name: string; quantity: number; notes?: string }>;
  totalAmount: number;
  createdAt: string;
  eta?: number;
}

// Mock data
const MOCK_ORDERS: Order[] = [
  {
    id: "1",
    tableNumber: 5,
    status: "pending",
    items: [
      { name: "Burger Classique", quantity: 2 },
      { name: "Frites", quantity: 2, notes: "Sans sel" },
    ],
    totalAmount: 3400,
    createdAt: new Date(Date.now() - 5 * 60000).toISOString(),
  },
  {
    id: "2",
    tableNumber: 8,
    status: "pending",
    items: [
      { name: "Salade César", quantity: 1 },
      { name: "Eau Pétillante", quantity: 2 },
    ],
    totalAmount: 2100,
    createdAt: new Date(Date.now() - 2 * 60000).toISOString(),
  },
  {
    id: "3",
    tableNumber: 3,
    status: "cooking",
    items: [{ name: "Steak Saignant", quantity: 1 }, { name: "Légumes grillés", quantity: 1 }],
    totalAmount: 2800,
    createdAt: new Date(Date.now() - 12 * 60000).toISOString(),
    eta: 8,
  },
  {
    id: "4",
    tableNumber: 12,
    status: "cooking",
    items: [
      { name: "Pizza Quattro Formaggi", quantity: 2 },
      { name: "Tiramisu", quantity: 2 },
    ],
    totalAmount: 3600,
    createdAt: new Date(Date.now() - 10 * 60000).toISOString(),
    eta: 5,
  },
  {
    id: "5",
    tableNumber: 7,
    status: "served",
    items: [{ name: "Poisson Grillé", quantity: 1 }],
    totalAmount: 1900,
    createdAt: new Date(Date.now() - 25 * 60000).toISOString(),
  },
];

export default function LiveDashboard() {
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const pendingOrders = orders.filter((o) => o.status === "pending");
  const cookingOrders = orders.filter((o) => o.status === "cooking");
  const servedOrders = orders.filter((o) => o.status === "served");

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: orders.length },
    { id: "stats", icon: "📊", label: "Statistiques", badge: 0 },
    { id: "commandes", icon: "📋", label: "Commandes", badge: 0 },
    { id: "menu", icon: "🍽️", label: "Menu", badge: 0 },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: 0 },
    { id: "reservations", icon: "📅", label: "Réservations", badge: 0 },
  ];

  const handleMoveOrder = (orderId: string, newStatus: "pending" | "cooking" | "served") => {
    setOrders((prev) =>
      prev.map((o) => (o.id === orderId ? { ...o, status: newStatus } : o))
    );
    setSelectedOrder(null);
  };

  return (
    <DashboardLayout
      activeTabId="live"
      tabs={tabs}
      onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
      restaurantName="Restaurant La Bella Vista"
      title="Cuisine en direct"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Cuisine en Direct</h2>
          <p className="text-white/50">
            {orders.length} commande{orders.length > 1 ? "s" : ""} en cours
          </p>
        </div>

        {/* Kanban Board */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[600px]">
          {/* Column 1: Pending */}
          <KanbanColumn
            title="À préparer"
            icon="⏳"
            count={pendingOrders.length}
            color="yellow"
          >
            {pendingOrders.map((order) => (
              <OrderCard
                key={order.id}
                {...order}
                onClick={() => setSelectedOrder(order)}
                onAction={() => handleMoveOrder(order.id, "cooking")}
                dragHandle="≡"
              />
            ))}
          </KanbanColumn>

          {/* Column 2: Cooking */}
          <KanbanColumn
            title="En préparation"
            icon="👨‍🍳"
            count={cookingOrders.length}
            color="orange"
          >
            {cookingOrders.map((order) => (
              <OrderCard
                key={order.id}
                {...order}
                onClick={() => setSelectedOrder(order)}
                onAction={() => handleMoveOrder(order.id, "served")}
                dragHandle="≡"
              />
            ))}
          </KanbanColumn>

          {/* Column 3: Served */}
          <KanbanColumn
            title="À servir"
            icon="✅"
            count={servedOrders.length}
            color="emerald"
          >
            {servedOrders.map((order) => (
              <OrderCard
                key={order.id}
                {...order}
                onClick={() => setSelectedOrder(order)}
                onAction={() => handleMoveOrder(order.id, "pending")}
              />
            ))}
          </KanbanColumn>
        </div>

        {/* Order Details (optional modal/sidebar) */}
        {selectedOrder && (
          <div className="fixed bottom-0 right-0 m-4 bg-[#111] border border-white/[0.06] rounded-xl p-6 w-80 max-h-[400px] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold text-white">Table {selectedOrder.tableNumber}</h3>
              <button
                onClick={() => setSelectedOrder(null)}
                className="text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <p className="text-white/50 text-xs mb-2">Articles</p>
                <ul className="space-y-2">
                  {selectedOrder.items.map((item, idx) => (
                    <li key={idx} className="text-sm text-white/70">
                      {item.quantity}× {item.name}
                      {item.notes && <span className="text-white/40"> ({item.notes})</span>}
                    </li>
                  ))}
                </ul>
              </div>

              <div className="border-t border-white/[0.06] pt-4">
                <p className="text-white/50 text-xs mb-2">Montant</p>
                <p className="text-xl font-bold text-white">{(selectedOrder.totalAmount / 100).toFixed(2)}€</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
