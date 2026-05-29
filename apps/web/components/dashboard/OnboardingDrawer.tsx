"use client";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

/**
 * Onboarding guidé au 1er login.
 * Overlay propre à z-[110] (même couche que la palette) — NE réutilise PAS Modal.
 * Multi-étapes : bienvenue → apps activées → fonctions clés → démarrage.
 * À la fermeture (terminer OU passer), on persiste onboardingCompleted=true
 * via le callback onComplete fourni par le layout.
 */

type AppInfo = { icon: string; label: string; desc: string };

// Description courte de chaque app pour l'étape "Vos applications"
const APP_INFO: Record<string, AppInfo> = {
  reviews:      { icon: "⭐", label: "Avis clients",   desc: "Collectez des avis Google via QR code et boostez votre e-réputation." },
  reservations: { icon: "📅", label: "Réservations",   desc: "Recevez et gérez les réservations en ligne, avec alertes en temps réel." },
  orders:       { icon: "🍽️", label: "Commandes & QR", desc: "Menu digital, commande à table par QR code et suivi cuisine en direct." },
  nova_ia:      { icon: "🤖", label: "Nova IA",        desc: "Génération de menus, chatbot, scan de documents et planning assistés par IA." },
  nova_stock:   { icon: "📦", label: "Nova Stock",     desc: "Pilotez vos stocks, ingrédients et listes de courses automatiquement." },
  nova_contab:  { icon: "🧮", label: "Nova Contab",    desc: "Suivi URSSAF & TVA simplifié pour votre comptabilité." },
  nova_finance: { icon: "💹", label: "Nova Finance",   desc: "Analyse financière et offres marketing pilotées par l'IA." },
};

type Step = { key: string; render: () => React.ReactNode };

