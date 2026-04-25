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
type SplitPart = {
  id: string; label: string; amountCents: number;
  paid: boolean; paidAt?: string | null; paymentMode?: string | null;
};
type TableSession = {
  id: string;
  table: { number: number; seats: number };
  orders: Order[];
  subtotalCents: number;
  tipCents: number;
  totalCents: number;
  billPaymentMode?: string | null;
  billRequestedAt?: string | null;
  billConfirmedAt?: string | null;
  billConfirmedBy?: string | null;
  billSplits: SplitPart[];
};

const MODE_INFO: Record<string, { icon: string; label: string; badgeCls: string; bgCls: string; borderCls: string }> = {
  CARD:    { icon: "💳", label: "Carte",   badgeCls: "bg-blue-500/20 border-blue-500/40 text-blue-300",    bgCls: "bg-blue-500/5",    borderCls: "border-blue-500/25" },
  CASH:    { icon: "💵", label: "Espèces", badgeCls: "bg-emerald-500/20 border-emerald-500/40 text-emerald-300", bgCls: "bg-emerald-500/5", borderCls: "border-emerald-500/25" },
  COUNTER: { icon: "🏪", label: "Caisse",  badgeCls: "bg-amber-500/20 border-amber-500/40 text-amber-300", bgCls: "bg-amber-500/5",   borderCls: "border-amber-500/25" },
};
const fmt = (c: number) => (c / 100).toFixed(2) + "€";
const uid = () => Math.random().toString(36).slice(2);
type TableMap = {
  id: string; number: number; seats: number; assignedServerId?: string | null;
  sessions: { server: { id: string; name: string } | null }[];
};
type EmptyTable = { id: string; number: number; seats: number };
type Stats = { ordersToday: number; avgRating: number | null; totalReviews: number; tipsToday: number };

// ─── Sub-components ──────────────────────────────────────────────────────────

