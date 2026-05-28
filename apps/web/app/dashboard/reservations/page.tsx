"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// ── CSV export ────────────────────────────────────────────────────────────────
function exportCsv(reservations: Reservation[]) {
  const header = ["Date", "Heure", "Couverts", "Nom", "Email", "Téléphone", "Table", "Zone", "Statut"];
  const rows = reservations.map((r) => {
    const d = new Date(r.startsAt);
    return [
      d.toLocaleDateString("fr-FR"),
      d.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" }),
      r.partySize,
      r.customerName,
      r.customerEmail ?? "",
      r.customerPhone ?? "",
      r.table?.number ?? "",
      r.table?.zone ?? "",
      r.status,
    ];
  });
  const csv = [header, ...rows].map((row) => row.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(";")).join("\n");
  const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `reservations-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

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

function isoDay(d: Date) {
  return d.toISOString().slice(0, 10);
}

function startOfMonth(d: Date) {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}

function buildCalendarDays(month: Date) {
  const first = startOfMonth(month);
  const start = new Date(first);
  const mondayOffset = (first.getDay() + 6) % 7;
  start.setDate(first.getDate() - mondayOffset);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d;
  });
}

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"upcoming" | "all" | "today">("upcoming");
  const [updating, setUpdating] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [createForm, setCreateForm] = useState({ name: "", email: "", phone: "", date: new Date().toISOString().slice(0, 10), time: "19:00", guests: 2, notes: "" });
  const [creating, setCreating] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(() => startOfMonth(new Date()));
  const [selectedDay, setSelectedDay] = useState<string | null>(isoDay(new Date()));

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
    if (selectedDay) return isoDay(d) === selectedDay;
    if (filter === "today") return d.toDateString() === todayStr;
    if (filter === "upcoming") return d >= new Date(now.getFullYear(), now.getMonth(), now.getDate());
    return true;
  });

  const grouped = groupByDate(filtered);
  const calendarDays = buildCalendarDays(calendarMonth);
  const calendarCounts = reservations.reduce<Record<string, { count: number; covers: number }>>((acc, r) => {
    const key = isoDay(new Date(r.startsAt));
    acc[key] ??= { count: 0, covers: 0 };
    acc[key].count += 1;
    acc[key].covers += r.partySize;
    return acc;
  }, {});

  const counts = {
    upcoming: reservations.filter((r) => new Date(r.startsAt) >= new Date(now.getFullYear(), now.getMonth(), now.getDate())).length,
    today: reservations.filter((r) => new Date(r.startsAt).toDateString() === todayStr).length,
    all: reservations.length,
  };
  const selectedLabel = selectedDay
    ? new Date(`${selectedDay}T12:00:00`).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })
    : null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-black text-white">Réservations</h1>
          <p className="text-sm text-white/40 mt-0.5">{counts.upcoming} à venir · {counts.today} aujourd&apos;hui</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => exportCsv(reservations)}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/60 hover:text-white rounded-xl text-sm transition-colors"
            title="Exporter en CSV"
          >
            ⬇ CSV
          </button>
          <button
            onClick={load}
            className="px-3 py-2 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/70 hover:text-white rounded-xl text-sm transition-colors"
          >
            🔄 Actualiser
          </button>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl text-sm transition-colors flex items-center gap-1.5"
          >
            ＋ Réservation
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(["today", "upcoming", "all"] as const).map((f) => (
          <button
            key={f}
            onClick={() => { setFilter(f); setSelectedDay(f === "today" ? isoDay(new Date()) : null); }}
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

      {selectedDay && (
        <div className="flex items-center justify-between gap-3 rounded-2xl border border-orange-500/20 bg-orange-500/10 px-4 py-3 text-sm text-orange-100/80">
          <span>Filtre calendrier actif : <b className="text-orange-200 capitalize">{selectedLabel}</b> · {filtered.length} réservation{filtered.length > 1 ? "s" : ""}</span>
          <button type="button" onClick={() => setSelectedDay(null)} className="text-xs font-bold text-orange-300 hover:text-orange-200">
            Retirer le filtre
          </button>
        </div>
      )}

      {/* Calendar */}
      <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-4">
        <div className="flex items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-white">Calendrier des réservations</h2>
            <p className="text-xs text-white/35">Cliquez un jour pour filtrer la liste sans masquer les fonctions existantes.</p>
          </div>
          <div className="flex items-center gap-2">
            <button type="button" className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1))}>←</button>
            <span className="w-36 text-center text-sm font-bold text-white/80 capitalize">
              {calendarMonth.toLocaleDateString("fr-FR", { month: "long", year: "numeric" })}
            </span>
            <button type="button" className="px-3 py-1.5 rounded-lg bg-white/[0.05] border border-white/10 text-white/60 hover:text-white" onClick={() => setCalendarMonth(new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1))}>→</button>
          </div>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-[10px] font-bold uppercase tracking-wider text-white/30">
          {["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"].map(d => <div key={d}>{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1.5">
          {calendarDays.map((day) => {
            const key = isoDay(day);
            const stat = calendarCounts[key];
            const inMonth = day.getMonth() === calendarMonth.getMonth();
            const selected = selectedDay === key;
            const isToday = key === isoDay(new Date());
            return (
              <button
                key={key}
                type="button"
                onClick={() => { setSelectedDay(selected ? null : key); setFilter("all"); }}
                className={`min-h-20 rounded-xl border p-2 text-left transition-all ${
                  selected ? "bg-orange-500/20 border-orange-500/40" : "bg-white/[0.025] border-white/[0.06] hover:bg-white/[0.05]"
                } ${!inMonth ? "opacity-35" : ""}`}
              >
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-black ${isToday ? "text-orange-300" : "text-white/70"}`}>{day.getDate()}</span>
                  {stat && <span className="w-2 h-2 rounded-full bg-orange-400" />}
                </div>
                {stat && (
                  <div className="mt-2 text-[10px] text-white/45 leading-tight">
                    <p className="font-bold text-white/70">{stat.count} résa</p>
                    <p>{stat.covers} couverts</p>
                  </div>
                )}
              </button>
            );
          })}
        </div>
        {selectedDay && (
          <button type="button" className="text-xs text-orange-300 hover:text-orange-200" onClick={() => setSelectedDay(null)}>
            Voir toutes les réservations du filtre actif
          </button>
        )}
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
      {/* Modal création manuelle */}
      {createOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => setCreateOpen(false)} />
          <div className="relative bg-[#111] border border-white/[0.08] rounded-2xl p-6 shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-white">Nouvelle réservation</h2>
              <button onClick={() => setCreateOpen(false)} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white">✕</button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                setCreating(true);
                try {
                  await api("/api/pro/reservations", {
                    method: "POST",
                    body: JSON.stringify({ ...createForm, partySize: createForm.guests }),
                  });
                  setCreateOpen(false);
                  setCreateForm({ name: "", email: "", phone: "", date: new Date().toISOString().slice(0, 10), time: "19:00", guests: 2, notes: "" });
                  load();
                } finally {
                  setCreating(false);
                }
              }}
              className="space-y-3"
            >
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="text-xs text-white/40 block mb-1">Nom du client *</label>
                  <input required className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
                    value={createForm.name} onChange={(e) => setCreateForm((f) => ({ ...f, name: e.target.value }))} placeholder="Jean Dupont" />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Téléphone</label>
                  <input type="tel" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
                    value={createForm.phone} onChange={(e) => setCreateForm((f) => ({ ...f, phone: e.target.value }))} placeholder="+33 6 …" />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Email</label>
                  <input type="email" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
                    value={createForm.email} onChange={(e) => setCreateForm((f) => ({ ...f, email: e.target.value }))} placeholder="jean@…" />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Date *</label>
                  <input required type="date" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    value={createForm.date} onChange={(e) => setCreateForm((f) => ({ ...f, date: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Heure *</label>
                  <input required type="time" className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    value={createForm.time} onChange={(e) => setCreateForm((f) => ({ ...f, time: e.target.value }))} />
                </div>
                <div>
                  <label className="text-xs text-white/40 block mb-1">Couverts *</label>
                  <select className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    value={createForm.guests} onChange={(e) => setCreateForm((f) => ({ ...f, guests: Number(e.target.value) }))}>
                    {[1,2,3,4,5,6,7,8,9,10,12,15,20].map((n) => (
                      <option key={n} value={n} className="bg-[#1a1a1a]">{n} personne{n > 1 ? "s" : ""}</option>
                    ))}
                  </select>
                </div>
                <div className="col-span-2">
                  <label className="text-xs text-white/40 block mb-1">Notes</label>
                  <textarea rows={2} className="w-full bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50 resize-none"
                    value={createForm.notes} onChange={(e) => setCreateForm((f) => ({ ...f, notes: e.target.value }))} placeholder="Allergie, occasion spéciale…" />
                </div>
              </div>
              <button type="submit" disabled={creating}
                className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl transition-colors mt-2">
                {creating ? "Création…" : "Créer la réservation"}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
