"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import QRCode from "qrcode";

type Customer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  points: number;
  tier: string;
  totalSpent: number;
  visitCount: number;
  offers: { id: string; name: string; description?: string | null; pointsCost: number; type: string; minTier?: string | null }[];
  transactions: { id: string; type: string; points: number; description?: string | null; createdAt: string }[];
};

type PageData = {
  customer: Customer;
  restaurant: { name: string; slug: string };
};

const TIER_INFO: Record<string, { label: string; icon: string; gradient: string; border: string; next: number }> = {
  bronze:   { label: "Bronze",  icon: "🥉", gradient: "from-amber-950 to-amber-900",  border: "border-amber-700/50",  next: 500  },
  silver:   { label: "Argent",  icon: "🥈", gradient: "from-slate-800 to-slate-700",  border: "border-slate-500/50",  next: 2000 },
  gold:     { label: "Or",      icon: "🥇", gradient: "from-yellow-950 to-yellow-900", border: "border-yellow-600/50", next: 5000 },
  platinum: { label: "Platine", icon: "💎", gradient: "from-cyan-950 to-cyan-900",     border: "border-cyan-500/50",   next: 5000 },
};

const TIER_SEQUENCE = ["bronze", "silver", "gold", "platinum"];

export default function CarteFidelitePage() {
  const { slug, customerId } = useParams<{ slug: string; customerId: string }>();
  const [data, setData]   = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [qrUrl, setQrUrl] = useState("");
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    api<PageData>(`/api/r/${slug}/loyalty/customer/${customerId}`, { pro: false })
      .then(setData)
      .catch(() => setError("Carte introuvable."))
      .finally(() => setLoading(false));
  }, [slug, customerId]);

  // QR code
  useEffect(() => {
    if (!customerId) return;
    QRCode.toDataURL(`LOYALTY:${customerId}`, {
      width: 220,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    }).then(setQrUrl).catch(() => {});
  }, [customerId]);

  // Inject PWA manifest dynamically
  useEffect(() => {
    const existing = document.querySelector('link[rel="manifest"][data-loyalty]');
    if (existing) return;
    const link = document.createElement("link");
    link.rel = "manifest";
    link.setAttribute("data-loyalty", "1");
    link.href = `/${slug}/carte/${customerId}/manifest`;
    document.head.appendChild(link);
    // iOS: set theme-color
    let meta = document.querySelector('meta[name="theme-color"]') as HTMLMetaElement | null;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = "#f97316";
    // iOS: apple-mobile-web-app-capable
    if (!document.querySelector('meta[name="apple-mobile-web-app-capable"]')) {
      const m = document.createElement("meta");
      m.name = "apple-mobile-web-app-capable";
      m.content = "yes";
      document.head.appendChild(m);
    }
    if (!document.querySelector('meta[name="apple-mobile-web-app-title"]')) {
      const m = document.createElement("meta");
      m.name = "apple-mobile-web-app-title";
      m.content = "Fidélité";
      document.head.appendChild(m);
    }
  }, [slug, customerId]);

  // PWA install prompt
  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener("beforeinstallprompt", handler);
    window.addEventListener("appinstalled", () => setInstalled(true));
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  async function installPwa() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") setInstalled(true);
    setDeferredPrompt(null);
  }

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </main>
  );

  if (error || !data) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 text-center">
      <p className="text-5xl">💎</p>
      <p className="text-white/60">{error ?? "Carte non disponible."}</p>
      <Link href={`/${slug}`} className="text-orange-400 text-sm hover:underline">← Retour au restaurant</Link>
    </main>
  );

  const { customer, restaurant } = data;
  const tier = customer.tier in TIER_INFO ? customer.tier : "bronze";
  const ti = TIER_INFO[tier];
  const pts = customer.points;
  const progress = tier === "platinum" ? 100 : Math.min(100, Math.round((pts / ti.next) * 100));
  const ptsToNext = tier === "platinum" ? null : ti.next - pts;
  const nextTierLabel = TIER_SEQUENCE[TIER_SEQUENCE.indexOf(tier) + 1];
  const nextTierInfo = nextTierLabel ? TIER_INFO[nextTierLabel] : null;
  const fullName = [customer.firstName, customer.lastName].filter(Boolean).join(" ");

  // iOS: "Add to Home Screen" instruction (no beforeinstallprompt on Safari)
  const isIos = typeof navigator !== "undefined" && /iphone|ipad|ipod/i.test(navigator.userAgent) && !(window as any).MSStream;
  const isStandalone = typeof window !== "undefined" && (window.navigator as any).standalone === true;

  return (
    <main className="max-w-sm mx-auto px-4 pb-12 pt-6">
      {/* ── Nav ─────────────────────────────────────────────────────── */}
      <div className="flex items-center justify-between mb-6">
        <Link href={`/${slug}/fidelite`} className="text-white/40 hover:text-white/70 text-sm">← {restaurant.name}</Link>
        <p className="text-xs text-white/30">Carte fidélité</p>
      </div>

      {/* ── Main card ───────────────────────────────────────────────── */}
      <div className={`rounded-3xl border ${ti.border} bg-gradient-to-br ${ti.gradient} p-6 mb-5 relative overflow-hidden shadow-2xl`}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/[0.04] blur-3xl pointer-events-none" />
        <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-white/[0.03] blur-2xl pointer-events-none" />
        <div className="relative z-10">
          <div className="flex items-start justify-between mb-5">
            <div>
              <p className="text-[10px] text-white/40 uppercase tracking-widest mb-0.5">{restaurant.name}</p>
              <h1 className="text-xl font-black text-white">{fullName || "Membre"}</h1>
            </div>
            <span className="text-4xl drop-shadow-lg">{ti.icon}</span>
          </div>

          <div className="mb-5">
            <p className="text-5xl font-black text-white tabular-nums">{pts.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-white/50 uppercase tracking-widest mt-1">points</p>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
            <span className="font-semibold">{ti.icon} {ti.label}</span>
            {nextTierInfo && <span>→ {nextTierInfo.icon} {nextTierInfo.label} à {ti.next.toLocaleString("fr-FR")} pts</span>}
            {!nextTierInfo && <span className="text-white/60">✨ Niveau maximum</span>}
          </div>
          <div className="h-2 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-white/70 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          {ptsToNext !== null && (
            <p className="text-[11px] text-white/30 mt-1 text-right">{ptsToNext.toLocaleString("fr-FR")} pts pour {nextTierInfo?.label}</p>
          )}
        </div>
      </div>

      {/* ── QR code ─────────────────────────────────────────────────── */}
      {qrUrl && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 mb-5 flex flex-col items-center gap-3">
          <p className="text-xs text-white/40 uppercase tracking-wider text-center">
            Présentez ce QR au serveur pour créditer des points
          </p>
          <div className="w-44 h-44 rounded-2xl bg-white/[0.06] flex items-center justify-center overflow-hidden p-1">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR fidélité" className="w-40 h-40" />
          </div>
          <p className="text-[10px] text-white/20 font-mono text-center break-all px-2">
            LOYALTY:{customerId}
          </p>
        </div>
      )}

      {/* ── PWA Install prompt (Android/Chrome) ─────────────────────── */}
      {deferredPrompt && !installed && (
        <button
          onClick={installPwa}
          className="w-full mb-5 py-3.5 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-600 text-white font-black text-sm flex items-center justify-center gap-2 shadow-lg shadow-orange-500/20"
        >
          <span className="text-lg">📲</span>
          Ajouter à l'écran d'accueil
        </button>
      )}
      {installed && (
        <div className="w-full mb-5 py-3 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-sm font-bold text-center">
          ✅ Application installée !
        </div>
      )}

      {/* ── iOS "Add to Home Screen" instructions ───────────────────── */}
      {isIos && !isStandalone && !deferredPrompt && (
        <div className="mb-5 rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
          <p className="text-xs font-bold text-white mb-2">📲 Installer sur votre iPhone</p>
          <p className="text-xs text-white/50 leading-relaxed">
            Appuyez sur <strong className="text-white/70">⎙ Partager</strong> en bas de Safari, puis <strong className="text-white/70">« Sur l'écran d'accueil »</strong>.
          </p>
        </div>
      )}

      {/* ── Stats ───────────────────────────────────────────────────── */}
      <div className="grid grid-cols-2 gap-3 mb-5">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-white">{customer.visitCount}</p>
          <p className="text-xs text-white/40 mt-0.5">visites</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-white">{customer.totalSpent.toFixed(0)} €</p>
          <p className="text-xs text-white/40 mt-0.5">dépensé</p>
        </div>
      </div>

      {/* ── Offers ──────────────────────────────────────────────────── */}
      {customer.offers.length > 0 && (
        <section className="mb-5">
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Vos offres</h2>
          <div className="space-y-2">
            {customer.offers.map(o => {
              const canRedeem = pts >= o.pointsCost;
              return (
                <div key={o.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  canRedeem
                    ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400"
                    : "border-white/[0.06] bg-white/[0.03] text-white/40"
                }`}>
                  <div>
                    <p className="text-sm font-semibold">{o.name}</p>
                    {o.description && <p className="text-xs opacity-60 mt-0.5">{o.description}</p>}
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="text-sm font-bold">{o.pointsCost} pts</p>
                    {canRedeem && <p className="text-[10px] opacity-70">✅ Dispo</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Transaction history ─────────────────────────────────────── */}
      {customer.transactions.length > 0 && (
        <section>
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Historique</h2>
          <div className="space-y-2">
            {customer.transactions.map(tx => (
              <div key={tx.id} className="flex items-center justify-between px-4 py-3 rounded-xl border border-white/[0.06] bg-white/[0.02]">
                <div>
                  <p className="text-xs text-white/70">{tx.description ?? tx.type}</p>
                  <p className="text-[10px] text-white/30 mt-0.5">
                    {new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <p className={`text-sm font-bold tabular-nums ${tx.points > 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {tx.points > 0 ? "+" : ""}{tx.points}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
