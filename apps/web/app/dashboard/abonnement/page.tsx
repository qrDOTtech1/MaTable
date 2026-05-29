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

export default function AbonnementPage() {
  const [status, setStatus] = useState<Status | null>(null);
  const [loading, setLoading] = useState(true);
  const [interval, setInterval] = useState<"monthly" | "yearly">("monthly");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    api<Status>("/api/platform-billing/status")
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
  }, []);

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
    </div>
  );
}