function CloseSessionButton({ sessionId, closing, defaultMode, onClose }: {
  sessionId: string; closing: boolean; defaultMode: "CARD"|"CASH"|"COUNTER";
  onClose: (mode: string) => void;
}) {
  const [mode, setMode] = useState<"CARD"|"CASH"|"COUNTER">(defaultMode);
  return (
    <div className="flex items-center gap-1.5 flex-1 min-w-0">
      <select value={mode} onChange={e => setMode(e.target.value as any)}
        className="text-xs bg-white/5 border border-white/10 rounded-lg px-2 py-2 text-white/70">
        <option value="CARD">💳 Carte</option>
        <option value="CASH">💵 Espèces</option>
        <option value="COUNTER">🏪 Caisse</option>
      </select>
      <button onClick={() => onClose(mode)} disabled={closing}
        className="flex-1 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-all active:scale-[0.98]">
        {closing ? <span className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin"/> : "✓ Fin de session"}
      </button>
    </div>
  );
}

function PartPayButton({ part, session, paying, onPay }: {
  part: SplitPart; session: TableSession; paying: boolean;
  onPay: (mode: string) => void;
}) {
  const [mode, setMode] = useState<"CARD"|"CASH"|"COUNTER">("CARD");
  return (
    <>
      <select value={mode} onChange={e => setMode(e.target.value as any)}
        className="text-[10px] bg-white/5 border border-white/10 rounded-lg px-1.5 py-1.5 text-white/60">
        <option value="CARD">💳</option>
        <option value="CASH">💵</option>
        <option value="COUNTER">🏪</option>
      </select>
      <button onClick={() => onPay(mode)} disabled={paying}
        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white text-xs font-bold transition-all">
        {paying ? "…" : "Payer"}
      </button>
    </>
  );
}

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
  const [myEmptyTables, setMyEmptyTables] = useState<EmptyTable[]>([]);
  const [globalChallenges, setGlobalChallenges] = useState<Challenge[]>([]);
  const [generatingChallenges, setGeneratingChallenges] = useState(false);
  const [stats, setStats] = useState<Stats | null>(null);
  const [tab, setTab] = useState<Tab>("tables");
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState<string | null>(null);
  const [closing, setClosing] = useState<string | null>(null);
  const [closeMode, setCloseMode] = useState<"CARD"|"CASH"|"COUNTER">("CARD");

  // Split state
  const [splitSession, setSplitSession] = useState<TableSession | null>(null);
  const [splitMode, setSplitMode] = useState<"equal"|"custom">("equal");
  const [splitCount, setSplitCount] = useState(2);
  const [splitParts, setSplitParts] = useState<SplitPart[]>([]);
  const [splitSaving, setSplitSaving] = useState(false);
  const [payingPart, setPayingPart] = useState<string | null>(null);

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
        serverFetch<{ sessions: TableSession[]; allTables: TableMap[]; myEmptyTables?: EmptyTable[] }>("/api/server/tables"),
        serverFetch<Stats>("/api/server/stats"),
      ]);
      setServer({ id: meRes.server.id, name: meRes.server.name, photoUrl: meRes.server.photoUrl });
      setRestaurant(meRes.restaurant);
      setSchedules(meRes.server.schedules ?? []);
      setNotes(meRes.server.notes ?? []);
      setChallenges(meRes.server.challenges ?? []);
      setGlobalChallenges(meRes.server.globalChallenges ?? []);
      setSessions(tablesRes.sessions);
      setAllTables(tablesRes.allTables);
      setMyEmptyTables(tablesRes.myEmptyTables ?? []);
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

  // ── Socket.io for live updates ───────────────────────────────────────────
  useEffect(() => {
    if (!restaurant?.id) return;
    const socket: Socket = io(API_URL, { auth: { restaurantId: restaurant.id } });
    
    // Demander la permission pour les notifications
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }

    const refreshData = () => {
      serverFetch<{ sessions: TableSession[]; allTables: TableMap[]; myEmptyTables?: EmptyTable[] }>("/api/server/tables")
        .then((r) => { setSessions(r.sessions); setAllTables(r.allTables); });
      serverFetch<Stats>("/api/server/stats").then(setStats);
    };

    socket.on("order:new", (data: any) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Nouvelle commande !", { body: `Table ${data.tableNumber} - ${data.items?.length || 1} article(s)` });
      }
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch(e){}
      refreshData();
    });

    socket.on("order:paid", () => {
      refreshData();
    });

    socket.on("bill:requested", (data: any) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Addition demandée", { body: `Table ${data.tableNumber} - Paiement: ${data.mode}` });
      }
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch(e){}
      refreshData();
    });

    socket.on("service:called", (data: any) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("Appel Serveur 🛎️", { body: `Table ${data.tableNumber} vous appelle` });
      }
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch(e){}
      refreshData();
    });

    socket.on("tip:received", (data: any) => {
      if (data.serverId === server?.id) {
        if ("Notification" in window && Notification.permission === "granted") {
          new Notification("Nouveau pourboire ! 💝", { body: `Vous avez reçu ${(data.amountCents / 100).toFixed(2)}€` });
        }
      }
      refreshData();
    });

    socket.on("order:overdue", (data: any) => {
      if ("Notification" in window && Notification.permission === "granted") {
        new Notification("⚠️ Commande en retard !", { body: `Table ${data.tableNumber} — la cuisine dépasse le temps estimé` });
      }
      try { new Audio("https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3").play(); } catch(e){}
      refreshData();
    });

    socket.on("order:updated", () => {
      refreshData();
    });

    return () => void socket.disconnect();
  }, [restaurant?.id, server?.id]);

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

  async function generateDailyChallenges() {
    setGeneratingChallenges(true);
    try {
      const res = await serverFetch<{ challenges: Challenge[]; alreadyGenerated: boolean }>("/api/server/challenges/generate-daily", { method: "POST" });
      setGlobalChallenges(res.challenges);
    } catch { } finally { setGeneratingChallenges(false); }
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

  async function closeSession(sessionId: string, mode: string) {
    setClosing(sessionId);
    try {
      await serverFetch(`/api/server/tables/${sessionId}/close`, {
        method: "POST", body: JSON.stringify({ paymentMode: mode }),
      });
      loadAll();
    } catch { } finally { setClosing(null); }
  }

  function openSplit(session: TableSession) {
    setSplitSession(session);
    setSplitMode("equal");
    setSplitCount(2);
    if (session.billSplits.length > 0) {
      setSplitParts(session.billSplits);
    } else {
      buildEqualSplits(2, session.totalCents);
    }
  }

  function buildEqualSplits(count: number, total: number) {
    const base = Math.floor(total / count);
    const rem  = total - base * count;
    const parts: SplitPart[] = Array.from({ length: count }, (_, i) => ({
      id: uid(),
      label: `Personne ${i + 1}`,
      amountCents: base + (i === 0 ? rem : 0),
      paid: false,
    }));
    setSplitParts(parts);
  }

  function adjustSplitCount(n: number, total: number) {
    setSplitCount(n);
    if (splitMode === "equal") buildEqualSplits(n, total);
    else {
      setSplitParts(prev => {
        const next = [...prev];
        while (next.length < n) next.push({ id: uid(), label: `Personne ${next.length + 1}`, amountCents: 0, paid: false });
        return next.slice(0, n);
      });
    }
  }

  async function saveSplits() {
    if (!splitSession) return;
    setSplitSaving(true);
    try {
      await serverFetch(`/api/server/tables/${splitSession.id}/splits`, {
        method: "PUT", body: JSON.stringify(splitParts),
      });
      loadAll();
      setSplitSession(null);
    } catch { } finally { setSplitSaving(false); }
  }

  async function payPart(session: TableSession, partId: string, mode: string) {
    setPayingPart(partId);
    try {
      const res = await serverFetch<{ splits: SplitPart[]; allPaid: boolean }>(
        `/api/server/tables/${session.id}/splits/${partId}/pay`,
        { method: "PATCH", body: JSON.stringify({ paymentMode: mode }) }
      );
      if (res.allPaid) { loadAll(); setSplitSession(null); }
      else {
        setSessions(prev => prev.map(s => s.id === session.id ? { ...s, billSplits: res.splits } : s));
        if (splitSession?.id === session.id) setSplitSession(s => s ? { ...s, billSplits: res.splits } : s);
      }
    } catch { } finally { setPayingPart(null); }
  }

  async function confirmBill(sessionId: string) {
    setConfirming(sessionId);
    try {
      await serverFetch(`/api/server/tables/${sessionId}/bill-confirm`, { method: "POST" });
      loadAll();
    } catch { } finally {
      setConfirming(null);
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
  const servedOrders = sessions.flatMap((s) => s.orders.filter((o) => o.status === "SERVED"));
  const myTables = sessions.length + myEmptyTables.length;
  const todayDow = new Date().getDay();
  const todaySchedule = schedules.filter((s) => s.dayOfWeek === todayDow);

  const TABS: { id: Tab; icon: string; label: string; badge?: number }[] = [
    { id: "tables", icon: "🪑", label: "Mes tables", badge: pendingOrders.length || undefined },
    { id: "planning", icon: "🗓️", label: "Planning" },
    { id: "notes", icon: "📝", label: "Notes", badge: notes.length || undefined },
    { id: "defis", icon: "🏆", label: "Défis", badge: (challenges.filter((c) => !c.done).length + globalChallenges.filter((c) => !c.done).length) || undefined },
    { id: "stats", icon: "📊", label: "Stats" },
  ];

  return (
    <>
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
                <p className="text-2xl font-black text-emerald-400">{servedOrders.length}</p>
                <p className="text-xs text-white/40 mt-1">À servir</p>
              </div>
            </div>

            {/* My assigned tables */}
            {sessions.length === 0 && myEmptyTables.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-10 text-center">
                <p className="text-4xl mb-3">🪑</p>
                <p className="text-white/50">Aucune table active en ce moment</p>
                <p className="text-xs text-white/25 mt-1">Les commandes apparaîtront ici dès qu'un client scanne un QR code</p>
              </div>
            ) : (<>
              {/* Empty tables assigned to me */}
              {myEmptyTables.length > 0 && (
                <div>
                  <p className="text-xs text-white/30 uppercase tracking-wider font-bold mb-2 px-1">Mes tables — en attente</p>
                  <div className="grid grid-cols-3 gap-2 mb-4">
                    {myEmptyTables.map((t) => (
                      <div key={t.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
                        <p className="text-xl font-black text-white/40">Table {t.number}</p>
                        <p className="text-xs text-white/20 mt-0.5">{t.seats} couverts · libre</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {/* Sessions: mine first (orange), unassigned (yellow — claimable), others (dim) */}
              {sessions.length > 0 && (
                <p className="text-xs text-white/30 uppercase tracking-wider font-bold mb-2 px-1">
                  Tables actives · {sessions.length}
                </p>
              )}
              {sessions.map((session) => {
                const isMine = (session as any).serverId === server?.id;
                const isUnassigned = !(session as any).serverId;
                const modeInfo = session.billPaymentMode ? MODE_INFO[session.billPaymentMode] : null;
                const billRequested = !!session.billPaymentMode;
                const billConfirmed = !!session.billConfirmedAt;
                const hasSplits = session.billSplits.length > 0;
                const paidSplits = session.billSplits.filter(s => s.paid).length;
                const totalCents = session.totalCents;

                return (
                  <div key={session.id} className={`rounded-2xl border overflow-hidden transition-all ${
                    hasSplits ? "bg-violet-500/5 border-violet-500/25"
                    : billConfirmed ? "bg-emerald-500/5 border-emerald-500/20"
                    : billRequested && modeInfo ? `${modeInfo.bgCls} ${modeInfo.borderCls}`
                    : isMine ? "bg-orange-500/5 border-orange-500/20"
                    : isUnassigned ? "bg-yellow-500/5 border-yellow-500/20"
                    : "bg-white/[0.02] border-white/[0.06]"
                  }`}>

                    {/* ── Header ─────────────────────────────────────────── */}
                    <div className={`px-5 py-3 border-b flex items-center justify-between flex-wrap gap-2 ${
                      hasSplits ? "bg-violet-500/[0.07] border-violet-500/15"
                      : billConfirmed ? "bg-emerald-500/[0.06] border-emerald-500/10"
                      : billRequested && modeInfo ? "bg-white/[0.04] border-white/[0.06]"
                      : isMine ? "bg-orange-500/[0.06] border-orange-500/10"
                      : isUnassigned ? "bg-yellow-500/[0.06] border-yellow-500/10"
                      : "bg-white/[0.03] border-white/[0.06]"
                    }`}>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className={`text-lg font-black ${
                          hasSplits ? "text-violet-400"
                          : billConfirmed ? "text-emerald-400"
                          : billRequested ? "text-white"
                          : isMine ? "text-orange-400"
                          : isUnassigned ? "text-yellow-400"
                          : "text-white/60"
                        }`}>Table {session.table.number}</span>
                        <span className="text-xs text-white/30">{session.table.seats} couverts</span>
                        {isMine && !billRequested && !hasSplits && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-orange-500/20 text-orange-300 font-semibold">Ma table</span>}
                        {isUnassigned && !billRequested && !hasSplits && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-yellow-500/20 text-yellow-300 font-semibold">Libre</span>}
                        {hasSplits && (
                          <span className="text-[10px] px-2 py-0.5 rounded-full border bg-violet-500/20 border-violet-500/40 text-violet-300 font-bold">
                            👥 {paidSplits}/{session.billSplits.length} payées
                          </span>
                        )}
                        {!hasSplits && billRequested && modeInfo && !billConfirmed && (
                          <span className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border animate-pulse ${modeInfo.badgeCls}`}>
                            🛎 Addition · {modeInfo.icon} {modeInfo.label}
                          </span>
                        )}
                        {!hasSplits && billConfirmed && (
                          <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full border bg-emerald-500/20 border-emerald-500/40 text-emerald-300">
                            ✓ Remis par {session.billConfirmedBy}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-white">{fmt(totalCents)}</span>
                        {isUnassigned && !billRequested && !hasSplits && (
                          <button onClick={async () => { await serverFetch(`/api/server/tables/${session.id}/claim`, { method: "POST" }); loadAll(); }}
                            className="text-xs px-2.5 py-1 rounded-lg bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 font-semibold">
                            Prendre en charge
                          </button>
                        )}
                      </div>
                    </div>

                    {/* ── Splits actifs ──────────────────────────────────── */}
                    {hasSplits && (
                      <div className="px-5 py-4 space-y-2 border-b border-violet-500/10">
                        {/* Progress bar */}
                        <div className="flex items-center justify-between text-xs mb-3">
                          <span className="text-violet-300 font-semibold">Partage de l'addition</span>
                          <span className="text-white/40">{fmt(session.billSplits.filter(s=>s.paid).reduce((a,s)=>a+s.amountCents,0))} / {fmt(totalCents)}</span>
                        </div>
                        <div className="h-1.5 rounded-full bg-white/[0.06] overflow-hidden mb-3">
                          <div className="h-full bg-violet-500 rounded-full transition-all"
                            style={{ width: `${paidSplits / session.billSplits.length * 100}%` }} />
                        </div>
                        {session.billSplits.map((part) => (
                          <div key={part.id} className={`rounded-xl border p-3 flex items-center justify-between gap-3 transition-all ${
                            part.paid ? "bg-emerald-500/5 border-emerald-500/20 opacity-60" : "bg-white/[0.03] border-white/[0.06]"
                          }`}>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${part.paid ? "text-emerald-400" : "text-white"}`}>
                                {part.paid ? "✓ " : ""}{part.label}
                              </p>
                              <p className="text-xs text-white/40">
                                {fmt(part.amountCents)}
                                {part.paid && part.paymentMode && ` · ${MODE_INFO[part.paymentMode]?.icon} ${MODE_INFO[part.paymentMode]?.label}`}
                              </p>
                            </div>
                            {!part.paid && (
                              <div className="flex items-center gap-2 shrink-0">
                                <PartPayButton
                                  part={part} session={session}
                                  paying={payingPart === part.id}
                                  onPay={(mode) => payPart(session, part.id, mode)}
                                />
                              </div>
                            )}
                          </div>
                        ))}
                        <button onClick={() => openSplit(session)}
                          className="w-full py-2 rounded-xl border border-violet-500/20 text-violet-400 text-xs font-semibold hover:bg-violet-500/10 transition-all">
                          ✏️ Modifier le partage
                        </button>
                      </div>
                    )}

                    {/* ── Panneau Addition (sans splits) ─────────────────── */}
                    {!hasSplits && billRequested && modeInfo && (
                      <div className="px-5 py-4 border-b border-white/[0.06] space-y-3">
                        <div className="flex items-center justify-between">
                          <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${modeInfo.badgeCls}`}>
                            {modeInfo.icon} {modeInfo.label}
                          </span>
                          <div className="text-right">
                            <p className="text-2xl font-black text-white">{fmt(totalCents)}</p>
                            {session.tipCents > 0 && <p className="text-[10px] text-orange-400/70">dont {fmt(session.tipCents)} pourboire</p>}
                          </div>
                        </div>
                        <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 space-y-1 max-h-36 overflow-y-auto">
                          {session.orders.flatMap((o) => (o.items as any[]).map((item: any, i: number) => (
                            <div key={`${o.id}-${i}`} className="flex justify-between text-xs">
                              <span className="text-white/60">{item.quantity}× {item.name}</span>
                              <span className="text-white/40 font-mono">{fmt(item.quantity * item.priceCents)}</span>
                            </div>
                          )))}
                        </div>
                        {!billConfirmed ? (
                          <button onClick={() => confirmBill(session.id)} disabled={confirming === session.id}
                            className="w-full py-3 rounded-xl bg-white text-black font-bold text-sm hover:bg-white/90 disabled:opacity-40 flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
                            {confirming === session.id
                              ? <><span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin"/>En cours…</>
                              : <>{modeInfo.icon} J'apporte l'addition / TPE</>}
                          </button>
                        ) : (
                          <p className="text-center text-sm text-emerald-400 font-semibold py-2">✓ Addition remise — en attente d'encaissement</p>
                        )}
                      </div>
                    )}

                    {/* ── Actions encaissement (toujours visibles) ───────── */}
                    {!hasSplits && (
                      <div className="px-5 py-3 flex items-center gap-2 flex-wrap">
                        <button onClick={() => openSplit(session)}
                          className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-violet-500/15 border border-violet-500/25 text-violet-300 text-xs font-bold hover:bg-violet-500/25 transition-all">
                          👥 Partager
                        </button>
                        <CloseSessionButton
                          sessionId={session.id}
                          closing={closing === session.id}
                          defaultMode={session.billPaymentMode as any ?? "CARD"}
                          onClose={(mode) => closeSession(session.id, mode)}
                        />
                      </div>
                    )}

                    {/* ── Commandes ─────────────────────────────────────── */}
                    {session.orders.length > 0 && (
                      <div className={`divide-y divide-white/[0.04] ${billRequested ? "opacity-40" : ""}`}>
                        {session.orders.map((order) => (
                          <div key={order.id} className="px-5 py-3 flex items-start justify-between gap-4">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <span className={`text-xs font-semibold ${STATUS_COLOR[order.status] ?? "text-white/60"}`}>
                                  {STATUS_LABEL[order.status] ?? order.status}
                                </span>
                                <span className="text-xs text-white/20">{new Date(order.createdAt).toLocaleTimeString("fr-FR",{hour:"2-digit",minute:"2-digit"})}</span>
                              </div>
                              <div className="space-y-0.5">
                                {(order.items as any[]).map((item:any,i:number) => (
                                  <p key={i} className="text-sm text-white/55">{item.quantity}× {item.name}</p>
                                ))}
                              </div>
                            </div>
                            <span className="text-sm font-bold text-white/60 shrink-0">{fmt(order.totalCents)}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </>
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

            {/* ── AI Global Challenges (PRO_IA) ─────────────────── */}
            {hasIA && (
              <div className="rounded-2xl bg-purple-500/5 border border-purple-500/20 overflow-hidden">
                <div className="px-5 py-4 border-b border-purple-500/10 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-purple-300 text-base">✨</span>
                    <div>
                      <p className="text-sm font-bold text-white">Défis Nova IA du jour</p>
                      <p className="text-xs text-white/40">Compétition entre tous les serveurs</p>
                    </div>
                  </div>
                  <button
                    onClick={generateDailyChallenges}
                    disabled={generatingChallenges}
                    className="text-xs px-3 py-1.5 rounded-lg bg-purple-500 hover:bg-purple-400 disabled:opacity-40 text-white font-semibold transition-all flex items-center gap-1.5"
                  >
                    {generatingChallenges
                      ? <><span className="w-3 h-3 border border-white/30 border-t-white rounded-full animate-spin" /> Génération…</>
                      : "🎲 Générer"}
                  </button>
                </div>
                {globalChallenges.length === 0 ? (
                  <p className="px-5 py-5 text-sm text-white/30 text-center">
                    Appuyez sur "Générer" pour créer les défis du jour
                  </p>
                ) : (
                  <div className="divide-y divide-purple-500/10">
                    {globalChallenges.map((ch) => (
                      <div key={ch.id} className={`px-5 py-4 flex items-center gap-4 ${ch.done ? "opacity-60" : ""}`}>
                        <button
                          onClick={() => {
                            serverFetch<{ challenge: Challenge }>(`/api/server/challenges/${ch.id}/toggle`, { method: "PATCH" })
                              .then((r) => setGlobalChallenges((g) => g.map((c) => c.id === ch.id ? r.challenge : c)));
                          }}
                          className={`w-7 h-7 rounded-full border-2 flex items-center justify-center shrink-0 transition-all ${
                            ch.done
                              ? "bg-emerald-500 border-emerald-500 text-white text-xs"
                              : "border-purple-400/40 hover:border-purple-400"
                          }`}
                        >
                          {ch.done ? "✓" : ""}
                        </button>
                        <p className={`text-sm flex-1 ${ch.done ? "line-through text-white/30" : "text-white/80"}`}>{ch.title}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* ── Personal Challenges ───────────────────────────── */}
            {challenges.length === 0 ? (
              <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 text-center">
                <p className="text-3xl mb-2">🏆</p>
                <p className="text-white/40 text-sm">Aucun défi personnel · Créez-en un pour vous motiver !</p>
              </div>
            ) : (
              <>
                <p className="text-xs text-white/30 uppercase tracking-wider font-bold px-1">Défis personnels</p>
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

    {/* ── Split Modal ───────────────────────────────────────────────────── */}
    {splitSession && (
      <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4"
        onClick={e => e.target === e.currentTarget && setSplitSession(null)}>
        <div className="bg-[#111] border border-white/10 rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[90vh] overflow-y-auto">
          {/* Header */}
          <div className="px-6 pt-6 pb-4 border-b border-white/[0.06] flex items-center justify-between">
            <div>
              <h2 className="text-lg font-black text-white">👥 Partager l'addition</h2>
              <p className="text-sm text-white/40 mt-0.5">Table {splitSession.table.number} · {fmt(splitSession.totalCents)}</p>
            </div>
            <button onClick={() => setSplitSession(null)} className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-white/40 hover:text-white transition-colors">✕</button>
          </div>

          <div className="px-6 py-5 space-y-5">
            {/* Mode tabs */}
            <div className="flex rounded-xl bg-white/[0.04] p-1 gap-1">
              {(["equal","custom"] as const).map(m => (
                <button key={m} onClick={() => {
                  setSplitMode(m);
                  if (m === "equal") buildEqualSplits(splitCount, splitSession.totalCents);
                }}
                  className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                    splitMode === m ? "bg-violet-500 text-white" : "text-white/40 hover:text-white/60"
                  }`}>
                  {m === "equal" ? "⚖️ Égal" : "✏️ Personnalisé"}
                </button>
              ))}
            </div>

            {/* Equal mode — person count slider */}
            {splitMode === "equal" && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-white/60">Nombre de personnes</span>
                  <div className="flex items-center gap-3">
                    <button onClick={() => adjustSplitCount(Math.max(2, splitCount - 1), splitSession.totalCents)}
                      className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/10 text-white text-lg font-bold hover:bg-white/10 transition-all active:scale-95">−</button>
                    <span className="text-2xl font-black text-white w-8 text-center">{splitCount}</span>
                    <button onClick={() => adjustSplitCount(Math.min(20, splitCount + 1), splitSession.totalCents)}
                      className="w-9 h-9 rounded-full bg-violet-500 text-white text-lg font-bold hover:bg-violet-400 transition-all active:scale-95">+</button>
                  </div>
                </div>
                <div className="rounded-xl bg-white/[0.03] border border-white/[0.06] p-3 text-center">
                  <p className="text-3xl font-black text-violet-400">{fmt(splitParts[0]?.amountCents ?? 0)}</p>
                  <p className="text-xs text-white/30 mt-1">par personne</p>
                  {(splitSession.totalCents % splitCount !== 0) && (
                    <p className="text-[10px] text-white/20 mt-1">+{fmt(splitSession.totalCents % splitCount)} ajouté à la 1ère part</p>
                  )}
                </div>
              </div>
            )}

            {/* Parts list — renaming */}
            <div className="space-y-2">
              <p className="text-xs text-white/40 uppercase tracking-wider font-bold">Parts</p>
              {splitParts.map((part, i) => (
                <div key={part.id} className="flex items-center gap-2">
                  <input
                    value={part.label}
                    onChange={e => setSplitParts(prev => prev.map((p,j) => j === i ? { ...p, label: e.target.value } : p))}
                    className="flex-1 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-violet-500"
                    placeholder={`Personne ${i+1}`}
                  />
                  {splitMode === "custom" ? (
                    <div className="relative">
                      <input
                        type="number" min="0" step="0.01"
                        value={(part.amountCents / 100).toFixed(2)}
                        onChange={e => {
                          const v = Math.round(parseFloat(e.target.value || "0") * 100);
                          setSplitParts(prev => prev.map((p,j) => j === i ? { ...p, amountCents: v } : p));
                        }}
                        className="w-24 bg-white/[0.04] border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white text-right focus:outline-none focus:border-violet-500"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-white/30">€</span>
                    </div>
                  ) : (
                    <span className="text-sm font-bold text-violet-300 w-20 text-right shrink-0">{fmt(part.amountCents)}</span>
                  )}
                </div>
              ))}
            </div>

            {/* Custom mode — total check */}
            {splitMode === "custom" && (() => {
              const sum = splitParts.reduce((a,p) => a + p.amountCents, 0);
              const diff = sum - splitSession.totalCents;
              return (
                <div className={`rounded-xl px-4 py-3 text-sm font-semibold flex justify-between ${
                  diff === 0 ? "bg-emerald-500/10 text-emerald-400" : "bg-red-500/10 text-red-400"
                }`}>
                  <span>Total des parts</span>
                  <span>{fmt(sum)} {diff !== 0 && `(${diff > 0 ? "+" : ""}${fmt(diff)} vs ${fmt(splitSession.totalCents)})`}</span>
                </div>
              );
            })()}

            {/* Save */}
            <button
              onClick={saveSplits} disabled={splitSaving || (splitMode === "custom" && splitParts.reduce((a,p)=>a+p.amountCents,0) !== splitSession.totalCents)}
              className="w-full py-3.5 rounded-xl bg-violet-500 hover:bg-violet-400 disabled:opacity-40 text-white font-bold text-sm flex items-center justify-center gap-2 transition-all active:scale-[0.98]">
              {splitSaving
                ? <><span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"/>Enregistrement…</>
                : `👥 Créer ${splitParts.length} parts · ${fmt(splitSession.totalCents)}`}
            </button>
          </div>
        </div>
      </div>
    )}
    </>
  );
}
