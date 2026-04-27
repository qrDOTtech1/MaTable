"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL, redirectOn401 } from "@/lib/api";

// ─── Types ────────────────────────────────────────────────────────────────────
type OrderItem = { menuItemId?: string; name: string; quantity: number; priceCents: number };
type Order = {
  id: string;
  status: "PENDING" | "COOKING" | "SERVED" | "PAID" | "CANCELLED";
  items: OrderItem[];
  totalCents: number;
  createdAt: string;
  notes?: string | null;
  table: { number: number };
};
type MenuItem = { id: string; name: string; category: string | null; priceCents: number; available: boolean };

// ── Subtle audio ping via Web Audio API ───────────────────────────────────────
function playPing() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.frequency.value = 880; osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
    osc.start(ctx.currentTime); osc.stop(ctx.currentTime + 0.4);
  } catch {}
}

const fmt = (c: number) => (c / 100).toFixed(2) + "€";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function DashboardPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [notifEnabled, setNotifEnabled] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const prevPendingRef = useRef(0);

  // ── Rupture panel ─────────────────────────────────────────────────────────
  const [showRupture, setShowRupture] = useState(false);
  const [ruptureSearch, setRuptureSearch] = useState("");
  const [togglingId, setTogglingId] = useState<string | null>(null);

  // ── Add-items modal ───────────────────────────────────────────────────────
  const [addModal, setAddModal] = useState<Order | null>(null);
  const [addCart, setAddCart] = useState<Record<string, number>>({});
  const [addMenuSearch, setAddMenuSearch] = useState("");
  const [addMenuCat, setAddMenuCat] = useState("all");
  const [addSaving, setAddSaving] = useState(false);

  // ─── Data loaders ──────────────────────────────────────────────────────────
  const loadOrders = useCallback(async () => {
    const r = await api<{ orders: Order[] }>("/api/pro/orders");
    setOrders(r.orders);
    return r.orders;
  }, []);

  const loadMenu = useCallback(async () => {
    const r = await api<{ items: MenuItem[] }>("/api/pro/menu");
    setMenuItems(r.items);
  }, []);

  useEffect(() => {
    api<{ restaurant: { id: string; name: string } }>("/api/pro/me")
      .then((r) => { setRestaurantId(r.restaurant.id); setRestaurantName(r.restaurant.name); })
      .catch(redirectOn401);
    loadOrders();
    loadMenu();
  }, [loadOrders, loadMenu]);

  // ── Tab title + pending count ──────────────────────────────────────────────
  const pendingOrders = orders.filter((o) => o.status === "PENDING");
  const cookingOrders = orders.filter((o) => o.status === "COOKING");
  const servedOrders  = orders.filter((o) => o.status === "SERVED");

  useEffect(() => {
    const n = pendingOrders.length;
    document.title = n > 0 ? `(${n}) 🔴 Cuisine — ${restaurantName}` : `Cuisine — ${restaurantName}`;
    return () => { document.title = "MaTable Pro"; };
  }, [pendingOrders.length, restaurantName]);

  // ── Sound + notification on new order ─────────────────────────────────────
  useEffect(() => {
    const n = pendingOrders.length;
    if (prevPendingRef.current < n) {
      playPing();
      const diff = n - prevPendingRef.current;
      const msg = `🔔 ${diff} nouvelle${diff > 1 ? "s" : ""} commande${diff > 1 ? "s" : ""} !`;
      setToast(msg); setTimeout(() => setToast(null), 4000);
      if (notifEnabled && "Notification" in window && Notification.permission === "granted") {
        new Notification("Nouvelle commande", { body: msg, icon: "/favicon.svg" });
      }
    }
    prevPendingRef.current = n;
  }, [pendingOrders.length, notifEnabled]);

  // ── Socket.io ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!restaurantId) return;
    const socket: Socket = io(API_URL, { auth: { restaurantId } });
    socket.on("order:new",     () => loadOrders());
    socket.on("order:updated", () => loadOrders());
    socket.on("order:paid",    () => loadOrders());
    socket.on("menu:availability_changed", (d: any) => {
      setMenuItems((prev) => prev.map((m) => m.id === d.itemId ? { ...m, available: d.available } : m));
    });
    return () => void socket.disconnect();
  }, [restaurantId, loadOrders]);

  // ─── Actions ──────────────────────────────────────────────────────────────
  async function advance(o: Order) {
    const next = o.status === "PENDING" ? "COOKING" : o.status === "COOKING" ? "SERVED" : "PAID";
    await api(`/api/pro/orders/${o.id}/status`, { method: "POST", body: JSON.stringify({ status: next }) });
    loadOrders();
  }

  async function toggleAvailable(id: string) {
    setTogglingId(id);
    try {
      const r = await api<{ available: boolean }>(`/api/pro/menu/${id}/toggle-available`, { method: "PATCH" });
      setMenuItems((prev) => prev.map((m) => m.id === id ? { ...m, available: r.available } : m));
    } finally {
      setTogglingId(null);
    }
  }

  function openAddModal(order: Order) {
    setAddModal(order);
    setAddCart({});
    setAddMenuSearch("");
    setAddMenuCat("all");
  }

  async function confirmAddItems() {
    if (!addModal) return;
    const toAdd = Object.entries(addCart)
      .filter(([, q]) => q > 0)
      .map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
    if (toAdd.length === 0) return;
    setAddSaving(true);
    try {
      await api(`/api/pro/orders/${addModal.id}/items`, {
        method: "PATCH",
        body: JSON.stringify({ add: toAdd }),
      });
      setAddModal(null);
      loadOrders();
    } catch {
      alert("Erreur lors de l'ajout.");
    } finally {
      setAddSaving(false);
    }
  }

  async function enableNotifs() {
    if (!("Notification" in window)) return;
    const perm = await Notification.requestPermission();
    setNotifEnabled(perm === "granted");
  }

  // ─── Computed ─────────────────────────────────────────────────────────────
  const outOfStock = menuItems.filter((m) => !m.available);
  const availableItems = menuItems.filter((m) => m.available);
  const menuCats = Array.from(new Set(menuItems.map((m) => m.category ?? "Autre"))).sort();

  const ruptureFiltered = menuItems.filter((m) => {
    if (ruptureSearch && !m.name.toLowerCase().includes(ruptureSearch.toLowerCase())) return false;
    return true;
  });

  const addMenuFiltered = availableItems.filter((m) => {
    if (addMenuCat !== "all" && m.category !== addMenuCat) return false;
    if (addMenuSearch && !m.name.toLowerCase().includes(addMenuSearch.toLowerCase())) return false;
    return true;
  });
  const addCartTotal = Object.entries(addCart).reduce((s, [id, q]) => {
    const m = menuItems.find((mi) => mi.id === id);
    return s + (m?.priceCents ?? 0) * q;
  }, 0);
  const addCartCount = Object.values(addCart).reduce((s, q) => s + q, 0);

  // ─── Order card shared ────────────────────────────────────────────────────
  function OrderCard({ order, color }: { order: Order; color: "yellow" | "orange" | "emerald" }) {
    const btnLabel = color === "yellow" ? "👨‍🍳 Cuire" : color === "orange" ? "✅ Servir" : "💳 Encaisser";
    const editable = order.status === "PENDING" || order.status === "COOKING";

    const cls = {
      yellow:  { border: "border-yellow-500/20",  bg: "bg-yellow-500/5",  hover: "hover:bg-yellow-500/10",  name: "text-yellow-400",  btn: "bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300" },
      orange:  { border: "border-orange-500/20",  bg: "bg-orange-500/5",  hover: "hover:bg-orange-500/10",  name: "text-orange-400",  btn: "bg-orange-500/20 hover:bg-orange-500/30 text-orange-300" },
      emerald: { border: "border-emerald-500/20", bg: "bg-emerald-500/5", hover: "hover:bg-emerald-500/10", name: "text-emerald-400", btn: "bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300" },
    }[color];

    return (
      <div className={`rounded-xl border ${cls.border} ${cls.bg} ${cls.hover} transition-all`}>
        <div className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div>
              <p className={`font-bold text-lg ${cls.name}`}>Table {order.table.number}</p>
              <p className="text-white/30 text-xs">{new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</p>
            </div>
            {color === "yellow" && <span className="text-[10px] px-2 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-bold animate-pulse">NOUVEAU</span>}
          </div>

          <div className="mb-3 space-y-0.5">
            {order.items.map((item, i) => (
              <p key={i} className="text-white/70 text-sm">{item.quantity}× {item.name}</p>
            ))}
          </div>

          {order.notes && (
            <p className="text-xs text-amber-400/80 bg-amber-500/10 border border-amber-500/20 rounded-lg px-3 py-1.5 mb-3">
              📝 {order.notes}
            </p>
          )}

          <div className="flex items-center justify-between gap-2 flex-wrap">
            <span className="text-sm font-bold text-white/70">{fmt(order.totalCents)}</span>
            <div className="flex items-center gap-1.5">
              {editable && (
                <button
                  onClick={() => openAddModal(order)}
                  className="px-2.5 py-1.5 rounded-lg bg-white/[0.06] border border-white/10 text-white/40 hover:text-white/70 text-xs font-semibold transition-all"
                  title="Ajouter des articles"
                >
                  ➕ Ajouter
                </button>
              )}
              <button
                onClick={() => advance(order)}
                className={`px-3 py-1.5 rounded-lg ${cls.btn} text-xs font-semibold transition-all`}
              >
                {btnLabel}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  return (
    <div className="space-y-4">
      {/* Toast */}
      {toast && (
        <div className="fixed top-4 right-4 z-[100] bg-orange-500 text-white px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm animate-bounce">
          {toast}
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-bold text-white">Cuisine en direct</h2>
          <p className="text-white/40 text-sm">
            {orders.length} commande{orders.length !== 1 ? "s" : ""} active{orders.length !== 1 ? "s" : ""}
            {pendingOrders.length > 0 && (
              <span className="ml-2 text-yellow-400 font-semibold">· {pendingOrders.length} en attente</span>
            )}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {/* Bouton Ruptures */}
          <button
            onClick={() => setShowRupture(true)}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all flex items-center gap-1.5 ${
              outOfStock.length > 0
                ? "bg-red-500/15 border-red-500/30 text-red-300 animate-pulse"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/60"
            }`}
          >
            🚫 Ruptures{outOfStock.length > 0 && <span className="w-4 h-4 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">{outOfStock.length}</span>}
          </button>
          <button
            onClick={enableNotifs}
            className={`text-xs px-3 py-1.5 rounded-lg border transition-all ${
              notifEnabled
                ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                : "bg-white/5 border-white/10 text-white/40 hover:text-white/70"
            }`}
          >
            {notifEnabled ? "🔔 Notifs" : "🔕 Notifs"}
          </button>
        </div>
      </div>

      {/* Kanban */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 min-h-[500px]">
        {/* À préparer */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⏳</span>
            <h3 className="font-bold text-white/80">À préparer</h3>
            {pendingOrders.length > 0 && (
              <span className="ml-auto w-6 h-6 rounded-full bg-yellow-500/20 text-yellow-300 text-xs font-bold flex items-center justify-center">{pendingOrders.length}</span>
            )}
          </div>
          {pendingOrders.length === 0 ? (
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-8 text-center text-white/20 text-sm">Aucune commande</div>
          ) : (
            <div className="space-y-3">
              {pendingOrders.map((o) => <OrderCard key={o.id} order={o} color="yellow" />)}
            </div>
          )}
        </div>

        {/* En préparation */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">👨‍🍳</span>
            <h3 className="font-bold text-white/80">En préparation</h3>
            {cookingOrders.length > 0 && (
              <span className="ml-auto w-6 h-6 rounded-full bg-orange-500/20 text-orange-300 text-xs font-bold flex items-center justify-center">{cookingOrders.length}</span>
            )}
          </div>
          {cookingOrders.length === 0 ? (
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-8 text-center text-white/20 text-sm">Aucune commande</div>
          ) : (
            <div className="space-y-3">
              {cookingOrders.map((o) => <OrderCard key={o.id} order={o} color="orange" />)}
            </div>
          )}
        </div>

        {/* À servir */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">✅</span>
            <h3 className="font-bold text-white/80">À servir</h3>
            {servedOrders.length > 0 && (
              <span className="ml-auto w-6 h-6 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold flex items-center justify-center">{servedOrders.length}</span>
            )}
          </div>
          {servedOrders.length === 0 ? (
            <div className="rounded-xl border border-white/[0.05] bg-white/[0.01] p-8 text-center text-white/20 text-sm">Aucune commande</div>
          ) : (
            <div className="space-y-3">
              {servedOrders.map((o) => <OrderCard key={o.id} order={o} color="emerald" />)}
            </div>
          )}
        </div>
      </div>

      {/* ── Rupture Panel (slide-in from right) ─────────────────────────────── */}
      {showRupture && (
        <div className="fixed inset-0 z-50 flex">
          {/* Backdrop */}
          <div className="flex-1 bg-black/60 backdrop-blur-sm" onClick={() => setShowRupture(false)} />
          {/* Panel */}
          <div className="w-80 bg-[#111] border-l border-white/10 flex flex-col h-full overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <div>
                <h2 className="font-black text-white text-base">🚫 Disponibilités menu</h2>
                <p className="text-xs text-white/40 mt-0.5">
                  {outOfStock.length > 0
                    ? <span className="text-red-400">{outOfStock.length} plat{outOfStock.length > 1 ? "s" : ""} en rupture</span>
                    : <span className="text-emerald-400">Tout est disponible</span>}
                </p>
              </div>
              <button onClick={() => setShowRupture(false)} className="w-7 h-7 rounded-full bg-white/5 text-white/40 hover:text-white text-sm flex items-center justify-center">✕</button>
            </div>

            {/* Ruptures actives en haut */}
            {outOfStock.length > 0 && (
              <div className="px-4 py-3 bg-red-500/5 border-b border-red-500/15">
                <p className="text-[10px] font-bold text-red-400/70 uppercase tracking-wider mb-2">En rupture</p>
                <div className="space-y-1.5">
                  {outOfStock.map((m) => (
                    <button
                      key={m.id}
                      onClick={() => toggleAvailable(m.id)}
                      disabled={togglingId === m.id}
                      className="w-full flex items-center justify-between px-3 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-left hover:bg-red-500/20 transition-all disabled:opacity-40"
                    >
                      <span className="text-sm text-red-300 font-semibold truncate">{m.name}</span>
                      <span className="text-[10px] text-red-400/70 ml-2 shrink-0">
                        {togglingId === m.id ? "…" : "Remettre dispo →"}
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Recherche */}
            <div className="px-4 py-3 border-b border-white/[0.06]">
              <input
                value={ruptureSearch}
                onChange={(e) => setRuptureSearch(e.target.value)}
                placeholder="Rechercher un plat…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500"
              />
            </div>

            {/* Liste complète */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {ruptureFiltered.map((m) => (
                <button
                  key={m.id}
                  onClick={() => toggleAvailable(m.id)}
                  disabled={togglingId === m.id}
                  className={`w-full flex items-center justify-between px-5 py-3 text-left transition-all disabled:opacity-40 ${
                    m.available ? "hover:bg-white/[0.03]" : "bg-red-500/5"
                  }`}
                >
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${m.available ? "bg-emerald-500" : "bg-red-500 animate-pulse"}`} />
                    <span className={`text-sm truncate ${m.available ? "text-white/70" : "text-red-300 line-through"}`}>{m.name}</span>
                    {m.category && <span className="text-[10px] text-white/20 shrink-0 hidden sm:block">{m.category}</span>}
                  </div>
                  <span className="text-xs ml-3 shrink-0">
                    {togglingId === m.id
                      ? <span className="w-3.5 h-3.5 border border-white/30 border-t-white rounded-full animate-spin block" />
                      : m.available
                      ? <span className="text-white/20 hover:text-red-400">🚫</span>
                      : <span className="text-emerald-400">✓ Remettre</span>}
                  </span>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ── Add Items Modal ─────────────────────────────────────────────────── */}
      {addModal && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={(e) => e.target === e.currentTarget && setAddModal(null)}
        >
          <div className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden">
            {/* Header */}
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between shrink-0">
              <div>
                <h2 className="font-black text-white text-base">➕ Ajouter des articles</h2>
                <p className="text-xs text-white/40 mt-0.5">Table {addModal.table.number} · commande en cours</p>
              </div>
              <button onClick={() => setAddModal(null)} className="w-7 h-7 rounded-full bg-white/5 text-white/40 hover:text-white text-sm flex items-center justify-center">✕</button>
            </div>

            {/* Filters */}
            <div className="px-4 py-3 border-b border-white/[0.06] space-y-2 shrink-0">
              <input
                value={addMenuSearch}
                onChange={(e) => setAddMenuSearch(e.target.value)}
                placeholder="Rechercher…"
                className="w-full bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-orange-500"
              />
              <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                <button
                  onClick={() => setAddMenuCat("all")}
                  className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${addMenuCat === "all" ? "bg-orange-500 text-white" : "bg-white/[0.04] text-white/50 hover:text-white/70"}`}
                >Tout</button>
                {menuCats.map((c) => (
                  <button key={c} onClick={() => setAddMenuCat(c)}
                    className={`shrink-0 px-3 py-1 rounded-lg text-xs font-semibold transition-all ${addMenuCat === c ? "bg-orange-500 text-white" : "bg-white/[0.04] text-white/50 hover:text-white/70"}`}
                  >{c}</button>
                ))}
              </div>
            </div>

            {/* Items list */}
            <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
              {addMenuFiltered.map((m) => {
                const qty = addCart[m.id] ?? 0;
                return (
                  <div key={m.id} className="px-4 py-3 flex items-center gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-white font-medium truncate">{m.name}</p>
                      <p className="text-xs text-orange-400 font-bold">{fmt(m.priceCents)}</p>
                    </div>
                    {qty > 0 ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => setAddCart((c) => ({ ...c, [m.id]: Math.max(0, qty - 1) }))}
                          className="w-7 h-7 rounded-full bg-white/[0.06] border border-white/10 text-white text-sm font-bold hover:bg-white/10 transition-all">−</button>
                        <span className="text-sm font-black text-orange-400 w-5 text-center">{qty}</span>
                        <button onClick={() => setAddCart((c) => ({ ...c, [m.id]: qty + 1 }))}
                          className="w-7 h-7 rounded-full bg-orange-500 text-white text-sm font-bold hover:bg-orange-400 transition-all">+</button>
                      </div>
                    ) : (
                      <button onClick={() => setAddCart((c) => ({ ...c, [m.id]: 1 }))}
                        className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-lg font-bold hover:bg-orange-500/30 transition-all flex items-center justify-center shrink-0">
                        +
                      </button>
                    )}
                  </div>
                );
              })}
              {addMenuFiltered.length === 0 && (
                <p className="px-4 py-8 text-center text-sm text-white/30">Aucun article disponible</p>
              )}
            </div>

            {/* Footer: cart summary + confirm */}
            <div className="px-4 py-4 border-t border-white/[0.06] shrink-0">
              {addCartCount > 0 ? (
                <div className="space-y-2">
                  <div className="text-xs text-white/40 space-y-0.5 max-h-20 overflow-y-auto">
                    {Object.entries(addCart).filter(([, q]) => q > 0).map(([id, q]) => {
                      const m = menuItems.find((mi) => mi.id === id);
                      if (!m) return null;
                      return <div key={id} className="flex justify-between"><span>{q}× {m.name}</span><span className="font-mono">{fmt(m.priceCents * q)}</span></div>;
                    })}
                  </div>
                  <div className="flex justify-between text-sm font-bold border-t border-white/[0.06] pt-2">
                    <span className="text-white/60">À ajouter</span>
                    <span className="text-orange-400">+{fmt(addCartTotal)}</span>
                  </div>
                  <button
                    onClick={confirmAddItems}
                    disabled={addSaving}
                    className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all"
                  >
                    {addSaving
                      ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Ajout en cours…</>
                      : `➕ Ajouter ${addCartCount} article${addCartCount > 1 ? "s" : ""} à la commande`}
                  </button>
                </div>
              ) : (
                <p className="text-center text-xs text-white/30">Sélectionnez des articles à ajouter</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
