"use client";
import { useEffect, useMemo, useState } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { api } from "@/lib/api";

type MenuItem = {
  id: string;
  name: string;
  description?: string | null;
  priceCents: number;
  category?: string | null;
};

type TableInfo = {
  table: { id: string; number: number };
  restaurant: { id: string; name: string };
  menu: MenuItem[];
};

type MyOrder = {
  id: string;
  status: "PENDING" | "COOKING" | "SERVED" | "PAID" | "CANCELLED";
  totalCents: number;
  createdAt: string;
};

const tokenKey = (tableId: string) => `atable_session_${tableId}`;
const cartKey  = (tableId: string) => `atable_cart_${tableId}`;

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
  const [lastOrderId, setLastOrderId] = useState<string | null>(null);
  const [myOrders, setMyOrders] = useState<MyOrder[]>([]);
  const [billRequestedMode, setBillRequestedMode] = useState<"CARD" | "CASH" | "COUNTER" | null>(null);

  useEffect(() => {
    api<TableInfo>(`/api/tables/${tableUuid}`, { pro: false })
      .then(setInfo)
      .catch(() => setError("Table introuvable."));
  }, [tableUuid]);

  useEffect(() => {
    if (paid) localStorage.removeItem(tokenKey(tableUuid));
  }, [paid, tableUuid]);

  async function loadMyOrders(token: string) {
    const r = await api<{ orders: MyOrder[] }>(`/api/orders/mine`, {
      token,
      // Session token is not a pro token.
      pro: false,
    });
    setMyOrders(r.orders);
  }

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (paid) {
      setMyOrders([]);
      setBillRequestedMode(null);
      return;
    }
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    loadMyOrders(token).catch(() => {
      localStorage.removeItem(tokenKey(tableUuid));
    });
  }, [paid, tableUuid]);

  const total = useMemo(() => {
    if (!info) return 0;
    return info.menu.reduce(
      (s, m) => s + (cart[m.id] || 0) * m.priceCents,
      0
    );
  }, [cart, info]);

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
    const res = await api<{ token: string }>(`/api/session`, {
      method: "POST",
      pro: false,
      body: JSON.stringify({ tableId: tableUuid }),
    });
    localStorage.setItem(tokenKey(tableUuid), res.token);
    return res.token;
  }

  async function submitOrder() {
    if (!Object.keys(cart).length) return;
    setSubmitting(true);
    try {
      const token = await ensureToken();
      const items = Object.entries(cart).map(([menuItemId, quantity]) => ({
        menuItemId,
        quantity,
      }));
      const res = await api<{ orderId: string }>(`/api/orders`, {
        method: "POST",
        token,
        pro: false,
        body: JSON.stringify({ items }),
      });
      setLastOrderId(res.orderId);
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
    await api(`/api/bill/request`, {
      method: "POST",
      token,
      pro: false,
      body: JSON.stringify({ mode }),
    });
    setBillRequestedMode(mode);
  }

  async function payBill() {
    const token = localStorage.getItem(tokenKey(tableUuid));
    if (!token) return;
    try {
      // Session-level checkout: pays everything not yet paid for the table.
      const res = await api<{ url: string }>(`/api/stripe/checkout`, {
        method: "POST",
        token,
        body: JSON.stringify({}),
      });
      window.location.href = res.url;
    } catch (e: any) {
      alert("Paiement indisponible (Stripe non configuré ?) — " + e.message);
    }
  }

  if (error) return <main className="p-8 text-center">{error}</main>;
  if (!info) return <main className="p-8 text-center">Chargement…</main>;

  const unpaidOrders = myOrders.filter((o) => o.status !== "PAID" && o.status !== "CANCELLED");
  const unpaidTotal = unpaidOrders.reduce((s, o) => s + o.totalCents, 0);

  const byCat = info.menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    const k = m.category || "Autres";
    (acc[k] ||= []).push(m);
    return acc;
  }, {});

  return (
    <main className="max-w-2xl mx-auto p-4 pb-40">
      <header className="mb-6">
        <p className="text-sm text-slate-500">{info.restaurant.name}</p>
        <h1 className="text-3xl font-bold">Table {info.table.number}</h1>
      </header>

      {paid && (
        <div className="card bg-green-50 border-green-200 text-green-800 mb-4">
          Paiement reçu, merci !
        </div>
      )}

      {lastOrderId && !paid && (
        <div className="card bg-amber-50 border-amber-200 mb-4">
          <p className="font-medium">Commande envoyée en cuisine.</p>
        </div>
      )}

      {!paid && unpaidOrders.length > 0 && (
        <div className="card mb-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <div className="font-semibold">Addition</div>
              <div className="text-sm text-slate-500">
                Total dû : <span className="font-medium">{(unpaidTotal / 100).toFixed(2)} €</span>
              </div>
            </div>
            {billRequestedMode && (
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                Demandée ({billRequestedMode})
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-3">
            <button
              className="btn-primary"
              onClick={async () => {
                // Make it visible to the resto, then redirect to Stripe.
                try {
                  await requestBill("CARD");
                } catch {}
                await payBill();
              }}
            >
              Carte
            </button>
            <button className="btn-ghost" onClick={() => requestBill("COUNTER")}>
              Caisse
            </button>
            <button className="btn-ghost" onClick={() => requestBill("CASH")}>
              Espèces
            </button>
          </div>
        </div>
      )}

      {Object.entries(byCat).map(([cat, items]) => (
        <section key={cat} className="mb-6">
          <h2 className="text-lg font-semibold mb-2">{cat}</h2>
          <div className="space-y-2">
            {items.map((m) => (
              <div key={m.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-medium">{m.name}</div>
                  {m.description && (
                    <div className="text-sm text-slate-500">{m.description}</div>
                  )}
                  <div className="text-sm mt-1">
                    {(m.priceCents / 100).toFixed(2)} €
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button className="btn-ghost w-9 h-9 !p-0" onClick={() => inc(m.id, -1)}>−</button>
                  <span className="w-6 text-center">{cart[m.id] || 0}</span>
                  <button className="btn-ghost w-9 h-9 !p-0" onClick={() => inc(m.id, 1)}>+</button>
                </div>
              </div>
            ))}
          </div>
        </section>
      ))}

      {total > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 p-4">
          <div className="max-w-2xl mx-auto flex items-center justify-between gap-4">
            <div>
              <div className="text-sm text-slate-500">Total</div>
              <div className="text-xl font-bold">{(total / 100).toFixed(2)} €</div>
            </div>
            <button
              className="btn-primary flex-1"
              disabled={submitting}
              onClick={submitOrder}
            >
              {submitting ? "Envoi…" : "Commander"}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
