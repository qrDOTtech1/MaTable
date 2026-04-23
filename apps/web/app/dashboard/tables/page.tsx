"use client";
import { useEffect, useMemo, useState } from "react";
import { io, Socket } from "socket.io-client";
import { api, API_URL, redirectOn401 } from "@/lib/api";
import { DashboardLayout, Card, Button, Badge } from "@/components/ui";

type Server = { id: string; name: string; active?: boolean };
type Session = {
  id: string;
  active: boolean;
  serverId?: string | null;
  server?: { id: string; name: string } | null;
  billRequestedAt?: string | null;
  billPaymentMode?: "CARD" | "CASH" | "COUNTER" | null;
  tipCents?: number;
};
type Table = {
  id: string;
  number: number;
  seats: number;
  label?: string | null;
  zone?: string | null;
  assignedServerId?: string | null;
  sessions: Session[];
};

const ALL_ZONES = "__all__";
const NO_ZONE = "__none__";

export default function TablesPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [restaurantId, setRestaurantId] = useState<string | null>(null);
  const [zoneFilter, setZoneFilter] = useState<string>(ALL_ZONES);
  const [editingId, setEditingId] = useState<string | null>(null);

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

  useEffect(() => {
    if (!restaurantId) return;
    const socket: Socket = io(API_URL, { auth: { restaurantId } });
    socket.on("bill:requested", () => reload());
    socket.on("order:paid", () => reload());
    socket.on("service:called", () => reload());
    return () => void socket.disconnect();
  }, [restaurantId]);

  const zones = useMemo(() => {
    const s = new Set<string>();
    tables.forEach((t) => { if (t.zone) s.add(t.zone); });
    return Array.from(s).sort();
  }, [tables]);

  const filtered = useMemo(() => {
    if (zoneFilter === ALL_ZONES) return tables;
    if (zoneFilter === NO_ZONE) return tables.filter((t) => !t.zone);
    return tables.filter((t) => t.zone === zoneFilter);
  }, [tables, zoneFilter]);

  const add = async () => {
    await api("/api/pro/tables", {
      method: "POST",
      body: JSON.stringify({ seats: 2, zone: zoneFilter !== ALL_ZONES && zoneFilter !== NO_ZONE ? zoneFilter : undefined }),
    });
    reload();
  };

  const patch = async (id: string, data: Partial<Table>) => {
    await api(`/api/pro/tables/${id}`, { method: "PATCH", body: JSON.stringify(data) });
    reload();
  };

  const remove = async (id: string) => {
    if (!confirm("Supprimer définitivement cette table ?")) return;
    await api(`/api/pro/tables/${id}`, { method: "DELETE" });
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

  const assignSessionServer = async (tableId: string, serverId: string | null) => {
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
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Tables</h2>
            <p className="text-white/50 text-sm">
              {tables.length} table(s) · {tables.filter((t) => t.sessions.find((s) => s.active)).length} occupée(s)
              · {tables.reduce((a, t) => a + t.seats, 0)} couverts total
            </p>
          </div>
          <div className="flex items-center gap-2">
            <select
              value={zoneFilter}
              onChange={(e) => setZoneFilter(e.target.value)}
              className="px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-orange-500 focus:outline-none"
            >
              <option value={ALL_ZONES}>Toutes les zones</option>
              {zones.map((z) => <option key={z} value={z}>{z}</option>)}
              <option value={NO_ZONE}>Sans zone</option>
            </select>
            <Button onClick={add}>+ Ajouter une table</Button>
          </div>
        </div>

        {/* Tables Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {filtered.map((t) => {
            const session = t.sessions.find((s) => s.active);
            const active = Boolean(session);
            const billMode = session?.billPaymentMode ?? null;
            const billRequested = Boolean(session?.billRequestedAt);
            const isEditing = editingId === t.id;
            const assignedServer = servers.find((s) => s.id === t.assignedServerId);

            return (
              <Card key={t.id} variant={active ? "cooking" : "default"} hover>
                {/* Header */}
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xl font-bold text-white">Table {t.number}</p>
                    {t.label && <p className="text-xs text-white/50">{t.label}</p>}
                    {t.zone && <p className="text-[10px] text-orange-300 font-bold uppercase tracking-wider mt-0.5">📍 {t.zone}</p>}
                  </div>
                  <Badge variant={active ? "cooking" : "default"}>
                    {active ? "🔴 Occupée" : "⚪ Libre"}
                  </Badge>
                </div>

                {/* Edit form */}
                {isEditing ? (
                  <div className="mb-3 pb-3 border-b border-white/10 space-y-2">
                    <div>
                      <label className="text-[10px] text-white/50 font-bold uppercase">Couverts</label>
                      <input
                        type="number"
                        min={1}
                        max={20}
                        defaultValue={t.seats}
                        onBlur={(e) => patch(t.id, { seats: Math.max(1, parseInt(e.target.value) || t.seats) })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/50 font-bold uppercase">Libellé</label>
                      <input
                        type="text"
                        defaultValue={t.label ?? ""}
                        placeholder="ex: Coin fenêtre"
                        onBlur={(e) => patch(t.id, { label: e.target.value || null as any })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-orange-500 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label className="text-[10px] text-white/50 font-bold uppercase">Zone</label>
                      <input
                        type="text"
                        list={`zones-${t.id}`}
                        defaultValue={t.zone ?? ""}
                        placeholder="Salle principale, Terrasse…"
                        onBlur={(e) => patch(t.id, { zone: e.target.value || null as any })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-orange-500 focus:outline-none"
                      />
                      <datalist id={`zones-${t.id}`}>
                        {zones.map((z) => <option key={z} value={z} />)}
                      </datalist>
                    </div>
                    <div>
                      <label className="text-[10px] text-white/50 font-bold uppercase">Serveur assigné (par défaut)</label>
                      <select
                        defaultValue={t.assignedServerId ?? ""}
                        onChange={(e) => patch(t.id, { assignedServerId: (e.target.value || null) as any })}
                        className="w-full px-2 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white text-sm focus:border-orange-500 focus:outline-none"
                      >
                        <option value="">— Aucun</option>
                        {servers.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                  </div>
                ) : (
                  <div className="mb-3 pb-3 border-b border-white/10 text-xs text-white/60 space-y-1">
                    <div>👥 <strong>{t.seats}</strong> couvert{t.seats > 1 ? "s" : ""}</div>
                    {assignedServer && <div>👤 Serveur par défaut : <strong className="text-white">{assignedServer.name}</strong></div>}
                  </div>
                )}

                {/* Session active — override serveur */}
                {active && (
                  <div className="mb-3 space-y-1">
                    <label className="text-[10px] text-white/50 font-bold uppercase">Serveur de la session</label>
                    <select
                      className="w-full px-2 py-1.5 rounded-lg border border-white/10 bg-white/5 text-white text-xs focus:border-orange-500 focus:outline-none"
                      value={session?.serverId ?? ""}
                      onChange={(e) => assignSessionServer(t.id, e.target.value || null)}
                    >
                      <option value="">— Non assigné</option>
                      {servers.map((s) => (
                        <option key={s.id} value={s.id}>{s.name}</option>
                      ))}
                    </select>
                    {billRequested && (
                      <Badge variant="pending">
                        🧾 Addition demandée
                        {session?.tipCents ? ` +${(session.tipCents / 100).toFixed(2)}€` : ""}
                      </Badge>
                    )}
                  </div>
                )}

                <div className="text-[10px] text-white/30 break-all mb-3 font-mono">{t.id}</div>

                {/* Actions */}
                <div className="space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() => setEditingId(isEditing ? null : t.id)}
                    >
                      {isEditing ? "✓ OK" : "✏️ Modifier"}
                    </Button>
                    <Button
                      variant="danger"
                      size="sm"
                      onClick={() => remove(t.id)}
                      disabled={active}
                    >
                      🗑️ Supprimer
                    </Button>
                  </div>
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
                    <Button variant="primary" size="sm" fullWidth onClick={() => settle(t.id)}>
                      ✅ Encaisser
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div className="text-center py-12 text-white/40 text-sm border border-dashed border-white/10 rounded-2xl">
            {tables.length === 0 ? "Aucune table. Cliquez sur « Ajouter une table »." : "Aucune table dans cette zone."}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
