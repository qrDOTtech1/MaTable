"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";
import { io, Socket } from "socket.io-client";

// ─── Types ───────────────────────────────────────────────────────────────────
type ServerInfo = { id: string; name: string; photoUrl?: string | null };
type RestaurantInfo = { id: string; name: string; subscription: string };
type Schedule = { dayOfWeek: number; openMin: number; closeMin: number };
type Note = { id: string; content: string; updatedAt: string };
type Challenge = { id: string; title: string; done: boolean; dueDate?: string | null };
type Order = { id: string; status: string; totalCents: number; items: any[]; createdAt: string };
type TableSession = {
  id: string;
  table: { number: number; seats: number };
  orders: Order[];
};
type TableMap = {
  id: string; number: number; seats: number;
  sessions: { server: { id: string; name: string } | null }[];
};
type Stats = { ordersToday: number; avgRating: number | null; totalReviews: number; tipsToday: number };

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const STATUS_LABEL: Record<string, string> = { PENDING: "À préparer", COOKING: "En cuisine", SERVED: "À servir" };
const STATUS_COLOR: Record<string, string> = { PENDING: "text-yellow-400", COOKING: "text-orange-400", SERVED: "text-emerald-400" };

function minToHhmm(m: number) {
  return `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;
}

function serverFetch<T>(path: string, opts?: RequestInit): Promise<T> {
  const token = localStorage.getItem("server_token");
  return fetch(`${API_URL}${path}`, {
    ...opts,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...(opts?.headers ?? {}),
    },
  }).then(async (r) => {
    if (r.status === 401) {
      localStorage.removeItem("server_token");
      window.location.href = `/${window.location.pathname.split("/")[1]}/login`;
      throw new Error("Unauthorized");
    }
    const json = await r.json();
    if (!r.ok) throw new Error(json.error ?? "Error");
    return json as T;
  });
}

type Tab = "tables" | "planning" | "notes" | "defis" | "stats";

// ─── Main Component ───────────────────────────────────────────────────────────
export default function ServeurDashPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [server, setServer] = useState<ServerInfo | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantInfo | null>(null);
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [notes, setNotes] = useState<Note[]>([]);
  const [challenges, setChallenges] = useState<Challenge[]>([]);
  const [sessions, setSessions] = useState<TableSession[]>([]);
  const [allTables, setAllTables] = useState<TableMap[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<Tab>("tables");
  const [loading, setLoading] = useState(true);

  // notes state
  const [newNote, setNewNote] = useState("");
  const [editingNote, setEditingNote] = useState<string | null>(null);
  const [editContent, setEditContent] = useState("");

  // challenges state
  const [newChallenge, setNewChallenge] = useState("");

  // IA planning
  const [iaContext, setIaContext] = useState("");
  const [iaSuggestions, setIaSuggestions] = useState<string | null>(null);
  const [iaLoading, setIaLoading] = useState(false);
  const [iaError, setIaError] = useState<string | null>(null);

  const hasIA = restaurant?.subscription === "PRO_IA";

  // ── Load data ─────────────────────────────────────────────────────────────
  const loadAll = useCallback(async () => {
    try {
      const [meRes, tablesRes, statsRes] = await Promise.all([
        serverFetch<{ server: any; restaurant: RestaurantInfo }>("/api/server/me"),
        serverFetch<{ sessions: TableSession[]; allTables: TableMap[] }>("/api/server/tables"),
        serverFetch<Stats>("/api/server/stats"),
      ]);
      setServer({ id: meRes.server.id, name: meRes.server.name, photoUrl: meRes.server.photoUrl });
      setRestaurant(meRes.restaurant);
      setSchedules(meRes.server.schedules ?? []);
      setNotes(meRes.server.notes ?? []);
      setChallenges(meRes.server.challenges ?? []);
      setSessions(tablesRes.sessions);
      setAllTables(tablesRes.allTables);
      setStats(statsRes);
    } catch {
      // token invalid → redirect handled in serverFetch
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const token = localStorage.getItem("server_token");
    if (!token) { router.push(`/${slug}/login`); return; }
    loadAll();
  }, [loadAll, router, slug]);

  // ── Socket.io for live order updates ─────────────────────────────────────
  useEffect(() => {
    if (!restaurant?.id) return;
    const socket: Socket = io(API_URL, { auth: { restaurantId: restaurant.id } });
    socket.on("order:new", () =>
      serverFetch<{ sessions: TableSession[]; allTables: TableMap[] }>("/api/server/tables")
        .then((r) => { setSessions(r.sessions); setAllTables(r.allTables); })
    );
    socket.on("order:paid", () =>
      serverFetch<{ sessions: TableSession[]; allTables: TableMap[] }>("/api/server/tables")
        .then((r) => { setSessions(r.sessions); setAllTables(r.allTables); })
    );
    return () => void socket.disconnect();
  }, [restaurant?.id]);

  // ── Note actions ──────────────────────────────────────────────────────────
  async function addNote() {
    if (!newNote.trim()) return;
    const res = await serverFetch<{ note: Note }>("/api/server/notes", {
      method: "POST", body: JSON.stringify({ content: newNote }),
    });
    setNotes((n) => [res.note, ...n]);
    setNewNote("");
  }

  async function saveNote(id: string) {
    await serverFetch("/api/server/notes/" + id, {
      method: "PATCH", body: JSON.stringify({ content: editContent }),
    });
    setNotes((n) => n.map((note) => note.id === id ? { ...note, content: editContent } : note));
    setEditingNote(null);
  }

  async function deleteNote(id: string) {
    await serverFetch("/api/server/notes/" + id, { method: "DELETE" });
    setNotes((n) => n.filter((note) => note.id !== id));
  }

  // ── Challenge actions ─────────────────────────────────────────────────────
  async function addChallenge() {
    if (!newChallenge.trim()) return;
    const res = await serverFetch<{ challenge: Challenge }>("/api/server/challenges", {
      method: "POST", body: JSON.stringify({ title: newChallenge }),
    });
    setChallenges((c) => [res.challenge, ...c]);
    setNewChallenge("");
  }

  async function toggleChallenge(id: string) {
    const res = await serverFetch<{ challenge: Challenge }>(`/api/server/challenges/${id}/toggle`, { method: "PATCH" });
    setChallenges((c) => c.map((ch) => ch.id === id ? res.challenge : ch));
  }

  async function deleteChallenge(id: string) {
    await serverFetch(`/api/server/challenges/${id}`, { method: "DELETE" });
    setChallenges((c) => c.filter((ch) => ch.id !== id));
  }

  // ── IA planning suggestion ────────────────────────────────────────────────
  async function askIA() {
    if (!iaContext.trim() || iaLoading) return;
    setIaLoading(true);
    setIaError(null);
    setIaSuggestions(null);
    try {
      const res = await serverFetch<{ suggestions: string }>("/api/server/ia/planning-suggest", {
        method: "POST",
        body: JSON.stringify({ context: iaContext }),
      });
      setIaSuggestions(res.suggestions);
    } catch (e: any) {
      setIaError("Suggestion impossible. Abonnement PRO_IA requis ou clé IA manquante.");
    } finally {
      setIaLoading(false);
    }
  }

  function logout() {
    localStorage.removeItem("server_token");
    localStorage.removeItem("server_info");
    localStorage.removeItem("restaurant_info");
    router.push(`/${slug}/login`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const pendingOrders = sessions.flatMap((s) => s.orders.filter((o) => o.status === "PENDING"));
  const myTables = sessions.length;
  const todayDow = new Date().getDay();
  const todaySchedule = schedules.filter((s) => s.dayOfWeek === todayDow);

  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "tables", icon: "🪑", label: "Mes tables", badge: pendingOrders.length || undefined },
    { id: "planning", icon: "🗓️", label: "Planning" },
    { id: "notes", icon: "📝", label: "Notes", badge: notes.length || undefined },
    { id: "defis", icon: "🏆", label: "Défis", badge: challenges.filter((c) => !c.done).length || undefined },
    { id: "stats", icon: "📊", label: "Stats" },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top bar */}
      <div className="sticky top-0 z-50 h-14 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-orange-500/20 border border-orange-500/30 flex items-center justify-center text-sm font-bold text-orange-400">
            {server?.name?.[0]?.toUpperCase() ?? "?"}
          </div>
          <div>
            <p className="text-sm font-semibold text-white leading-none">{server?.name}</p>
            <p className="text-xs text-white/40 font-mono">{restaurant?.name}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {hasIA && <span className="text-xs px-2 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-300">✨ IA</span>}
          {todaySchedule.length > 0 && (
            <span className="text-xs text-white/40">
              {todaySchedule.map((s) => `${minToHhmm(s.openMin)}–${minToHhmm(s.closeMin)}`).join(", ")}
            </span>
          )}
          <button onClick={logout} className="text-xs text-white/30 hover:text-white/60 transition-colors">Quitter</button>
        </div>
      </div>

      {/* Tabs */}
      <div className="sticky top-14 z-40 bg-[#0a0a0a] border-b border-white/[0.06] px-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-all ${
              tab === t.id
                ? "border-orange-500 text-orange-400"
                : "border-transparent text-white/40 hover:text-white/60"
            }`}
          >
            {t.icon} {t.label}
            {t.badge !== undefined && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-bold flex items-center justify-center">
                {t.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 p-4 space-y-4 max-w-2xl mx-auto w-full">

        {/* ── TABLES ─────────────────────────────────────────────── */}
        {tab === "tables" && (
          <div className="space-y-4">
            {/* Quick stats */}
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-black text-white">{myTables}</p>
                <p className="text-xs text-white/40 mt-1">Tables actives</p>
              </div>
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-black text-yellow-400">{pendingOrders.length}</p>
                <p className="text-xs text-white/40 mt-1">À préparer</p>
              </div>
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
                <p className="text-2xl font-black text-emerald-400">{sessions.flatMap((s) => s.orders.filter((o) => o.status === "SERVED")).length}</p>
                <p className="text-xs text-white/40 mt-1">À servir</p>
              </div>
            </div>

            {/* My assigned tables */}
            {sessions.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-10 text-center">
                <p className="text-4xl mb-3">🪑</p>
                <p className="text-white/50">Aucune table assignée pour le moment</p>
              </div>
            ) : (
              sessions.map((session) => (
                <div key={session.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                  <div className="px-5 py-3 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-lg font-black text-white">Table {session.table.number}</span>
                      <span className="text-xs text-white/30">{session.table.seats} couverts</span>
                    </div>
                    <span className="text-xs text-white/30">{session.orders.length} commande{session.orders.length !== 1 ? "s" : ""}</span>
                  </div>
                  {session.orders.length === 0 ? (
                    <p className="px-5 py-4 text-sm text-white/30 italic">Aucune commande en cours</p>
                  ) : (
                    <div className="divide-y divide-white/[0.04]">
                      {session.orders.map((order) => (
                        <div key={order.id} className="px-5 py-4 flex items-start justify-between gap-4">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <span className={`text-xs font-semibold ${STATUS_COLOR[order.status] ?? "text-white/60"}`}>
                                {STATUS_LABEL[order.status] ?? order.status}
                              </span>
                              <span className="text-xs text-white/20">
                                {new Date(order.createdAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                              </span>
                            </div>
                            <div className="space-y-0.5">
                              {(order.items as any[]).map((item: any, i: number) => (
                                <p key={i} className="text-sm text-white/70">
                                  {item.quantity}× {item.name}
                                </p>
                              ))}
                            </div>
                          </div>
                          <span className="text-sm font-bold text-white/80 shrink-0">
                            {(order.totalCents / 100).toFixed(2)}€
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))
            )}

            {/* All restaurant tables overview */}
            <div>
              <p className="text-xs text-white/30 uppercase tracking-wider font-bold mb-3 px-1">Vue globale salle</p>
              <div className="grid grid-cols-4 gap-2">
                {allTables.map((table) => {
                  const active = table.sessions.length > 0;
                  const mine = active && table.sessions[0].server?.id === server?.id;
                  return (
                    <div key={table.id} className={`rounded-xl p-3 text-center border transition-all ${
                      mine
                        ? "bg-orange-500/10 border-orange-500/30"
                        : active
                        ? "bg-white/[0.04] border-white/10"
                        : "bg-white/[0.01] border-white/[0.04]"
                    }`}>
                      <p className={`text-lg font-black ${mine ? "text-orange-400" : active ? "text-white/70" : "text-white/20"}`}>
                        {table.number}
                      </p>
                      <p className="text-[10px] text-white/30">{table.seats}p</p>
                      {active && table.sessions[0].server && (
                        <p className="text-[9px] text-white/30 truncate">{mine ? "moi" : table.sessions[0].server.name}</p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── PLANNING ───────────────────────────────────────────── */}
        {tab === "planning" && (
          <div className="space-y-4">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
              <div className="px-5 py-4 border-b border-white/[0.06]">
                <h2 className="font-bold text-white">Mon planning</h2>
              </div>
              {schedules.length === 0 ? (
                <p className="px-5 py-8 text-center text-white/30 text-sm">Aucun planning défini · Contactez votre gérant</p>
              ) : (
                <div className="divide-y divide-white/[0.04]">
                  {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                    const slots = schedules.filter((s) => s.dayOfWeek === dow);
                    const isToday = dow === todayDow;
                    return (
                      <div key={dow} className={`px-5 py-4 flex items-center justify-between ${isToday ? "bg-orange-500/5" : ""}`}>
                        <div className="flex items-center gap-3">
                          {isToday && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                          <p className={`text-sm font-medium ${isToday ? "text-orange-400" : slots.length > 0 ? "text-white" : "text-white/25"}`}>
                            {DAYS[dow]}
                          </p>
                        </div>
                        {slots.length > 0 ? (
                          <div className="flex flex-col items-end gap-1">
                            {slots.map((s, i) => (
                              <span key={i} className="text-sm font-mono text-white/70">
                                {minToHhmm(s.openMin)} – {minToHhmm(s.closeMin)}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-white/20">Repos</span>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* IA planning suggestion */}
            {hasIA ? (
              <div className="rounded-2xl bg-purple-500/5 border border-purple-500/20 p-5 space-y-4">
                <div className="flex items-center gap-2">
                  <span className="text-purple-300 text-lg">✨</span>
                  <div>
                    <p className="text-sm font-bold text-white">Suggestion IA de planning</p>
                    <p className="text-xs text-white/40">Partagez un retour terrain pour obtenir des suggestions</p>
                  </div>
                </div>
                <textarea
                  value={iaContext}
                  onChange={(e) => setIaContext(e.target.value)}
                  placeholder="Ex : Beaucoup de clients demandaient du végétarien ce midi, le plat du jour risotto a été épuisé à 12h30…"
                  rows={3}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-purple-500 text-sm resize-none"
                />
                <button
                  onClick={askIA}
                  disabled={!iaContext.trim() || iaLoading}
                  className="w-full py-2.5 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-semibold text-sm flex items-center justify-center gap-2 transition-all"
                >
                  {iaLoading ? (
                    <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> Analyse en cours…</>
                  ) : "✨ Envoyer à Nova IA"}
                </button>
                {iaError && <p className="text-xs text-red-400">{iaError}</p>}
                {iaSuggestions && (
                  <div className="bg-purple-500/10 rounded-xl p-4 border border-purple-500/20">
                    <p className="text-xs font-bold text-purple-300 mb-2">Suggestions Nova IA</p>
                    <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed">{iaSuggestions}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 text-center space-y-2">
                <p className="text-2xl">✨</p>
                <p className="text-sm text-white/50">Suggestions IA disponibles avec l'abonnement <strong className="text-purple-300">PRO_IA</strong></p>
              </div>
            )}
          </div>
        )}

        {/* ── NOTES ──────────────────────────────────────────────── */}
        {tab === "notes" && (
          <div className="space-y-3">
            {/* Add note */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <textarea
                value={newNote}
                onChange={(e) => setNewNote(e.target.value)}
                placeholder="Ajouter une note personnelle…"
                rows={2}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 text-sm resize-none"
              />
              <button
                onClick={addNote}
                disabled={!newNote.trim()}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold text-sm transition-all"
              >
                + Ajouter la note
              </button>
            </div>

            {notes.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 text-center">
                <p className="text-3xl mb-2">📝</p>
                <p className="text-white/40 text-sm">Aucune note pour l'instant</p>
              </div>
            ) : (
              notes.map((note) => (
                <div key={note.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4">
                  {editingNote === note.id ? (
                    <div className="space-y-2">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        rows={3}
                        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-sm resize-none focus:outline-none focus:border-orange-500"
                      />
                      <div className="flex gap-2">
                        <button onClick={() => saveNote(note.id)} className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white text-sm font-semibold transition-all">Sauver</button>
                        <button onClick={() => setEditingNote(null)} className="flex-1 py-2 rounded-lg bg-white/5 border border-white/10 text-white/50 text-sm transition-all">Annuler</button>
                      </div>
                    </div>
                  ) : (
                    <div>
                      <p className="text-sm text-white/80 whitespace-pre-wrap leading-relaxed mb-3">{note.content}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/20">
                          {new Date(note.updatedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                        </span>
                        <div className="flex gap-2">
                          <button onClick={() => { setEditingNote(note.id); setEditContent(note.content); }} className="text-xs text-white/30 hover:text-white/60 transition-colors">✏️</button>
                          <button onClick={() => deleteNote(note.id)} className="text-xs text-white/20 hover:text-red-400 transition-colors">🗑️</button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* ── DÉFIS ──────────────────────────────────────────────── */}
        {tab === "defis" && (
          <div className="space-y-3">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <input
                value={newChallenge}
                onChange={(e) => setNewChallenge(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && addChallenge()}
                placeholder="Nouveau défi… ex: Proposer un dessert à 3 tables"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 text-sm"
              />
              <button
                onClick={addChallenge}
                disabled={!newChallenge.trim()}
                className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-40 text-white font-semibold text-sm transition-all"
              >
                + Ajouter le défi
              </button>
            </div>

            {challenges.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 text-center">
                <p className="text-3xl mb-2">🏆</p>
                <p className="text-white/40 text-sm">Aucun défi défini · Créez-en un pour vous motiver !</p>
              </div>
            ) : (
              <>
                {challenges.filter((c) => !c.done).length > 0 && (
                  <p className="text-xs text-white/30 uppercase tracking-wider font-bold px-1">En cours ({challenges.filter((c) => !c.done).length})</p>
                )}
                {challenges.map((ch) => (
                  <div key={ch.id} className={`rounded-2xl border p-4 flex items-center gap-4 transition-all ${
                    ch.done
                      ? "bg-emerald-500/5 border-emerald-500/20"
                      : "bg-white/[0.02] border-white/[0.06]"
                  }`}>
                    <button
                      onClick={() => toggleChallenge(ch.id)}
                      className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                        ch.done
                          ? "bg-emerald-500 border-emerald-500 text-white text-xs"
                          : "border-white/20 hover:border-orange-500"
                      }`}
                    >
                      {ch.done ? "✓" : ""}
                    </button>
                    <div className="flex-1">
                      <p className={`text-sm ${ch.done ? "line-through text-white/30" : "text-white/80"}`}>{ch.title}</p>
                      {ch.dueDate && (
                        <p className="text-xs text-white/30 mt-0.5">
                          📅 {new Date(ch.dueDate).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                    <button onClick={() => deleteChallenge(ch.id)} className="text-white/20 hover:text-red-400 transition-colors text-sm">🗑️</button>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* ── STATS ──────────────────────────────────────────────── */}
        {tab === "stats" && stats && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 text-center">
                <p className="text-4xl font-black text-white">{stats.ordersToday}</p>
                <p className="text-xs text-white/40 mt-2">Commandes aujourd'hui</p>
              </div>
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5 text-center">
                <p className="text-4xl font-black text-yellow-400">
                  {stats.avgRating ? stats.avgRating.toFixed(1) : "–"}
                </p>
                <p className="text-xs text-white/40 mt-2">Note moyenne</p>
                {stats.totalReviews > 0 && (
                  <p className="text-xs text-white/20 mt-0.5">{stats.totalReviews} avis</p>
                )}
              </div>
              <div className="col-span-2 rounded-2xl bg-emerald-500/5 border border-emerald-500/20 p-5 text-center">
                <p className="text-4xl font-black text-emerald-400">
                  {(stats.tipsToday / 100).toFixed(2)}€
                </p>
                <p className="text-xs text-white/40 mt-2">Pourboires reçus aujourd'hui</p>
              </div>
            </div>

            {/* Challenges progress */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-5">
              <p className="text-sm font-bold text-white mb-4">Progression des défis</p>
              {challenges.length === 0 ? (
                <p className="text-xs text-white/30">Aucun défi · Créez-en dans l'onglet Défis</p>
              ) : (
                <div className="space-y-2">
                  <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-orange-500 to-emerald-500 rounded-full transition-all"
                      style={{ width: `${(challenges.filter((c) => c.done).length / challenges.length) * 100}%` }}
                    />
                  </div>
                  <p className="text-xs text-white/40 text-right">
                    {challenges.filter((c) => c.done).length}/{challenges.length} complétés
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
