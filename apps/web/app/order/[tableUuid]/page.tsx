"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { api, API_URL } from "@/lib/api";
import { ImageLightbox } from "./ImageLightbox";
import { NovaAssistant } from "@/components/ui";

type MenuItem = {
  id: string; name: string; description?: string | null;
  priceCents: number; category?: string | null; imageUrl?: string | null;
  allergens?: string[]; diets?: string[];
};
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
  status: "PENDING" | "COOKING" | "SERVED" | "PAID" | "CANCELLED";
  totalCents: number;
  items?: { menuItemId: string; name: string; quantity: number; priceCents: number }[];
  createdAt: string;
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
  SERVED:    { label: "Servie",          icon: "✅", bg: "bg-emerald-500/10", text: "text-emerald-400"},
  PAID:      { label: "Payée",           icon: "💳", bg: "bg-blue-500/10",    text: "text-blue-400"   },
  CANCELLED: { label: "Annulée",         icon: "❌", bg: "bg-red-500/10",     text: "text-red-400"    },
};

const tokenKey     = (id: string) => `atable_session_${id}`;
const sessionIdKey = (id: string) => `atable_session_id_${id}`;
const cartKey      = (id: string) => `atable_cart_${id}`;

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

  // Tips — now part of the addition
  const [tipCents, setTipCents]           = useState(0);
  const [customTip, setCustomTip]         = useState("");
  const [submittingTip, setSubmittingTip] = useState(false);
  const [tipSent, setTipSent]             = useState(false);

  // Reviews
  const [serverRating, setServerRating]     = useState(0);
  const [dishRatings, setDishRatings]       = useState<Record<string, number>>({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess]   = useState(false);

  // Service call
  const [callingService, setCallingService] = useState(false);
  const [serviceCalled, setServiceCalled]   = useState(false);

  // Invoice email
  const [invoiceEmail, setInvoiceEmail]   = useState("");
  const [paidSessionId, setPaidSessionId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!sessionId) return;
    const socket: Socket = io(API_URL, { auth: { sessionId } });
    socket.on("order:updated", (data: { id: string; status: string }) => {
      setMyOrders(prev => prev.map(o => o.id === data.id ? { ...o, status: data.status as any } : o));
      if (data.status === "SERVED") {
        try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch {}
      }
    });
    return () => void socket.disconnect();
  }, [sessionId]);

  const cartTotal = useMemo(() => {
    if (!info) return 0;
    return info.menu.reduce((s, m) => s + (cart[m.id] || 0) * m.priceCents, 0);
  }, [cart, info]);

  const unpaidOrders = myOrders.filter(o => o.status !== "PAID" && o.status !== "CANCELLED");
  const unpaidTotal  = unpaidOrders.reduce((s, o) => s + o.totalCents, 0);
  const grandTotal   = unpaidTotal + tipCents; // total including tip

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
      await api<{ orderId: string }>(`/api/orders`, { method: "POST", token, pro: false, body: JSON.stringify({ items }) });
      setCart({});
      localStorage.removeItem(cartKey(tableUuid));
      await loadMyOrders(token);
    } catch (e: any) {
      if (String(e.message).startsWith("401")) {
        localStorage.removeItem(tokenKey(tableUuid));
        alert("Votre session a expiré, réessayez.");
      } else alert("Erreur : " + e.message);
    } finally { setSubmitting(false); }
  }

  async function requestBill(mode: "CARD"|"CASH"|"COUNTER") {
    const token = await ensureToken();
    await api(`/api/bill/request`, { method: "POST", token, pro: false, body: JSON.stringify({ mode }) });
    setBillMode(mode);
  }

  async function payByCard() {
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    try {
      // Pass tipCents + optional email to checkout
      const res = await api<{ url: string }>(`/api/stripe/checkout`, {
        method: "POST", token,
        body: JSON.stringify({ tipCents: tipCents > 0 ? tipCents : undefined, email: invoiceEmail || undefined }),
      });
      window.location.href = res.url;
    } catch (e: any) {
      alert("Paiement indisponible — " + e.message);
    }
  }

  async function sendTip(cents: number) {
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    setSubmittingTip(true);
    try {
      await api(`/api/tip`, { method: "POST", token, pro: false, body: JSON.stringify({ amountCents: cents }) });
      setTipSent(true);
    } catch { alert("Erreur lors de l'envoi du pourboire"); }
    finally { setSubmittingTip(false); }
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

  const showFeedback = paid || billMode !== null || myOrders.some(o => o.status === "SERVED");

  const TIP_PRESETS = [100, 200, 500];

  return (
    <main className="max-w-2xl mx-auto px-4 pb-40 pt-4">
      {/* Header */}
      <header className="mb-6 flex items-center justify-between">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider">{info.restaurant.name}</p>
          <h1 className="text-2xl font-black text-white">Table {info.table.number}
            {info.table.zone && <span className="text-sm font-normal text-white/40 ml-2">· {info.table.zone}</span>}
          </h1>
        </div>
        <Link
          href={`https://matable.app/onboarding?restaurantId=${info.restaurant.id}&tableId=${info.table.id}`}
          className="flex items-center gap-1.5 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-3 py-1.5 rounded-full text-xs font-black shadow-lg hover:scale-105 transition-all"
        >
          ✨ Social
        </Link>
      </header>

      {/* Serveur */}
      {info.server && (
        <div className="flex items-center gap-3 bg-white/[0.04] border border-white/[0.08] rounded-2xl p-3 mb-5">
          <div className="w-11 h-11 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 flex items-center justify-center font-bold text-base overflow-hidden shrink-0">
            {info.server.photoUrl
              ? <img src={info.server.photoUrl} alt="server" className="w-full h-full object-cover" />
              : info.server.name[0]?.toUpperCase()}
          </div>
          <div className="flex-1">
            <p className="text-sm font-bold text-white">
              Votre serveur : <span className="text-orange-400">{info.server.name}</span>
            </p>
            <p className="text-xs text-white/40 mt-0.5">{info.table.zone ? `Zone ${info.table.zone}` : "À votre service"}</p>
          </div>
          {info.restaurant.serviceCallEnabled && (
            <button
              onClick={callService}
              disabled={callingService || serviceCalled}
              className={`w-10 h-10 rounded-full flex items-center justify-center text-lg transition-all ${
                serviceCalled ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.06] text-white/60 border border-white/[0.08] hover:bg-white/[0.1]"
              }`}
            >
              {serviceCalled ? "✅" : "🛎️"}
            </button>
          )}
        </div>
      )}

      {/* Paiement confirmé */}
      {paid && (
        <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-6 text-center mb-6">
          <div className="text-5xl mb-3">🎉</div>
          <h2 className="text-xl font-black text-white">Paiement reçu, merci !</h2>
          <p className="text-sm text-white/50 mt-1">Nous espérons vous revoir très bientôt.</p>
          {/* Invoice offer */}
          <div className="mt-5 space-y-3">
            <p className="text-xs text-white/40">Souhaitez-vous recevoir votre ticket ?</p>
            <div className="flex gap-2">
              <input
                type="email"
                placeholder="votre@email.com (optionnel)"
                value={invoiceEmail}
                onChange={e => setInvoiceEmail(e.target.value)}
                className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
              />
            </div>
            <div className="flex gap-2">
              {paidSessionId && (
                <a
                  href={`/order/${tableUuid}/receipt?sessionId=${paidSessionId}${invoiceEmail ? `&email=${encodeURIComponent(invoiceEmail)}` : ""}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 font-bold text-sm rounded-xl transition-colors text-center"
                >
                  📄 Voir / Télécharger
                </a>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback post-service */}
      {showFeedback && (
        <div className="space-y-4 mb-6">
          {/* Reviews */}
          {info.restaurant.reviewsEnabled && !reviewSuccess && orderedItems.length > 0 && (
            <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4">
              <h3 className="font-bold text-white mb-4 flex items-center gap-2">⭐ Donnez votre avis</h3>
              {info.server && (
                <div className="mb-4 pb-4 border-b border-white/[0.07]">
                  <div className="text-sm text-white/70 font-medium mb-2">Service de {info.server.name}</div>
                  <StarRating value={serverRating} onChange={setServerRating} />
                </div>
              )}
              <div className="space-y-4 mb-4">
                <p className="text-sm text-white/50">Plats commandés :</p>
                {orderedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-white/80 truncate">{item.name}</span>
                    <StarRating value={dishRatings[item.id] || 0} onChange={v => setDishRatings(p => ({ ...p, [item.id]: v }))} />
                  </div>
                ))}
              </div>
              <button
                onClick={submitReviews}
                disabled={submittingReview || (serverRating === 0 && Object.keys(dishRatings).length === 0)}
                className="w-full py-3 rounded-xl bg-white/[0.08] hover:bg-white/[0.12] text-white font-bold text-sm disabled:opacity-40 transition-all"
              >
                Envoyer mon avis
              </button>
            </div>
          )}
          {reviewSuccess && (
            <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/20 p-3 text-center text-emerald-400 text-sm font-medium">
              ⭐ Merci pour votre avis !
            </div>
          )}
        </div>
      )}

      {/* Statut commandes en cours */}
      {!paid && myOrders.filter(o => o.status !== "PAID" && o.status !== "CANCELLED").length > 0 && (
        <div className="space-y-2 mb-5">
          {myOrders.filter(o => o.status !== "PAID" && o.status !== "CANCELLED").map(o => {
            const s = STATUS_INFO[o.status];
            return (
              <div key={o.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${s.bg} border-white/[0.06]`}>
                <div className="flex items-center gap-2">
                  <span>{s.icon}</span>
                  <span className={`text-sm font-semibold ${s.text}`}>{s.label}</span>
                </div>
                <span className="text-xs text-white/30">{new Date(o.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}</span>
              </div>
            );
          })}
        </div>
      )}

      {/* Addition */}
      {!paid && unpaidOrders.length > 0 && (
        <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 mb-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-white text-lg">Addition</h3>
            {billMode && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-semibold">
                Demandée ({billMode})
              </span>
            )}
          </div>

          {/* Détail */}
          <div className="space-y-1 text-sm">
            <div className="flex justify-between text-white/60">
              <span>Commandes</span>
              <span>{(unpaidTotal / 100).toFixed(2)} €</span>
            </div>
            {tipCents > 0 && (
              <div className="flex justify-between text-emerald-400">
                <span>💝 Pourboire</span>
                <span>+ {(tipCents / 100).toFixed(2)} €</span>
              </div>
            )}
            <div className="flex justify-between text-white font-black text-base pt-2 border-t border-white/[0.06] mt-2">
              <span>Total</span>
              <span className="text-orange-400">{(grandTotal / 100).toFixed(2)} €</span>
            </div>
          </div>

          {/* Pourboire intégré */}
          {info.restaurant.tipsEnabled && !tipSent && (
            <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-2">
              <p className="text-xs text-white/50 font-medium">💝 Ajouter un pourboire ?</p>
              <div className="flex gap-2">
                <button
                  onClick={() => setTipCents(0)}
                  className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tipCents === 0 ? "bg-white/[0.12] text-white" : "bg-white/[0.04] text-white/40 hover:text-white/60"}`}
                >
                  Sans
                </button>
                {TIP_PRESETS.map(c => (
                  <button
                    key={c}
                    onClick={() => setTipCents(c)}
                    className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${tipCents === c ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30" : "bg-white/[0.04] text-white/40 hover:text-white/60 border border-white/[0.06]"}`}
                  >
                    {(c / 100).toFixed(2)} €
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  type="number" min="0" step="0.50" placeholder="Montant libre (€)"
                  value={customTip}
                  onChange={e => {
                    setCustomTip(e.target.value);
                    setTipCents(Math.round(parseFloat(e.target.value || "0") * 100));
                  }}
                  className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-emerald-500/50"
                />
              </div>
            </div>
          )}
          {tipSent && (
            <div className="rounded-xl bg-emerald-500/10 border border-emerald-500/20 p-2 text-center text-emerald-400 text-xs font-medium">
              💝 Pourboire envoyé, merci !
            </div>
          )}

          {/* Email pour la facture */}
          <div>
            <input
              type="email"
              placeholder="Email pour recevoir votre ticket (optionnel)"
              value={invoiceEmail}
              onChange={e => setInvoiceEmail(e.target.value)}
              className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {/* Boutons paiement */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <button
              onClick={async () => { try { await requestBill("CARD"); } catch {} await payByCard(); }}
              className="py-3 rounded-xl bg-orange-600 hover:bg-orange-500 text-white font-bold text-sm transition-all"
            >
              💳 Payer par carte
            </button>
            <button
              onClick={() => requestBill("COUNTER")}
              className="py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 font-bold text-sm transition-all"
            >
              🏪 Caisse
            </button>
            <button
              onClick={() => requestBill("CASH")}
              className="py-3 rounded-xl bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 font-bold text-sm transition-all"
            >
              💵 Espèces
            </button>
          </div>
        </div>
      )}

      {/* Menu */}
      {!paid && Object.entries(byCat).map(([cat, items]) => (
        <section key={cat} className="mb-8">
          <h2 className="text-xs font-black uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-3">
            <span className="flex-1 h-px bg-orange-500/20" />
            {cat}
            <span className="flex-1 h-px bg-orange-500/20" />
          </h2>
          <div className="space-y-3">
            {items.map(m => (
              <div key={m.id} className="bg-white/[0.03] border border-white/[0.07] rounded-2xl overflow-hidden hover:bg-white/[0.05] transition-colors">
                <div className="flex gap-3 p-3">
                  {m.imageUrl && (
                    <ImageLightbox
                      src={m.imageUrl} alt={m.name}
                      className="w-20 h-20 rounded-xl object-cover shrink-0 cursor-pointer"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <h3 className="font-bold text-white text-sm leading-tight">{m.name}</h3>
                      <span className="font-black text-orange-400 text-sm shrink-0">{(m.priceCents / 100).toFixed(2)} €</span>
                    </div>
                    {m.description && (
                      <p className="text-xs text-white/65 mt-1 leading-relaxed line-clamp-2">{m.description}</p>
                    )}
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {m.diets?.map(d => (
                        <span key={d} className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">{DIET_LABELS[d] ?? d}</span>
                      ))}
                      {m.allergens?.map(a => (
                        <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">⚠️ {ALLERGEN_LABELS[a] ?? a}</span>
                      ))}
                    </div>
                  </div>
                  {/* Qty controls */}
                  <div className="flex flex-col items-center gap-1 shrink-0">
                    <button
                      onClick={() => inc(m.id, 1)}
                      className="w-8 h-8 rounded-lg bg-orange-600/80 hover:bg-orange-500 text-white font-black text-lg flex items-center justify-center transition-colors"
                    >
                      +
                    </button>
                    <span className="w-8 text-center text-sm font-black text-white py-0.5">
                      {cart[m.id] || 0}
                    </span>
                    <button
                      onClick={() => inc(m.id, -1)}
                      disabled={!cart[m.id]}
                      className="w-8 h-8 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] disabled:opacity-20 text-white font-black text-lg flex items-center justify-center transition-colors border border-white/[0.08]"
                    >
                      −
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {/* Sticky cart bar */}
      {cartTotal > 0 && !paid && (
        <div className="fixed bottom-0 left-0 right-0 bg-[#0a0a0a]/95 backdrop-blur-xl border-t border-white/[0.07] p-4 z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-xs text-white/40">Votre panier</p>
              <p className="text-xl font-black text-white">{(cartTotal / 100).toFixed(2)} €</p>
            </div>
            <button
              onClick={submitOrder}
              disabled={submitting}
              className="flex-1 max-w-[200px] py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-black text-base rounded-2xl transition-all shadow-lg shadow-orange-500/20"
            >
              {submitting ? "Envoi…" : "🛒 Commander"}
            </button>
          </div>
        </div>
      )}

      <NovaAssistant
        restaurantName={info.restaurant.name}
        menuContext={JSON.stringify(info.menu.map(m => ({ name: m.name, price: m.priceCents/100, desc: m.description })))}
      />
    </main>
  );
}
