"use client";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { useState } from "react";
import { useParams } from "next/navigation";

type Tier = "bronze" | "silver" | "gold" | "platinum";
type CustomerResult = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  points: number;
  tier: Tier;
  totalSpent: number;
  visitCount: number;
  transactions: Array<{
    id: string;
    type: "earn" | "redeem" | "adjust" | "expire";
    points: number;
    description: string | null;
    createdAt: string;
  }>;
  offers: Array<{
    id: string;
    name: string;
    description: string | null;
    type: string;
    pointsCost: number;
    minTier: string | null;
    active: boolean;
  }>;
};

const TIERS: Record<Tier, { label: string; icon: string; color: string; bg: string; border: string; minPts: number; nextPts: number | null }> = {
  bronze:   { label: "Bronze",  icon: "🥉", color: "text-amber-500",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  minPts: 0,    nextPts: 500  },
  silver:   { label: "Argent",  icon: "🥈", color: "text-slate-300",  bg: "bg-slate-500/10",  border: "border-slate-400/30",  minPts: 500,  nextPts: 2000 },
  gold:     { label: "Or",      icon: "🥇", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-400/30", minPts: 2000, nextPts: 5000 },
  platinum: { label: "Platine", icon: "💎", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-400/30", minPts: 5000, nextPts: null },
};

const OFFER_ICONS: Record<string, string> = {
  discount_pct: "🏷️", discount_fixed: "💶", free_item: "🎁", double_points: "⚡", birthday: "🎂",
};

export default function FidelitePage() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;

  const [lookup, setLookup] = useState("");
  const [result, setResult] = useState<CustomerResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searched, setSearched] = useState(false);

  const search = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!lookup.trim()) return;
    setLoading(true);
    setError(null);
    setResult(null);
    setSearched(true);
    try {
      const res = await fetch(`${API_URL}/api/r/${slug}/loyalty?q=${encodeURIComponent(lookup.trim())}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "not_found");
      setResult(data.customer);
    } catch (err: any) {
      setError("Aucun compte trouvé pour cet email ou ce téléphone.");
    } finally {
      setLoading(false);
    }
  };

  const tierInfo = result ? TIERS[result.tier] : null;

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${slug}`} className="text-white/50 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← Retour
          </Link>
          <span className="text-base font-black">💎 Fidélité</span>
        </div>
      </nav>

      <div className="max-w-xl mx-auto px-4 py-10 space-y-8">

        {/* Hero */}
        {!result && (
          <div className="text-center space-y-3">
            <div className="text-5xl">💎</div>
            <h1 className="text-2xl font-black">Mon espace fidélité</h1>
            <p className="text-white/40 text-sm max-w-xs mx-auto">
              Consultez vos points, votre niveau et les offres exclusives disponibles.
            </p>
          </div>
        )}

        {/* Lookup form */}
        <form onSubmit={search} className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-5 space-y-3">
          <label className="text-xs font-bold text-white/50 uppercase tracking-wider block">
            Votre email ou téléphone
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={lookup}
              onChange={(e) => setLookup(e.target.value)}
              placeholder="jean@exemple.fr  ou  06 12 34 56 78"
              className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-3 text-white text-sm placeholder-white/25 focus:outline-none focus:border-orange-500/50"
              required
            />
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm shrink-0"
            >
              {loading ? "…" : "Consulter"}
            </button>
          </div>
          {error && searched && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}
        </form>

        {/* Result */}
        {result && tierInfo && (
          <div className="space-y-5">
            {/* Card niveau */}
            <div className={`rounded-2xl p-6 border ${tierInfo.bg} ${tierInfo.border}`}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider font-bold mb-1">Bonjour</p>
                  <h2 className="text-xl font-black text-white">
                    {[result.firstName, result.lastName].filter(Boolean).join(" ") || result.email || result.phone}
                  </h2>
                </div>
                <div className={`text-4xl`}>{tierInfo.icon}</div>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <p className="text-4xl font-black text-white">{result.points.toLocaleString("fr-FR")}</p>
                  <p className="text-xs text-white/40 mt-0.5">points accumulés</p>
                </div>
                <div className={`px-3 py-1.5 rounded-full ${tierInfo.bg} border ${tierInfo.border}`}>
                  <span className={`text-sm font-black ${tierInfo.color}`}>{tierInfo.icon} {tierInfo.label}</span>
                </div>
              </div>

              {/* Progress to next tier */}
              {tierInfo.nextPts !== null && (
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-white/40 mb-1.5">
                    <span>{result.points.toLocaleString("fr-FR")} pts</span>
                    <span>{tierInfo.nextPts.toLocaleString("fr-FR")} pts pour le niveau suivant</span>
                  </div>
                  <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full ${tierInfo.color.replace("text-", "bg-")}`}
                      style={{ width: `${Math.min(100, ((result.points - tierInfo.minPts) / (tierInfo.nextPts - tierInfo.minPts)) * 100).toFixed(1)}%` }}
                    />
                  </div>
                  <p className="text-[11px] text-white/30 mt-1.5">
                    Encore {Math.max(0, tierInfo.nextPts - result.points).toLocaleString("fr-FR")} points pour atteindre le niveau suivant
                  </p>
                </div>
              )}
              {tierInfo.nextPts === null && (
                <p className="mt-3 text-xs text-violet-300/70 font-semibold">✨ Niveau maximum atteint — vous bénéficiez de tous les avantages !</p>
              )}

              {/* Stats */}
              <div className="grid grid-cols-2 gap-3 mt-5 pt-4 border-t border-white/[0.08]">
                <div>
                  <p className="text-2xl font-black text-white">{result.visitCount}</p>
                  <p className="text-xs text-white/40">visite{result.visitCount > 1 ? "s" : ""}</p>
                </div>
                <div>
                  <p className="text-2xl font-black text-white">{result.totalSpent.toFixed(0)} €</p>
                  <p className="text-xs text-white/40">dépensés au total</p>
                </div>
              </div>
            </div>

            {/* Offres disponibles */}
            {result.offers.filter((o) => o.active).length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Offres disponibles</h3>
                <div className="space-y-2">
                  {result.offers.filter((o) => o.active).map((offer) => {
                    const tierOrder: Tier[] = ["bronze", "silver", "gold", "platinum"];
                    const myTierIdx = tierOrder.indexOf(result.tier);
                    const minTierIdx = offer.minTier ? tierOrder.indexOf(offer.minTier as Tier) : 0;
                    const canRedeem = result.points >= offer.pointsCost && myTierIdx >= minTierIdx;
                    return (
                      <div
                        key={offer.id}
                        className={`rounded-xl p-4 border flex items-center gap-4 ${
                          canRedeem
                            ? "bg-orange-500/10 border-orange-500/20"
                            : "bg-white/[0.02] border-white/[0.06] opacity-60"
                        }`}
                      >
                        <span className="text-2xl shrink-0">{OFFER_ICONS[offer.type] ?? "🎁"}</span>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-white text-sm">{offer.name}</p>
                          {offer.description && <p className="text-xs text-white/40 truncate">{offer.description}</p>}
                        </div>
                        <div className="text-right shrink-0">
                          <p className={`font-black text-sm ${canRedeem ? "text-orange-300" : "text-white/30"}`}>
                            {offer.pointsCost.toLocaleString("fr-FR")} pts
                          </p>
                          {!canRedeem && result.points < offer.pointsCost && (
                            <p className="text-[10px] text-white/25">
                              encore {(offer.pointsCost - result.points).toLocaleString("fr-FR")} pts
                            </p>
                          )}
                          {canRedeem && (
                            <p className="text-[10px] text-orange-400/80 font-semibold">Disponible ✓</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                  <p className="text-xs text-white/30 pt-1">Pour utiliser une offre, présentez cet écran à votre serveur lors de votre prochaine visite.</p>
                </div>
              </div>
            )}

            {/* Historique transactions */}
            {result.transactions.length > 0 && (
              <div>
                <h3 className="text-xs font-bold text-white/40 uppercase tracking-wider mb-3">Historique récent</h3>
                <div className="space-y-1.5">
                  {result.transactions.slice(0, 8).map((tx) => (
                    <div key={tx.id} className="flex items-center justify-between rounded-xl bg-white/[0.03] border border-white/[0.06] px-4 py-3">
                      <div>
                        <p className="text-sm text-white/70">{tx.description ?? (tx.type === "earn" ? "Points gagnés" : tx.type === "redeem" ? "Offre utilisée" : "Ajustement")}</p>
                        <p className="text-xs text-white/30">{new Date(tx.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
                      </div>
                      <span className={`font-black text-sm ${tx.points >= 0 ? "text-emerald-400" : "text-red-400"}`}>
                        {tx.points >= 0 ? "+" : ""}{tx.points.toLocaleString("fr-FR")} pts
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => { setResult(null); setSearched(false); setLookup(""); }}
              className="w-full py-3 bg-white/5 hover:bg-white/10 border border-white/[0.08] text-white/60 hover:text-white rounded-xl text-sm transition-colors"
            >
              ← Chercher un autre compte
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
