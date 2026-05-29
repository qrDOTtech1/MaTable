"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { io, Socket } from "socket.io-client";

type Session = {
  id: string;
  table: { number: number; seats: number; zone?: string };
  server?: { id: string; name: string } | null;
  orders: any[];
  subtotalCents: number;
  tipCents: number;
  totalCents: number;
  hasUnserved: boolean;
  billPaymentMode?: string | null;
  billRequestedAt?: string | null;
  billConfirmedAt?: string | null;
  billConfirmedBy?: string | null;
};

const MODE_INFO: Record<string, { icon: string; label: string; badgeCls: string }> = {
  CARD:    { icon: "💳", label: "Carte bancaire", badgeCls: "bg-blue-500/20 border-blue-500/40 text-blue-300" },
  CASH:    { icon: "💵", label: "Espèces",        badgeCls: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300" },
  COUNTER: { icon: "🏪", label: "En caisse",      badgeCls: "bg-amber-500/20 border-amber-500/40 text-amber-300" },
};

type Stats = {
  revenueTodayCents: number;
  ordersToday: number;
  sessionsClosedToday: number;
  sessionsActive: number;
  paymentBreakdown: { CARD: number; CASH: number; COUNTER: number };
  tipsTotal: number;
};

export default function CaisseDashPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"CARD" | "CASH" | "COUNTER">("CARD");
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Vente au comptoir (cannette, café… sans table)
  const [showCounter, setShowCounter] = useState(false);
  const [counterMenu, setCounterMenu] = useState<Array<{ id: string; name: string; priceCents: number; category: string | null }>>([]);
  const [counterCart, setCounterCart] = useState<Record<string, number>>({});
  const [counterMode, setCounterMode] = useState<"CARD" | "CASH" | "COUNTER">("CARD");
  const [counterBusy, setCounterBusy] = useState(false);
  const [counterMsg, setCounterMsg] = useState<string | null>(null);

  const caisseFetch = useCallback(async <T,>(path: string, opts?: RequestInit): Promise<T> => {
    const token = localStorage.getItem("caisse_token");
    if (!token) { router.push(`/${slug}`); throw new Error("No token"); }
    const res = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
    });
    if (res.status === 401) {
      localStorage.removeItem("caisse_token");
      router.push(`/${slug}`);
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [slug, router]);

  const loadData = useCallback(async () => {
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        caisseFetch<{ sessions: Session[] }>("/api/caisse/sessions"),
        caisseFetch<Stats>("/api/caisse/stats"),
      ]);
      setSessions(sessionsRes.sessions);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caisseFetch]);

  // Decode restaurantId from JWT (no library needed — just base64)
  useEffect(() => {
    const token = localStorage.getItem("caisse_token");
    if (!token) return;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      setRestaurantId(payload.restaurantId ?? null);
    } catch {}
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("caisse_token");
    if (!token) { router.push(`/${slug}`); return; }
    loadData();
    // Fallback polling every 15s (socket handles live updates)
    const interval = setInterval(loadData, 15000);
    return () => clearInterval(interval);
  }, [loadData, router, slug]);

  // Socket.io — real-time bill events
  useEffect(() => {
    if (!restaurantId) return;
    const socket = io(API_URL, { auth: { restaurantId } });
    socketRef.current = socket;

    const refresh = () => loadData();

    socket.on("bill:requested", (data: any) => {
      // Play a soft notification sound
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch {}
      refresh();
    });

    socket.on("bill:confirmed", (data: any) => {
      refresh();
    });

    socket.on("order:paid", refresh);
    socket.on("order:new", refresh);

    return () => { socket.disconnect(); socketRef.current = null; };
  }, [restaurantId, loadData]);

  async function closeSession(sessionId: string) {
    setClosing(sessionId);
    try {
      const token = localStorage.getItem("caisse_token");
      const doClose = (force: boolean) => fetch(`${API_URL}/api/caisse/sessions/${sessionId}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ paymentMode, force }),
      });
      let res = await doClose(false);
      if (res.status === 409) {
        const body = await res.json().catch(() => ({}));
        if (body?.error === "orders_not_served") {
          if (!confirm("Des plats ne sont pas encore servis. Encaisser quand même ?")) { setClosing(null); return; }
          res = await doClose(true);
        }
      }
      if (!res.ok && res.status !== 409) throw new Error(`HTTP ${res.status}`);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(null);
    }
  }

  function logout() {
    localStorage.removeItem("caisse_token");
    router.push(`/${slug}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 h-14 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400">
            💳
          </div>
          <h1 className="text-lg font-bold">Caisse</h1>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={async () => {
              setShowCounter(true); setCounterMsg(null);
              if (counterMenu.length === 0) {
                try {
                  const r = await caisseFetch<{ menu: typeof counterMenu }>("/api/caisse/menu");
                  setCounterMenu(r.menu);
                } catch {}
              }
            }}
            className="px-3 py-1.5 rounded-full bg-orange-500/15 border border-orange-500/30 text-orange-400 text-xs font-bold hover:bg-orange-500/25 transition-colors"
            title="Encaisser un client au comptoir (cannette, café…)"
          >🥤 Vente comptoir</button>
          <button onClick={logout} className="text-xs text-white/30 hover:text-white/60 transition-colors">Quitter</button>
        </div>
      </div>

      {/* Modal Vente comptoir */}
      {showCounter && (() => {
        const cartItems = counterMenu.filter((m) => (counterCart[m.id] ?? 0) > 0);
        const total = cartItems.reduce((s, m) => s + m.priceCents * (counterCart[m.id] ?? 0), 0);
        const categories = Array.from(new Set(counterMenu.map((m) => m.category || "Autres")));
        async function submitSale() {
          if (cartItems.length === 0) return;
          setCounterBusy(true); setCounterMsg(null);
          try {
            await caisseFetch("/api/caisse/sales/counter", {
              method: "POST",
              body: JSON.stringify({
                items: cartItems.map((m) => ({ menuItemId: m.id, name: m.name, priceCents: m.priceCents, quantity: counterCart[m.id] })),
                paymentMode: counterMode,
              }),
            });
            setCounterMsg(`✅ Encaissé ${(total/100).toFixed(2)} €`);
            setCounterCart({});
            await loadData();
            setTimeout(() => { setShowCounter(false); setCounterMsg(null); }, 1200);
          } catch (e: any) {
            setCounterMsg(`Erreur : ${e?.message ?? "envoi"}`);
          } finally { setCounterBusy(false); }
        }
        return (
          <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setShowCounter(false)} />
            <div className="relative w-full max-w-3xl max-h-[90vh] rounded-2xl border border-white/[0.08] bg-[#0f0f0f] shadow-2xl flex flex-col">
              <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.06]">
                <h2 className="text-lg font-black">🥤 Vente au comptoir</h2>
                <button onClick={() => setShowCounter(false)} className="text-white/40 hover:text-white text-xl">✕</button>
              </div>
              <div className="flex-1 overflow-y-auto p-5 space-y-4">
                {counterMenu.length === 0 ? (
                  <p className="text-center text-white/40 py-8">Chargement du menu…</p>
                ) : categories.map((cat) => (
                  <div key={cat}>
                    <p className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-2">{cat}</p>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {counterMenu.filter((m) => (m.category || "Autres") === cat).map((m) => {
                        const qty = counterCart[m.id] ?? 0;
                        return (
                          <div key={m.id} className={`rounded-xl border p-3 transition-colors ${qty > 0 ? "bg-orange-500/[0.08] border-orange-500/30" : "bg-white/[0.03] border-white/[0.06]"}`}>
                            <p className="text-sm font-semibold text-white truncate">{m.name}</p>
                            <p className="text-xs text-white/45">{(m.priceCents / 100).toFixed(2)} €</p>
                            <div className="flex items-center justify-between mt-2">
                              <button onClick={() => setCounterCart((c) => ({ ...c, [m.id]: Math.max(0, (c[m.id] ?? 0) - 1) }))}
                                className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 text-lg leading-none">−</button>
                              <span className="text-base font-black tabular-nums">{qty}</span>
                              <button onClick={() => setCounterCart((c) => ({ ...c, [m.id]: (c[m.id] ?? 0) + 1 }))}
                                className="w-8 h-8 rounded-lg bg-orange-500 hover:bg-orange-400 text-lg leading-none">+</button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
              <div className="border-t border-white/[0.06] p-5 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Total</span>
                  <span className="text-2xl font-black text-emerald-400">{(total/100).toFixed(2)} €</span>
                </div>
                <div className="flex gap-2">
                  {(["CARD","CASH","COUNTER"] as const).map((m) => (
                    <button key={m} onClick={() => setCounterMode(m)}
                      className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-colors border ${counterMode === m ? "bg-orange-500 border-orange-500 text-white" : "bg-white/[0.03] border-white/[0.06] text-white/60 hover:bg-white/[0.06]"}`}>
                      {MODE_INFO[m].icon} {MODE_INFO[m].label}
                    </button>
                  ))}
                </div>
                <button
                  onClick={submitSale}
                  disabled={cartItems.length === 0 || counterBusy}
                  className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-base disabled:opacity-40 transition-colors"
                >
                  {counterBusy ? "…" : `Encaisser ${(total/100).toFixed(2)} €`}
                </button>
                {counterMsg && <p className="text-sm text-center text-emerald-400 font-semibold">{counterMsg}</p>}
              </div>
            </div>
          </div>
        );
      })()}

      <div className="flex-1 p-4 space-y-6 max-w-5xl mx-auto w-full">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
              <p className="text-2xl font-black text-emerald-400">{(stats.revenueTodayCents / 100).toFixed(2)}€</p>
              <p className="text-xs text-white/40 mt-1">Chiffre d'affaires</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
              <p className="text-2xl font-black text-white">{stats.ordersToday}</p>
              <p className="text-xs text-white/40 mt-1">Couverts</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
              <p className="text-2xl font-black text-white">{stats.sessionsActive}</p>
              <p className="text-xs text-white/40 mt-1">Tables actives</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
              <p className="text-2xl font-black text-orange-400">{(stats.tipsTotal / 100).toFixed(2)}€</p>
              <p className="text-xs text-white/40 mt-1">Pourboires</p>
            </div>
          </div>
        )}

        {/* Sessions */}
        {sessions.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-10 text-center">
            <p className="text-4xl mb-3">🪑</p>
            <p className="text-white/50">Aucune table active</p>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Priority: bill-requested sessions first */}
            {[...sessions].sort((a, b) => {
              const aP = a.billPaymentMode ? (a.billConfirmedAt ? 1 : 0) : 2;
              const bP = b.billPaymentMode ? (b.billConfirmedAt ? 1 : 0) : 2;
              return aP - bP;
            }).map((session) => {
              const modeInfo = session.billPaymentMode ? MODE_INFO[session.billPaymentMode] : null;
              const billRequested = !!session.billPaymentMode;
              const billConfirmed = !!session.billConfirmedAt;
              const effectiveMode = (session.billPaymentMode as "CARD" | "CASH" | "COUNTER" | null) ?? paymentMode;

              return (
              <div key={session.id} className={`rounded-2xl border overflow-hidden transition-all ${
                billConfirmed
                  ? "bg-emerald-500/[0.06] border-emerald-500/30 ring-1 ring-emerald-500/20"
                  : billRequested
                  ? "bg-blue-500/[0.04] border-blue-500/25 ring-1 ring-blue-500/10"
                  : "bg-white/[0.02] border-white/[0.06]"
              }`}>
                {/* Header */}
                <div className={`px-5 py-4 border-b flex items-center justify-between flex-wrap gap-2 ${
                  billConfirmed ? "bg-emerald-500/[0.08] border-emerald-500/15"
                  : billRequested ? "bg-blue-500/[0.06] border-blue-500/15"
                  : "bg-white/[0.03] border-white/[0.06]"
                }`}>
                  <div className="flex items-center gap-3 flex-wrap">
                    <span className={`text-xl font-black ${
                      billConfirmed ? "text-emerald-400" : billRequested ? "text-white" : "text-emerald-400"
                    }`}>Table {session.table.number}</span>
                    <span className="text-xs text-white/30">{session.table.seats} couverts</span>
                    {session.table.zone && <span className="text-xs text-white/20 px-2 py-0.5 bg-white/[0.04] rounded">{session.table.zone}</span>}
                    {session.server && !billRequested && (
                      <span className="text-xs text-white/30 px-2 py-0.5 bg-white/[0.03] rounded-full">
                        👤 {session.server.name}
                      </span>
                    )}
                    {/* Bill requested — not yet confirmed */}
                    {billRequested && !billConfirmed && modeInfo && (
                      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border animate-pulse ${modeInfo.badgeCls}`}>
                        🛎 {modeInfo.icon} {modeInfo.label} · en route
                      </span>
                    )}
                    {/* Bill confirmed by server */}
                    {billConfirmed && modeInfo && (
                      <span className={`flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full border ${modeInfo.badgeCls}`}>
                        ✓ {modeInfo.icon} {modeInfo.label} · {session.billConfirmedBy}
                      </span>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="text-xl font-black text-white">{(session.totalCents / 100).toFixed(2)}€</p>
                    {session.tipCents > 0 && (
                      <p className="text-[10px] text-orange-400/70">dont {(session.tipCents / 100).toFixed(2)}€ pourboire</p>
                    )}
                  </div>
                </div>

                {/* Orders summary */}
                {session.orders.length > 0 && (
                  <div className={`px-5 py-3 border-b border-white/[0.04] ${billRequested ? "opacity-50" : ""}`}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-white/30">
                        {session.orders.length} commande{session.orders.length !== 1 ? "s" : ""}
                      </span>
                      <span className={`text-xs font-semibold ${session.hasUnserved ? "text-amber-400" : "text-emerald-400"}`}>
                        {session.hasUnserved ? "⏳ En cours de service" : "✓ Tout servi"}
                      </span>
                    </div>
                    <div className="space-y-0.5 max-h-28 overflow-y-auto">
                      {session.orders.flatMap((o: any) => (o.items as any[]).map((item: any, i: number) => (
                        <div key={`${o.id}-${i}`} className="flex justify-between text-xs">
                          <span className="text-white/50">{item.quantity}× {item.name}</span>
                          <span className="text-white/35 font-mono">{((item.quantity * item.priceCents) / 100).toFixed(2)}€</span>
                        </div>
                      )))}
                    </div>
                    {session.tipCents > 0 && (
                      <div className="flex justify-between text-xs mt-1.5 pt-1.5 border-t border-white/[0.05]">
                        <span className="text-orange-400/70">Pourboire</span>
                        <span className="text-orange-400/70 font-mono">+{(session.tipCents / 100).toFixed(2)}€</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Encaissement */}
                <div className="px-5 py-4 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={effectiveMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className={`text-xs rounded-lg px-3 py-2 text-white border font-semibold ${
                        billConfirmed && modeInfo ? "bg-emerald-900/30 border-emerald-500/30"
                        : billRequested && modeInfo ? "bg-blue-900/30 border-blue-500/30"
                        : "bg-slate-800 border-slate-700"
                      }`}
                    >
                      <option value="CARD">💳 Carte</option>
                      <option value="CASH">💵 Espèces</option>
                      <option value="COUNTER">🏪 Comptoir</option>
                    </select>
                    <button
                      onClick={() => closeSession(session.id)}
                      disabled={closing === session.id || session.hasUnserved}
                      title={session.hasUnserved ? "Attendre que toutes les commandes soient servies" : ""}
                      className={`flex-1 min-w-36 py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all ${
                        closing === session.id
                          ? "bg-white/10 text-white/40"
                          : session.hasUnserved
                          ? "bg-white/5 text-white/20 cursor-not-allowed border border-white/10"
                          : billConfirmed
                          ? "bg-emerald-500 hover:bg-emerald-400 text-white active:scale-[0.98]"
                          : "bg-white text-black hover:bg-white/90 active:scale-[0.98]"
                      }`}
                    >
                      {closing === session.id
                        ? <><span className="w-4 h-4 border-2 border-current/30 border-t-current rounded-full animate-spin" /> Encaissement…</>
                        : session.hasUnserved
                        ? "⏳ Attendre la fin du service"
                        : "✓ Encaisser"
                      }
                    </button>
                  </div>
                </div>
              </div>
            );})}
          </div>
        )}
      </div>
    </div>
  );
}
