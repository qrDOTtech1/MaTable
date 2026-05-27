"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Reservation = {
  id: string;
  startsAt: string;
  partySize: number;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  status: string;
  table?: { number: number; zone?: string | null } | null;
};

const STATUS_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  PENDING:   { label: "En attente",  color: "bg-amber-500/10 text-amber-300 border-amber-500/30",   dot: "bg-amber-400" },
  CONFIRMED: { label: "Confirmée",   color: "bg-blue-500/10 text-blue-300 border-blue-500/30",      dot: "bg-blue-400" },
  SEATED:    { label: "Installée",   color: "bg-purple-500/10 text-purple-300 border-purple-500/30", dot: "bg-purple-400" },
  HONORED:   { label: "Honorée",     color: "bg-emerald-500/10 text-emerald-300 border-emerald-500/30", dot: "bg-emerald-400" },
  NO_SHOW:   { label: "No-show",     color: "bg-red-500/10 text-red-300 border-red-500/30",          dot: "bg-red-400" },
  CANCELLED: { label: "Annulée",     color: "bg-white/5 text-white/30 border-white/10",              dot: "bg-white/30" },
};

function groupByDate(reservations: Reservation[]) {
  const map = new Map<string, Reservation[]>();
  for (const r of reservations) {
    const day = new Date(r.startsAt).toLocaleDateString("fr-FR", {
      weekday: "long", day: "numeric", month: "long", year: "numeric",
    });
    if (!map.has(day)) map.set(day, []);
    map.get(day)!.push(r);
  }
  return map;
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all" | "today">("upcoming");
  const [updating, setUpdating] = useState<string | null>(null);

  const load = () => {
    setLoading(true);
    api<{ reservations: Reservation[] }>("/api/pro/reservations")
      .then((r) => setReservations(r.reservations))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const updateStatus = async (id: string, status: string) => {
    setUpdating(id);
    try {
      await api(`/api/pro/reservations/${id}/status`, {
        method: "POST",
        body: JSON.stringify({ status }),
      });
      setReservations((prev) =>
        prev.map((r) => (r.id === id ? { ...r, status } : r))
      );
    } finally {
      setUpdating(null);
    }
  };

  const now = new Date();
  const todayStr = now.toDateString();

  const filtered = reservations.filter((r) => {
    const d = new Date(r.startsAt);
    if (filter === "today") return d.toDateString() === todayStr;
    if (filter === "upcoming") return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return true;
  });

  const grouped = groupByDate(filtered);

  const counts = {
    upcoming: reservations.filter((r) => new Date(r.startsAt) >= new Date(now.getFullYear(), now.getMonth(), now.getDate())).length,
    today: reservations.filter((r) => new Date(r.startsAt).toDateString() === todayStr).length,
    all: reservations.length,
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Réservations</h1>
          <p className="text-sm text-white/40 mt-0.5">{counts.upcoming} à venir · {counts.today} aujourd&apos;hui</p>
        </div>
        <button
          onClick={load}
          className="px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/70 hover:text-white rounded-xl text-sm transition-colors"
        >
          🔄 Actualiser
        </button>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["today", "upcoming", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all border ${
              filter === f
                ? "bg-orange-500/20 border-orange-500/30 text-orange-300"
                : "bg-white/[0.03] border-white/[0.07] text-white/50 hover:text-white/70"
            }`}
          >
            {f === "today" ? `Aujourd'hui (${counts.today})` : f === "upcoming" ? `À venir (${counts.upcoming})` : `Tout (${counts.all})`}
          </button>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div className="flex items-center gap-3 py-12 justify-center text-white/30">
          <div className="w-5 h-5 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
          Chargement…
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-12 text-center">
          <p className="text-3xl mb-3">📅</p>
          <p className="text-white/50 text-sm">Aucune réservation {filter === "today" ? "aujourd'hui" : filter === "upcoming" ? "à venir" : ""}</p>
        </div>
      ) : (
        <div className="space-y-6">
          {Array.from(grouped.entries()).map(([day, list]) => (
            <div key={day}>
              <h2 className="text-xs font-bold text-white/30 uppercase tracking-wider mb-3 px-1 capitalize">{day}</h2>
              <div className="space-y-2">
                {list.map((r) => {
                  const cfg = STATUS_CONFIG[r.status] ?? STATUS_CONFIG.PENDING;
                  const time = new Date(r.startsAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
                  return (
                    <div
                      key={r.id}
                      className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 flex items-center gap-4 flex-wrap"
                    >
                      {/* Time */}
                      <div className="text-center shrink-0 w-14">
                        <p className="text-lg font-black text-white">{time}</p>
                        <p className="text-[10px] text-white/30 font-bold uppercase">
                          {r.partySize} cvt
                        </p>
                      </div>

                      {/* Divider */}
                      <div className="w-px h-10 bg-white/[0.07] shrink-0 hidden sm:block" />

                      {/* Customer */}
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-white truncate">{r.customerName}</p>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          {r.customerEmail && (
                            <span className="text-xs text-white/40 truncate">{r.customerEmail}</span>
                          )}
                          {r.customerPhone && (
                            <span className="text-xs text-white/40">{r.customerPhone}</span>
                          )}
                        </div>
                        {r.table && (
                          <div className="flex items-center gap-1 mt-1">
                            <span className="text-[11px] bg-white/[0.06] px-2 py-0.5 rounded-full text-white/50 font-medium">
                              🪑 Table {r.table.number}{r.table.zone ? ` · ${r.table.zone}` : ""}
                            </span>
                          </div>
                        )}
                      </div>

                      {/* Status badge + selector */}
                      <div className="flex items-center gap-2 shrink-0">
                        <span className={`hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${cfg.color}`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
                          {cfg.label}
                        </span>
                        <select
                          disabled={updating === r.id}
                          value={r.status}
                          onChange={(e) => updateStatus(r.id, e.target.value)}
                          className="bg-white/[0.06] border border-white/[0.1] rounded-xl px-3 py-1.5 text-sm text-white disabled:opacity-50 focus:outline-none focus:border-orange-500/50"
                        >
                          <option value="PENDING"   className="bg-[#1a1a1a]">En attente</option>
                          <option value="CONFIRMED" className="bg-[#1a1a1a]">Confirmée</option>
                          <option value="SEATED"    className="bg-[#1a1a1a]">Installée</option>
                          <option value="HONORED"   className="bg-[#1a1a1a]">Honorée</option>
                          <option value="NO_SHOW"   className="bg-[#1a1a1a]">No-show</option>
                          <option value="CANCELLED" className="bg-[#1a1a1a]">Annulée</option>
                        </select>
                        {updating === r.id && (
                          <div className="w-4 h-4 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
