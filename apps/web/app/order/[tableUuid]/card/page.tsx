"use client";
import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";
import QRCode from "qrcode";

type LoyaltyCustomer = {
  id: string;
  firstName?: string | null;
  lastName?: string | null;
  email?: string | null;
  phone?: string | null;
  points: number;
  tier: string;
  totalSpent?: number;
  visitCount?: number;
  offers: { id: string; name: string; description?: string | null; pointsCost: number; type: string }[];
};

const TIER_INFO: Record<string, { label: string; icon: string; gradient: string; border: string }> = {
  bronze:   { label: "Bronze",  icon: "🥉", gradient: "from-amber-900/60 to-amber-800/30",  border: "border-amber-700/40" },
  silver:   { label: "Argent",  icon: "🥈", gradient: "from-slate-700/60 to-slate-600/30",  border: "border-slate-500/40" },
  gold:     { label: "Or",      icon: "🥇", gradient: "from-yellow-800/60 to-yellow-700/30", border: "border-yellow-600/40" },
  platinum: { label: "Platine", icon: "💎", gradient: "from-cyan-900/60 to-cyan-800/30",     border: "border-cyan-600/40" },
};
const TIER_NEXT: Record<string, number> = { bronze: 500, silver: 2000, gold: 5000, platinum: 5000 };

