"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { api, API_URL } from "@/lib/api";
import { ImageLightbox } from "./ImageLightbox";
import { NovaAssistant } from "@/components/ui";

type QuantityTier = { qty: number; priceCents: number };
type MenuItem = {
  id: string; name: string; description?: string | null;
  priceCents: number; category?: string | null; imageUrl?: string | null;
  allergens?: string[]; diets?: string[];
  waitMinutes?: number;
  suggestedPairings?: string[];
  upsellItems?: string[];
  quantityTiers?: QuantityTier[];
};

/** Effective unit price for a given quantity. */
function effectiveUnitPriceCents(base: number, qty: number, tiers?: QuantityTier[]): number {
  if (!tiers || tiers.length === 0 || qty < 1) return base;
  const sorted = [...tiers].sort((a, b) => b.qty - a.qty);
  for (const t of sorted) {
    if (qty >= t.qty) return Math.round(t.priceCents / t.qty);
  }
  return base;
}

type TableInfo = {
  table: { id: string; number: number; zone?: string };
  restaurant: {
    id: string; name: string; slug: string;
    tipsEnabled: boolean; reviewsEnabled: boolean; serviceCallEnabled: boolean;
    openingHours?: unknown; timezone?: string | null;
  };
  menu: MenuItem[];
  server?: { id: string; name: string; photoUrl?: string | null } | null;
};
type MyOrder = {
  id: string;
  status: "PENDING" | "COOKING" | "READY" | "SERVED" | "PAID" | "CANCELLED";
  totalCents: number;
  items?: { menuItemId: string; name: string; quantity: number; priceCents: number }[];
  expectedReadyAt?: string | null;
  createdAt: string;
};

type LoyaltyData = {
  customer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    points: number;
    tier: string;
    totalSpent: number;
    visitCount: number;
  };
  offers: { id: string; name: string; description?: string | null; pointsCost: number; type: string; value: number }[];
  transactions: { id: string; type: string; points: number; description?: string | null; createdAt: string }[];
};

const ALLERGEN_LABELS: Record<string, string> = {
  GLUTEN:"Gluten",CRUSTACEANS:"Crustacés",EGGS:"Œufs",FISH:"Poisson",
  PEANUTS:"Arachides",SOYBEANS:"Soja",MILK:"Lait",NUTS:"Fruits à coque",
  CELERY:"Céleri",MUSTARD:"Moutarde",SESAME:"Sésame",SULPHITES:"Sulfites",
  LUPIN:"Lupin",MOLLUSCS:"Mollusques",
};
const DIET_LABELS: Record<string, string> = {
  VEGETARIAN:"🌿 Végé",VEGAN:"🌱 Vegan",GLUTEN_FREE:"Sans gluten",
  LACTOSE_FREE:"Sans lactose",HALAL:"Halal",KOSHER:"Casher",SPICY:"🌶️ Épicé",
};
const STATUS_INFO: Record<MyOrder["status"], { label: string; icon: string; bg: string; text: string }> = {
  PENDING:   { label: "Reçue",           icon: "📩", bg: "bg-amber-500/10",   text: "text-amber-400"  },
  COOKING:   { label: "En préparation",  icon: "🍳", bg: "bg-orange-500/10",  text: "text-orange-400" },
  READY:     { label: "Prête 🛎️",        icon: "🛎️", bg: "bg-sky-500/10",     text: "text-sky-400"    },
  SERVED:    { label: "Servie",          icon: "✅", bg: "bg-emerald-500/10", text: "text-emerald-400"},
  PAID:      { label: "Payée",           icon: "💳", bg: "bg-blue-500/10",    text: "text-blue-400"   },
  CANCELLED: { label: "Annulée",         icon: "❌", bg: "bg-red-500/10",     text: "text-red-400"    },
};

const TIER_INFO: Record<string, { label: string; icon: string; color: string }> = {
  bronze:   { label: "Bronze",   icon: "🥉", color: "text-amber-600" },
  silver:   { label: "Argent",   icon: "🥈", color: "text-gray-400" },
  gold:     { label: "Or",       icon: "🥇", color: "text-yellow-400" },
  platinum: { label: "Platine",  icon: "💎", color: "text-cyan-400" },
};
const TIER_NEXT: Record<string, number> = { bronze: 500, silver: 2000, gold: 5000, platinum: 5000 };

const tokenKey     = (id: string) => `atable_session_${id}`;
const sessionIdKey = (id: string) => `atable_session_id_${id}`;
const cartKey      = (id: string) => `atable_cart_${id}`;

