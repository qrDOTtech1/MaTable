"use client";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL, redirectOn401 } from "@/lib/api";
import { DashboardLayout, Card, Button, Badge, Select } from "@/components/ui";

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
      .catch(redirectOn401);
    reload().catch(redirectOn401);
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

  const tabs = [
    { id: "live", icon: "🔴", label: "Cuisine en direct", badge: 0 },
    { id: "stats", icon: "📊", label: "Statistiques", badge: 0 },
    { id: "commandes", icon: "📋", label: "Commandes", badge: 0 },
    { id: "menu", icon: "🍽️", label: "Menu", badge: 0 },
    { id: "serveurs", icon: "👥", label: "Serveurs", badge: 0 },
    { id: "reservations", icon: "📅", label: "Réservations", badge: 0 },
  ];

  return (
    <DashboardLayout
      activeTabId="live"
      tabs={tabs}
      onTabChange={(tabId) => console.log("Tab changed to:", tabId)}
      restaurantName="Restaurant"
      title="Tables"
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Tables</h2>
            <p className="text-white/50">{tables.length} table(s) · {tables.filter((t) => t.sessions.find((s) => s.active)).length} occupée(s)</p>
          </div>
          <Button onClick={add}>+ Ajouter une table</Button>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {tables.map((t) => {
            const session = t.sessions.find((s) => s.active);
            const active = Boolean(session);
            const billMode = session?.billPaymentMode ?? null;
            const billRequested = Boolean(session?.billRequestedAt);

            return (
              <Card
                key={t.id}
                variant={active ? "cooking" : "default"}
                hover
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <p className="text-xl font-bold text-white">Table {t.number}</p>
                    {t.label && <p className="text-xs text-white/50">{t.label}</p>}
                    <p className="text-xs text-white/50">👥 {t.seats} couvert{t.seats > 1 ? "s" : ""}</p>
                  </div>
                  <Badge variant={active ? "cooking" : "default"}>
                    {active ? "🔴 Occupée" : "⚪ Libre"}
                  </Badge>
                </div>

                {/* Session Status */}
                {active && (
                  <div className="mb-4 space-y-2 pb-4 border-b border-white/10">
                    {billRequested && (
                      <Badge variant="pending">
                        🧾 Addition demandée
                        {session?.tipCents ? ` +${(session.tipCents / 100).toFixed(2)}€` : ""}
                      </Badge>
                    )}

                    {/* Server Assignment */}
                    <div className="space-y-1">
                      <label className="text-xs text-white/50">Serveur</label>
                      <select
                        className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-xs focus:border-orange-500 focus:outline-none transition-all"
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

                {/* Table ID */}
                <div className="text-[10px] text-white/30 break-all mb-4 font-mono">{t.id}</div>

                {/* Actions */}
                <div className="space-y-2">
                  <Button
                    variant={active ? "danger" : "secondary"}
                    size="sm"
                    fullWidth
                    disabled={!active}
                    onClick={() => reset(t.id)}
                  >
                    🔄 Reset session
                  </Button>

                  {active && billRequested && billMode !== "CARD" && (
                    <Button
                      variant="primary"
                      size="sm"
                      fullWidth
                      onClick={() => settle(t.id)}
                    >
                      ✅ Encaisser
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
