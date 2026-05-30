"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Status = {
  billingEnabled: boolean;
  plan: string;
  expiresAt: string | null;
  subscribed: boolean;
  isTrial?: boolean;
  hasInvoice?: boolean;
  daysRemaining?: number | null;
};

const PLANS = [
  { key: "starter",  label: "Starter",  monthly: 59,  features: ["Avis Google", "Réservations", "Commande & Paiement QR"] },
  { key: "pro",      label: "Pro",      monthly: 119, features: ["Tout Starter", "Portails Serveur / Cuisine / Caisse"] },
  { key: "business", label: "Business", monthly: 249, features: ["Tout Pro", "Nova IA, Stock, Compta, Fidélité"] },
] as const;

const ENUM_TO_KEY: Record<string, string> = { STARTER: "starter", PRO: "pro", PRO_IA: "business" };

type ReferralData = {
  currentCode: string | null;
  currentPeriod: string;
  codes: Array<{
    code: string; periodYearMonth: string; used: boolean; refereeName: string | null;
    registeredAt: string | null; converted: boolean; rewarded: boolean; isCurrent: boolean;
  }>;
  legacyCode: string | null;
  legacyReferees: Array<{ name: string; createdAt: string; converted: boolean; rewardGranted: boolean }>;
  totalConverted: number;
  totalRewardMonths: number;
  remainingYearly: number;
};

function periodLabel(yyyymm: string): string {
  if (!/^\d{6}$/.test(yyyymm)) return yyyymm;
  const y = yyyymm.slice(0, 4); const m = parseInt(yyyymm.slice(4), 10) - 1;
  return new Date(parseInt(y, 10), m, 1).toLocaleDateString("fr-FR", { month: "long", year: "numeric" });
}