/** Countdown timer — shows remaining time or overdue message */
function CountdownTimer({ targetIso, orderId, onOverdue }: {
  targetIso: string;
  orderId: string;
  onOverdue: (id: string) => void;
}) {
  const [now, setNow] = useState(Date.now());
  const firedRef = useRef(false);
  useEffect(() => {
    const iv = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(iv);
  }, []);

  const target = new Date(targetIso).getTime();
  const diff = target - now;
  const overdue = diff <= 0;

  useEffect(() => {
    if (overdue && !firedRef.current) {
      firedRef.current = true;
      onOverdue(orderId);
    }
  }, [overdue, orderId, onOverdue]);

  if (overdue) {
    const overdueMin = Math.floor(Math.abs(diff) / 60_000);
    return (
      <div className="mt-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs">
        <p className="font-bold text-red-400">Retard de {overdueMin} min</p>
        <p className="text-red-300/70 mt-0.5">
          Nous nous excusons pour l'attente. La cuisine a ete alertee, votre commande arrive !
        </p>
      </div>
    );
  }

  const min = Math.floor(diff / 60_000);
  const sec = Math.floor((diff % 60_000) / 1000);

  return (
    <div className="mt-2">
      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-white/50">Temps restant</span>
        <span className={`font-mono font-bold ${min < 2 ? "text-amber-400" : "text-white/70"}`}>
          {min}:{String(sec).padStart(2, "0")}
        </span>
      </div>
      <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-1000 ${
            min < 2 ? "bg-amber-500" : "bg-orange-500"
          }`}
          style={{ width: `${Math.max(5, 100 - (diff / ((target - now + diff) || 1)) * 100)}%` }}
        />
      </div>
    </div>
  );
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1,2,3,4,5].map(i => (
        <button key={i} onClick={() => onChange(i)}
          className={`text-2xl transition-transform hover:scale-110 ${value >= i ? "text-yellow-400" : "text-white/20"}`}>
          ★
        </button>
      ))}
    </div>
  );
}

export default function OrderPage() {
  const { tableUuid } = useParams<{ tableUuid: string }>();
  const search = useSearchParams();
  const paid = search.get("paid") === "1";

  const [info, setInfo]             = useState<TableInfo | null>(null);
  const [error, setError]           = useState<string | null>(null);
  const [cart, setCart]             = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(cartKey(tableUuid)) || "{}"); } catch { return {}; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [myOrders, setMyOrders]     = useState<MyOrder[]>([]);
  const [billMode, setBillMode]     = useState<"CARD"|"CASH"|"COUNTER"|null>(null);
  const [sessionId, setSessionId]   = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(sessionIdKey(tableUuid));
  });

  const [serverRating, setServerRating]     = useState(0);
  const [dishRatings, setDishRatings]       = useState<Record<string, number>>({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess]   = useState(false);

  const [callingService, setCallingService] = useState(false);
  const [serviceCalled, setServiceCalled]   = useState(false);

  const [invoiceEmail, setInvoiceEmail]   = useState("");
  const [paidSessionId, setPaidSessionId] = useState<string | null>(null);
  const [invoiceSent, setInvoiceSent]     = useState(false);
  const [invoiceSending, setInvoiceSending] = useState(false);

  const [upsellItem, setUpsellItem] = useState<MenuItem | null>(null);
  const [upsellSuggestions, setUpsellSuggestions] = useState<MenuItem[]>([]);

  // ── Loyalty flow ────────────────────────────────────────────────────────────
  const [loyaltyModal, setLoyaltyModal]   = useState(false);
  const [loyaltyEmail, setLoyaltyEmail]   = useState("");
  const [loyaltyPhone, setLoyaltyPhone]   = useState("");
  const [loyaltyLoading, setLoyaltyLoading] = useState(false);
  const [loyaltyData, setLoyaltyData]     = useState<LoyaltyData | null>(null);
  const [pendingBillMode, setPendingBillMode] = useState<"CARD"|"CASH"|"COUNTER"|null>(null);

  useEffect(() => {
    api<TableInfo>(`/api/tables/${tableUuid}`, { pro: false })
      .then(setInfo)
      .catch(() => setError("Table introuvable."));
  }, [tableUuid]);

  useEffect(() => {
    if (paid) {
      const sid = localStorage.getItem(sessionIdKey(tableUuid));
      setPaidSessionId(sid);
      localStorage.removeItem(tokenKey(tableUuid));
      localStorage.removeItem(sessionIdKey(tableUuid));
    }
  }, [paid, tableUuid]);

  async function loadMyOrders(token: string) {
    const r = await api<{ orders: MyOrder[] }>(`/api/orders/mine`, { token, pro: false });
    setMyOrders(r.orders);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    loadMyOrders(token).catch(() => {
      localStorage.removeItem(tokenKey(tableUuid));
      localStorage.removeItem(sessionIdKey(tableUuid));
    });
  }, [paid, tableUuid]);

  const handleOverdue = useCallback(async (orderId: string) => {
    try {
      await api(`/api/cuisine/orders/${orderId}/overdue`, { method: "POST", pro: false });
    } catch {}
  }, []);

  useEffect(() => {
    if (!sessionId) return;
    const socket: Socket = io(API_URL, { auth: { sessionId } });

    socket.on("order:updated", (data: { id: string; status: string; expectedReadyAt?: string | null }) => {
      setMyOrders(prev => prev.map(o => o.id === data.id ? {
        ...o,
        status: data.status as any,
        // Le cuisto peut ajuster l'ETA → on met à jour le countdown en live
        ...(data.expectedReadyAt !== undefined ? { expectedReadyAt: data.expectedReadyAt } : {}),
      } : o));
    });

    socket.on("order:new", () => {
      const token = localStorage.getItem(tokenKey(tableUuid));
      if (token) loadMyOrders(token).catch(() => {});
    });

    return () => void socket.disconnect();
  }, [sessionId, tableUuid]);

  const cartTotal = useMemo(() => {
    if (!info) return 0;
    return info.menu.reduce((s, m) => {
      const qty = cart[m.id] || 0;
      if (!qty) return s;
      return s + qty * effectiveUnitPriceCents(m.priceCents, qty, m.quantityTiers);
    }, 0);
  }, [cart, info]);

  const cartSavings = useMemo(() => {
    if (!info) return 0;
    return info.menu.reduce((s, m) => {
      const qty = cart[m.id] || 0;
      if (!qty) return s;
      const unit = effectiveUnitPriceCents(m.priceCents, qty, m.quantityTiers);
      return s + qty * (m.priceCents - unit);
    }, 0);
  }, [cart, info]);

  const unpaidOrders = myOrders.filter(o => o.status !== "PAID" && o.status !== "CANCELLED");
  const unpaidTotal  = unpaidOrders.reduce((s, o) => s + o.totalCents, 0);
  const grandTotal   = unpaidTotal;

  const orderedItems = useMemo(() => {
    if (!info) return [];
    const ids = new Set<string>();
    myOrders.forEach(o => {
      if (o.status !== "CANCELLED" && Array.isArray(o.items))
        o.items.forEach(item => ids.add(item.menuItemId));
    });
    return info.menu.filter(m => ids.has(m.id));
  }, [myOrders, info]);

  function inc(id: string, delta: number) {
    setCart(c => {
      const next = { ...c, [id]: Math.max(0, (c[id] || 0) + delta) };
      if (next[id] === 0) delete next[id];
      localStorage.setItem(cartKey(tableUuid), JSON.stringify(next));

      if (delta > 0 && info) {
        const addedItem = info.menu.find(m => m.id === id);
        if (addedItem && addedItem.upsellItems && addedItem.upsellItems.length > 0) {
          const suggestions = addedItem.upsellItems
            .map(uid => info.menu.find(m => m.id === uid))
            .filter((m): m is MenuItem => m !== undefined && !(next[m.id] > 0));
          if (suggestions.length > 0) {
            setUpsellItem(addedItem);
            setUpsellSuggestions(suggestions);
          }
        }
      }

      return next;
    });
  }

  async function ensureToken(): Promise<string> {
    const cached = localStorage.getItem(tokenKey(tableUuid));
    if (cached) return cached;
    const res = await api<{ token: string; sessionId: string }>(`/api/session`, {
      method: "POST", pro: false, body: JSON.stringify({ tableId: tableUuid }),
    });
    localStorage.setItem(tokenKey(tableUuid), res.token);
    localStorage.setItem(sessionIdKey(tableUuid), res.sessionId);
    setSessionId(res.sessionId);
    return res.token;
  }

  async function callService() {
    setCallingService(true);
    try {
      const token = await ensureToken();
      await api(`/api/service-call`, { method: "POST", token, pro: false, body: JSON.stringify({ reason: "Appel depuis la table" }) });
      setServiceCalled(true);
      setTimeout(() => setServiceCalled(false), 5000);
    } catch { alert("Erreur lors de l'appel"); }
    finally { setCallingService(false); }
  }

  async function submitOrder() {
    if (!Object.keys(cart).length) return;
    setSubmitting(true);
    try {
      const token = await ensureToken();
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
      await api(`/api/orders`, { method: "POST", token, pro: false, body: JSON.stringify({ items }) });
      setCart({});
      localStorage.removeItem(cartKey(tableUuid));
      await loadMyOrders(token);
    } catch (e: any) {
      if (String(e.message).startsWith("401")) {
        localStorage.removeItem(tokenKey(tableUuid));
        alert("Votre session a expire, reessayez.");
      } else alert("Erreur : " + e.message);
    } finally { setSubmitting(false); }
  }

  /** Opens loyalty modal before confirming bill */
  function openBillFlow(mode: "CARD"|"CASH"|"COUNTER") {
    setPendingBillMode(mode);
    setLoyaltyModal(true);
  }

  /** Submit loyalty info, then request bill */
  /** Demande l'addition ; si aucun plat servi (409), propose de confirmer (force). */
  async function requestBill(token: string, mode: "CARD"|"CASH"|"COUNTER") {
    try {
      await api(`/api/bill/request`, { method: "POST", token, pro: false, body: JSON.stringify({ mode }) });
    } catch (e: any) {
      const msg = String(e?.message ?? "");
      if (msg.includes("no_order_served")) {
        if (confirm("Vos plats ne sont pas encore servis. Demander l'addition quand même ?")) {
          await api(`/api/bill/request`, { method: "POST", token, pro: false, body: JSON.stringify({ mode, force: true }) });
        } else {
          throw new Error("__cancelled__");
        }
      } else {
        throw e;
      }
    }
  }

  async function submitLoyaltyAndBill() {
    if (!pendingBillMode) return;
    setLoyaltyLoading(true);
    try {
      const token = await ensureToken();
      if (loyaltyEmail || loyaltyPhone) {
        const res = await api<{ loyalty?: LoyaltyData }>(`/api/session/customer`, {
          method: "PATCH", token, pro: false,
          body: JSON.stringify({ email: loyaltyEmail || undefined, phone: loyaltyPhone || undefined }),
        });
        if (res.loyalty) setLoyaltyData(res.loyalty);
      }
      await requestBill(token, pendingBillMode);
      setBillMode(pendingBillMode);
      setLoyaltyModal(false);
    } catch (e: any) {
      if (e?.message !== "__cancelled__") alert("Erreur : " + e.message);
    } finally {
      setLoyaltyLoading(false);
    }
  }

  async function payByCard() {
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    try {
      const res = await api<{ url: string }>(`/api/stripe/checkout`, {
        method: "POST", token,
        body: JSON.stringify({ email: invoiceEmail || undefined }),
      });
      window.location.href = res.url;
    } catch (e: any) {
      alert("Paiement indisponible — " + e.message);
    }
  }

  async function submitReviews() {
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    setSubmittingReview(true);
    try {
      const dishReviews = Object.entries(dishRatings).map(([menuItemId, rating]) => ({ menuItemId, rating }));
      await api(`/api/reviews`, {
        method: "POST", token, pro: false,
        body: JSON.stringify({
          serverRating: serverRating > 0 ? serverRating : undefined,
          dishReviews: dishReviews.length > 0 ? dishReviews : undefined,
        }),
      });
      setReviewSuccess(true);
    } catch { alert("Erreur lors de l'envoi de l'avis"); }
    finally { setSubmittingReview(false); }
  }

  const [currentCatIdx, setCurrentCatIdx] = useState(0);
  const [viewMode, setViewMode] = useState<"steps" | "full">("steps");

  if (error) return <main className="min-h-screen flex items-center justify-center text-white/50">{error}</main>;
  if (!info)  return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </main>
  );

  const byCat = info.menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    const k = m.category || "Menu";
    (acc[k] ||= []).push(m);
    return acc;
  }, {});

  const PHASE_ORDER = ["Apéritifs", "Cocktails", "Boissons", "Entrées", "Plats", "Desserts", "Cafés", "Digestifs"];
  const catKeys = Object.keys(byCat);
  const sortedCats = catKeys.sort((a, b) => {
    const ia = PHASE_ORDER.findIndex(p => a.toLowerCase().includes(p.toLowerCase()));
    const ib = PHASE_ORDER.findIndex(p => b.toLowerCase().includes(p.toLowerCase()));
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });

  const safeIdx = Math.min(Math.max(0, currentCatIdx), Math.max(0, sortedCats.length - 1));
  const currentCat = sortedCats[safeIdx] || "Menu";

  const showFeedback = paid || billMode !== null || myOrders.some(o => o.status === "SERVED");

  // ── Paid screen ─────────────────────────────────────────────────────────────
  if (paid) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-6 text-center">
        <div className="text-6xl">🎉</div>
        <h1 className="text-2xl font-black text-white">Merci !</h1>
        <p className="text-white/50 text-sm">Votre paiement a bien été reçu. Bonne journée !</p>

        {/* Loyalty card teaser */}
        {loyaltyData && (
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5 text-left">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-3xl">{TIER_INFO[loyaltyData.customer.tier]?.icon ?? "🏅"}</span>
              <div>
                <p className="font-bold text-white">
                  {loyaltyData.customer.firstName ? `${loyaltyData.customer.firstName}, vous avez` : "Vous avez"}
                </p>
                <p className="text-2xl font-black text-orange-400">{loyaltyData.customer.points} pts</p>
              </div>
            </div>
            <Link
              href={`/order/${tableUuid}/card`}
              className="block w-full text-center py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm transition-colors"
            >
              💎 Voir ma carte fidélité
            </Link>
          </div>
        )}

        {/* Invoice email */}
        {paidSessionId && !invoiceSent && (
          <div className="w-full max-w-sm rounded-2xl border border-white/[0.08] bg-white/[0.04] p-5">
            <p className="text-sm text-white/70 mb-3">Recevoir votre ticket par email :</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={invoiceEmail}
                onChange={e => setInvoiceEmail(e.target.value)}
                placeholder="votre@email.com"
                className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
              />
              <button
                onClick={async () => {
                  if (!invoiceEmail || !paidSessionId) return;
                  setInvoiceSending(true);
                  try {
                    await api(`/api/invoice/send`, { method: "POST", pro: false, body: JSON.stringify({ sessionId: paidSessionId, email: invoiceEmail }) });
                    setInvoiceSent(true);
                  } catch { alert("Erreur envoi"); }
                  finally { setInvoiceSending(false); }
                }}
                disabled={invoiceSending || !invoiceEmail}
                className="px-4 py-2 rounded-xl bg-orange-500 disabled:opacity-50 text-white font-bold text-sm"
              >
                {invoiceSending ? "…" : "Envoyer"}
              </button>
            </div>
          </div>
        )}
        {invoiceSent && <p className="text-emerald-400 text-sm">✅ Ticket envoyé !</p>}
      </main>
    );
  }

  return (
    <main className="max-w-2xl mx-auto px-4 pb-40 pt-4">
      {/* ── Loyalty modal ─────────────────────────────────────────────────── */}
      {loyaltyModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/[0.08] p-6">
            <h2 className="text-lg font-black text-white mb-1">🧾 Avant de partir…</h2>
            <p className="text-sm text-white/50 mb-5">
              Laissez votre email ou téléphone pour recevoir votre ticket et cumuler des points fidélité !
            </p>

            <div className="space-y-3 mb-5">
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Email</label>
                <input
                  type="email"
                  value={loyaltyEmail}
                  onChange={e => setLoyaltyEmail(e.target.value)}
                  placeholder="votre@email.com"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Téléphone</label>
                <input
                  type="tel"
                  value={loyaltyPhone}
                  onChange={e => setLoyaltyPhone(e.target.value)}
                  placeholder="+33 6 00 00 00 00"
                  className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-white/30 focus:outline-none focus:border-orange-500/50"
                />
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={async () => {
                  if (!pendingBillMode) return;
                  setLoyaltyModal(false);
                  try {
                    const token = await ensureToken();
                    await requestBill(token, pendingBillMode);
                    setBillMode(pendingBillMode);
                  } catch { /* annulé ou erreur */ }
                }}
                className="flex-1 py-3 rounded-xl border border-white/10 text-white/50 text-sm hover:text-white/80 transition-colors"
              >
                Ignorer
              </button>
              <button
                onClick={submitLoyaltyAndBill}
                disabled={loyaltyLoading}
                className="flex-1 py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-bold text-sm transition-colors"
              >
                {loyaltyLoading ? "…" : "Confirmer →"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Upsell modal ──────────────────────────────────────────────────── */}
      {upsellItem && upsellSuggestions.length > 0 && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-[#1a1a1a] border border-white/[0.08] p-6">
            <h2 className="text-lg font-black text-white mb-1">✨ Parfait avec {upsellItem.name}</h2>
            <p className="text-sm text-white/50 mb-4">Souvent commandé ensemble :</p>
            <div className="space-y-3 mb-5">
              {upsellSuggestions.map(s => (
                <div key={s.id} className="flex items-center justify-between gap-3 p-3 rounded-xl bg-white/[0.04] border border-white/[0.06]">
                  <div>
                    <p className="text-sm font-semibold text-white">{s.name}</p>
                    <p className="text-xs text-white/40">{(s.priceCents / 100).toFixed(2)} €</p>
                  </div>
                  <button
                    onClick={() => { inc(s.id, 1); setUpsellItem(null); setUpsellSuggestions([]); }}
                    className="px-3 py-1.5 rounded-lg bg-orange-500 text-white text-xs font-bold"
                  >+ Ajouter</button>
                </div>
              ))}
            </div>
            <button
              onClick={() => { setUpsellItem(null); setUpsellSuggestions([]); }}
              className="w-full py-2.5 rounded-xl border border-white/10 text-white/50 text-sm"
            >Non merci</button>
          </div>
        </div>
      )}

      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider">{info.restaurant.name}</p>
          <h1 className="text-2xl font-black text-white">Table {info.table.number}
            {info.table.zone && <span className="text-sm font-normal text-white/40 ml-2">· {info.table.zone}</span>}
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setViewMode(v => v === "steps" ? "full" : "steps")}
            className="text-[10px] px-2.5 py-1 rounded-full border border-white/[0.08] text-white/40 hover:text-white/70 transition-colors"
          >
            {viewMode === "steps" ? "Voir tout" : "Par étape"}
          </button>
        </div>
      </header>

      {/* ── Service call ─────────────────────────────────────────────────── */}
      {info.restaurant.serviceCallEnabled && !billMode && !paid && (
        <button
          onClick={callService}
          disabled={callingService || serviceCalled}
          className={`w-full mb-4 py-3 rounded-2xl border text-sm font-semibold transition-all ${
            serviceCalled
              ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400"
              : "border-white/[0.08] bg-white/[0.03] text-white/60 hover:text-white hover:bg-white/[0.06]"
          }`}
        >
          {serviceCalled ? "✅ Serveur appelé !" : callingService ? "…" : "🔔 Appeler le serveur"}
        </button>
      )}

      {/* ── My orders ────────────────────────────────────────────────────── */}
      {myOrders.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Mes commandes</h2>
          <div className="space-y-3">
            {myOrders.map(order => {
              const si = STATUS_INFO[order.status];
              return (
                <div key={order.id} className={`rounded-2xl border border-white/[0.06] ${si.bg} p-4`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className={`text-sm font-bold ${si.text}`}>{si.icon} {si.label}</span>
                    <span className="text-sm font-bold text-white">{(order.totalCents / 100).toFixed(2)} €</span>
                  </div>
                  {order.items && order.items.length > 0 && (
                    <ul className="text-xs text-white/50 space-y-0.5">
                      {order.items.map((it, i) => (
                        <li key={i}>× {it.quantity} {it.name}</li>
                      ))}
                    </ul>
                  )}
                  {order.expectedReadyAt && order.status === "COOKING" && (
                    <CountdownTimer targetIso={order.expectedReadyAt} orderId={order.id} onOverdue={handleOverdue} />
                  )}
                </div>
              );
            })}
          </div>

          {/* Total + bill request */}
          {unpaidTotal > 0 && !billMode && (
            <div className="mt-4 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
              <div className="flex justify-between items-center mb-4">
                <span className="text-white/60 text-sm">Total à régler</span>
                <span className="text-2xl font-black text-white">{(grandTotal / 100).toFixed(2)} €</span>
              </div>
              <p className="text-xs text-white/30 mb-3 text-center">Comment souhaitez-vous payer ?</p>
              <div className="grid grid-cols-3 gap-2">
                {([
                  { mode: "CARD" as const,    icon: "💳", label: "Carte" },
                  { mode: "CASH" as const,    icon: "💵", label: "Espèces" },
                  { mode: "COUNTER" as const, icon: "🏪", label: "Comptoir" },
                ] as const).map(({ mode, icon, label }) => (
                  <button
                    key={mode}
                    onClick={() => openBillFlow(mode)}
                    className="flex flex-col items-center gap-1 py-3 rounded-xl border border-white/[0.08] bg-white/[0.04] hover:bg-white/[0.08] transition-colors"
                  >
                    <span className="text-xl">{icon}</span>
                    <span className="text-xs text-white/60">{label}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Bill requested */}
          {billMode && (
            <div className="mt-4 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
              <p className="text-emerald-400 font-bold mb-1">✅ Addition demandée</p>
              <p className="text-xs text-white/40">Le serveur arrive avec votre addition.</p>
              {billMode === "CARD" && (
                <button
                  onClick={payByCard}
                  className="mt-3 w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm"
                >
                  Payer en ligne →
                </button>
              )}
            </div>
          )}
        </section>
      )}

      {/* ── Loyalty data (after bill, if linked) ─────────────────────────── */}
      {loyaltyData && billMode && (
        <section className="mb-6 rounded-2xl border border-orange-500/20 bg-orange-500/[0.06] p-5">
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{TIER_INFO[loyaltyData.customer.tier]?.icon ?? "🏅"}</span>
            <div>
              <p className="text-xs text-white/40 uppercase tracking-wider">Fidélité</p>
              <p className="text-lg font-black text-orange-400">{loyaltyData.customer.points} points</p>
              <p className="text-xs text-white/50">{TIER_INFO[loyaltyData.customer.tier]?.label ?? loyaltyData.customer.tier}</p>
            </div>
            <Link
              href={`/order/${tableUuid}/card`}
              className="ml-auto px-3 py-1.5 rounded-xl bg-orange-500 text-white text-xs font-bold"
            >
              Ma carte →
            </Link>
          </div>
          {loyaltyData.offers.length > 0 && (
            <div>
              <p className="text-xs text-white/40 mb-2">Offres disponibles :</p>
              <div className="space-y-1.5">
                {loyaltyData.offers.map(o => {
                  const canRedeem = loyaltyData.customer.points >= o.pointsCost;
                  return (
                    <div key={o.id} className={`flex items-center justify-between px-3 py-2 rounded-xl border text-xs ${canRedeem ? "border-emerald-500/30 bg-emerald-500/10 text-emerald-400" : "border-white/[0.06] text-white/40"}`}>
                      <span>{o.name}</span>
                      <span className="font-bold">{o.pointsCost} pts</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </section>
      )}

      {/* ── Menu ─────────────────────────────────────────────────────────── */}
      {!billMode && (
        <>
          {/* Category tabs */}
          {viewMode === "steps" && sortedCats.length > 1 && (
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1 scrollbar-none">
              {sortedCats.map((cat, i) => (
                <button
                  key={cat}
                  onClick={() => setCurrentCatIdx(i)}
                  className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-semibold transition-colors ${
                    i === safeIdx
                      ? "bg-orange-500 text-white"
                      : "bg-white/[0.06] text-white/50 hover:text-white"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {/* Items */}
          {(viewMode === "full" ? sortedCats : [currentCat]).map(cat => (
            <div key={cat} className="mb-6">
              {viewMode === "full" && (
                <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">{cat}</h2>
              )}
              <div className="space-y-3">
                {(byCat[cat] || []).map(item => {
                  const qty = cart[item.id] || 0;
                  const unitPrice = effectiveUnitPriceCents(item.priceCents, qty, item.quantityTiers);
                  const hasDiscount = qty > 0 && unitPrice < item.priceCents;

                  return (
                    <div key={item.id} className="rounded-2xl border border-white/[0.06] bg-white/[0.03] overflow-hidden">
                      <div className="flex gap-3 p-4">
                        {item.imageUrl && (
                          <ImageLightbox src={item.imageUrl} alt={item.name} className="w-16 h-16 rounded-xl object-cover shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <p className="font-semibold text-white text-sm leading-tight">{item.name}</p>
                            <div className="text-right shrink-0">
                              <p className={`font-bold text-sm ${hasDiscount ? "text-emerald-400" : "text-white/80"}`}>
                                {(unitPrice / 100).toFixed(2)} €
                              </p>
                              {hasDiscount && (
                                <p className="text-xs text-white/30 line-through">{(item.priceCents / 100).toFixed(2)} €</p>
                              )}
                            </div>
                          </div>
                          {item.description && (
                            <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{item.description}</p>
                          )}
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {item.diets?.map(d => (
                              <span key={d} className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400">{DIET_LABELS[d] ?? d}</span>
                            ))}
                            {item.allergens?.map(a => (
                              <span key={a} className="text-[10px] px-1.5 py-0.5 rounded-full bg-red-500/10 text-red-400">{ALLERGEN_LABELS[a] ?? a}</span>
                            ))}
                          </div>
                          {item.waitMinutes && (
                            <p className="text-[10px] text-white/30 mt-1">⏱ ~{item.waitMinutes} min</p>
                          )}
                        </div>
                      </div>

                      {/* Quantity tiers info */}
                      {item.quantityTiers && item.quantityTiers.length > 0 && (
                        <div className="px-4 pb-2 flex gap-2 flex-wrap">
                          {item.quantityTiers.map(t => (
                            <span key={t.qty} className="text-[10px] px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-400">
                              × {t.qty} → {(t.priceCents / t.qty / 100).toFixed(2)} €/u
                            </span>
                          ))}
                        </div>
                      )}

                      {/* Add/remove controls */}
                      <div className="px-4 pb-4 flex items-center justify-end gap-3">
                        {qty > 0 && (
                          <>
                            <button onClick={() => inc(item.id, -1)}
                              className="w-8 h-8 rounded-full border border-white/10 text-white/60 hover:text-white hover:border-white/30 flex items-center justify-center text-lg font-bold transition-colors">
                              −
                            </button>
                            <span className="text-white font-bold text-sm w-4 text-center">{qty}</span>
                          </>
                        )}
                        <button onClick={() => inc(item.id, 1)}
                          className="w-8 h-8 rounded-full bg-orange-500 hover:bg-orange-600 text-white flex items-center justify-center text-lg font-bold transition-colors">
                          +
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </>
      )}

      {/* ── Feedback / reviews ───────────────────────────────────────────── */}
      {showFeedback && info.restaurant.reviewsEnabled && !reviewSuccess && (
        <section className="mb-6 rounded-2xl border border-white/[0.06] bg-white/[0.03] p-5">
          <h2 className="font-bold text-white mb-4">Votre avis compte ✨</h2>
          {info.server && (
            <div className="mb-4">
              <p className="text-xs text-white/40 mb-2">Note pour {info.server.name}</p>
              <StarRating value={serverRating} onChange={setServerRating} />
            </div>
          )}
          {orderedItems.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-white/40 mb-2">Notes pour vos plats</p>
              <div className="space-y-2">
                {orderedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between">
                    <span className="text-sm text-white/70 truncate flex-1 mr-2">{item.name}</span>
                    <StarRating value={dishRatings[item.id] || 0} onChange={v => setDishRatings(p => ({ ...p, [item.id]: v }))} />
                  </div>
                ))}
              </div>
            </div>
          )}
          <button
            onClick={submitReviews}
            disabled={submittingReview || (serverRating === 0 && Object.keys(dishRatings).length === 0)}
            className="w-full py-3 rounded-xl bg-orange-500 hover:bg-orange-600 disabled:opacity-40 text-white font-bold text-sm transition-colors"
          >
            {submittingReview ? "Envoi…" : "Envoyer mon avis"}
          </button>
        </section>
      )}
      {reviewSuccess && (
        <div className="mb-6 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-center">
          <p className="text-emerald-400 font-bold">Merci pour votre avis ! 🙏</p>
        </div>
      )}

      {/* ── Cart sticky footer ───────────────────────────────────────────── */}
      {Object.keys(cart).length > 0 && !billMode && (
        <div className="fixed bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black via-black/95 to-transparent pt-8">
          <div className="max-w-2xl mx-auto">
            {cartSavings > 0 && (
              <p className="text-center text-xs text-emerald-400 mb-1">
                🎉 Vous économisez {(cartSavings / 100).toFixed(2)} € avec les offres quantité !
              </p>
            )}
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-lg transition-colors flex items-center justify-center gap-3"
            >
              {submitting ? (
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  <span>Commander</span>
                  <span className="px-3 py-1 rounded-full bg-white/20 text-sm font-bold">
                    {(cartTotal / 100).toFixed(2)} €
                  </span>
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* ── Nova AI assistant ────────────────────────────────────────────── */}
      <NovaAssistant
        restaurantName={info.restaurant.name}
        menuContext={info.menu.map(m => `${m.name} (${(m.priceCents / 100).toFixed(2)}€)${m.description ? " — " + m.description : ""}`).join(" · ")}
      />
    </main>
  );
}
