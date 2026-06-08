"use client";
import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, ApiError, API_URL } from "@/lib/api";

type PlanId = "starter" | "pro" | "business";

const PLAN_OPTIONS: { id: PlanId; name: string; price: number; desc: string; badge?: string }[] = [
  { id: "starter", name: "Starter", price: 59, desc: "Avis, Commandes QR, Portails" },
  { id: "pro", name: "Pro", price: 119, desc: "Starter + Réservations avancées, Fidélité", badge: "Populaire" },
  { id: "business", name: "Business", price: 249, desc: "Pro + Nova IA (Stock, Finance, Compta…)", badge: "IA" },
];

export default function RegisterPage() {
  return (
    <Suspense fallback={null}>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const router = useRouter();
  const search = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [referralCode, setReferralCode] = useState("");
  const [selectedPlan, setSelectedPlan] = useState<PlanId>((search?.get("plan") as PlanId) || "pro");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const r = search?.get("ref");
    if (r) setReferralCode(r.toUpperCase());
  }, [search]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await api(`/api/pro/register`, {
        method: "POST",
        body: JSON.stringify({
          email, password, restaurantName,
          referralCode: referralCode || undefined,
          contractData: { plan: selectedPlan, billing: "monthly" },
        }),
        pro: false,
      });
      router.push("/login?registered=1");
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status === 409) setErr("Email déjà utilisé.");
        else setErr(`Erreur serveur (${e.status}). Réessayez.`);
      } else {
        const msg = String((e as any)?.message ?? e);
        if (msg.includes("Failed to fetch") || msg.includes("fetch"))
          setErr("Impossible de contacter le serveur. Vérifiez votre connexion.");
        else setErr(`Erreur: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-md space-y-5">
        <div>
          <h1 className="text-2xl font-bold">Ma <span className="text-orange-500">Table</span></h1>
          <p className="text-sm text-white/50 mt-1">Essai gratuit 14 jours · Sans carte bancaire</p>
        </div>

        <input
          className={inputClass}
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="Nom du restaurant"
          required
        />
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          className={inputClass}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe (min. 6 caractères)"
          minLength={6}
          required
        />

        {/* Choix du forfait */}
        <div className="space-y-2">
          <p className="text-xs uppercase tracking-wider text-white/45 font-bold">Choisissez votre forfait</p>
          <div className="grid gap-2">
            {PLAN_OPTIONS.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => setSelectedPlan(p.id)}
                className={`relative text-left px-3.5 py-3 rounded-xl border transition-all ${
                  selectedPlan === p.id
                    ? "border-orange-500 bg-orange-500/10"
                    : "border-white/10 bg-white/[0.02] hover:border-white/20"
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                      selectedPlan === p.id ? "border-orange-500" : "border-white/30"
                    }`}>
                      {selectedPlan === p.id && <span className="w-2 h-2 rounded-full bg-orange-500" />}
                    </span>
                    <span className="font-bold text-sm">{p.name}</span>
                    {p.badge && (
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-bold ${
                        p.badge === "IA" ? "bg-purple-500/20 text-purple-300" : "bg-orange-500/20 text-orange-300"
                      }`}>{p.badge}</span>
                    )}
                  </div>
                  <span className="text-sm font-bold">{p.price}€<span className="text-white/40 font-normal text-xs">/mois</span></span>
                </div>
                <p className="text-xs text-white/40 mt-1 ml-6">{p.desc}</p>
              </button>
            ))}
          </div>
        </div>

        <input
          className={inputClass}
          type="text"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
          placeholder="Code de parrainage (optionnel) 🎁"
          maxLength={40}
        />

        {err && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded break-all">{err}</div>
        )}

        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "Création en cours…" : `Essayer ${PLAN_OPTIONS.find(p => p.id === selectedPlan)?.name} gratuitement →`}
        </button>

        <div className="rounded-lg bg-emerald-500/[0.06] border border-emerald-500/15 px-3 py-2 text-center">
          <p className="text-xs text-emerald-300/80">🎉 14 jours gratuits sur le forfait choisi — aucun paiement demandé avant la fin de l'essai.</p>
        </div>

        {process.env.NODE_ENV !== "production" && (
          <p className="text-xs text-white/30 text-center">API: {API_URL}</p>
        )}

        <p className="text-sm text-white/50 text-center">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-orange-400 font-medium hover:text-orange-300">Se connecter</Link>
        </p>
        <p className="text-xs text-white/30 text-center">
          Vous pourrez changer de forfait ou souscrire directement depuis{" "}
          <Link href="/tarifs" className="text-orange-400 hover:underline">nos tarifs</Link>.
        </p>
      </form>
    </main>
  );
}