export default function LoyaltyCardPage() {
  const { tableUuid } = useParams<{ tableUuid: string }>();
  const [loyalty, setLoyalty]       = useState<LoyaltyCustomer | null>(null);
  const [restaurantName, setRestaurantName] = useState("");
  const [restaurantSlug, setRestaurantSlug] = useState("");
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState<string | null>(null);
  const [qrUrl, setQrUrl]           = useState<string>("");

  useEffect(() => {
    const sessionKey = `atable_session_${tableUuid}`;
    const token = localStorage.getItem(sessionKey);
    if (!token) {
      setError("Session introuvable. Scannez à nouveau le QR de votre table.");
      setLoading(false);
      return;
    }
    Promise.all([
      api<{ loyalty?: LoyaltyCustomer }>(`/api/session/customer`, { method: "PATCH", token, pro: false, body: JSON.stringify({}) }),
      api<{ restaurant: { name: string; slug: string } }>(`/api/tables/${tableUuid}`, { pro: false }).catch(() => null),
    ]).then(([sessionRes, tableRes]) => {
      if (tableRes?.restaurant) {
        setRestaurantName(tableRes.restaurant.name);
        setRestaurantSlug(tableRes.restaurant.slug);
      }
      if (sessionRes.loyalty) {
        setLoyalty(sessionRes.loyalty);
      } else {
        setError("Aucun compte fidélité lié à cette session. Demandez l'addition et laissez votre email pour cumuler des points !");
      }
    })
    .catch(() => setError("Impossible de charger la carte fidélité."))
    .finally(() => setLoading(false));
  }, [tableUuid]);

  // Generate QR code when loyalty data is available
  useEffect(() => {
    if (!loyalty?.id) return;
    const data = `LOYALTY:${loyalty.id}`;
    QRCode.toDataURL(data, {
      width: 200,
      margin: 2,
      color: { dark: "#ffffff", light: "#00000000" },
    }).then(setQrUrl).catch(() => {});
  }, [loyalty]);

  if (loading) return (
    <main className="min-h-screen flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </main>
  );

  if (error || !loyalty) return (
    <main className="min-h-screen flex flex-col items-center justify-center px-6 gap-4 text-center">
      <p className="text-4xl">💎</p>
      <p className="text-white/60 text-sm">{error ?? "Carte non disponible."}</p>
      <Link href={`/order/${tableUuid}`} className="text-orange-400 text-sm hover:underline">← Retour</Link>
    </main>
  );

  const tier = loyalty.tier;
  const ti = TIER_INFO[tier] ?? TIER_INFO.bronze;
  const pts = loyalty.points;
  const nextThreshold = TIER_NEXT[tier] ?? 5000;
  const progress = tier === "platinum" ? 100 : Math.min(100, Math.round((pts / nextThreshold) * 100));
  const fullName = [loyalty.firstName, loyalty.lastName].filter(Boolean).join(" ");

  const slug = restaurantSlug || null;

  return (
    <main className="max-w-sm mx-auto px-4 pb-16 pt-6">
      <div className="flex items-center justify-between mb-6">
        <Link href={`/order/${tableUuid}`} className="text-white/40 hover:text-white/70 text-sm">← Retour</Link>
        {slug && (
          <Link href={`/${slug}/fidelite`} className="text-xs text-orange-400 hover:underline">Voir mon historique →</Link>
        )}
      </div>

      {/* ── Card ──────────────────────────────────────────────────────── */}
      <div className={`rounded-3xl border ${ti.border} bg-gradient-to-br ${ti.gradient} backdrop-blur-sm p-6 mb-6 relative overflow-hidden`}>
        {/* Decorative glow */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/[0.04] blur-2xl pointer-events-none" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-white/[0.03] blur-2xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-xs text-white/40 uppercase tracking-widest mb-0.5">
                {restaurantName || "Carte fidélité"}
              </p>
              <h1 className="text-xl font-black text-white">{fullName || "Membre"}</h1>
            </div>
            <span className="text-4xl">{ti.icon}</span>
          </div>

          <div className="mb-4">
            <p className="text-4xl font-black text-white">{pts.toLocaleString("fr-FR")}</p>
            <p className="text-xs text-white/50 uppercase tracking-wider">points</p>
          </div>

          <div className="flex items-center justify-between text-xs text-white/40 mb-1.5">
            <span>{ti.label}</span>
            {tier !== "platinum" && <span>→ {tier === "bronze" ? "Argent" : tier === "silver" ? "Or" : "Platine"} à {nextThreshold} pts</span>}
          </div>
          <div className="h-1.5 rounded-full bg-white/[0.08] overflow-hidden">
            <div
              className="h-full rounded-full bg-white/60 transition-all duration-700"
              style={{ width: `${progress}%` }}
            />
          </div>
          {tier !== "platinum" && (
            <p className="text-xs text-white/30 mt-1 text-right">{nextThreshold - pts} pts manquants</p>
          )}
        </div>
      </div>

      {/* ── QR code ──────────────────────────────────────────────────── */}
      {qrUrl && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 mb-6 flex flex-col items-center gap-3">
          <p className="text-xs text-white/40 uppercase tracking-wider">Scanner pour créditer des points</p>
          <div className="w-40 h-40 rounded-xl bg-white/[0.06] flex items-center justify-center overflow-hidden">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={qrUrl} alt="QR fidélité" className="w-36 h-36" />
          </div>
          <p className="text-[10px] text-white/20 font-mono break-all text-center">
            LOYALTY:{loyalty.id.slice(0, 16)}…
          </p>
        </div>
      )}

      {/* ── Offers ───────────────────────────────────────────────────── */}
      {loyalty.offers.length > 0 && (
        <section className="mb-6">
          <h2 className="text-xs font-bold text-white/30 uppercase tracking-widest mb-3">Vos offres</h2>
          <div className="space-y-2">
            {loyalty.offers.map(o => {
              const canRedeem = pts >= o.pointsCost;
              return (
                <div key={o.id} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                  canRedeem
                    ? "border-emerald-500/30 bg-emerald-500/[0.08] text-emerald-400"
                    : "border-white/[0.06] bg-white/[0.03] text-white/40"
                }`}>
                  <div>
                    <p className="text-sm font-semibold">{o.name}</p>
                    {o.description && <p className="text-xs opacity-60">{o.description}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold">{o.pointsCost} pts</p>
                    {canRedeem && <p className="text-[10px] opacity-70">✅ Disponible</p>}
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {/* ── Historique complet via page fidélité ──────────────────────── */}
      {slug && (
        <div className="mt-4 text-center">
          <a
            href={`/${slug}/fidelite`}
            className="text-xs text-orange-400 hover:underline"
          >
            Voir l'historique complet sur la page fidélité →
          </a>
        </div>
      )}

      {/* ── Stats ────────────────────────────────────────────────────── */}
      <div className="mt-6 grid grid-cols-2 gap-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-white">{loyalty.visitCount ?? 0}</p>
          <p className="text-xs text-white/40">visites</p>
        </div>
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4 text-center">
          <p className="text-2xl font-black text-white">{(loyalty.totalSpent ?? 0).toFixed(0)} €</p>
          <p className="text-xs text-white/40">dépensé</p>
        </div>
      </div>
    </main>
  );
}
