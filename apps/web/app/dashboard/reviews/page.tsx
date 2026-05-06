"use client";
import { useEffect, useState, useMemo, useRef } from "react";
import { api, API_URL } from "@/lib/api";
import Link from "next/link";
import QRCode from "qrcode";
import { io, Socket } from "socket.io-client";

type DishReview = { id: string; rating: number; comment?: string; menuItem: { name: string }; createdAt: string };
type ServerReview = { id: string; rating: number; comment?: string; server: { name: string }; createdAt: string };
type ChatMessage = { role: "ai" | "user"; content: string };
type CustomerReview = { id: string; serverName: string; ratings: any; reviewText: string; chatHistory?: ChatMessage[] | null; createdAt: string };
type ServerTip = { id: string; serverName: string; amountCents: number; createdAt: string };
type RestaurantConfig = { id: string; slug: string; name: string; googleReviewLink?: string; reviewVoucherConfig?: { active: boolean; title: string; description: string; code: string } };
type ServerData = { id: string; name: string; photoUrl: string | null; active: boolean; avgRating: number | null; reviewsCount: number };

type DayStats = {
  date: string;
  count: number;
  avg: { food: number; service: number; atmosphere: number; value: number };
  best: string | null;
  worst: string | null;
};
type ReviewStats = {
  totalReviews: number;
  avg: { food: number; service: number; atmosphere: number; value: number; global: number };
  history: DayStats[];
  today: { date: string; count: number; comments: string[] };
};

