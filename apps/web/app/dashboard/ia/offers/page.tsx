"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type ActiveOffer = {
  id: string;
  dish: string;
  type: string;
  description: string;
  discountPercent: number;
  rationale: string;
  endsAt: string;
  createdAt: string;
};

const TYPE_ICON: Record<string, string> = {
  HAPPY_HOUR: "🕐",
  COMBO: "🍱",
  PROMO_SEMAINE: "📅",
  FORMULE: "🎯",
  PROMO: "🏷️",
};

function daysLeft(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  const d = Math.ceil(diff / 86400_000);
  return d;
}

export default function OffersPage() {
  const [offers, setOffers] = useState<ActiveOffer[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  const loadOffers = async () => {
    setLoading(true);
    try {
      const r = await api<{ offers: ActiveOffer[] }>("/api/pro/ia/offers");
      setOffers(r.offers);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOffers(); }, []);

  const removeOffer = async (id: string) => {
    setRemoving(id);
    try {
      await api(`/api/pro/ia/offers/${id}`, { method: "DELETE" });
      setOffers(prev => prev.filter(o => o.id !== id));
    } catch { /* ignore */ }
    finally { setRemoving(null); }
  };

  return (
    <div className="p-8 max-w-4xl space-y-6">

      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white flex items-center gap-3">
          <span className="text-3xl">🏷️</span> Offres en cours
        </h1>
        <p className="text-sm text-white/40 mt-1">
          Offres d{"\u00e9"}ploy{"\u00e9"}es par Nova Finance IA. Les offres expirent automatiquement.
        </p>
      </div>

      {loading && (
        <div className="text-center py-16">
          <span className="w-8 h-8 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin inline-block" />
        </div>
      )}

      {!loading && offers.length === 0 && (
        <div className="text-center py-16 bg-white/[0.02] border border-white/[0.06] rounded-2xl">
          <div className="text-5xl mb-3">🏷️</div>
          <p className="text-white/40 text-sm mb-2">Aucune offre active</p>
          <p className="text-white/25 text-xs">
            Lancez une analyse dans <a href="/dashboard/ia/finance" className="text-purple-400 hover:underline">Nova Finance IA</a> pour obtenir des recommandations d'offres.
          </p>
        </div>
      )}

      {!loading && offers.length > 0 && (
        <div className="space-y-3">
          <p className="text-sm text-white/50">{offers.length} offre{offers.length > 1 ? "s" : ""} active{offers.length > 1 ? "s" : ""}</p>

          {offers.map(o => {
            const days = daysLeft(o.endsAt);
            const isExpiring = days <= 2;
            return (
              <div key={o.id} className={`border rounded-2xl p-5 transition-all ${
                isExpiring
                  ? "bg-amber-500/5 border-amber-500/20"
                  : "bg-purple-500/5 border-purple-500/20"
              }`}>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">{TYPE_ICON[o.type] ?? "🏷️"}</span>
                      <h3 className="font-bold text-white text-lg">{o.dish}</h3>
                      <span className="text-xl font-black text-emerald-400">-{o.discountPercent}%</span>
                    </div>

                    <p className="text-sm text-white/70 mb-2">{o.description}</p>

                    {o.rationale && (
                      <p className="text-xs text-white/40 mb-3">{o.rationale}</p>
                    )}

                    <div className="flex items-center gap-4 text-xs">
                      <span className={`font-bold ${isExpiring ? "text-amber-400" : "text-purple-400"}`}>
                        {days > 0 ? `${days} jour${days > 1 ? "s" : ""} restant${days > 1 ? "s" : ""}` : "Expire aujourd'hui"}
                      </span>
                      <span className="text-white/30">
                        Depuis le {new Date(o.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                      <span className="text-white/30">
                        Fin : {new Date(o.endsAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => removeOffer(o.id)}
                    disabled={removing === o.id}
                    className="shrink-0 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 text-xs font-bold rounded-lg transition-colors disabled:opacity-50"
                  >
                    {removing === o.id ? "..." : "Retirer"}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
