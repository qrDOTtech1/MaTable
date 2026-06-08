"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError, API_URL, setProToken } from "@/lib/api";
import { PLANS, ANNUAL_DISCOUNT_PERCENT } from "@/components/landing/landingData";

type PlanId = "starter" | "pro" | "business";
type Billing = "monthly" | "yearly";

const annualMonthly = (monthly: number) => Math.round(monthly * (1 - ANNUAL_DISCOUNT_PERCENT / 100));

export default function SouscrireClient() {
  const router = useRouter();
  const search = useSearchParams();

  const planId = (search?.get("plan") as PlanId) || "pro";
  const billing = (search?.get("billing") as Billing) || "monthly";
  const plan = useMemo(() => PLANS.find((p) => p.id === planId) ?? PLANS[1], [planId]);

  const [restaurantName, setRestaurantName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [signatureName, setSignatureName] = useState("");
  const [cgvAccepted, setCgvAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  // Pré-remplissage code parrainage via ?ref=
  useEffect(() => {
    const r = search?.get("ref");
    if (r) setReferralCode(r.toUpperCase());
  }, [search]);

  const monthlyPrice = billing === "yearly" ? annualMonthly(plan.priceMonthly) : plan.priceMonthly;
  const yearlyTotal = monthlyPrice * 12;

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!cgvAccepted) { setErr("Vous devez accepter les CGV pour souscrire."); return; }
    if (!signatureName.trim()) { setErr("Indiquez votre nom complet pour signer."); return; }
    setBusy(true); setErr(null);
    try {
      // 1. Création du compte sans essai + signature CGV
      const reg = await api<{ token?: string; restaurantId?: string }>(`/api/pro/register`, {
        method: "POST",
        pro: false,
        body: JSON.stringify({
          email, password, restaurantName,
          skipTrial: true,
          cgvAccepted: true,
          cgvSignatureName: signatureName.trim(),
          contractData: { plan: planId, billing },
          referralCode: referralCode.trim() || undefined,
        }),
      });
      if (!reg.token) throw new Error("Token manquant — impossible de continuer.");

      // 2. Petit délai pour laisser la base propager la création du restaurant
      await new Promise(r => setTimeout(r, 500));

      // 3. Création de la session Stripe Checkout avec le token fraichement émis
      let j: any;
      for (let attempt = 0; attempt < 3; attempt++) {
        const checkout = await fetch(`${API_URL}/api/platform-billing/checkout`, {
          method: "POST",
          headers: { "Content-Type": "application/json", Authorization: `Bearer ${reg.token}` },
          body: JSON.stringify({ plan: planId, interval: billing }),
        });
        j = await checkout.json();
        if (checkout.ok) break;
        if (j.error === "restaurant_not_found" && attempt < 2) {
          await new Promise(r => setTimeout(r, 1000));
          continue;
        }
        throw new Error(j.error ?? "Impossible de lancer le paiement.");
      }

      // 3. On stocke le token en sessionStorage (temporaire) — il ne sera promu
      //    dans localStorage qu'après confirmation du paiement (page success).
      //    Ainsi, si l'utilisateur fait "retour" depuis Stripe, il n'a PAS accès au dashboard.
      sessionStorage.setItem("pending_pro_token", reg.token);

      // 4. Redirection vers Stripe Checkout
      window.location.href = j.url;
    } catch (e: any) {
      if (e instanceof ApiError && e.status === 409) setErr("Cet email est déjà utilisé.");
      else setErr(String(e?.message ?? e));
      setBusy(false);
    }
  }

  const inputClass = "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors";

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white py-10 px-4">
      <div className="max-w-5xl mx-auto">
        <Link href="/tarifs" className="text-sm text-white/40 hover:text-white inline-block mb-6">← Retour aux tarifs</Link>

        <div className="grid gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          {/* Formulaire */}
          <form onSubmit={onSubmit} className="bg-white/[0.03] border border-white/[0.08] rounded-2xl p-6 space-y-5">
            <div>
              <h1 className="text-2xl font-black">Souscription directe</h1>
              <p className="text-sm text-white/50 mt-1">Compte activé dès paiement reçu. Signature électronique en ligne, valeur légale (eIDAS).</p>
            </div>

            <div className="grid grid-cols-1 gap-3">
              <Field label="Nom du restaurant">
                <input className={inputClass} value={restaurantName} onChange={(e) => setRestaurantName(e.target.value)} required minLength={2} placeholder="Le Bistrot du Coin" />
              </Field>
              <Field label="Email de connexion">
                <input className={inputClass} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="vous@votreresto.com" />
              </Field>
              <Field label="Mot de passe (min. 6 caractères)">
                <input className={inputClass} type="password" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} placeholder="••••••••" />
              </Field>
              <Field label="Code de parrainage (optionnel) 🎁">
                <input className={inputClass} value={referralCode} onChange={(e) => setReferralCode(e.target.value.toUpperCase())} placeholder="PIZZ-2605KZ" maxLength={40} />
              </Field>
            </div>

            <div className="border-t border-white/[0.08] pt-4 space-y-3">
              <p className="text-xs uppercase tracking-widest text-orange-300 font-black">Signature électronique</p>
              <Field label="Nom & prénom du signataire">
                <input className={inputClass} value={signatureName} onChange={(e) => setSignatureName(e.target.value)} required minLength={2} placeholder="Jean Dupont" />
              </Field>
              <label className="flex items-start gap-3 cursor-pointer">
                <input type="checkbox" checked={cgvAccepted} onChange={(e) => setCgvAccepted(e.target.checked)} className="mt-1 w-4 h-4 accent-orange-500" />
                <span className="text-[13px] text-white/65 leading-snug">
                  Je reconnais avoir lu et accepté sans réserve les <Link href="/cgv" target="_blank" className="text-orange-400 underline">Conditions Générales de Vente</Link>,
                  les Conditions Particulières liées à mon forfait <strong>{plan.name}</strong> et la <Link href="/confidentialite" target="_blank" className="text-orange-400 underline">Politique de confidentialité</Link>.
                  Cette acceptation, votre nom, votre adresse IP et l'horodatage constituent ma signature électronique (eIDAS).
                </span>
              </label>
            </div>

            {err && <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{err}</p>}

            <button
              type="submit"
              disabled={busy || !cgvAccepted || !signatureName.trim()}
              className="w-full py-4 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-black text-base transition-colors shadow-xl shadow-orange-500/25"
            >
              {busy ? "Préparation du paiement…" : `Signer et payer ${monthlyPrice}€${billing === "yearly" ? " × 12 (annuel)" : "/mois"} →`}
            </button>

            <div className="rounded-xl border border-orange-500/20 bg-orange-500/[0.05] px-4 py-3 text-center space-y-1.5">
              <p className="text-sm text-white/70">
                🎉 Vous pouvez toujours <strong className="text-orange-400">essayer gratuitement pendant 14 jours</strong> si vous ne l'avez pas encore fait&nbsp;!
              </p>
              <Link
                href="/register"
                className="inline-block text-sm font-bold text-orange-400 hover:text-orange-300 underline underline-offset-2 transition-colors"
              >
                Commencer mon essai gratuit →
              </Link>
              <p className="text-[11px] text-white/35">Aucune carte bancaire requise · Sans engagement</p>
            </div>
          </form>

          {/* Récap forfait + signature */}
          <aside className="bg-gradient-to-br from-orange-500/[0.06] to-purple-500/[0.04] border border-white/[0.08] rounded-2xl p-6 h-fit lg:sticky lg:top-6 space-y-5">
            <div>
              <p className="text-xs uppercase tracking-widest text-orange-300 font-black mb-1">Votre forfait</p>
              <p className="text-3xl font-black">{plan.name}</p>
              <p className="text-sm text-white/55 mt-1">{plan.desc}</p>
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-4">
              <div className="flex items-baseline justify-between">
                <span className="text-sm text-white/55">{billing === "yearly" ? "Annuel" : "Mensuel"}</span>
                <span className="text-3xl font-black">{monthlyPrice}€<span className="text-sm text-white/40 font-normal">/mois HT</span></span>
              </div>
              {billing === "yearly" && (
                <p className="text-xs text-emerald-400 mt-2">
                  Économie de {ANNUAL_DISCOUNT_PERCENT}% — facturé <strong>{yearlyTotal}€ HT</strong> une fois par an
                </p>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-xs uppercase tracking-widest text-white/45 font-bold">Ce qui est inclus</p>
              {plan.features.map((f, i) => (
                <p key={i} className="text-[13px] text-white/70 leading-snug flex items-start gap-2">
                  <span className="text-emerald-400 mt-0.5">✓</span> {f}
                </p>
              ))}
            </div>

            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/[0.05] p-3 text-[11px] text-emerald-100/80 leading-relaxed">
              🎁 <strong>Parrainage inclus</strong> dès activation : 12 codes/an, +30 jours offerts à chaque filleul converti.
            </div>

            <div className="rounded-xl border border-white/10 bg-black/30 p-3 text-[11px] text-white/45 leading-relaxed">
              🔒 <strong className="text-white/70">Sans engagement</strong> — résiliable à tout moment. Aucun frais d'installation.
              Vos données restent votre propriété (hébergement UE).
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-white/45 font-bold">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}