// ── Animated Radar Octagon ────────────────────────────────────────────────────
function RadarOctagon({ avg }: { avg: { food: number; service: number; atmosphere: number; value: number } }) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 100); return () => clearTimeout(t); }, [avg]);
  useEffect(() => { setAnimated(false); }, [avg]);

  const labels = [
    { key: "food", label: "Cuisine", angle: -90 },
    { key: "service", label: "Service", angle: 0 },
    { key: "value", label: "Prix", angle: 90 },
    { key: "atmosphere", label: "Ambiance", angle: 180 },
  ] as const;

  const cx = 150, cy = 150, maxR = 110;

  const toXY = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  // Grid rings
  const rings = [1, 2, 3, 4, 5];

  // Data polygon points
  const points = labels.map((l) => {
    const val = animated ? (avg[l.key] || 0) : 0;
    const r = (val / 5) * maxR;
    return toXY(l.angle, r);
  });
  const polyStr = points.map((p) => `${p.x},${p.y}`).join(" ");

  return (
    <div className="flex justify-center">
      <svg viewBox="0 0 300 300" className="w-64 h-64">
        {/* Grid rings */}
        {rings.map((r) => {
          const radius = (r / 5) * maxR;
          const ringPts = labels.map((l) => toXY(l.angle, radius));
          return (
            <polygon
              key={r}
              points={ringPts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}
        {/* Axes */}
        {labels.map((l) => {
          const end = toXY(l.angle, maxR);
          return <line key={l.key} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
        })}
        {/* Data polygon */}
        <polygon
          points={polyStr}
          fill="rgba(249,115,22,0.15)"
          stroke="rgba(249,115,22,0.8)"
          strokeWidth="2.5"
          strokeLinejoin="round"
          style={{ transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        {/* Data dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill="#f97316"
            stroke="#0a0a0a"
            strokeWidth="2"
            style={{ transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        ))}
        {/* Labels */}
        {labels.map((l) => {
          const pos = toXY(l.angle, maxR + 22);
          const val = avg[l.key] || 0;
          return (
            <g key={l.key}>
              <text x={pos.x} y={pos.y - 6} textAnchor="middle" className="text-[11px] font-bold fill-white/70">{l.label}</text>
              <text x={pos.x} y={pos.y + 8} textAnchor="middle" className="text-[10px] fill-orange-400/80 font-mono">{val.toFixed(1)}</text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Generic Octagon (radar) for any list of (label, value) pairs ─────────────
function GenericOctagon({
  items,
  color = "#f97316",
  size = 280,
  emptyMessage,
}: {
  items: { label: string; value: number; count?: number }[];
  color?: string;
  size?: number;
  emptyMessage?: string;
}) {
  const [animated, setAnimated] = useState(false);
  useEffect(() => { const t = setTimeout(() => setAnimated(true), 120); return () => clearTimeout(t); }, [items]);
  useEffect(() => { setAnimated(false); }, [items]);

  if (!items || items.length === 0) {
    return (
      <div className="flex items-center justify-center h-64 text-sm text-white/40 text-center px-4">
        {emptyMessage ?? "Aucune donnée."}
      </div>
    );
  }

  const cx = size / 2, cy = size / 2, maxR = size * 0.36;
  const n = items.length;
  // Distribute points evenly around the circle, starting at top
  const angleFor = (i: number) => -90 + (360 / n) * i;

  const toXY = (angle: number, r: number) => {
    const rad = (angle * Math.PI) / 180;
    return { x: cx + r * Math.cos(rad), y: cy + r * Math.sin(rad) };
  };

  const rings = [1, 2, 3, 4, 5];

  const points = items.map((it, i) => {
    const val = animated ? Math.max(0, Math.min(5, it.value || 0)) : 0;
    const r = (val / 5) * maxR;
    return toXY(angleFor(i), r);
  });
  const polyStr = points.map((p) => `${p.x},${p.y}`).join(" ");

  // Lighter version of color for fill
  const fill = color.startsWith("#") ? `${color}26` : color;

  return (
    <div className="flex justify-center">
      <svg viewBox={`0 0 ${size} ${size}`} className="w-full max-w-[320px] h-auto">
        {/* Grid rings */}
        {rings.map((r) => {
          const radius = (r / 5) * maxR;
          const ringPts = items.map((_, i) => toXY(angleFor(i), radius));
          return (
            <polygon
              key={r}
              points={ringPts.map((p) => `${p.x},${p.y}`).join(" ")}
              fill="none"
              stroke="rgba(255,255,255,0.06)"
              strokeWidth="1"
            />
          );
        })}
        {/* Axes */}
        {items.map((_, i) => {
          const end = toXY(angleFor(i), maxR);
          return <line key={i} x1={cx} y1={cy} x2={end.x} y2={end.y} stroke="rgba(255,255,255,0.08)" strokeWidth="1" />;
        })}
        {/* Data polygon */}
        <polygon
          points={polyStr}
          fill={fill}
          stroke={color}
          strokeWidth="2.5"
          strokeLinejoin="round"
          style={{ transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
        />
        {/* Data dots */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="4"
            fill={color}
            stroke="#0a0a0a"
            strokeWidth="2"
            style={{ transition: "all 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)" }}
          />
        ))}
        {/* Labels */}
        {items.map((it, i) => {
          const labelDist = maxR + 28;
          const pos = toXY(angleFor(i), labelDist);
          const val = it.value || 0;
          // Truncate long labels for display
          const display = it.label.length > 14 ? it.label.slice(0, 13) + "…" : it.label;
          return (
            <g key={i}>
              <text x={pos.x} y={pos.y - 6} textAnchor="middle" className="text-[11px] font-bold fill-white/70">{display}</text>
              <text x={pos.x} y={pos.y + 8} textAnchor="middle" className="text-[10px] fill-orange-400/80 font-mono">
                {val.toFixed(1)}{it.count != null ? ` · ${it.count}` : ""}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ── Mini Sparkline Component ──────────────────────────────────────────────────
function Sparkline({ data, color = "#f97316", height = 40 }: { data: number[]; color?: string; height?: number }) {
  if (data.length < 2) return null;
  const max = Math.max(...data, 0.1);
  const min = Math.min(...data, 0);
  const range = max - min || 1;
  const w = 200;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * w,
    y: height - ((v - min) / range) * (height - 4) - 2,
  }));
  const line = pts.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");
  const area = `${line} L${w},${height} L0,${height} Z`;

  return (
    <svg viewBox={`0 0 ${w} ${height}`} className="w-full" style={{ height }}>
      <defs>
        <linearGradient id={`sparkGrad-${color.replace("#", "")}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.3" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill={`url(#sparkGrad-${color.replace("#", "")})`} />
      <path d={line} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Last point dot */}
      <circle cx={pts[pts.length - 1].x} cy={pts[pts.length - 1].y} r="3" fill={color} stroke="#0a0a0a" strokeWidth="1.5" />
    </svg>
  );
}

export default function ReviewsPage() {
  const [dishReviews, setDishReviews] = useState<DishReview[]>([]);
  const [serverReviews, setServerReviews] = useState<ServerReview[]>([]);
  const [customerReviews, setCustomerReviews] = useState<CustomerReview[]>([]);
  const [serverTips, setServerTips] = useState<ServerTip[]>([]);
  const [tab, setTab] = useState<"synthesis" | "dishes" | "servers" | "customers" | "campaign">("synthesis");
  const [stats, setStats] = useState<ReviewStats | null>(null);
  const [selectedDay, setSelectedDay] = useState<DayStats | null>(null);
  const [restaurant, setRestaurant] = useState<RestaurantConfig | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");
  const [serversList, setServersList] = useState<ServerData[]>([]);

  // Campaign Form State
  const [googleLink, setGoogleLink] = useState("");
  const [voucherActive, setVoucherActive] = useState(false);
  const [voucherTitle, setVoucherTitle] = useState("");
  const [voucherDesc, setVoucherDesc] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [saving, setSaving] = useState(false);

  // Live updates — flash banner shown when a new review arrives via WebSocket
  const [liveFlash, setLiveFlash] = useState<{ id: string; kind: string; label: string } | null>(null);
  const liveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const triggerLiveFlash = (kind: string, label: string) => {
    if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
    setLiveFlash({ id: `${kind}-${Date.now()}`, kind, label });
    liveTimeoutRef.current = setTimeout(() => setLiveFlash(null), 4500);
  };

  useEffect(() => {
    api<ReviewStats>("/api/pro/reviews/stats")
      .then((r) => setStats(r))
      .catch(() => {});
    api<{ reviews: DishReview[] }>("/api/pro/reviews/dishes")
      .then((r) => setDishReviews(r.reviews))
      .catch(() => {});
    api<{ reviews: ServerReview[] }>("/api/pro/reviews/servers")
      .then((r) => setServerReviews(r.reviews))
      .catch(() => {});
    api<{ reviews: CustomerReview[], tips: ServerTip[] }>("/api/pro/reviews/customers")
      .then((r) => {
        setCustomerReviews(r.reviews);
        setServerTips(r.tips);
      })
      .catch(() => {});
    api<{ servers: ServerData[] }>("/api/pro/servers")
      .then((r) => setServersList(r.servers))
      .catch(() => {});
    api<{ restaurant: RestaurantConfig }>("/api/pro/me")
      .then((r) => {
        setRestaurant(r.restaurant);
        setGoogleLink(r.restaurant.googleReviewLink || "");
        if (r.restaurant.reviewVoucherConfig) {
          setVoucherActive(r.restaurant.reviewVoucherConfig.active || false);
          setVoucherTitle(r.restaurant.reviewVoucherConfig.title || "");
          setVoucherDesc(r.restaurant.reviewVoucherConfig.description || "");
          setVoucherCode(r.restaurant.reviewVoucherConfig.code || "");
        }
        if (r.restaurant.slug) {
          QRCode.toDataURL(`https://matable.pro/r/${r.restaurant.slug}/review`, { width: 400, margin: 2 })
            .then(setQrUrl).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  // ── Live updates via WebSocket ─────────────────────────────────────────────
  // Le serveur emit "review:new" sur la room `restaurant:<id>` à chaque nouvel avis.
  // On met à jour la liste correspondante (server / dish / customer) sans recharger.
  useEffect(() => {
    if (!restaurant?.id) return;

    const socket: Socket = io(API_URL, { auth: { restaurantId: restaurant.id } });

    socket.on("review:new", (payload: { kind: "server" | "dish" | "customer"; review: any }) => {
      if (!payload?.review) return;

      // Refresh aggregate stats so synthesis tab updates count + averages
      api<ReviewStats>("/api/pro/reviews/stats").then(setStats).catch(() => {});

      if (payload.kind === "server") {
        const r = payload.review;
        const newRow: ServerReview = {
          id: r.id,
          rating: r.rating,
          comment: r.comment ?? undefined,
          createdAt: r.createdAt,
          server: { name: r.server?.name ?? "—" },
        };
        setServerReviews(prev => prev.some(x => x.id === newRow.id) ? prev : [newRow, ...prev]);
        triggerLiveFlash("server", `Nouvel avis serveur · ${newRow.server.name} · ${newRow.rating}★`);
        api<{ servers: ServerData[] }>("/api/pro/servers").then(rs => setServersList(rs.servers)).catch(() => {});
      } else if (payload.kind === "dish") {
        const r = payload.review;
        const newRow: DishReview = {
          id: r.id,
          rating: r.rating,
          comment: r.comment ?? undefined,
          createdAt: r.createdAt,
          menuItem: { name: r.menuItem?.name ?? "—" },
        };
        setDishReviews(prev => prev.some(x => x.id === newRow.id) ? prev : [newRow, ...prev]);
        triggerLiveFlash("dish", `Nouvel avis plat · ${newRow.menuItem.name} · ${newRow.rating}★`);
      } else if (payload.kind === "customer") {
        const r = payload.review;
        const newRow: CustomerReview = {
          id: r.id,
          serverName: r.serverName,
          ratings: r.ratings,
          reviewText: r.reviewText,
          chatHistory: r.chatHistory ?? null,
          createdAt: r.createdAt,
        };
        setCustomerReviews(prev => prev.some(x => x.id === newRow.id) ? prev : [newRow, ...prev]);
        triggerLiveFlash("customer", `Nouvel avis IA · ${newRow.serverName}`);
      }

    });

    return () => {
      socket.disconnect();
      if (liveTimeoutRef.current) clearTimeout(liveTimeoutRef.current);
    };
  }, [restaurant?.id]);

  // ── Compute trend data from stats history ──────────────────────────────────
  const trendData = useMemo(() => {
    if (!stats || stats.history.length < 2) return null;
    // Reverse to chronological order (history is desc)
    const hist = [...stats.history].reverse();
    return {
      food: hist.map(d => d.avg.food),
      service: hist.map(d => d.avg.service),
      atmosphere: hist.map(d => d.avg.atmosphere),
      value: hist.map(d => d.avg.value),
      global: hist.map(d => +((d.avg.food + d.avg.service + d.avg.atmosphere + d.avg.value) / 4).toFixed(2)),
      reviewsPerDay: hist.map(d => d.count),
      labels: hist.map(d => new Date(d.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })),
    };
  }, [stats]);

  // ── Server leaderboard from tips ───────────────────────────────────────────
  const serverLeaderboard = useMemo(() => {
    // Aggregate tips per server
    const tipsByServer = new Map<string, number>();
    for (const t of serverTips) {
      tipsByServer.set(t.serverName, (tipsByServer.get(t.serverName) || 0) + t.amountCents);
    }

    // Merge with serversList data
    const board = serversList
      .filter(s => s.active)
      .map(s => ({
        id: s.id,
        name: s.name,
        photoUrl: s.photoUrl,
        avgRating: s.avgRating,
        reviewsCount: s.reviewsCount,
        totalTipsCents: tipsByServer.get(s.name) || 0,
      }))
      .sort((a, b) => (b.avgRating || 0) - (a.avgRating || 0));

    return board;
  }, [serversList, serverTips]);

  // ── Aggregate dish reviews → moyenne + total par plat ─────────────────────
  const dishAggregates = useMemo(() => {
    const byName = new Map<string, { name: string; total: number; count: number }>();
    for (const r of dishReviews) {
      const name = r.menuItem?.name ?? "—";
      const cur = byName.get(name) ?? { name, total: 0, count: 0 };
      cur.total += r.rating;
      cur.count += 1;
      byName.set(name, cur);
    }
    return Array.from(byName.values())
      .map(d => ({ ...d, avg: d.count > 0 ? d.total / d.count : 0 }))
      .sort((a, b) => (b.avg - a.avg) || (b.count - a.count));
  }, [dishReviews]);

  // ── Aggregate server reviews → moyenne + total par serveur ────────────────
  const serverAggregates = useMemo(() => {
    const byName = new Map<string, { name: string; total: number; count: number }>();
    for (const r of serverReviews) {
      const name = r.server?.name ?? "—";
      const cur = byName.get(name) ?? { name, total: 0, count: 0 };
      cur.total += r.rating;
      cur.count += 1;
      byName.set(name, cur);
    }
    return Array.from(byName.values())
      .map(d => ({ ...d, avg: d.count > 0 ? d.total / d.count : 0 }))
      .sort((a, b) => (b.avg - a.avg) || (b.count - a.count));
  }, [serverReviews]);

  async function saveCampaign() {
    setSaving(true);
    try {
      await api("/api/pro/restaurant", {
        method: "PATCH",
        body: JSON.stringify({
          googleReviewLink: googleLink,
          reviewVoucherConfig: { active: voucherActive, title: voucherTitle, description: voucherDesc, code: voucherCode }
        })
      });
      alert("Campagne sauvegardée !");
    } catch {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between gap-3 mb-6 flex-wrap">
        <h1 className="text-2xl font-bold">Avis & Réputation</h1>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs font-bold">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-60" />
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
          </span>
          LIVE
        </span>
      </div>

      {liveFlash && (
        <div
          key={liveFlash.id}
          className="mb-4 px-4 py-3 rounded-2xl bg-orange-500/10 border border-orange-500/30 text-orange-300 text-sm font-semibold flex items-center gap-3 animate-fade-in"
          role="status"
          aria-live="polite"
        >
          <span className="text-lg" aria-hidden>🔔</span>
          <span className="flex-1 truncate">{liveFlash.label}</span>
          <button
            onClick={() => setLiveFlash(null)}
            className="text-orange-300/60 hover:text-orange-300 text-lg leading-none"
            aria-label="Fermer"
          >
            ×
          </button>
        </div>
      )}

      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2 overflow-x-auto scrollbar-none">
        <button className={`shrink-0 pb-2 px-2 text-sm font-bold ${tab === "synthesis" ? "border-b-2 border-orange-500 text-orange-500" : "text-white/50"}`} onClick={() => setTab("synthesis")}>Synthese</button>
        <button className={`shrink-0 pb-2 px-2 text-sm font-bold ${tab === "customers" ? "border-b-2 border-orange-500 text-orange-500" : "text-white/50"}`} onClick={() => setTab("customers")}>Avis des clients ({customerReviews.length})</button>
        <button className={`shrink-0 pb-2 px-2 text-sm font-bold ${tab === "dishes" ? "border-b-2 border-orange-500 text-orange-500" : "text-white/50"}`} onClick={() => setTab("dishes")}>Plats ({dishReviews.length})</button>
        <button className={`shrink-0 pb-2 px-2 text-sm font-bold ${tab === "servers" ? "border-b-2 border-orange-500 text-orange-500" : "text-white/50"}`} onClick={() => setTab("servers")}>Serveurs ({serverReviews.length})</button>
        <button className={`shrink-0 pb-2 px-2 text-sm font-bold flex items-center gap-2 ${tab === "campaign" ? "border-b-2 border-orange-500 text-orange-500" : "text-white/50"}`} onClick={() => setTab("campaign")}>
          Parametres IA
        </button>
      </div>

      {tab === "synthesis" && (
        <div className="space-y-8">
          {!stats ? (
            <p className="text-sm text-white/50 text-center py-8">Chargement des statistiques...</p>
          ) : stats.totalReviews === 0 ? (
            <div className="text-center py-12 space-y-3">
              <div className="text-5xl">📊</div>
              <p className="text-white/50">Aucun avis pour le moment. Les statistiques apparaitront ici des le premier avis.</p>
            </div>
          ) : (
            <>
              {/* Header stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="card text-center py-4">
                  <div className="text-3xl font-black text-white">{stats.totalReviews}</div>
                  <div className="text-xs text-white/50 mt-1">Avis total</div>
                </div>
                <div className="card text-center py-4">
                  <div className="text-3xl font-black text-orange-400">{stats.avg.global}/5</div>
                  <div className="text-xs text-white/50 mt-1">Note globale</div>
                </div>
                <div className="card text-center py-4">
                  <div className="text-3xl font-black text-emerald-400">{stats.today.count}</div>
                  <div className="text-xs text-white/50 mt-1">Avis aujourd'hui</div>
                </div>
                <div className="card text-center py-4">
                  <div className="text-3xl font-black text-white">{stats.history.length}</div>
                  <div className="text-xs text-white/50 mt-1">Jours actifs</div>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-8">
                {/* Radar octogone */}
                <div className="card p-6">
                  <h3 className="font-bold text-white mb-4 text-center">{selectedDay ? `Journee du ${new Date(selectedDay.date).toLocaleDateString("fr-FR")}` : "Moyenne globale"}</h3>
                  <RadarOctagon avg={selectedDay?.avg ?? stats.avg} />
                  {selectedDay && (
                    <button onClick={() => setSelectedDay(null)} className="block mx-auto mt-4 text-xs text-orange-400 hover:underline">
                      Retour a la moyenne globale
                    </button>
                  )}
                </div>

                {/* Synthese du jour */}
                <div className="space-y-4">
                  <div className="card p-6">
                    <h3 className="font-bold text-white mb-3">Synthese du jour</h3>
                    {stats.today.count === 0 ? (
                      <p className="text-sm text-white/40">Pas encore d'avis aujourd'hui.</p>
                    ) : (
                      <div className="space-y-3">
                        {stats.history[0] && stats.history[0].date === stats.today.date && (
                          <>
                            {stats.history[0].best && (
                              <div className="flex items-start gap-2">
                                <span className="text-emerald-400 text-lg leading-none mt-0.5">+</span>
                                <div>
                                  <div className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Point fort</div>
                                  <p className="text-sm text-white/70">{stats.history[0].best}</p>
                                </div>
                              </div>
                            )}
                            {stats.history[0].worst && (
                              <div className="flex items-start gap-2">
                                <span className="text-red-400 text-lg leading-none mt-0.5">-</span>
                                <div>
                                  <div className="text-xs text-red-400 font-bold uppercase tracking-wider">A ameliorer</div>
                                  <p className="text-sm text-white/70">{stats.history[0].worst}</p>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                        {stats.today.comments.length > 0 && (
                          <div className="pt-2 border-t border-white/5">
                            <div className="text-xs text-white/30 font-bold uppercase tracking-wider mb-2">Verbatims clients</div>
                            <div className="space-y-1.5 max-h-48 overflow-y-auto">
                              {stats.today.comments.map((c, i) => (
                                <div key={i} className="text-xs text-white/60 bg-white/5 px-3 py-2 rounded-lg">"{c}"</div>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* ── Octogones Plats & Serveurs ─────────────────────────────── */}
              {(dishAggregates.length > 0 || serverAggregates.length > 0) && (
                <div className="grid md:grid-cols-2 gap-6">
                  {dishAggregates.length > 0 && (
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">🍽️ Plats notés</h3>
                        <span className="text-xs text-white/40">
                          {dishAggregates.reduce((s, d) => s + d.count, 0)} avis · {dishAggregates.length} plat{dishAggregates.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <GenericOctagon
                        items={dishAggregates.slice(0, 8).map(d => ({ label: d.name, value: d.avg, count: d.count }))}
                        color="#f59e0b"
                        emptyMessage="Aucun avis sur les plats."
                      />
                      {dishAggregates.length > 0 && (
                        <div className="mt-4 space-y-1.5 max-h-48 overflow-y-auto">
                          {dishAggregates.slice(0, 8).map(d => (
                            <div key={d.name} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/5">
                              <span className="text-white/70 truncate">{d.name}</span>
                              <span className="font-mono text-amber-400 shrink-0 ml-2">
                                {d.avg.toFixed(1)}/5 <span className="text-white/30">({d.count})</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {serverAggregates.length > 0 && (
                    <div className="card p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="font-bold text-white flex items-center gap-2">👤 Serveurs notés</h3>
                        <span className="text-xs text-white/40">
                          {serverAggregates.reduce((s, d) => s + d.count, 0)} avis · {serverAggregates.length} serveur{serverAggregates.length > 1 ? "s" : ""}
                        </span>
                      </div>
                      <GenericOctagon
                        items={serverAggregates.slice(0, 8).map(d => ({ label: d.name, value: d.avg, count: d.count }))}
                        color="#3b82f6"
                        emptyMessage="Aucun avis sur les serveurs."
                      />
                      {serverAggregates.length > 0 && (
                        <div className="mt-4 space-y-1.5 max-h-48 overflow-y-auto">
                          {serverAggregates.slice(0, 8).map(d => (
                            <div key={d.name} className="flex items-center justify-between text-xs px-3 py-2 rounded-lg bg-white/5">
                              <span className="text-white/70 truncate">{d.name}</span>
                              <span className="font-mono text-blue-400 shrink-0 ml-2">
                                {d.avg.toFixed(1)}/5 <span className="text-white/30">({d.count})</span>
                              </span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* ── Trend Analysis ──────────────────────────────────────────── */}
              {trendData && (
                <div className="card p-6">
                  <h3 className="font-bold text-white mb-4">Tendances</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-semibold">Note globale</span>
                        <span className="text-xs font-mono text-orange-400">{trendData.global[trendData.global.length - 1]}/5</span>
                      </div>
                      <Sparkline data={trendData.global} color="#f97316" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-semibold">Cuisine</span>
                        <span className="text-xs font-mono text-amber-400">{trendData.food[trendData.food.length - 1]}/5</span>
                      </div>
                      <Sparkline data={trendData.food} color="#f59e0b" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-semibold">Service</span>
                        <span className="text-xs font-mono text-blue-400">{trendData.service[trendData.service.length - 1]}/5</span>
                      </div>
                      <Sparkline data={trendData.service} color="#60a5fa" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-semibold">Ambiance</span>
                        <span className="text-xs font-mono text-purple-400">{trendData.atmosphere[trendData.atmosphere.length - 1]}/5</span>
                      </div>
                      <Sparkline data={trendData.atmosphere} color="#a78bfa" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-semibold">Qualite/Prix</span>
                        <span className="text-xs font-mono text-emerald-400">{trendData.value[trendData.value.length - 1]}/5</span>
                      </div>
                      <Sparkline data={trendData.value} color="#34d399" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-white/50 font-semibold">Avis/jour</span>
                        <span className="text-xs font-mono text-white/70">{trendData.reviewsPerDay[trendData.reviewsPerDay.length - 1]}</span>
                      </div>
                      <Sparkline data={trendData.reviewsPerDay} color="#94a3b8" />
                    </div>
                  </div>
                </div>
              )}

              {/* ── Server Leaderboard ────────────────────────────────────── */}
              {serverLeaderboard.length > 0 && (
                <div className="card p-6">
                  <h3 className="font-bold text-white mb-4">Classement Serveurs</h3>
                  <div className="space-y-3">
                    {serverLeaderboard.map((s, i) => {
                      const medal = i === 0 ? "text-yellow-400" : i === 1 ? "text-slate-300" : i === 2 ? "text-amber-600" : "text-white/20";
                      return (
                        <div key={s.id} className="flex items-center gap-4 p-3 rounded-xl bg-white/[0.02] border border-white/5">
                          <div className={`text-lg font-black w-8 text-center ${medal}`}>
                            {i < 3 ? ["1er", "2e", "3e"][i] : `${i + 1}e`}
                          </div>
                          <div className="w-10 h-10 rounded-full bg-white/10 overflow-hidden flex items-center justify-center text-sm font-bold text-white/40 shrink-0">
                            {s.photoUrl
                              ? <img
                                  src={s.photoUrl.startsWith("http") ? s.photoUrl : `${API_URL}${s.photoUrl.startsWith("/") ? s.photoUrl : `/${s.photoUrl}`}`}
                                  alt={s.name}
                                  className="w-full h-full object-cover"
                                  decoding="async"
                                  loading="lazy"
                                  referrerPolicy="no-referrer"
                                  crossOrigin="anonymous"
                                  onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = "none"; }}
                                />
                              : s.name.charAt(0)
                            }
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">{s.name}</div>
                            <div className="text-xs text-white/40">{s.reviewsCount} avis</div>
                          </div>
                          <div className="text-right shrink-0">
                            <div className={`text-sm font-bold ${(s.avgRating || 0) >= 4 ? "text-emerald-400" : (s.avgRating || 0) >= 3 ? "text-orange-400" : "text-red-400"}`}>
                              {s.avgRating ? `${s.avgRating.toFixed(1)}/5` : "-"}
                            </div>
                            {s.totalTipsCents > 0 && (
                              <div className="text-[10px] text-emerald-400/70">{(s.totalTipsCents / 100).toFixed(0)} EUR tips</div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Historique par jour */}
              <div className="card p-6">
                <h3 className="font-bold text-white mb-4">Historique (30 derniers jours)</h3>
                <div className="space-y-2 max-h-80 overflow-y-auto">
                  {stats.history.map((day) => {
                    const dayAvgGlobal = +((day.avg.food + day.avg.service + day.avg.atmosphere + day.avg.value) / 4).toFixed(1);
                    return (
                      <button
                        key={day.date}
                        onClick={() => setSelectedDay(day)}
                        className={`w-full flex items-center justify-between p-3 rounded-xl border text-left transition-all ${selectedDay?.date === day.date ? "bg-orange-500/10 border-orange-500/30" : "bg-white/[0.02] border-white/5 hover:border-white/15 hover:bg-white/5"}`}
                      >
                        <div className="flex items-center gap-4">
                          <div className="text-sm font-bold text-white/70 w-24">{new Date(day.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })}</div>
                          <div className="text-xs text-white/40">{day.count} avis</div>
                        </div>
                        <div className="flex items-center gap-4">
                          {day.best && <span className="text-xs text-emerald-400/70 hidden md:block">+ {day.best}</span>}
                          {day.worst && <span className="text-xs text-red-400/70 hidden md:block">- {day.worst}</span>}
                          <div className={`text-sm font-bold px-2 py-0.5 rounded ${dayAvgGlobal >= 4 ? "text-emerald-400 bg-emerald-500/10" : dayAvgGlobal >= 3 ? "text-orange-400 bg-orange-500/10" : "text-red-400 bg-red-500/10"}`}>
                            {dayAvgGlobal}/5
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {tab === "campaign" && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-bold mb-4 text-orange-400">1. Lien Google My Business</h3>
              <p className="text-sm text-white/50 mb-4">Lien exact vers la page de dépôt d'avis Google de votre établissement.</p>
              <input 
                type="url" 
                value={googleLink} 
                onChange={e => setGoogleLink(e.target.value)} 
                placeholder="https://g.page/r/..." 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm mb-2"
              />
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-emerald-400">2. Récompense Client</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={voucherActive} onChange={e => setVoucherActive(e.target.checked)} className="rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/20" />
                  <span className="text-sm text-white/70">Activer</span>
                </label>
              </div>
              <p className="text-sm text-white/50 mb-4">Offrez un bon de réduction automatique après le dépôt de l'avis.</p>
              
              <div className={`space-y-3 ${!voucherActive && "opacity-40 pointer-events-none"}`}>
                <div>
                  <label className="label">Titre de l'offre</label>
                  <input type="text" value={voucherTitle} onChange={e => setVoucherTitle(e.target.value)} placeholder="Ex: Un café offert !" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="label">Description courte</label>
                  <input type="text" value={voucherDesc} onChange={e => setVoucherDesc(e.target.value)} placeholder="Sur présentation de ce code à la caisse." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="label">Code promo secret</label>
                  <input type="text" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="MERCI24" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono text-emerald-400 uppercase" />
                </div>
              </div>
            </div>

            <button onClick={saveCampaign} disabled={saving} className="btn-primary w-full py-3">
              {saving ? "Sauvegarde..." : "Enregistrer la campagne"}
            </button>
          </div>

          <div className="card bg-gradient-to-br from-purple-500/10 to-orange-500/5 border-purple-500/20 flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Générateur d'Avis IA</h3>
            <p className="text-sm text-white/50 mb-8 max-w-xs">Vos clients scannent ce QR code, l'IA pose 3 questions et rédige l'avis parfait, prêt à être collé sur Google.</p>
            
            {restaurant?.slug ? (
              <>
                <div className="bg-white p-4 rounded-2xl shadow-xl mb-6">
                  {qrUrl && <img src={qrUrl} alt="QR Code Avis" className="w-48 h-48" />}
                </div>
                <Link href={`/r/${restaurant.slug}/review`} target="_blank" className="text-orange-400 text-sm hover:underline font-bold">
                  Ouvrir la page de test ↗
                </Link>
                <button onClick={() => {
                  const restoName = restaurant?.name || "Notre Restaurant";
                  const hasOffer = voucherActive && voucherTitle;
                  const offerHtml = hasOffer ? `
  <div class="offer-badge">
    <div class="offer-icon">🎁</div>
    <div class="offer-title">${voucherTitle || "Une recompense vous attend !"}</div>
    <div class="offer-desc">${voucherDesc || "Laissez un avis et recevez votre cadeau."}</div>
  </div>` : "";
                  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8" />
<title>QR Code Avis - ${restoName}</title>
<style>
  @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap');
  * { margin: 0; padding: 0; box-sizing: border-box; }
  @page { size: A4 portrait; margin: 0; }
  html, body { width: 100%; height: 100%; font-family: 'Inter', Arial, sans-serif; background: #fff; color: #1a1a1a; }
  body { display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; }
  .container { display: flex; flex-direction: column; align-items: center; justify-content: center; text-align: center; padding: 40px; }
  .logo-text { font-size: 18px; font-weight: 600; color: #f97316; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 20px; }
  .resto-name { font-size: 42px; font-weight: 900; color: #1a1a1a; margin-bottom: 12px; line-height: 1.1; }
  .divider { width: 80px; height: 4px; background: #f97316; border-radius: 4px; margin: 20px auto 36px; }
  .qr-wrapper { background: #fff; border: 3px solid #f0f0f0; border-radius: 24px; padding: 24px; margin-bottom: 24px; }
  .qr-wrapper img { width: 220px; height: 220px; display: block; }
  .message { font-size: 28px; font-weight: 700; color: #1a1a1a; margin-bottom: 8px; line-height: 1.3; }
  .sub-message { font-size: 16px; color: #888; font-weight: 400; margin-top: 8px; }
  .offer-badge { margin-top: 28px; background: linear-gradient(135deg, #fff7ed, #fef3c7); border: 2px solid #f97316; border-radius: 16px; padding: 20px 32px; max-width: 400px; }
  .offer-icon { font-size: 32px; margin-bottom: 8px; }
  .offer-title { font-size: 20px; font-weight: 800; color: #c2410c; margin-bottom: 4px; }
  .offer-desc { font-size: 14px; color: #92400e; }
  .footer-print { position: fixed; bottom: 30px; left: 0; right: 0; text-align: center; font-size: 12px; color: #bbb; letter-spacing: 1px; }
</style>
</head>
<body>
<div class="container">
  <div class="logo-text">MaTable Pro</div>
  <div class="resto-name">${restoName}</div>
  <div class="divider"></div>
  <div class="qr-wrapper"><img src="${qrUrl}" alt="QR Code" /></div>
  <div class="message">Laissez-nous un avis en 2 minutes !</div>
  <div class="sub-message">Scannez le QR code avec votre telephone</div>
  ${offerHtml}
</div>
<div class="footer-print">matable.pro</div>
</body>
</html>`;
                  // Use hidden iframe to avoid popup blockers
                  let iframe = document.getElementById("qr-print-frame") as HTMLIFrameElement | null;
                  if (iframe) iframe.remove();
                  iframe = document.createElement("iframe");
                  iframe.id = "qr-print-frame";
                  iframe.style.cssText = "position:fixed;top:-9999px;left:-9999px;width:210mm;height:297mm;border:none;";
                  document.body.appendChild(iframe);
                  const doc = iframe.contentDocument || iframe.contentWindow?.document;
                  if (!doc) return;
                  doc.open();
                  doc.write(html);
                  doc.close();
                  setTimeout(() => {
                    iframe!.contentWindow?.focus();
                    iframe!.contentWindow?.print();
                  }, 600);
                }} className="mt-6 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-sm font-bold transition-colors">
                  🖨️ Imprimer ce QR Code
                </button>
              </>
            ) : (
              <p className="text-sm text-white/40">Veuillez sauvegarder le nom du restaurant dans les paramètres pour générer le QR Code.</p>
            )}
          </div>
        </div>
      )}

      {tab === "customers" && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">⭐ Avis IA générés</h2>
            {customerReviews.length === 0 ? (
              <p className="text-sm text-white/50 bg-white/5 p-4 rounded-xl text-center">Aucun avis généré pour le moment.</p>
            ) : customerReviews.map((r) => {
              const ratings = r.ratings || {};
              const vals = Object.values(ratings) as number[];
              const avg = vals.length ? vals.reduce((a, b) => a + b, 0) / vals.length : 0;

              // Parse review text — may be JSON { version1, version2 } or plain text
              let versions: string[] = [];
              if (r.reviewText) {
                try {
                  const parsed = JSON.parse(r.reviewText);
                  if (parsed.version1) versions.push(parsed.version1);
                  if (parsed.version2) versions.push(parsed.version2);
                } catch {
                  versions = [r.reviewText];
                }
              }

              return (
                <div key={r.id} className="card space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="text-sm text-orange-400 font-bold">{avg > 0 ? `${avg.toFixed(1)}/5` : 'Nouvel avis'}</div>
                    <div className="text-xs text-slate-400">{new Date(r.createdAt).toLocaleDateString()}</div>
                  </div>
                  <div className="flex items-center gap-3">
                    {r.serverName && <div className="text-xs text-white/50">Serveur : <span className="text-white/70 font-semibold">{r.serverName}</span></div>}
                  </div>
                  {ratings && (
                    <div className="flex flex-wrap gap-2 text-xs">
                      {ratings.food != null && <span className="px-2 py-1 rounded bg-white/5">🍽️ {ratings.food}/5</span>}
                      {ratings.service != null && <span className="px-2 py-1 rounded bg-white/5">😊 {ratings.service}/5</span>}
                      {ratings.atmosphere != null && <span className="px-2 py-1 rounded bg-white/5">🏠 {ratings.atmosphere}/5</span>}
                      {ratings.value != null && <span className="px-2 py-1 rounded bg-white/5">💰 {ratings.value}/5</span>}
                    </div>
                  )}
                  {/* Chat history — questions IA + réponses client */}
                  {r.chatHistory && r.chatHistory.length > 0 && (
                    <div className="pt-1">
                      <div className="text-[10px] uppercase tracking-wider text-white/30 font-bold mb-2">Conversation</div>
                      <div className="space-y-1.5">
                        {r.chatHistory.map((msg, i) => (
                          <div key={i} className={`flex ${msg.role === "ai" ? "justify-start" : "justify-end"}`}>
                            <div className={`px-3 py-1.5 rounded-xl text-xs max-w-[85%] ${msg.role === "ai" ? "bg-white/5 text-white/50" : "bg-orange-500/15 text-orange-300 font-medium"}`}>
                              {msg.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {versions.length > 0 && (
                    <div className="space-y-2 pt-1">
                      {versions.map((txt, i) => (
                        <div key={i} className="bg-black/20 border border-white/5 p-3 rounded-xl">
                          {versions.length > 1 && <div className="text-[10px] uppercase tracking-wider text-orange-400/60 font-bold mb-1">Version {i + 1}</div>}
                          <p className="text-sm text-white/70 leading-relaxed">{txt}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2">💝 Pourboires reçus</h2>
            {serverTips.length === 0 ? (
              <p className="text-sm text-white/50 bg-white/5 p-4 rounded-xl text-center">Aucun pourboire reçu pour le moment.</p>
            ) : serverTips.map((t) => (
              <div key={t.id} className="card flex items-center justify-between">
                <div>
                  <div className="font-bold text-emerald-400">{(t.amountCents / 100).toFixed(2)} €</div>
                  <div className="text-xs text-white/50 mt-0.5">Pour : {t.serverName}</div>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  <div>{new Date(t.createdAt).toLocaleDateString()}</div>
                  <div className="text-[10px] mt-0.5">Stripe</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === "dishes" && (
        <div className="space-y-2">
          {dishReviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{r.menuItem.name}</div>
                  <div className="text-sm">{"⭐".repeat(r.rating)} ({r.rating}/5)</div>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {tab === "servers" && (
        <div className="space-y-2">
          {serverReviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{r.server.name}</div>
                  <div className="text-sm">{"⭐".repeat(r.rating)} ({r.rating}/5)</div>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