export default function AbonnementPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState<string | null>(null);
  const [ref, setRef] = useState<ReferralData | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    api<Status>("/api/platform-billing/status")
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
    api<ReferralData>("/api/pro/referrals/me")
      .then(setRef)
      .catch(() => {});
  }, []);

  const shareLink = ref?.currentCode ? `${typeof window !== "undefined" ? window.location.origin : "https://matable.pro"}/register?ref=${ref.currentCode}` : "";
  async function copyLink() {
    if (!shareLink) return;
    try { await navigator.clipboard.writeText(shareLink); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch {}
  }

  async function subscribe(plan: string) {
    setBusy(plan);
    try {
      const r = await api<{ url: string }>("/api/platform-billing/checkout", {
        method: "POST", body: JSON.stringify({ plan, interval }),
      });
      if (r.url) window.location.href = r.url;
    } catch (e: any) {
      alert("Abonnement indisponible — " + (e?.message ?? "erreur"));
      setBusy(null);
    }
  }

  async function openPortal() {
    setBusy("portal");
    try {
      const r = await api<{ url: string }>("/api/platform-billing/portal", { method: "POST" });
      if (r.url) window.location.href = r.url;
    } catch (e: any) {
      alert("Portail indisponible — " + (e?.message ?? "erreur"));
      setBusy(null);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  const currentKey = status ? ENUM_TO_KEY[status.plan] ?? "starter" : "starter";

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Mon abonnement</h1>
        <p className="text-sm text-white/40 mt-0.5">Gérez votre forfait MaTable.Pro et votre moyen de paiement.</p>
      </div>

      {/* Bannière version d'essai */}
      {status?.isTrial && (
        <div className="rounded-2xl border border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.10] to-orange-500/[0.05] p-5">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <p className="font-black text-white">
                Vous êtes en version d'essai gratuite
                {typeof status.daysRemaining === "number" && (
                  <span className="ml-2 text-sm font-bold text-emerald-400">
                    {status.daysRemaining > 0 ? `${status.daysRemaining} jour${status.daysRemaining > 1 ? "s" : ""} restant${status.daysRemaining > 1 ? "s" : ""}` : "dernier jour"}
                  </span>
                )}
              </p>
              <p className="text-sm text-white/55 mt-1">
                Profitez de toutes les fonctionnalités <strong className="text-white/80">Pro</strong> sans engagement.
                Aucun paiement ne vous sera demandé tant que vous n'aurez pas choisi un forfait ci-dessous.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* État actuel */}
      <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 flex flex-wrap items-center justify-between gap-4">
        <div>
          <p className="text-xs text-white/40 uppercase tracking-wider">Forfait actuel</p>
          <p className="text-xl font-black text-orange-400">
            {PLANS.find((p) => p.key === currentKey)?.label ?? status?.plan}
          </p>
          {status?.expiresAt && (
            <p className="text-xs text-white/40 mt-0.5">
              {status.subscribed ? "Renouvellement" : status.isTrial ? "Essai jusqu'au" : "Expire"} le {new Date(status.expiresAt).toLocaleDateString("fr-FR")}
            </p>
          )}
          {status?.isTrial && (
            <span className="inline-block mt-1.5 text-[10px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">
              🎁 Version d'essai
            </span>
          )}
        </div>
        {status?.subscribed && status.billingEnabled && (
          <button
            onClick={openPortal}
            disabled={busy === "portal"}
            className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white/70 text-sm font-semibold transition-colors"
          >
            {busy === "portal" ? "…" : "Gérer mon paiement / résilier"}
          </button>
        )}
      </div>

      {!status?.billingEnabled ? (
        <div className="rounded-2xl border border-amber-500/20 bg-amber-500/[0.06] p-5 text-sm text-amber-200/80">
          💳 Le paiement en ligne des abonnements n'est pas encore activé. Votre forfait est géré
          directement avec l'équipe MaTable.Pro pour le moment.
        </div>
      ) : (
        <>
          {/* Toggle mensuel / annuel */}
          <div className="flex items-center justify-center gap-1 rounded-xl bg-white/[0.04] border border-white/[0.06] p-1 w-fit mx-auto">
            {(["monthly", "yearly"] as const).map((it) => (
              <button
                key={it}
                onClick={() => setInterval(it)}
                className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-colors ${
                  interval === it ? "bg-orange-500 text-white" : "text-white/50 hover:text-white"
                }`}
              >
                {it === "monthly" ? "Mensuel" : "Annuel"}
                {it === "yearly" && <span className="ml-1 text-[10px] text-emerald-400">-2 mois</span>}
              </button>
            ))}
          </div>

          {/* Plans */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PLANS.map((p) => {
              const isCurrent = p.key === currentKey && status?.subscribed;
              const price = interval === "yearly" ? Math.round(p.monthly * 10) : p.monthly;
              return (
                <div key={p.key} className={`rounded-2xl border p-5 flex flex-col ${
                  p.key === "pro" ? "border-orange-500/30 bg-orange-500/[0.04]" : "border-white/[0.08] bg-white/[0.03]"
                }`}>
                  <p className="font-black text-white text-lg">{p.label}</p>
                  <p className="mt-1">
                    <span className="text-3xl font-black text-white">{price}€</span>
                    <span className="text-xs text-white/40">/{interval === "yearly" ? "an HT" : "mois HT"}</span>
                  </p>
                  <ul className="mt-4 space-y-1.5 flex-1">
                    {p.features.map((f) => (
                      <li key={f} className="text-xs text-white/60 flex items-start gap-1.5">
                        <span className="text-emerald-400">✓</span> {f}
                      </li>
                    ))}
                  </ul>
                  <button
                    onClick={() => subscribe(p.key)}
                    disabled={busy === p.key || isCurrent}
                    className={`mt-4 w-full py-2.5 rounded-xl text-sm font-bold transition-colors ${
                      isCurrent
                        ? "bg-white/5 text-white/40 cursor-default"
                        : "bg-orange-500 hover:bg-orange-600 text-white"
                    }`}
                  >
                    {isCurrent ? "Forfait actuel" : busy === p.key ? "…" : "Choisir"}
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Programme parrainage — code mensuel + historique + CGV */}
      {ref?.currentCode && (
        <div className="rounded-2xl border border-purple-500/25 bg-gradient-to-br from-purple-500/[0.08] to-orange-500/[0.05] p-5 space-y-4">
          <div className="flex items-start gap-3">
            <span className="text-2xl">🎁</span>
            <div className="flex-1">
              <p className="font-black text-white">Parrainez un confrère = 1 mois offert</p>
              <p className="text-sm text-white/55 mt-1">
                Vous recevez <strong className="text-white">1 nouveau code par mois</strong> (12 par an).
                Chaque code peut faire venir <strong className="text-white">1 nouveau resto</strong> — et dès qu'il devient payant,
                <strong className="text-emerald-400"> on vous offre 30 jours d'abonnement</strong>.
              </p>
            </div>
          </div>

          {/* Code du mois en cours */}
          <div className="rounded-xl border border-purple-500/30 bg-purple-500/[0.08] p-4 space-y-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs uppercase tracking-wider text-purple-300 font-bold">
                Code du mois — {periodLabel(ref.currentPeriod)}
              </p>
              <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-400">Actif</span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto] gap-2">
              <div className="rounded-xl border border-white/10 bg-black/30 px-4 py-3 font-mono text-sm text-orange-300 truncate">{shareLink}</div>
              <button onClick={copyLink}
                className="px-4 py-3 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors">
                {copied ? "✓ Copié" : "Copier le lien"}
              </button>
            </div>
            <p className="text-[11px] text-white/45">
              Code à partager : <strong className="text-orange-300 font-mono">{ref.currentCode}</strong> · valable
              jusqu'au {new Date(parseInt(ref.currentPeriod.slice(0, 4), 10), parseInt(ref.currentPeriod.slice(4), 10), 0).toLocaleDateString("fr-FR")}
            </p>
          </div>

          {/* Compteurs */}
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/60">
              Filleuls inscrits : <strong className="text-white">{ref.codes.filter(c => c.used).length + ref.legacyReferees.length}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-amber-500/15 border border-amber-500/25 text-amber-300">
              Convertis : <strong>{ref.totalConverted}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300">
              Mois offerts : <strong>{ref.totalRewardMonths}</strong>
            </span>
            <span className="px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/10 text-white/60">
              Quota restant : <strong className="text-white">{ref.remainingYearly} / 12</strong>
            </span>
          </div>

          {/* Historique des codes mensuels */}
          {ref.codes.length > 1 && (
            <details className="rounded-xl border border-white/[0.06] overflow-hidden">
              <summary className="px-4 py-2.5 text-sm font-semibold text-white/70 cursor-pointer hover:bg-white/[0.03]">
                Historique de vos codes ({ref.codes.length} mois)
              </summary>
              <table className="w-full text-sm">
                <thead className="bg-white/[0.04] text-[10px] uppercase tracking-wider text-white/40">
                  <tr>
                    <th className="px-3 py-2 text-left">Mois</th>
                    <th className="px-3 py-2 text-left">Code</th>
                    <th className="px-3 py-2 text-left">Filleul</th>
                    <th className="px-3 py-2 text-right">Statut</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/[0.04]">
                  {ref.codes.map((c) => (
                    <tr key={c.code} className={c.isCurrent ? "bg-purple-500/[0.06]" : ""}>
                      <td className="px-3 py-2 text-white/70 text-xs">{periodLabel(c.periodYearMonth)}</td>
                      <td className="px-3 py-2 text-orange-300 font-mono text-xs">{c.code}</td>
                      <td className="px-3 py-2 text-white/60 text-xs">{c.refereeName ?? "—"}</td>
                      <td className="px-3 py-2 text-right">
                        {c.rewarded ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-emerald-500/15 text-emerald-400">🎉 +30 j versés</span>
                        ) : c.converted ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-amber-500/15 text-amber-400">Converti</span>
                        ) : c.used ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.06] text-white/50">Essai en cours</span>
                        ) : c.isCurrent ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-purple-500/15 text-purple-300">Dispo</span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-white/[0.04] text-white/35">Non utilisé</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </details>
          )}

          {/* Conditions */}
          <div className="rounded-xl border border-white/[0.06] bg-black/30 p-3 text-[11px] text-white/45 leading-relaxed space-y-1.5">
            <p className="font-bold text-white/65 mb-1">Conditions du programme</p>
            <p>• 1 code par mois calendaire, soit 12 codes par an. Un code non utilisé n'est pas reportable.</p>
            <p>• La récompense de 30 jours est versée <strong className="text-white/70">uniquement</strong> à la 1ère facture payée du filleul (Stripe ou paiement manuel confirmé).</p>
            <p>• Si le filleul résilie ou est remboursé dans les 30 jours suivant son 1er paiement, la récompense peut être annulée.</p>
            <p>• Les codes ne sont pas utilisables sur un compte créé par vous-même ou un proche déjà rattaché à votre établissement.</p>
            <p>• Sans valeur monétaire, non cumulables avec d'autres promotions, non transférables.</p>
            <p>• MaTable.Pro se réserve le droit de refuser ou annuler une récompense en cas d'abus avéré.</p>
          </div>
        </div>
      )}
    </div>
  );
}
