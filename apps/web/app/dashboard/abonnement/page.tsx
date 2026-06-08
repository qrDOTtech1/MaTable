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

type ContractInfo = {
  restaurantName: string | null;
  cgvAcceptedAt: string | null;
  cgvSignatureName: string | null;
  cgvContractData: { plan?: string; billing?: string; signedAt?: string } | null;
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
  const [contract, setContract] = useState<ContractInfo | null>(null);

  useEffect(() => {
    api<Status>("/api/platform-billing/status")
      .then(setStatus)
      .catch(() => setStatus(null))
      .finally(() => setLoading(false));
    api<ReferralData>("/api/pro/referrals/me")
      .then(setRef)
      .catch(() => {});
    api<{ restaurant: ContractInfo }>("/api/pro/me")
      .then((r) => setContract({
        restaurantName: r.restaurant.restaurantName ?? (r.restaurant as any).name ?? null,
        cgvAcceptedAt: r.restaurant.cgvAcceptedAt,
        cgvSignatureName: r.restaurant.cgvSignatureName,
        cgvContractData: r.restaurant.cgvContractData,
      }))
      .catch(() => {});
  }, []);

  // Génère le contrat d'abonnement signé en HTML pour impression PDF
  function downloadContract() {
    if (!contract?.cgvAcceptedAt) return;
    const planLabel = ({ starter: "Starter", pro: "Pro", business: "Business" } as Record<string, string>)[contract.cgvContractData?.plan ?? ""] ?? "Pro";
    const billingLabel = contract.cgvContractData?.billing === "yearly" ? "Annuel (−12 %)" : "Mensuel sans engagement";
    const signedAt = new Date(contract.cgvContractData?.signedAt ?? contract.cgvAcceptedAt).toLocaleString("fr-FR");
    const html = `<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Contrat d'abonnement signé — ${contract.restaurantName ?? "MaTable.Pro"}</title>
<style>
  @page { size: A4; margin: 18mm 16mm; }
  body { font-family: Arial, Helvetica, sans-serif; color: #111; font-size: 12px; line-height: 1.45; margin: 0; padding: 0; }
  .header { border-bottom: 3px solid #ea580c; padding-bottom: 14px; margin-bottom: 22px; display: flex; justify-content: space-between; align-items: flex-start; }
  .logo { font-size: 22px; font-weight: 900; }
  .logo .o { color: #ea580c; }
  .tag { font-size: 9px; color: #666; margin-top: 4px; letter-spacing: 1.5px; }
  .ref { text-align: right; font-size: 11px; color: #666; }
  .ref b { color: #ea580c; font-size: 14px; display: block; }
  h1 { font-size: 16px; text-transform: uppercase; letter-spacing: 2px; text-align: center; border-bottom: 1px solid #ddd; padding-bottom: 10px; margin: 0 0 22px; }
  h2 { font-size: 12px; font-weight: 900; text-transform: uppercase; letter-spacing: 1.5px; color: #ea580c; margin: 18px 0 8px; border-bottom: 1px solid #eee; padding-bottom: 4px; }
  table { width: 100%; border-collapse: collapse; margin: 8px 0; }
  td { padding: 7px 9px; vertical-align: top; }
  .row { border-bottom: 1px solid #f0f0f0; }
  .row td:first-child { color: #666; width: 38%; }
  .row td:last-child { font-weight: 600; }
  .sign-box { border: 2px solid #ea580c; border-radius: 8px; padding: 14px 16px; background: #fff7ed; margin: 18px 0; }
  .sign-box .label { font-size: 10px; text-transform: uppercase; letter-spacing: 1.5px; color: #ea580c; font-weight: 900; }
  .sign-box .name { font-size: 22px; font-family: 'Lucida Handwriting', cursive; color: #1a1a1a; margin: 6px 0 4px; }
  .sign-box .meta { font-size: 10px; color: #666; line-height: 1.5; }
  .footer { font-size: 9px; color: #888; text-align: center; border-top: 1px solid #eee; padding-top: 10px; margin-top: 22px; }
  .footer .italic { font-style: italic; color: #aaa; }
</style></head><body>
  <div class="header">
    <div>
      <div class="logo">MaTable<span class="o">.Pro</span></div>
      <div class="tag">DIGITALISATION D'ÉTABLISSEMENT DEPUIS 2017*</div>
    </div>
    <div class="ref">
      <span style="text-transform:uppercase;">Contrat d'abonnement</span>
      <b>${(contract.restaurantName || "MaTable").slice(0, 24).toUpperCase()}</b>
      <span>Signé le ${signedAt}</span>
    </div>
  </div>

  <h1>Contrat d'abonnement — Plateforme MaTable.Pro</h1>

  <h2>1. Parties</h2>
  <table>
    <tr class="row"><td>Le Prestataire</td><td>MaTable.Pro — Plateforme logicielle pour la restauration. matable.pro</td></tr>
    <tr class="row"><td>Le Client (souscripteur)</td><td>${contract.restaurantName ?? "Établissement"}</td></tr>
  </table>

  <h2>2. Objet</h2>
  <p>Le Prestataire concède au Client un droit d'usage personnel et non exclusif sur la plateforme MaTable.Pro,
  incluant l'ensemble des modules listés ci-dessous pour le forfait choisi. Le détail des fonctionnalités est consultable
  sur matable.pro/tarifs et fait partie intégrante du présent contrat.</p>

  <h2>3. Forfait souscrit</h2>
  <table>
    <tr class="row"><td>Forfait</td><td><strong style="color:#ea580c">${planLabel}</strong></td></tr>
    <tr class="row"><td>Mode de facturation</td><td>${billingLabel}</td></tr>
    <tr class="row"><td>Date d'activation</td><td>${signedAt}</td></tr>
    <tr class="row"><td>Engagement</td><td>Aucun — résiliation possible à tout moment via le portail Stripe</td></tr>
  </table>

  <h2>4. Conditions générales</h2>
  <p>Le Client reconnaît avoir lu et accepté sans réserve les Conditions Générales de Vente publiées sur matable.pro/cgv et la
  Politique de confidentialité publiée sur matable.pro/confidentialite, qui font partie intégrante du présent contrat.
  Le présent contrat est soumis au droit français. Tout litige sera porté devant les tribunaux du ressort de la cour d'appel
  du siège du Prestataire.</p>

  <h2>5. Programme parrainage</h2>
  <p>Le Client bénéficie, dès activation, du programme parrainage MaTable.Pro : 12 codes par an (1/mois calendaire).
  Chaque filleul restaurateur qui souscrit avec un code et règle sa 1<sup>re</sup> facture ouvre droit à 30 jours d'abonnement
  offerts au Client, au niveau de son forfait en cours. Les conditions détaillées sont accessibles depuis le tableau de bord du Client.</p>

  <div class="sign-box">
    <div class="label">Signature électronique du Client (eIDAS)</div>
    <div class="name">${contract.cgvSignatureName ?? "—"}</div>
    <div class="meta">
      <strong>Signé le ${signedAt}</strong><br/>
      Par acceptation explicite des CGV via la case à cocher en ligne sur matable.pro/souscrire.<br/>
      Cette signature électronique, son horodatage et l'adresse IP de connexion conservés par le Prestataire constituent
      la preuve d'acceptation du présent contrat conformément au Règlement (UE) n° 910/2014 (eIDAS).
    </div>
  </div>

  <div class="footer">
    Document à conserver — MaTable.Pro · matable.pro<br/>
    <span class="italic">*Avant la création de MaTable.Pro, ses deux co-fondateurs collaboraient déjà à la digitalisation d'établissements.</span>
  </div>
</body></html>`;
    const win = window.open("", "_blank", "width=900,height=1200");
    if (!win) { alert("Pop-up bloquée. Autorisez les pop-ups pour télécharger votre contrat."); return; }
    win.document.open(); win.document.write(html); win.document.close();
    setTimeout(() => { win.focus(); win.print(); }, 300);
  }

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

      {/* Contrat d'abonnement signé électroniquement */}
      {contract?.cgvAcceptedAt && (
        <div className="rounded-2xl border border-orange-500/25 bg-orange-500/[0.04] p-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-start gap-3 min-w-0">
            <span className="text-2xl">📄</span>
            <div className="min-w-0">
              <p className="font-black text-white">Contrat d'abonnement signé</p>
              <p className="text-sm text-white/55 mt-0.5">
                Signé électroniquement par <strong className="text-white/80">{contract.cgvSignatureName}</strong>
                {" "}le {new Date(contract.cgvAcceptedAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" })}.
                Valeur légale eIDAS.
              </p>
            </div>
          </div>
          <button
            onClick={downloadContract}
            className="px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors shrink-0"
          >
            📥 Télécharger
          </button>
        </div>
      )}

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
                <strong className="text-emerald-400"> on vous offre 30 jours à votre niveau d'abonnement actuel</strong>
                {status?.plan === "STARTER" && (
                  <>
                    {" "}<strong className="text-purple-300">+ 30 jours d'accès Nova IA</strong> en bonus
                    à votre 1<sup>re</sup> conversion
                  </>
                )}.
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
            <p>• La récompense est de <strong className="text-white/70">30 jours équivalents à votre forfait actuel</strong> au moment du versement (Starter, Pro ou Business), et non un mois générique.</p>
            <p>• <strong className="text-white/70">Bonus Starter</strong> : à votre 1<sup>re</sup> conversion de filleul, vous bénéficiez en plus de 30 jours d'accès Nova IA — non renouvelables automatiquement et limités à 1 fois par compte.</p>
            <p>• La récompense est versée <strong className="text-white/70">uniquement</strong> à la 1<sup>re</sup> facture payée du filleul (Stripe ou paiement manuel confirmé).</p>
            <p>• Si le filleul résilie ou est remboursé dans les 30 jours suivant son 1<sup>er</sup> paiement, la récompense peut être annulée.</p>
            <p>• Les codes ne sont pas utilisables sur un compte créé par vous-même ou un proche déjà rattaché à votre établissement.</p>
            <p>• Sans valeur monétaire, non cumulables avec d'autres promotions, non transférables.</p>
            <p>• MaTable.Pro se réserve le droit de refuser ou annuler une récompense en cas d'abus avéré.</p>
          </div>
        </div>
      )}
    </div>
  );
}
