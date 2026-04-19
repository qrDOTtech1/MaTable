"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL } from "@/lib/api";

type Table = {
  id: string;
  number: number;
  sessions: Array<{
    id: string;
    active: boolean;
    billRequestedAt?: string | null;
    billPaymentMode?: "CARD" | "CASH" | "COUNTER" | null;
  }>;
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  async function reload() {
    const r = await api<{ tables: Table[] }>(`/api/pro/tables`);
    setTables(r.tables);
  }

  useEffect(() => {
    api<{ restaurant: { id: string } }>(`/api/pro/me`)
      .then((r) => setRestaurantId(r.restaurant.id))
      .catch(() => (window.location.href = "/login"));

    reload().catch(() => (window.location.href = "/login"));
  }, []);

  useEffect(() => {
    if (!restaurantId) return;
    const socket: Socket = io(API_URL, { auth: { restaurantId } });
    socket.on("bill:requested", () => reload());
    socket.on("order:paid", () => reload());
    return () => void socket.disconnect();
  }, [restaurantId]);

  async function add() {
    await api(`/api/pro/tables`, { method: "POST" });
    reload();
  }

  async function reset(id: string) {
    if (!confirm("Fermer la session en cours sur cette table ?")) return;
    await api(`/api/pro/tables/${id}/reset`, { method: "POST" });
    reload();
  }

  async function settle(id: string) {
    if (!confirm("Marquer comme payée et fermer la session active ?")) return;
    await api(`/api/pro/tables/${id}/settle`, { method: "POST" });
    reload();
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tables</h1>
        <button className="btn-primary" onClick={add}>+ Ajouter une table</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {tables.map((t) => {
          const active = t.sessions.some((s) => s.active);
          const s0 = t.sessions[0];
          const billMode = s0?.billPaymentMode ?? null;
          const billRequested = Boolean(s0?.billRequestedAt);
          return (
            <div key={t.id} className="card">
              <div className="flex items-center justify-between mb-2">
                <div className="text-xl font-bold">Table {t.number}</div>
                <span
                  className={`text-xs px-2 py-0.5 rounded ${
                    active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                  }`}
                >
                  {active ? "Occupée" : "Libre"}
                </span>
              </div>

              {active && billRequested && (
                <div className="text-xs mb-2">
                  <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800">
                    Addition demandée{billMode ? ` (${billMode})` : ""}
                  </span>
                </div>
              )}

              <div className="text-xs text-slate-500 break-all mb-3">{t.id}</div>
              <button
                className="btn-ghost w-full text-sm"
                disabled={!active}
                onClick={() => reset(t.id)}
              >
                Reset Table
              </button>

              {active && billRequested && billMode !== "CARD" && (
                <button className="btn-primary w-full text-sm mt-2" onClick={() => settle(t.id)}>
                  Encaisser
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
