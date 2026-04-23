"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { io, Socket } from "socket.io-client";
import { api, API_URL } from "@/lib/api";
import { ImageLightbox } from "./ImageLightbox";
import { NovaAssistant } from "@/components/ui";

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  category?: string | null;
  imageUrl?: string | null;
  allergens?: string[];
  diets?: string[];
};

type TableInfo = {
  table: { id: string; number: number; zone?: string };
  restaurant: {
    id: string;
    name: string;
    slug: string;
    tipsEnabled: boolean;
    reviewsEnabled: boolean;
    serviceCallEnabled: boolean;
    openingHours?: unknown;
    timezone?: string | null;
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

const STATUS_LABELS: Record<MyOrder["status"], { label: string; color: string; icon: string }> = {
  PENDING:   { label: "Reçue", color: "bg-amber-50 border-amber-100 text-amber-800", icon: "📩" },
  COOKING:   { label: "En préparation", color: "bg-orange-50 border-orange-100 text-orange-800", icon: "👨‍🍳" },
  SERVED:    { label: "Servie", color: "bg-emerald-50 border-emerald-100 text-emerald-800", icon: "✅" },
  PAID:      { label: "Payée", color: "bg-blue-50 border-blue-100 text-blue-800", icon: "💳" },
  CANCELLED: { label: "Annulée", color: "bg-red-50 border-red-100 text-red-800", icon: "❌" },
};

const tokenKey = (tableId: string) => `atable_session_${tableId}`;
const sessionIdKey = (tableId: string) => `atable_session_id_${tableId}`;
const cartKey  = (tableId: string) => `atable_cart_${tableId}`;

function parseHm(s: string): number | null {
  const m = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(s);
  if (!m) return null;
  return Number(m[1]) * 60 + Number(m[2]);
}

function isOpenNow(openingHours: unknown): boolean | null {
  if (!Array.isArray(openingHours)) return null;
  const now = new Date();
  const jsDay = now.getDay();
  const day = jsDay === 0 ? 6 : jsDay - 1;
  const mins = now.getHours() * 60 + now.getMinutes();

  const entry = (openingHours as any[]).find((x) => x?.day === day);
  if (!entry) return null;
  if (entry.closed) return false;
  const o = parseHm(String(entry.open ?? ""));
  const c = parseHm(String(entry.close ?? ""));
  if (o == null || c == null) return null;
  return mins >= o && mins <= c;
}

function StarRating({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex gap-1">
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`text-2xl transition-transform hover:scale-110 ${value >= i ? "text-yellow-400" : "text-slate-200"}`}
        >
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

  const [info, setInfo] = useState<TableInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cart, setCart] = useState<Record<string, number>>(() => {
    if (typeof window === "undefined") return {};
    try { return JSON.parse(localStorage.getItem(cartKey(tableUuid)) || "{}"); } catch { return {}; }
  });
  const [submitting, setSubmitting] = useState(false);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [billRequestedMode, setBillRequestedMode] = useState<"CARD" | "CASH" | "COUNTER" | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(sessionIdKey(tableUuid));
  });

  // Service call
  const [callingService, setCallingService] = useState(false);
  const [serviceCalled, setServiceCalled] = useState(false);

  // Tip
  const [customTip, setCustomTip] = useState("");
  const [submittingTip, setSubmittingTip] = useState(false);
  const [tipSuccess, setTipSuccess] = useState(false);

  // Reviews
  const [serverRating, setServerRating] = useState(0);
  const [dishRatings, setDishRatings] = useState<Record<string, number>>({});
  const [submittingReview, setSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState(false);

  useEffect(() => {
    api<TableInfo>(`/api/tables/${tableUuid}`, { pro: false })
      .then(setInfo)
      .catch(() => setError("Table introuvable."));
  }, [tableUuid]);

  useEffect(() => {
    if (paid) {
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
    if (paid) {
      // Don't clear orders on paid, we need them for reviews
      const token = localStorage.getItem(tokenKey(tableUuid));
      if (token) loadMyOrders(token).catch(() => {});
      setBillRequestedMode(null);
      setSessionId(null);
      return;
    }
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
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("À table !", { body: "Votre commande est prête et arrive !" });
        }
        try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch (e) {}
      }
    });

    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
    return () => void socket.disconnect();
  }, [sessionId]);

  const total = useMemo(() => {
    if (!info) return 0;
    return info.menu.reduce((s, m) => s + (cart[m.id] || 0) * m.priceCents, 0);
  }, [cart, info]);

  // Unique ordered items for review
  const orderedItems = useMemo(() => {
    if (!info) return [];
    const ids = new Set<string>();
    myOrders.forEach(o => {
      if (o.status !== "CANCELLED" && Array.isArray(o.items)) {
        o.items.forEach(item => ids.add(item.menuItemId));
      }
    });
    return info.menu.filter(m => ids.has(m.id));
  }, [myOrders, info]);

  function inc(id: string, delta: number) {
    setCart((c) => {
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
      await api(`/api/service-call`, {
        method: "POST", token, pro: false, body: JSON.stringify({ reason: "Appel depuis la table" })
      });
      setServiceCalled(true);
      setTimeout(() => setServiceCalled(false), 5000);
    } catch(e) {
      alert("Erreur lors de l'appel");
    } finally {
      setCallingService(false);
    }
  }

  async function submitOrder() {
    if (!Object.keys(cart).length) return;
    setSubmitting(true);
    try {
      const token = await ensureToken();
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({ menuItemId, quantity }));
      await api<{ orderId: string }>(`/api/orders`, {
        method: "POST", token, pro: false, body: JSON.stringify({ items }),
      });
      setCart({});
      localStorage.removeItem(cartKey(tableUuid));
      await loadMyOrders(token);
    } catch (e: any) {
      if (String(e.message).startsWith("401")) {
        localStorage.removeItem(tokenKey(tableUuid));
        alert("Votre session a expiré, réessayez.");
      } else {
        alert("Erreur : " + e.message);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function requestBill(mode: "CARD" | "CASH" | "COUNTER") {
    const token = await ensureToken();
    await api(`/api/bill/request`, { method: "POST", token, pro: false, body: JSON.stringify({ mode }) });
    setBillRequestedMode(mode);
  }

  async function payBill() {
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    try {
      const res = await api<{ url: string }>(`/api/stripe/checkout`, { method: "POST", token, body: JSON.stringify({}) });
      window.location.href = res.url;
    } catch (e: any) {
      alert("Paiement indisponible (Stripe non configuré ?) — " + e.message);
    }
  }

  async function sendTip(amountCents: number) {
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    setSubmittingTip(true);
    try {
      await api(`/api/tip`, { method: "POST", token, pro: false, body: JSON.stringify({ amountCents }) });
      setTipSuccess(true);
    } catch (e) {
      alert("Erreur lors de l'envoi du pourboire");
    } finally {
      setSubmittingTip(false);
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
          dishReviews: dishReviews.length > 0 ? dishReviews : undefined
        })
      });
      setReviewSuccess(true);
    } catch (e) {
      alert("Erreur lors de l'envoi de l'avis");
    } finally {
      setSubmittingReview(false);
    }
  }

  if (error) return <main className="p-8 text-center">{error}</main>;
  if (!info) return <main className="p-8 text-center">Chargement…</main>;

  const unpaidOrders = myOrders.filter((o) => o.status !== "PAID" && o.status !== "CANCELLED");
  const unpaidTotal = unpaidOrders.reduce((s, o) => s + o.totalCents, 0);

  const openState = isOpenNow(info.restaurant.openingHours);
  const restaurantClosed = openState === false;

  const byCat = info.menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    const k = m.category || "Autres";
    (acc[k] ||= []).push(m);
    return acc;
  }, {});

  const showFeedback = paid || billRequestedMode !== null || myOrders.some(o => o.status === "SERVED");

  return (
    <main className="max-w-2xl mx-auto p-4 pb-40">
      <header className="mb-6 flex justify-between items-start">
        <div>
          <p className="text-sm text-slate-500">{info.restaurant.name}</p>
          <h1 className="text-3xl font-bold">Table {info.table.number}</h1>
        </div>
        <Link 
          href={`https://matable.app/onboarding?restaurantId=${info.restaurant.id}&tableId=${info.table.id}`}
          className="flex items-center gap-2 bg-gradient-to-r from-orange-500 to-rose-500 text-white px-4 py-2 rounded-full text-xs font-black shadow-lg hover:scale-105 transition-all"
        >
          ✨ SOCIAL
        </Link>
      </header>

      {/* Server Banner */}
      {info.server && (
        <div className="flex items-center gap-3 bg-white shadow-sm border border-slate-100 p-3 rounded-2xl mb-6">
          <div className="w-12 h-12 rounded-full bg-orange-100 text-orange-600 flex items-center justify-center font-bold text-lg overflow-hidden shrink-0 border border-orange-200">
            {info.server.photoUrl ? (
              <img src={info.server.photoUrl} alt="server" className="w-full h-full object-cover" />
            ) : (
              info.server.name[0]?.toUpperCase()
            )}
          </div>
          <div className="flex-1">
            <div className="text-sm font-bold text-slate-800">
              Votre serveur(se) : <span className="text-orange-600">{info.server.name}</span>
            </div>
            <div className="text-xs text-slate-500 mt-0.5">
              {info.table.zone ? `Zone : ${info.table.zone}` : 'À votre service aujourd\'hui'}
            </div>
          </div>
          {info.restaurant.serviceCallEnabled && (
            <button 
              onClick={callService} 
              disabled={callingService || serviceCalled}
              className={`w-12 h-12 rounded-full flex items-center justify-center text-xl transition-all shadow-sm ${
                serviceCalled 
                  ? "bg-emerald-100 text-emerald-600 border border-emerald-200" 
                  : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
              }`}
            >
              {serviceCalled ? "✅" : "🛎️"}
            </button>
          )}
        </div>
      )}

      {paid && (
        <div className="card bg-emerald-50 border-emerald-200 text-emerald-800 mb-6 text-center py-6">
          <div className="text-4xl mb-2">🎉</div>
          <h2 className="text-xl font-bold">Paiement reçu, merci !</h2>
          <p className="text-sm opacity-80 mt-1">Nous espérons vous revoir très bientôt.</p>
        </div>
      )}

      {/* Feedback & Tips Section (Shown after serving or paying) */}
      {showFeedback && (
        <div className="space-y-4 mb-8">
          {info.restaurant.tipsEnabled && !tipSuccess && (
            <div className="card bg-gradient-to-br from-orange-50 to-rose-50 border-orange-100">
              <h3 className="font-bold text-slate-800 mb-3 flex items-center gap-2">
                💝 Laisser un pourboire
              </h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                {[200, 500, 1000].map(cents => (
                  <button
                    key={cents}
                    onClick={() => sendTip(cents)}
                    disabled={submittingTip}
                    className="py-2 rounded-xl bg-white border border-orange-200 text-orange-600 font-bold hover:bg-orange-50 transition-colors"
                  >
                    {(cents / 100).toFixed(2)} €
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input 
                  type="number"
                  min="0"
                  step="1"
                  placeholder="Montant libre (€)"
                  value={customTip}
                  onChange={e => setCustomTip(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-xl border border-orange-200 focus:outline-none focus:border-orange-500"
                />
                <button
                  onClick={() => sendTip(Math.round(parseFloat(customTip || "0") * 100))}
                  disabled={!customTip || submittingTip}
                  className="px-4 bg-orange-500 text-white rounded-xl font-bold disabled:opacity-50"
                >
                  Valider
                </button>
              </div>
            </div>
          )}
          {tipSuccess && (
            <div className="card bg-emerald-50 border-emerald-100 text-emerald-700 text-center font-medium">
              💝 Merci pour votre pourboire !
            </div>
          )}

          {info.restaurant.reviewsEnabled && !reviewSuccess && orderedItems.length > 0 && (
            <div className="card">
              <h3 className="font-bold text-slate-800 mb-4 flex items-center gap-2">
                ⭐ Donnez votre avis
              </h3>
              
              {info.server && (
                <div className="mb-4 pb-4 border-b border-slate-100">
                  <div className="text-sm font-medium mb-2">Service de {info.server.name}</div>
                  <StarRating value={serverRating} onChange={setServerRating} />
                </div>
              )}

              <div className="space-y-4 mb-4">
                <div className="text-sm font-medium">Plats commandés :</div>
                {orderedItems.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4">
                    <span className="text-sm text-slate-600 truncate">{item.name}</span>
                    <StarRating 
                      value={dishRatings[item.id] || 0} 
                      onChange={v => setDishRatings(prev => ({ ...prev, [item.id]: v }))} 
                    />
                  </div>
                ))}
              </div>

              <button
                onClick={submitReviews}
                disabled={submittingReview || (serverRating === 0 && Object.keys(dishRatings).length === 0)}
                className="w-full py-3 rounded-xl bg-slate-900 text-white font-bold disabled:opacity-50 transition-opacity"
              >
                Envoyer mon avis
              </button>
            </div>
          )}
          {reviewSuccess && (
            <div className="card bg-emerald-50 border-emerald-100 text-emerald-700 text-center font-medium">
              ⭐ Merci pour votre avis !
            </div>
          )}
        </div>
      )}

      {!paid && myOrders.length > 0 && (
        <div className="space-y-2 mb-4">
          {myOrders
            .filter(o => o.status !== "PAID" && o.status !== "CANCELLED")
            .map(o => (
              <div key={o.id} className={`flex items-center justify-between px-4 py-2 rounded-lg border ${STATUS_LABELS[o.status].color}`}>
                <div className="flex items-center gap-2">
                  <span>{STATUS_LABELS[o.status].icon}</span>
                  <span className="text-sm font-semibold">{STATUS_LABELS[o.status].label}</span>
                </div>
                <span className="text-xs opacity-60">{new Date(o.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            ))
          }
        </div>
      )}

      {!paid && unpaidOrders.length > 0 && (
        <div className="card mb-6 border-slate-200 shadow-sm">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-bold text-lg">Addition</div>
              <div className="text-sm text-slate-500">
                Total dû : <span className="font-bold text-slate-800">{(unpaidTotal / 100).toFixed(2)} €</span>
              </div>
            </div>
            {billRequestedMode && (
              <span className="text-xs px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-semibold border border-amber-200">
                Demandée ({billRequestedMode})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-4">
            <button
              className="btn-primary"
              onClick={async () => {
                try { await requestBill("CARD"); } catch {}
                await payBill();
              }}
            >
              💳 Carte
            </button>
            <button className="btn-ghost" onClick={() => requestBill("COUNTER")}>
              🏪 Caisse
            </button>
            <button className="btn-ghost" onClick={() => requestBill("CASH")}>
              💵 Espèces
            </button>
          </div>
        </div>
      )}

      {!paid && restaurantClosed && (
        <div className="card bg-slate-50 border-slate-200 mb-4">
          <div className="font-medium">Restaurant fermé</div>
          <div className="text-sm text-slate-600">
            Les commandes sont désactivées en dehors des horaires d'ouverture.
          </div>
        </div>
      )}

      {!paid && Object.entries(byCat).map(([cat, items]) => (
        <section key={cat} className="mb-8">
          <h2 className="text-xl font-bold mb-4 pb-2 border-b border-slate-100">{cat}</h2>
          <div className="space-y-4">
            {items.map((m) => (
              <div key={m.id} className="card flex gap-4 items-start shadow-sm hover:shadow-md transition-shadow">
                {m.imageUrl && (
                  <ImageLightbox
                    src={m.imageUrl}
                    alt={m.name}
                    className="w-24 h-24 rounded-xl object-cover shrink-0"
                  />
                )}

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="font-bold text-slate-800 leading-tight">{m.name}</div>
                    <div className="text-sm font-black text-brand shrink-0">
                      {(m.priceCents / 100).toFixed(2)} €
                    </div>
                  </div>

                  {m.description && (
                    <div className="text-sm text-slate-500 mt-1 line-clamp-2">{m.description}</div>
                  )}

                  {m.diets && m.diets.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {m.diets.map((d) => (
                        <span key={d} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-100 font-medium">
                          {DIET_LABELS[d] ?? d}
                        </span>
                      ))}
                    </div>
                  )}

                  {m.allergens && m.allergens.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {m.allergens.map((a) => (
                        <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-100 font-medium">
                          ⚠️ {ALLERGEN_LABELS[a] ?? a}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center gap-1 shrink-0 mt-1 bg-slate-50 rounded-lg p-1 border border-slate-100">
                  <button
                    className="w-8 h-8 rounded-md bg-white border border-slate-200 text-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    onClick={() => inc(m.id, 1)}
                  >
                    +
                  </button>
                  <span className="w-8 text-center text-sm font-bold text-slate-800 py-1">
                    {cart[m.id] || 0}
                  </span>
                  <button
                    className="w-8 h-8 rounded-md bg-white border border-slate-200 text-lg flex items-center justify-center font-bold text-slate-600 hover:bg-slate-100 disabled:opacity-30"
                    onClick={() => inc(m.id, -1)}
                    disabled={!cart[m.id]}
                  >
                    −
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {total > 0 && !paid && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] z-50">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-sm font-medium text-slate-500">Total panier</div>
              <div className="text-2xl font-black text-slate-900">{(total / 100).toFixed(2)} €</div>
            </div>
            <button
              className="bg-slate-900 text-white rounded-xl px-8 py-4 font-bold flex-1 max-w-[200px] shadow-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-800 transition-colors"
              disabled={submitting || restaurantClosed}
              onClick={submitOrder}
            >
              {submitting ? "Envoi…" : "🛒 Commander"}
            </button>
          </div>
        </div>
      )}

      {/* NovaTech Assistant */}
      <NovaAssistant 
        restaurantName={info.restaurant.name} 
        menuContext={JSON.stringify(info.menu.map(m => ({ name: m.name, price: m.priceCents/100, desc: m.description })))} 
      />
    </main>
  );
}