"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";

type OrderItem = { menuItemId: string; name: string; quantity: number; priceCents: number };
type Order = {
  id: string;
  status: "PENDING" | "COOKING";
  items: OrderItem[];
  totalCents: number;
  createdAt: string;
  table: { number: number; zone?: string };
  session?: { id: string; server?: { name: string } | null } | null;
};
type Stats = { pending: number; cooking: number; served: number; paid: number; total: number };

export default function CuisineDashPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [orders, setOrders] = useState<Order[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const cuisineFetch = useCallback(async <T,>(path: string, opts?: RequestInit): Promise<T> => {
    const token = localStorage.getItem("cuisine_token");
    if (!token) { router.push(`/${slug}/cuisine`); throw new Error("No token"); }
    const res = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
    });
    if (res.status === 401) {
      localStorage.removeItem("cuisine_token");
      router.push(`/${slug}/cuisine`);
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [slug, router]);

  const loadData = useCallback(async () => {
    try {
      const [ordersRes, statsRes] = await Promise.all([
        cuisineFetch<{ orders: Order[] }>("/api/cuisine/orders"),
        cuisineFetch<Stats>("/api/cuisine/stats"),
      ]);
      setOrders(ordersRes.orders);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [cuisineFetch]);

  useEffect(() => {
    const token = localStorage.getItem("cuisine_token");
    if (!token) { router.push(`/${slug}/cuisine`); return; }
    loadData();
    const interval = setInterval(loadData, 8000);
    return () => clearInterval(interval);
  }, [loadData, router, slug]);

  const markCooking = async (orderId: string) => {
    setActing(orderId);
    try {
      await cuisineFetch(`/api/cuisine/orders/${orderId}/cooking`, { method: "POST" });
      await loadData();
    } finally { setActing(null); }
  };

  const markServed = async (orderId: string) => {
    setActing(orderId);
    try {
      await cuisineFetch(`/api/cuisine/orders/${orderId}/served`, { method: "POST" });
      await loadData();
    } finally { setActing(null); }
  };

  const pending = orders.filter((o) => o.status === "PENDING");
  const cooking = orders.filter((o) => o.status === "COOKING");

  // Elapsed time helper
  const elapsed = (iso: string) => {
    const mins = Math.floor((Date.now() - new Date(iso).getTime()) / 60000);
    if (mins < 1) return "< 1 min";
    if (mins < 60) return `${mins} min`;
    return `${Math.floor(mins / 60)}h${String(mins % 60).padStart(2, "0")}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 h-14 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-sm">
            🍳
          </div>
          <h1 className="text-lg font-bold">Cuisine</h1>
          {stats && (
            <div className="flex items-center gap-2 ml-2">
              {stats.pending > 0 && (
                <span className="text-xs bg-red-500/20 text-red-400 border border-red-500/30 px-2 py-0.5 rounded-full font-bold">
                  {stats.pending} en attente
                </span>
              )}
              {stats.cooking > 0 && (
                <span className="text-xs bg-amber-500/20 text-amber-400 border border-amber-500/30 px-2 py-0.5 rounded-full font-bold">
                  {stats.cooking} en cuisson
                </span>
              )}
            </div>
          )}
        </div>
        <button
          onClick={() => { localStorage.removeItem("cuisine_token"); router.push(`/${slug}/cuisine`); }}
          className="text-xs text-white/30 hover:text-white/60 transition-colors"
        >
          Quitter
        </button>
      </div>

      <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-0 md:gap-0 divide-y md:divide-y-0 md:divide-x divide-white/[0.06]">

        {/* Colonne PENDING */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <span className="text-xs text-white/40 uppercase tracking-wider font-bold">En attente ({pending.length})</span>
          </div>

          {pending.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 text-center">
              <p className="text-3xl mb-2">✅</p>
              <p className="text-white/30 text-sm">Aucune commande en attente</p>
            </div>
          ) : (
            pending.map((order) => (
              <div key={order.id} className="rounded-2xl bg-red-500/5 border border-red-500/20 overflow-hidden">
                <div className="px-4 py-3 bg-red-500/10 border-b border-red-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-red-400 text-lg">Table {order.table.number}</span>
                    {order.table.zone && <span className="text-xs text-white/30 bg-white/[0.04] px-2 py-0.5 rounded">{order.table.zone}</span>}
                    {order.session?.server && <span className="text-xs text-white/30">· {order.session.server.name}</span>}
                  </div>
                  <span className="text-xs text-red-400/70 font-mono">{elapsed(order.createdAt)}</span>
                </div>
                <div className="px-4 py-3 space-y-1">
                  {(order.items as OrderItem[]).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center text-xs font-bold text-white/70">
                        {item.quantity}
                      </span>
                      <span className="text-white/80">{item.name}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-3">
                  <button
                    onClick={() => markCooking(order.id)}
                    disabled={acting === order.id}
                    className="w-full py-2.5 rounded-xl bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
                  >
                    {acting === order.id ? "…" : "🍳 Démarrer la cuisson"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Colonne COOKING */}
        <div className="p-4 space-y-3">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
            <span className="text-xs text-white/40 uppercase tracking-wider font-bold">En cuisson ({cooking.length})</span>
          </div>

          {cooking.length === 0 ? (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-8 text-center">
              <p className="text-3xl mb-2">🍽️</p>
              <p className="text-white/30 text-sm">Aucun plat en cuisson</p>
            </div>
          ) : (
            cooking.map((order) => (
              <div key={order.id} className="rounded-2xl bg-amber-500/5 border border-amber-500/20 overflow-hidden">
                <div className="px-4 py-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-black text-amber-400 text-lg">Table {order.table.number}</span>
                    {order.table.zone && <span className="text-xs text-white/30 bg-white/[0.04] px-2 py-0.5 rounded">{order.table.zone}</span>}
                    {order.session?.server && <span className="text-xs text-white/30">· {order.session.server.name}</span>}
                  </div>
                  <span className="text-xs text-amber-400/70 font-mono">{elapsed(order.createdAt)}</span>
                </div>
                <div className="px-4 py-3 space-y-1">
                  {(order.items as OrderItem[]).map((item, i) => (
                    <div key={i} className="flex items-center gap-2 text-sm">
                      <span className="w-6 h-6 rounded bg-white/[0.06] flex items-center justify-center text-xs font-bold text-white/70">
                        {item.quantity}
                      </span>
                      <span className="text-white/80">{item.name}</span>
                    </div>
                  ))}
                </div>
                <div className="px-4 pb-3">
                  <button
                    onClick={() => markServed(order.id)}
                    disabled={acting === order.id}
                    className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 text-white font-bold text-sm transition-all"
                  >
                    {acting === order.id ? "…" : "✓ Prêt — Envoyer en salle"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Footer stats */}
      {stats && (
        <div className="border-t border-white/[0.06] px-4 py-3 flex items-center gap-6 text-xs text-white/30">
          <span>Aujourd'hui : <strong className="text-white/60">{stats.total}</strong> cmds</span>
          <span>Servies : <strong className="text-emerald-400">{stats.served}</strong></span>
          <span>Payées : <strong className="text-white/50">{stats.paid}</strong></span>
          <span className="ml-auto text-white/20">Actualisation auto 8s</span>
        </div>
      )}
    </div>
  );
}