export function OnboardingDrawer({
  open,
  onComplete,
  onStartTour,
  enabledApps,
  restaurantName,
  hasAnyIa,
  isTrial = false,
  daysRemaining = null,
}: {
  open: boolean;
  onComplete: () => void;        // persiste onboardingCompleted=true puis ferme
  onStartTour?: () => void;      // lance le tour guidé interactif après l'intro
  enabledApps: string[];
  restaurantName: string;
  hasAnyIa: boolean;
  isTrial?: boolean;
  daysRemaining?: number | null;
}) {
  const router = useRouter();
  const [stepIdx, setStepIdx] = useState(0);

  const has = (app: string) => enabledApps.includes(app);

  // Apps à présenter (ordre logique), filtrées sur l'activé
  const appsToShow = useMemo(
    () => ["orders", "reservations", "reviews", "nova_ia", "nova_stock", "nova_contab", "nova_finance"]
      .filter((a) => has(a) && APP_INFO[a]),
    [enabledApps]
  );

  // Actions de démarrage suggérées (selon apps activées)
  const startActions = useMemo(() => {
    const out: Array<{ href: string; icon: string; label: string }> = [];
    if (has("orders")) out.push({ href: "/dashboard/menu", icon: "🍽️", label: "Créer mon menu" });
    if (has("orders")) out.push({ href: "/dashboard/print", icon: "🖨️", label: "Imprimer mes QR codes" });
    if (has("reservations")) out.push({ href: "/dashboard/reservations", icon: "📅", label: "Voir mes réservations" });
    out.push({ href: "/dashboard/settings", icon: "⚙️", label: "Compléter mes infos" });
    return out.slice(0, 4);
  }, [enabledApps]);

  // Va vers une page ET clôture l'onboarding
  const goAndComplete = (href: string) => {
    onComplete();
    router.push(href);
  };

  const steps: Step[] = useMemo(() => {
    const list: Step[] = [];

    // 1. Bienvenue
    list.push({
      key: "welcome",
      render: () => (
        <div className="text-center px-2">
          <div className="text-5xl mb-4">👋</div>
          <h2 className="text-2xl font-black mb-2">
            Bienvenue{restaurantName ? ` chez ` : ""}
            {restaurantName && <span className="text-orange-500"> {restaurantName}</span>} !
          </h2>
          {isTrial && (
            <div className="inline-flex items-center gap-2 mb-3 px-3 py-1.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-300 text-xs font-bold">
              🎁 Version d'essai gratuite
              {typeof daysRemaining === "number" && daysRemaining > 0 && (
                <span className="text-emerald-400">· {daysRemaining} j restants</span>
              )}
            </div>
          )}
          <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto">
            On vous accompagne en 1 minute pour découvrir votre tableau de bord
            <span className="text-white"> Ma<span className="text-orange-500">Table</span></span>.
            {isTrial && " Vous avez accès à toutes les fonctions Pro, sans engagement ni paiement."}
          </p>
        </div>
      ),
    });

    // 2. Vos applications
    list.push({
      key: "apps",
      render: () => (
        <div className="px-1">
          <h2 className="text-xl font-black mb-1 text-center">Vos applications activées</h2>
          <p className="text-xs text-white/40 text-center mb-5">Voici ce qui est inclus dans votre formule.</p>
          <div className="space-y-2.5">
            {appsToShow.map((a) => {
              const info = APP_INFO[a];
              const isIa = a.startsWith("nova");
              return (
                <div
                  key={a}
                  className={`flex items-start gap-3 p-3 rounded-xl border ${
                    isIa
                      ? "bg-purple-500/[0.07] border-purple-500/20"
                      : "bg-white/[0.035] border-white/[0.06]"
                  }`}
                >
                  <span className="text-2xl shrink-0 leading-none mt-0.5">{info.icon}</span>
                  <div className="min-w-0">
                    <p className={`text-sm font-bold ${isIa ? "text-purple-300" : "text-white"}`}>{info.label}</p>
                    <p className="text-[12px] text-white/45 leading-snug">{info.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      ),
    });

    // 2b. Comment ça marche — workflow concret (réduit le besoin de support)
    const steps2b: Array<{ n: string; title: string; desc: string }> = [];
    if (has("orders")) {
      steps2b.push({ n: "1", title: "Créez votre menu", desc: "Ajoutez vos plats, prix et photos dans la page Menu." });
      steps2b.push({ n: "2", title: "Imprimez vos QR codes", desc: "Page QR Codes : un QR par table, à poser sur place." });
      steps2b.push({ n: "3", title: "Le client scanne & commande", desc: "Il commande et paie depuis son téléphone, sans appli." });
      steps2b.push({ n: "4", title: "La cuisine reçoit en direct", desc: "Les commandes s'affichent sur l'écran cuisine en temps réel." });
    } else if (has("reservations")) {
      steps2b.push({ n: "1", title: "Configurez vos créneaux", desc: "Définissez horaires et capacité dans Paramètres." });
      steps2b.push({ n: "2", title: "Partagez votre page", desc: "Vos clients réservent en ligne 24h/24." });
      steps2b.push({ n: "3", title: "Recevez les alertes", desc: "Chaque réservation arrive en temps réel sur ce tableau de bord." });
    } else {
      steps2b.push({ n: "1", title: "Personnalisez votre page", desc: "Renseignez vos infos dans Paramètres." });
      steps2b.push({ n: "2", title: "Affichez votre QR avis", desc: "Vos clients laissent un avis Google en un scan." });
      steps2b.push({ n: "3", title: "Suivez votre réputation", desc: "Retrouvez tous vos avis dans la page Avis." });
    }
    list.push({
      key: "howto",
      render: () => (
        <div className="px-1">
          <h2 className="text-xl font-black mb-1 text-center">Comment ça marche</h2>
          <p className="text-xs text-white/40 text-center mb-5">Le parcours en quelques étapes simples.</p>
          <div className="space-y-2.5">
            {steps2b.map((s) => (
              <div key={s.n} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.035] border border-white/[0.06]">
                <span className="shrink-0 w-7 h-7 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-sm font-black flex items-center justify-center">{s.n}</span>
                <div className="min-w-0">
                  <p className="text-sm font-bold text-white">{s.title}</p>
                  <p className="text-[12px] text-white/45 leading-snug">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    });

    // 3. Fonctions clés / navigation
    list.push({
      key: "navigation",
      render: () => (
        <div className="px-2 text-center">
          <div className="text-4xl mb-3">🧭</div>
          <h2 className="text-xl font-black mb-2">Tout est à portée de main</h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto mb-5">
            Le menu latéral regroupe vos pages par thème. Sur mobile, la barre du bas
            donne accès aux essentiels en un geste.
          </p>
          <div className="grid grid-cols-1 gap-2 text-left max-w-sm mx-auto">
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.035] border border-white/[0.06]">
              <span className="text-lg">🔍</span>
              <p className="text-[12px] text-white/55">
                Appuyez sur <kbd className="text-[10px] text-white/40 border border-white/10 rounded px-1 py-0.5">⌘K</kbd> (ou la loupe)
                pour aller n'importe où instantanément.
              </p>
            </div>
            <div className="flex items-center gap-3 p-2.5 rounded-lg bg-white/[0.035] border border-white/[0.06]">
              <span className="text-lg">★</span>
              <p className="text-[12px] text-white/55">
                Épinglez vos pages favorites pour les retrouver en haut sur tous vos appareils.
              </p>
            </div>
            {hasAnyIa && (
              <div className="flex items-center gap-3 p-2.5 rounded-lg bg-purple-500/[0.07] border border-purple-500/20">
                <span className="text-lg">✨</span>
                <p className="text-[12px] text-purple-200/70">
                  La section <span className="font-semibold text-purple-300">Nova IA</span> regroupe vos outils intelligents.
                </p>
              </div>
            )}
          </div>
        </div>
      ),
    });

    // 4. Démarrage — actions concrètes
    list.push({
      key: "start",
      render: () => (
        <div className="px-1 text-center">
          <div className="text-4xl mb-3">🚀</div>
          <h2 className="text-xl font-black mb-2">Prêt à démarrer ?</h2>
          <p className="text-sm text-white/50 leading-relaxed max-w-sm mx-auto mb-5">
            Voici quelques premières étapes recommandées. Vous pourrez y revenir à tout moment.
          </p>
          <div className="grid grid-cols-2 gap-2.5 max-w-sm mx-auto">
            {startActions.map((a) => (
              <button
                key={a.href}
                onClick={() => goAndComplete(a.href)}
                className="flex flex-col items-center gap-1.5 p-4 rounded-xl bg-white/[0.035] border border-white/[0.06] hover:border-orange-500/40 hover:bg-orange-500/[0.06] transition-colors"
              >
                <span className="text-2xl">{a.icon}</span>
                <span className="text-[12px] font-semibold text-white/70">{a.label}</span>
              </button>
            ))}
          </div>
          <p className="text-[12px] text-white/40 mt-5 max-w-sm mx-auto">
            Une question ? La page <span className="text-white/70 font-semibold">Support / SAV</span> du menu
            vous met en relation avec notre équipe — on répond vite. 🤝
          </p>
        </div>
      ),
    });

    return list;
  }, [appsToShow, startActions, restaurantName, hasAnyIa, enabledApps, isTrial, daysRemaining]);

  // Reset à l'ouverture
  useEffect(() => {
    if (open) setStepIdx(0);
  }, [open]);

  // Lock scroll (même pattern que palette/drawer)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  if (!open || steps.length === 0) return null;

  const isLast = stepIdx >= steps.length - 1;
  const current = steps[Math.min(stepIdx, steps.length - 1)];

  const next = () => {
    if (isLast) {
      onComplete();
      onStartTour?.(); // enchaîne sur le tour guidé interactif
    } else {
      setStepIdx((i) => Math.min(i + 1, steps.length - 1));
    }
  };
  const prev = () => setStepIdx((i) => Math.max(i - 1, 0));

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      {/* Overlay — non cliquable pour fermer (onboarding intentionnel), mais bouton Passer dispo */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

      <div className="relative w-full max-w-md rounded-2xl border border-white/[0.08] bg-[#111] shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
        {/* Header : passer */}
        <div className="flex items-center justify-between px-4 pt-4">
          <div className="flex items-center gap-1.5">
            {steps.map((s, i) => (
              <span
                key={s.key}
                className={`h-1.5 rounded-full transition-all ${
                  i === stepIdx ? "w-6 bg-orange-500" : i < stepIdx ? "w-1.5 bg-orange-500/50" : "w-1.5 bg-white/15"
                }`}
              />
            ))}
          </div>
          <button
            onClick={onComplete}
            className="text-[12px] text-white/35 hover:text-white/70 transition-colors"
          >
            Passer
          </button>
        </div>

        {/* Corps */}
        <div className="px-5 py-6 min-h-[280px] flex items-center">
          <div className="w-full">{current.render()}</div>
        </div>

        {/* Footer : navigation */}
        <div className="flex items-center justify-between gap-3 px-5 py-4 border-t border-white/[0.06]">
          <button
            onClick={prev}
            disabled={stepIdx === 0}
            className="text-sm text-white/45 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-colors"
          >
            ← Précédent
          </button>
          <button
            onClick={next}
            className="px-5 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors shadow-lg shadow-orange-500/20"
          >
            {isLast ? (onStartTour ? "Visite guidée →" : "C'est parti ! 🎉") : "Suivant →"}
          </button>
        </div>
      </div>
    </div>
  );
}
