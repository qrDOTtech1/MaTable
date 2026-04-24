"use client";
import { useEffect, useState, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";

type Session = {
  id: string;
  table: { number: number; seats: number; zone?: string };
  server?: { id: string; name: string } | null;
  orders: any[];
  totalCents: number;
  hasUnserved: boolean;
};

type Stats = {
  revenueTodayCents: number;
  ordersToday: number;
  sessionsClosedToday: number;
  sessionsActive: number;
  paymentBreakdown: { CARD: number; CASH: number; COUNTER: number };
  tipsTotal: number;
};

export default function CaisseDashPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();

  const [sessions, setSessions] = useState<Session[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [closing, setClosing] = useState<string | null>(null);
  const [paymentMode, setPaymentMode] = useState<"CARD" | "CASH" | "COUNTER">("CARD");

  const caisseFetch = useCallback(async <T,>(path: string, opts?: RequestInit): Promise<T> => {
    const token = localStorage.getItem("caisse_token");
    if (!token) { router.push(`/${slug}`); throw new Error("No token"); }
    const res = await fetch(`${API_URL}${path}`, {
      ...opts,
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}`, ...(opts?.headers ?? {}) },
    });
    if (res.status === 401) {
      localStorage.removeItem("caisse_token");
      router.push(`/${slug}`);
      throw new Error("Unauthorized");
    }
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return res.json();
  }, [slug, router]);

  const loadData = useCallback(async () => {
    try {
      const [sessionsRes, statsRes] = await Promise.all([
        caisseFetch<{ sessions: Session[] }>("/api/caisse/sessions"),
        caisseFetch<Stats>("/api/caisse/stats"),
      ]);
      setSessions(sessionsRes.sessions);
      setStats(statsRes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [caisseFetch]);

  useEffect(() => {
    const token = localStorage.getItem("caisse_token");
    if (!token) { router.push(`/${slug}`); return; }
    loadData();
    const interval = setInterval(loadData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, [loadData, router, slug]);

  async function closeSession(sessionId: string) {
    setClosing(sessionId);
    try {
      await caisseFetch(`/api/caisse/sessions/${sessionId}/close`, {
        method: "POST",
        body: JSON.stringify({ paymentMode }),
      });
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setClosing(null);
    }
  }

  function logout() {
    localStorage.removeItem("caisse_token");
    router.push(`/${slug}`);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-emerald-500/30 border-t-emerald-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Header */}
      <div className="sticky top-0 z-50 h-14 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06] px-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center text-sm font-bold text-emerald-400">
            💳
          </div>
          <h1 className="text-lg font-bold">Caisse</h1>
        </div>
        <button onClick={logout} className="text-xs text-white/30 hover:text-white/60 transition-colors">Quitter</button>
      </div>

      <div className="flex-1 p-4 space-y-6 max-w-5xl mx-auto w-full">
        {/* Stats */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
              <p className="text-2xl font-black text-emerald-400">{(stats.revenueTodayCents / 100).toFixed(2)}€</p>
              <p className="text-xs text-white/40 mt-1">Chiffre d'affaires</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
              <p className="text-2xl font-black text-white">{stats.ordersToday}</p>
              <p className="text-xs text-white/40 mt-1">Couverts</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
              <p className="text-2xl font-black text-white">{stats.sessionsActive}</p>
              <p className="text-xs text-white/40 mt-1">Tables actives</p>
            </div>
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 text-center">
              <p className="text-2xl font-black text-orange-400">{(stats.tipsTotal / 100).toFixed(2)}€</p>
              <p className="text-xs text-white/40 mt-1">Pourboires</p>
            </div>
          </div>
        )}

        {/* Sessions */}
        {sessions.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-10 text-center">
            <p className="text-4xl mb-3">🪑</p>
            <p className="text-white/50">Aucune table active</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-white/30 uppercase tracking-wider font-bold">Sessions actives</p>
            {sessions.map((session) => (
              <div key={session.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
                <div className="px-5 py-4 bg-white/[0.03] border-b border-white/[0.06] flex items-center justify-between flex-wrap gap-2">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-black text-emerald-400">Table {session.table.number}</span>
                    <span className="text-xs text-white/30">{session.table.seats} couverts</span>
                    {session.table.zone && <span className="text-xs text-white/20 px-2 py-0.5 bg-white/[0.04] rounded">{session.table.zone}</span>}
                  </div>
                  <span className="text-lg font-black text-white">{(session.totalCents / 100).toFixed(2)}€</span>
                </div>

                <div className="px-5 py-4 space-y-3">
                  {session.orders.length > 0 && (
                    <div className="text-xs text-white/30">
                      {session.orders.length} commande{session.orders.length !== 1 ? "s" : ""} — {session.hasUnserved ? "⏳ En cours" : "✓ Prête"}
                    </div>
                  )}

                  <div className="flex items-center gap-2 flex-wrap">
                    <select
                      value={paymentMode}
                      onChange={(e) => setPaymentMode(e.target.value as any)}
                      className="text-xs bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white"
                    >
                      <option value="CARD">Carte</option>
                      <option value="CASH">Espèces</option>
                      <option value="COUNTER">Comptoir</option>
                    </select>
                    <button
                      onClick={() => closeSession(session.id)}
                      disabled={closing === session.id || session.hasUnserved}
                      className="flex-1 min-w-32 py-2.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold transition-all"
                    >
                      {closing === session.id ? "Encaissement..." : "Encaisser"}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
