"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL, redirectOn401 } from "@/lib/api";
import { DashboardLayout, KanbanColumn } from "@/components/ui";

type Order = {
  id: string;
  status: "PENDING" | "COOKING" | "SERVED" | "PAID" | "CANCELLED";
  items: Array<{ name: string; quantity: number; priceCents: number }>;
  totalCents: number;
  createdAt: string;
  table: { number: number };
};

// ── Subtle audio ping via Web Audio API (no external file needed) ─────────────
function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 880;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const prevPendingRef = useRef(0);

  const loadOrders = useCallback(async () => {
    const r = await api<{ orders: Order[] }>(`/api/pro/orders`);
    setOrders(r.orders);
    return r.orders;
  }, []);

  // ── Init ───────────────────────────────────────────────────────────────────
  useEffect(() => {
    api<{ restaurant: { id: string; name: string } }>(`/api/pro/me`)
      .then((r) => { setRestaurantId(r.restaurant.id); setRestaurantName(r.restaurant.name); })
      .catch(redirectOn401);
    loadOrders();
  }, [loadOrders]);

  // ── Browser tab title — shows pending count ────────────────────────────────
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const cookingOrders = orders.filter((o) => o.status === "COOKING");
  const servedOrders  = orders.filter((o) => o.status === "SERVED");

  useEffect(() => {
    const pending = pendingOrders.length;
    document.title = pending > 0
      ? `(${pending}) 🔴 Cuisine — ${restaurantName}`
      : `Cuisine — ${restaurantName}`;
    return () => { document.title = "MaTable Pro"; };
  }, [pendingOrders.length, restaurantName]);

  // ── Notification + sound on new order ─────────────────────────────────────
  useEffect(() => {
    const pending = pendingOrders.length;
    if (prevPendingRef.current < pending) {
      playPing();
      const newCount = pending - prevPendingRef.current;
      const msg = `🔔 ${newCount} nouvelle${newCount > 1 ? "s" : ""} commande${newCount > 1 ? "s" : ""} !`;
      setToast(msg);
      setTimeout(() => setToast(null), 4000);
      if (notifEnabled && "Notification" in window && Notification.permission === "granted") {
        new Notification("Nouvelle commande", { body: msg, icon: "/favicon.svg" });
      }
    }
    prevPendingRef.current = pending;
  }, [pendingOrders.length, notifEnabled]);

  // ── Socket.io ─────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    const socket: Socket = io(API_URL, { auth: { restaurantId } });
    socket.on("order:new",     () => loadOrders());
    socket.on("order:updated", () => loadOrders());
    socket.on("order:paid",    () => loadOrders());
    return () => void socket.disconnect();
  }, [restaurantId, loadOrders]);

  // ── Enable push notifications ──────────────────────────────────────────────
  async function enableNotifs() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifEnabled(perm === "granted");
  }

  async function advance(o: Order) {
    const next: Order["status"] =
      o.status === "PENDING" ? "COOKING" : o.status === "COOKING" ? "SERVED" : "PAID";
    await api(`/api/pro/orders/${o.id}/status`, {
      method: "POST",
      body: JSON.stringify({ status: next }),
    });
    loadOrders();
  }

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: pendingOrders.length || undefined },
    { id: "stats", icon: "📊", label: "Statistiques", badge: undefined },
    { id: "commandes", icon: "📋", label: "Commandes", badge: undefined },
    { id: "menu", icon: "🍽️", label: "Menu", badge: undefined },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: undefined },
    { id: "reservations", icon: "📅", label: "Réservations", badge: undefined },
  ];

  return (
    <DashboardLayout activeTabId="live" tabs={tabs} onTabChange={() => {}} restaurantName={restaurantName} title="Cuisine en direct">
      {/* Toast notification */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-orange-500 text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm animate-bounce">
          {toast}
        </div>
      )}

      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Cuisine en direct</h2>
            <p className="text-white/40 text-sm">
              {orders.length} commande{orders.length !== 1 ? "s" : ""} active{orders.length !== 1 ? "s" : ""}
              {pendingOrders.length > 0 && (
                <span className="ml-2 text-yellow-400 font-semibold">
                  · {pendingOrders.length} en attente
                </span>
              )}
            </p>
          </div>
          <button
            onClick={enableNotifs}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              notifEnabled
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {notifEnabled ? "🔔 Notifs actives" : "🔕 Activer notifs"}
          </button>
        </div>

        {/* Kanban */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
          <KanbanColumn title="À préparer" icon="⏳" count={pendingOrders.length} color="yellow">
            {pendingOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-yellow-500/20 bg-yellow-500/5 p-4 hover:bg-yellow-500/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-bold text-lg text-yellow-400">Table {order.table.number}</p>
                    <p className="text-white/30 text-xs">{new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold animate-pulse">NOUVEAU</span>
                </div>
                <div className="mb-3 space-y-0.5">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-white/70 text-sm">{item.quantity}× {item.name}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white/70">{(order.totalCents / 100).toFixed(2)}€</span>
                  <button onClick={() => advance(order)} className="px-3 py-1.5 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 text-xs font-semibold transition-all">
                    👨‍🍳 Cuire
                  </button>
                </div>
              </div>
            ))}
          </KanbanColumn>

          <KanbanColumn title="En préparation" icon="👨‍🍳" count={cookingOrders.length} color="orange">
            {cookingOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 hover:bg-orange-500/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-bold text-lg text-orange-400">Table {order.table.number}</p>
                  <p className="text-white/30 text-xs">{new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="mb-3 space-y-0.5">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-white/70 text-sm">{item.quantity}× {item.name}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white/70">{(order.totalCents / 100).toFixed(2)}€</span>
                  <button onClick={() => advance(order)} className="px-3 py-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/30 text-orange-300 text-xs font-semibold transition-all">
                    ✅ Servir
                  </button>
                </div>
              </div>
            ))}
          </KanbanColumn>

          <KanbanColumn title="À servir" icon="✅" count={servedOrders.length} color="emerald">
            {servedOrders.map((order) => (
              <div key={order.id} className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 hover:bg-emerald-500/10 transition-all">
                <div className="flex items-start justify-between mb-3">
                  <p className="font-bold text-lg text-emerald-400">Table {order.table.number}</p>
                  <p className="text-white/30 text-xs">{new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
                </div>
                <div className="mb-3 space-y-0.5">
                  {order.items.map((item, i) => (
                    <p key={i} className="text-white/70 text-sm">{item.quantity}× {item.name}</p>
                  ))}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white/70">{(order.totalCents / 100).toFixed(2)}€</span>
                  <button onClick={() => advance(order)} className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 text-xs font-semibold transition-all">
                    💳 Encaisser
                  </button>
                </div>
              </div>
            ))}
          </KanbanColumn>
        </div>
      </div>
    </DashboardLayout>
  );
}
