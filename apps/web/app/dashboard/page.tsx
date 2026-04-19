"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL } from "@/lib/api";

type Order = {
  id: string;
  status: "PENDING" | "COOKING" | "SERVED" | "PAID" | "CANCELLED";
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  totalCents: number;
  createdAt: string;
  table: { number: number };
};

const COLS: Order["status"][] = ["PENDING", "COOKING", "SERVED"];
const LABELS: Record<Order["status"], string> = {
  PENDING: "Reçues",
  COOKING: "En préparation",
  SERVED: "Servies",
  PAID: "Payées",
  CANCELLED: "Annulées",
};

export default function LivePage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  useEffect(() => {
    api<{ restaurant: { id: string } }>(`/api/pro/me`)
      .then((r) => setRestaurantId(r.restaurant.id))
      .catch(() => (window.location.href = "/login"));
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

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Cuisine — temps réel</h1>
      <div className="grid grid-cols-3 gap-4">
        {COLS.map((col) => (
          <div key={col}>
            <h2 className="font-semibold mb-2">{LABELS[col]}</h2>
            <div className="space-y-2">
              {orders
                .filter((o) => o.status === col)
                .map((o) => (
                  <div key={o.id} className="card">
                    <div className="flex justify-between items-center mb-2">
                      <div className="font-bold">Table {o.table.number}</div>
                      <div className="text-xs text-slate-500">
                        {new Date(o.createdAt).toLocaleTimeString()}
                      </div>
                    </div>
                    <ul className="text-sm space-y-1">
                      {o.items.map((it, i) => (
                        <li key={i}>
                          {it.quantity}× {it.name}
                        </li>
                      ))}
                    </ul>
                    <div className="text-sm font-medium mt-2">
                      Total : {(o.totalCents / 100).toFixed(2)} €
                    </div>
                    <button className="btn-primary w-full mt-3" onClick={() => advance(o)}>
                      {col === "PENDING"
                        ? "Passer en cuisson"
                        : col === "COOKING"
                        ? "Marquer servi"
                        : "Marquer payé"}
                    </button>
                  </div>
                ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
