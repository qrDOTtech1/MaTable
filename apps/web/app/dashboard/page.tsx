"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL, redirectOn401 } from "@/lib/api";
import { DashboardLayout, KanbanColumn, OrderCard, Button } from "@/components/ui";

type Order = {
  id: string;
  status: "PENDING" | "COOKING" | "SERVED" | "PAID" | "CANCELLED";
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  totalCents: number;
  createdAt: string;
  table: { number: number };
};

const COLS: Order["status"][] = ["PENDING", "COOKING", "SERVED"];

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Restaurant");

  useEffect(() => {
    api<{ restaurant: { id: string; name: string } }>(`/api/pro/me`)
      .then((r) => {
        setRestaurantId(r.restaurant.id);
        setRestaurantName(r.restaurant.name);
      })
      .catch(redirectOn401);
  }, []);

  useEffect(() => {
    api<{ orders: Order[] }>(`/api/pro/orders`).then((r) => setOrders(r.orders));
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    const socket: Socket = io(API_URL, { auth: { restaurantId } });
    socket.on("order:new", () => {
      api<{ orders: Order[] }>(`/api/pro/orders`).then((r) => setOrders(r.orders));
    });
    socket.on("order:paid", () => {
      api<{ orders: Order[] }>(`/api/pro/orders`).then((r) => setOrders(r.orders));
    });
    return () => void socket.disconnect();
  }, [restaurantId]);

  async function advance(o: Order) {
    const next: Order["status"] =
      o.status === "PENDING" ? "COOKING" : o.status === "COOKING" ? "SERVED" : "PAID";
    await api(`/api/pro/orders/${o.id}/status`, {
      method: "POST",
      body: JSON.stringify({ status: next }),
    });
    const r = await api<{ orders: Order[] }>(`/api/pro/orders`);
    setOrders(r.orders);
  }

  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const cookingOrders = orders.filter((o) => o.status === "COOKING");
  const servedOrders = orders.filter((o) => o.status === "SERVED");

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: orders.length },
    { id: "stats", icon: "📊", label: "Statistiques", badge: 0 },
    { id: "commandes", icon: "📋", label: "Commandes", badge: 0 },
    { id: "menu", icon: "🍽️", label: "Menu", badge: 0 },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: 0 },
    { id: "reservations", icon: "📅", label: "Réservations", badge: 0 },
  ];

  return (
    <DashboardLayout
      activeTabId="live"
      tabs={tabs}
      onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
      restaurantName={restaurantName}
      title="Cuisine en direct"
    >
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h2 className="text-2xl font-bold text-white mb-2">Cuisine en direct</h2>
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
              <div key={order.id} className="space-y-2">
                <div className="rounded-lg border border-yellow-500/20 bg-yellow-500/5 p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg text-yellow-400">Table {order.table.number}</p>
                      <p className="text-white/40 text-xs">
                        {new Date(order.createdAt).toLocaleTimeString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2">
                        <span className="text-white/70 text-sm truncate flex-1">
                          {item.quantity}× {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/80">
                      {(order.totalCents / 100).toFixed(2)}€
                    </span>
                    <button
                      onClick={() => advance(order)}
                      className="px-2 py-1 rounded text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
                    >
                      👨‍🍳 Cuire
                    </button>
                  </div>
                </div>
              </div>
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
              <div key={order.id} className="space-y-2">
                <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg text-orange-400">Table {order.table.number}</p>
                      <p className="text-white/40 text-xs">
                        {new Date(order.createdAt).toLocaleTimeString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2">
                        <span className="text-white/70 text-sm truncate flex-1">
                          {item.quantity}× {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/80">
                      {(order.totalCents / 100).toFixed(2)}€
                    </span>
                    <button
                      onClick={() => advance(order)}
                      className="px-2 py-1 rounded text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
                    >
                      ✅ Servir
                    </button>
                  </div>
                </div>
              </div>
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
              <div key={order.id} className="space-y-2">
                <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-4 hover:shadow-md transition-all">
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="font-bold text-lg text-emerald-400">Table {order.table.number}</p>
                      <p className="text-white/40 text-xs">
                        {new Date(order.createdAt).toLocaleTimeString("fr-FR")}
                      </p>
                    </div>
                  </div>
                  <div className="mb-3 space-y-1">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-start justify-between gap-2">
                        <span className="text-white/70 text-sm truncate flex-1">
                          {item.quantity}× {item.name}
                        </span>
                      </div>
                    ))}
                  </div>
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-white/80">
                      {(order.totalCents / 100).toFixed(2)}€
                    </span>
                    <button
                      onClick={() => advance(order)}
                      className="px-2 py-1 rounded text-white/50 hover:text-white hover:bg-white/5 transition-all text-xs font-medium"
                    >
                      💳 Payé
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </KanbanColumn>
        </div>
      </div>
    </DashboardLayout>
  );
}
