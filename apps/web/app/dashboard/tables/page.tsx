"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL } from "@/lib/api";

type Server = { id: string; name: string };
type Session = {
  id: string;
  active: boolean;
  serverId?: string | null;
  billRequestedAt?: string | null;
  billPaymentMode?: "CARD" | "CASH" | "COUNTER" | null;
  tipCents?: number;
};
type Table = {
  id: string;
  number: number;
  seats: number;
  label?: string | null;
  sessions: Session[];
};

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);

  const reload = async () => {
    const r = await api<{ tables: Table[] }>("/api/pro/tables");
    setTables(r.tables);
  };

  useEffect(() => {
    api<{ restaurant: { id: string } }>("/api/pro/me")
      .then((r) => setRestaurantId(r.restaurant.id))
      .catch(() => (window.location.href = "/login"));
    reload().catch(() => (window.location.href = "/login"));
    api<{ servers: Server[] }>("/api/pro/servers")
      .then((r) => setServers(r.servers.filter((s: any) => s.active)))
      .catch(() => {});
  }, []);

  // Socket.io temps réel
  useEffect(() => {
    if (!restaurantId) return;
    const socket: Socket = io(API_URL, { auth: { restaurantId } });
    socket.on("bill:requested", () => reload());
    socket.on("order:paid", () => reload());
    socket.on("service:called", () => reload());
    return () => void socket.disconnect();
  }, [restaurantId]);

  const add = async () => {
    await api("/api/pro/tables", { method: "POST" });
    reload();
  };

  const reset = async (id: string) => {
    if (!confirm("Fermer la session en cours sur cette table ?")) return;
    await api(`/api/pro/tables/${id}/reset`, { method: "POST" });
    reload();
  };

  const settle = async (id: string) => {
    if (!confirm("Marquer comme payée et fermer la session active ?")) return;
    await api(`/api/pro/tables/${id}/settle`, { method: "POST" });
    reload();
  };

  const assignServer = async (tableId: string, serverId: string | null) => {
    await api(`/api/pro/tables/${tableId}/assign-server`, {
      method: "POST",
      body: JSON.stringify({ serverId }),
    });
    reload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Tables</h1>
        <button className="btn-primary" onClick={add}>+ Ajouter une table</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
        {tables.map((t) => {
          const session = t.sessions.find((s) => s.active);
          const active = Boolean(session);
          const billMode = session?.billPaymentMode ?? null;
          const billRequested = Boolean(session?.billRequestedAt);
          const currentServer = servers.find((s) => s.id === session?.serverId);

          return (
            <div
              key={t.id}
              className={`card border-2 transition-colors ${
                active ? "border-green-200" : "border-slate-100"
              }`}
            >
              {/* En-tête */}
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="text-xl font-bold">Table {t.number}</div>
                  {t.label && <div className="text-xs text-slate-400">{t.label}</div>}
                  <div className="text-xs text-slate-400">{t.seats} couvert{t.seats > 1 ? "s" : ""}</div>
                </div>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  active ? "bg-green-100 text-green-700" : "bg-slate-100 text-slate-500"
                }`}>
                  {active ? "Occupée" : "Libre"}
                </span>
              </div>

              {/* Badges session */}
              {active && (
                <div className="space-y-1 mb-3">
                  {billRequested && (
                    <div className="text-xs px-2 py-1 rounded bg-amber-100 text-amber-800 font-medium">
                      🧾 Addition demandée{billMode ? ` · ${billMode}` : ""}
                      {session?.tipCents ? ` · +${(session.tipCents / 100).toFixed(2)} € pourboire` : ""}
                    </div>
                  )}

                  {/* Attribution serveur */}
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-slate-500">Serveur :</span>
                    <select
                      className="flex-1 border rounded px-1.5 py-0.5 text-xs"
                      value={session?.serverId ?? ""}
                      onChange={(e) => assignServer(t.id, e.target.value || null)}
                    >
                      <option value="">— Non assigné</option>
                      {servers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {/* ID table (raccourci) */}
              <div className="text-[10px] text-slate-300 break-all mb-3 font-mono">{t.id}</div>

              {/* Actions */}
              <div className="space-y-1.5">
                <button
                  className="btn-ghost w-full text-sm"
                  disabled={!active}
                  onClick={() => reset(t.id)}
                >
                  🔄 Reset session
                </button>

                {active && billRequested && billMode !== "CARD" && (
                  <button
                    className="btn-primary w-full text-sm"
                    onClick={() => settle(t.id)}
                  >
                    ✅ Encaisser
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
