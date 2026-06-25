"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";
import { clearProToken, setProToken, api, API_URL, getProToken } from "@/lib/api";
import { MobileBottomNav, type BottomNavItem } from "@/components/dashboard/MobileBottomNav";
import { CommandPalette, type PaletteDestination } from "@/components/dashboard/CommandPalette";
import { OnboardingDrawer } from "@/components/dashboard/OnboardingDrawer";
import { GuidedTour, type TourStep } from "@/components/dashboard/GuidedTour";
import { ReferralReminderPopup } from "@/components/dashboard/ReferralReminderPopup";

// Descriptions par écran pour le tour guidé (clé = href)
const TOUR_DESC: Record<string, string> = {
  "/dashboard": "Le cœur du service : toutes les commandes en direct, table par table, à mesure qu'elles arrivent.",
  "/dashboard/tables": "Gérez votre plan de salle, ouvrez/fermez les tables et suivez leur statut.",
  "/dashboard/service-calls": "Les appels serveur de vos clients arrivent ici en temps réel.",
  "/dashboard/menu": "Créez et organisez votre carte : plats, prix, photos, catégories et disponibilité.",
  "/dashboard/stock": "Suivez vos ingrédients et niveaux de stock, avec alertes de rupture.",
  "/dashboard/shopping": "Générez et suivez vos listes de courses automatiquement.",
  "/dashboard/servers": "Gérez votre équipe de salle et leurs accès au portail serveur.",
  "/dashboard/print": "Imprimez vos QR codes par table — vos clients scannent pour commander.",
  "/dashboard/analytics": "Tout votre pilotage : CA, tendances, plats stars, heatmap d'affluence et recommandations.",
  "/dashboard/novacontab": "Votre comptabilité simplifiée : URSSAF, TVA et exports.",
  "/dashboard/reviews": "Centralisez les avis clients et boostez votre e-réputation.",
  "/dashboard/reservations": "Recevez et gérez vos réservations en ligne, avec alertes instantanées.",
  "/dashboard/loyalty": "Fidélisez vos clients : points, offres et récompenses.",
  "/dashboard/invoices": "Retrouvez et exportez toutes vos factures.",
  "/dashboard/settings": "Configurez votre établissement : infos, horaires, options de service.",
  "/dashboard/abonnement": "Gérez votre forfait, votre essai, votre paiement — et votre code parrainage du mois (12 mois offerts max/an).",
  "/dashboard/support": "Une question ? Contactez notre équipe support depuis ici.",
  "/dashboard/testimonial": "Partagez votre témoignage et aidez d'autres restaurateurs.",
  "/dashboard/ia/stock": "Nova Stock : analyse intelligente de vos stocks et besoins.",
  "/dashboard/ia/menu-generator": "Nova Menu : générez des fiches et descriptions de plats par IA.",
  "/dashboard/ia/finance": "Nova Finance : analyses et conseils financiers automatisés.",
  "/dashboard/ia/offers": "Pilotez vos offres marketing actives.",
  "/dashboard/ia/chatbot": "Votre chatbot IA pour répondre aux clients.",
  "/dashboard/ia/magic-scan": "Scannez un document ou une carte : l'IA fait le reste.",
  "/dashboard/ia/planning": "Planning d'équipe assisté par IA.",
  "/dashboard/ia/descriptions": "Générez des descriptions de plats percutantes par IA.",
};

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [enabledApps, setEnabledApps] = useState<string[]>(["reviews"]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [quickActionHrefs, setQuickActionHrefs] = useState<string[]>([]);
  const [bottomNavHrefs, setBottomNavHrefs] = useState<string[]>([]);
  const [billingPastDue, setBillingPastDue] = useState(false);
  const [onboardingOpen, setOnboardingOpen] = useState(false);
  const [trial, setTrial] = useState<{ isTrial: boolean; daysRemaining: number | null }>({ isTrial: false, daysRemaining: null });
  const [tourOpen, setTourOpen] = useState(false);
  const pathname = usePathname();

  // Notifications réservations temps réel
  const [resvNotifCount, setResvNotifCount] = useState(0);
  const [toasts, setToasts] = useState<Array<{ id: number; text: string }>>([]);
  const toastId = useRef(0);

  const pushToast = (text: string) => {
    const id = ++toastId.current;
    setToasts((t) => [...t, { id, text }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 5000);
  };

  // Promotion du token "pending" après retour de Stripe Checkout
  useEffect(() => {
    const pending = sessionStorage.getItem("pending_pro_token");
    if (pending) {
      setProToken(pending);
      sessionStorage.removeItem("pending_pro_token");
    }
  }, []);

  // Redirection vers login si aucun token
  useEffect(() => {
    if (!getProToken()) {
      window.location.href = "/login";
    }
  }, []);

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

  // Close mobile nav on route change
  useEffect(() => {
    setMobileNavOpen(false);
  }, [pathname]);

  // Reset badge quand on visite la page réservations
  useEffect(() => {
    if (pathname === "/dashboard/reservations") setResvNotifCount(0);
  }, [pathname]);

  // Keep pathname accessible inside the long-lived SSE handler without
  // re-subscribing on every route change. Without this ref the handler would
  // read a stale pathname captured at mount.
  const pathnameRef = useRef(pathname);
  useEffect(() => { pathnameRef.current = pathname; }, [pathname]);

  // SSE — écouter les nouvelles réservations
  useEffect(() => {
    const token = getProToken();
    if (!token) return;
    const es = new EventSource(`${API_URL}/api/pro/events/stream?token=${encodeURIComponent(token)}`);
    es.onmessage = (e) => {
      try {
        const data = JSON.parse(e.data);
        if (data.type === "reservation:new") {
          const name = data.customerName ?? "Client";
          const covers = data.partySize ?? "";
          pushToast(`🔔 Nouvelle réservation — ${name}${covers ? ` · ${covers} cvt` : ""}`);
          if (pathnameRef.current !== "/dashboard/reservations") {
            setResvNotifCount((n) => n + 1);
          }
        }
      } catch { /* ignore */ }
    };
    // Stop the browser's automatic reconnect loop if the stream is rejected
    // (e.g. token expired). Otherwise EventSource retries forever in the
    // background, burning battery on mobile.
    let errorCount = 0;
    es.onerror = () => {
      errorCount += 1;
      if (errorCount >= 3 || es.readyState === EventSource.CLOSED) {
        es.close();
      }
    };
    return () => es.close();
  }, []);

  // Lock body scroll when mobile nav is open
  useEffect(() => {
    if (mobileNavOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [mobileNavOpen]);

  const toggleTheme = () => {
    const newTheme = theme === "dark" ? "light" : "dark";
    setTheme(newTheme);
    localStorage.setItem("theme", newTheme);
    document.documentElement.classList.toggle("dark", newTheme === "dark");
  };

  useEffect(() => {
    api<{ restaurant: { slug?: string | null; name?: string; dashboardQuickActions?: string[]; dashboardBottomNav?: string[]; onboardingCompleted?: boolean }; enabledApps?: string[] }>("/api/pro/me")
      .then((r) => {
        setSlug(r.restaurant.slug ?? null);
        setRestaurantName(r.restaurant.name ?? "");
        setEnabledApps(r.enabledApps ?? ["reviews"]);
        setQuickActionHrefs(Array.isArray(r.restaurant.dashboardQuickActions) ? r.restaurant.dashboardQuickActions : []);
        setBottomNavHrefs(Array.isArray(r.restaurant.dashboardBottomNav) ? r.restaurant.dashboardBottomNav : []);
        // 1er login → ouvrir l'onboarding guidé (flag faux uniquement si la colonne existe ET vaut false)
        if (r.restaurant.onboardingCompleted === false) setOnboardingOpen(true);
      })
      .catch(() => {});
  }, []);

  // État facturation (bandeau de relance si paiement échoué)
  useEffect(() => {
    api<{ pastDue?: boolean; isTrial?: boolean; daysRemaining?: number | null }>("/api/platform-billing/status")
      .then((s) => {
        setBillingPastDue(!!s.pastDue);
        setTrial({ isTrial: !!s.isTrial, daysRemaining: s.daysRemaining ?? null });
      })
      .catch(() => {});
  }, []);

  // Raccourci clavier ⌘K / Ctrl+K — ouvre la palette de recherche
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setMobileNavOpen(false);
        setPaletteOpen((o) => !o);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  function logout() {
    clearProToken();
    window.location.href = "/login";
  }

  // Helper
  const has = (app: string) => enabledApps.includes(app);
  const hasAnyIa = has("nova_ia") || has("nova_stock") || has("nova_contab") || has("nova_finance");

  const quickActions = [
    ...(has("orders") ? [{ href: "/dashboard/menu", icon: "🍽️", label: "Ajouter un plat" }] : []),
    ...(has("reservations") ? [{ href: "/dashboard/reservations", icon: "📅", label: "Voir réservations", badge: resvNotifCount }] : []),
    { href: "/dashboard/loyalty", icon: "💎", label: "Fidélité" },
    ...(has("orders") ? [{ href: "/dashboard/print", icon: "🖨️", label: "QR codes" }] : []),
  ].slice(0, 4);

  // Navigation menu — sections are shown/hidden based on enabledApps
  const navSections = [
    {
      label: "SERVICE",
      items: [
        ...(has("orders") ? [{ href: "/dashboard", icon: "🔴", label: "Live cuisine" }] : []),
        ...(has("orders") ? [{ href: "/dashboard/tables", icon: "🪑", label: "Tables" }] : []),
        ...(has("orders") ? [{ href: "/dashboard/service-calls", icon: "🔔", label: "Appels serveur" }] : []),
      ],
    },
    {
      label: "CONTENU",
      items: [
        ...(has("orders") ? [{ href: "/dashboard/menu", icon: "🍽️", label: "Menu" }] : []),
        ...(has("nova_stock") ? [{ href: "/dashboard/stock", icon: "📦", label: "Stock & Ingrédients" }] : []),
        ...(has("nova_stock") ? [{ href: "/dashboard/shopping", icon: "🛒", label: "Listes de courses" }] : []),
        { href: "/dashboard/servers", icon: "👤", label: "Serveurs" },
        ...(has("orders") ? [{ href: "/dashboard/print", icon: "🖨️", label: "QR Codes" }] : []),
      ],
    },
    {
      label: "ANALYSE",
      items: [
        ...(has("orders") ? [{ href: "/dashboard/analytics", icon: "📊", label: "Statistiques" }] : []),
        ...(has("nova_contab") ? [{ href: "/dashboard/novacontab", icon: "🧮", label: "URSSAF & TVA" }] : []),
        ...(has("reviews") ? [{ href: "/dashboard/reviews", icon: "⭐", label: "Avis des clients" }] : []),
        ...(has("reservations") ? [{ href: "/dashboard/reservations", icon: "📅", label: "Réservations", badge: resvNotifCount }] : []),
        { href: "/dashboard/loyalty", icon: "💎", label: "Fidélité" },
        ...(has("orders") ? [{ href: "/dashboard/invoices", icon: "🧾", label: "Factures" }] : []),
      ],
    },
    {
      label: "CONFIG",
      items: [
        { href: "/dashboard/settings", icon: "⚙️", label: "Paramètres" },
        { href: "/dashboard/abonnement", icon: "💳", label: "Mon abonnement" },
        { href: "/dashboard/support", icon: "🎧", label: "Support / SAV" },
        { href: "/dashboard/testimonial", icon: "💬", label: "Témoignage" },
      ],
    },
  ].filter(section => section.items.length > 0);

  // Nova IA section items — only show apps that are enabled
  const iaItems = [
    ...(has("nova_stock") ? [{ href: "/dashboard/ia/stock", icon: "📦", label: "Nova Stock" }] : []),
    ...(has("nova_ia") ? [{ href: "/dashboard/ia/menu-generator", icon: "🍽️", label: "Nova Menu" }] : []),
    ...(has("nova_finance") ? [{ href: "/dashboard/ia/finance", icon: "💹", label: "Nova Finance" }] : []),
    ...(has("nova_finance") ? [{ href: "/dashboard/ia/offers", icon: "🏷️", label: "Offres actives" }] : []),
    ...(has("nova_ia") ? [{ href: "/dashboard/ia/chatbot", icon: "🤖", label: "Chatbot IA" }] : []),
    ...(has("nova_ia") ? [{ href: "/dashboard/ia/magic-scan", icon: "📷", label: "Magic Scan" }] : []),
    ...(has("nova_ia") ? [{ href: "/dashboard/ia/planning", icon: "🗓️", label: "Planning IA" }] : []),
    ...(has("nova_ia") ? [{ href: "/dashboard/ia/descriptions", icon: "✍️", label: "Descriptions IA" }] : []),
  ];

  // Toutes les destinations à plat (pour la palette + l'épinglage)
  const allDestinations: PaletteDestination[] = useMemo(() => {
    const out: PaletteDestination[] = [];
    for (const section of navSections) {
      for (const item of section.items) {
        out.push({ href: item.href, icon: item.icon, label: item.label, section: section.label });
      }
    }
    for (const item of iaItems) {
      out.push({ href: item.href, icon: item.icon, label: item.label, section: "NOVA IA" });
    }
    // dédoublonnage par href (Fidélité/Menu apparaissent dans plusieurs sections)
    const seen = new Set<string>();
    return out.filter((d) => (seen.has(d.href) ? false : (seen.add(d.href), true)));
  }, [enabledApps, resvNotifCount]);

  const destByHref = useMemo(
    () => new Map(allDestinations.map((d) => [d.href, d])),
    [allDestinations]
  );

  // Étapes du tour guidé : intro + un arrêt par écran activé (les éléments
  // absents/masqués sont ignorés par GuidedTour, ex. sidebar sur mobile).
  const tourSteps: TourStep[] = useMemo(() => {
    const steps: TourStep[] = [
      { selector: '[data-tour="nav-desktop"]', title: "Votre navigation", text: "Toutes vos pages sont rangées ici par thème : service, contenu, analyse, config." },
      { selector: '[data-tour="nav-mobile"]', title: "Le menu", text: "Touchez ici pour ouvrir toutes vos pages, rangées par thème." },
      { selector: '[data-tour="search"]', title: "Recherche rapide", text: "Trouvez n'importe quelle page en un instant (⌘K / Ctrl+K)." },
    ];
    for (const d of allDestinations) {
      steps.push({
        selector: `[data-tour-item="${d.href}"]`,
        title: `${d.icon} ${d.label}`,
        text: TOUR_DESC[d.href] ?? `Accédez à « ${d.label} ».`,
      });
    }
    steps.push(
      { selector: '[data-tour="quick"]', title: "Vos raccourcis", text: "Depuis la recherche : ★ épingle en haut (ordinateur), 📱 ajoute à la barre du bas (mobile, 5 max). Tout au même endroit." },
      { selector: '[data-tour="trial"]', title: "Votre essai", text: "Suivez vos jours d'essai restants. Cliquez pour choisir un forfait quand vous serez prêt." },
      { selector: '[data-tour="help"]', title: "Revoir le guide", text: "Besoin d'un rappel ? Rouvrez ce guide à tout moment depuis ce bouton." },
    );
    return steps;
  }, [allDestinations]);

  // Raccourcis rapides résolus : choix du resto si présent, sinon défaut ; filtrés sur l'activé
  const DEFAULT_QUICK = quickActions.map((q) => q.href);
  const resolvedQuickActions = (quickActionHrefs.length > 0 ? quickActionHrefs : DEFAULT_QUICK)
    .filter((href) => destByHref.has(href))
    .slice(0, 8);

  // Barre mobile : 4 destinations prioritaires
  const bottomCandidates: BottomNavItem[] = [
    ...(has("orders") ? [{ href: "/dashboard", icon: "🔴", label: "Live" }] : []),
    ...(has("reservations") ? [{ href: "/dashboard/reservations", icon: "📅", label: "Résa", badge: resvNotifCount }] : []),
    ...(has("orders") ? [{ href: "/dashboard/menu", icon: "🍽️", label: "Menu" }] : []),
    { href: "/dashboard/loyalty", icon: "💎", label: "Fidélité" },
    ...(has("orders") ? [{ href: "/dashboard/print", icon: "🖨️", label: "QR" }] : []),
    ...(has("reviews") ? [{ href: "/dashboard/reviews", icon: "⭐", label: "Avis" }] : []),
  ];
  // Barre du bas configurable : choix du resto sinon défaut (4 prioritaires) ; max 5, filtré sur l'activé
  const DEFAULT_BOTTOM = bottomCandidates.slice(0, 4).map((b) => b.href);
  const BOTTOM_SHORT: Record<string, string> = {
    "/dashboard": "Live", "/dashboard/reservations": "Résa", "/dashboard/menu": "Menu",
    "/dashboard/loyalty": "Fidélité", "/dashboard/print": "QR", "/dashboard/reviews": "Avis",
    "/dashboard/analytics": "Stats", "/dashboard/tables": "Tables", "/dashboard/settings": "Réglages",
  };
  const resolvedBottomHrefs = (bottomNavHrefs.length > 0 ? bottomNavHrefs : DEFAULT_BOTTOM)
    .filter((href) => destByHref.has(href))
    .slice(0, 5);
  const bottomNavItems: BottomNavItem[] = resolvedBottomHrefs.map((href) => {
    const d = destByHref.get(href)!;
    return {
      href,
      icon: d.icon,
      label: BOTTOM_SHORT[href] ?? d.label,
      badge: href === "/dashboard/reservations" ? resvNotifCount : undefined,
    };
  });

  // Onboarding terminé/passé → persiste en base et ferme (optimiste : on ferme tout de suite)
  const completeOnboarding = () => {
    setOnboardingOpen(false);
    api("/api/pro/restaurant", { method: "PATCH", body: JSON.stringify({ onboardingCompleted: true }) }).catch(() => {});
  };

  // Épingler / désépingler un raccourci du HAUT (desktop) → persiste en base
  const togglePin = (href: string) => {
    const base = quickActionHrefs.length > 0 ? quickActionHrefs : DEFAULT_QUICK;
    const next = base.includes(href) ? base.filter((h) => h !== href) : [...base, href].slice(0, 8);
    setQuickActionHrefs(next);
    api("/api/pro/restaurant", { method: "PATCH", body: JSON.stringify({ dashboardQuickActions: next }) }).catch(() => {});
  };

  // Épingler / désépingler un raccourci de la BARRE DU BAS (mobile) → persiste en base (max 5)
  const togglePinBottom = (href: string) => {
    const base = bottomNavHrefs.length > 0 ? bottomNavHrefs : DEFAULT_BOTTOM;
    const next = base.includes(href) ? base.filter((h) => h !== href) : [...base, href].slice(0, 5);
    setBottomNavHrefs(next);
    api("/api/pro/restaurant", { method: "PATCH", body: JSON.stringify({ dashboardBottomNav: next }) }).catch(() => {});
  };

  // Sidebar content — réutilisé dans desktop ET mobile drawer
  const sidebarContent = (
    <>
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 py-2 mt-2">
            {section.label}
          </p>
          {section.items.map((item) => {
            const isActive = pathname === item.href || (item.href !== "/dashboard" && pathname.startsWith(`${item.href}/`));
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour-item={item.href}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-orange-500/20 border border-orange-500/30 text-orange-400 font-semibold"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                }`}
                aria-current={isActive ? "page" : undefined}
              >
                <span className="flex items-center justify-between">
                  <span><span className="mr-2">{item.icon}</span>{item.label}</span>
                  {"badge" in item && (item as any).badge > 0 && (
                    <span className="ml-1 min-w-[18px] h-[18px] px-1 rounded-full bg-orange-500 text-white text-[10px] font-black flex items-center justify-center">
                      {(item as any).badge > 9 ? "9+" : (item as any).badge}
                    </span>
                  )}
                </span>
              </Link>
            );
          })}
        </div>
      ))}

      {/* Nova IA section — only if at least one IA app is enabled */}
      {iaItems.length > 0 && (
        <div>
          <p className="text-[10px] font-bold text-purple-400/70 uppercase tracking-wider px-3 py-2 mt-4 flex items-center gap-1.5">
            <span>✨</span> NOVA IA
          </p>
          {iaItems.map((item) => {
            const isActive = pathname === item.href || pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                data-tour-item={item.href}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-purple-500/20 border border-purple-500/30 text-purple-300 font-semibold"
                    : "text-white/50 hover:text-purple-300/70 hover:bg-purple-500/5"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Upgrade banner for restaurants without any IA */}
      {!hasAnyIa && (
        <div className="mt-6 mx-1 p-3 rounded-xl bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20">
          <p className="text-xs font-bold text-purple-300 mb-1">✨ Nova IA</p>
          <p className="text-[11px] text-white/40 mb-2 leading-relaxed">
            NovaContab IA, Stock, Menu Generator, Chatbot & plus.
          </p>
          <a
            href="mailto:contact@novavivo.online?subject=Activer%20Nova%20IA"
            className="block text-center text-xs font-semibold py-1.5 px-3 rounded-lg bg-purple-500/20 text-purple-300 hover:bg-purple-500/30 transition-colors"
          >
            Decouvrir →
          </a>
        </div>
      )}
    </>
  );

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Bar */}
      <div className="h-14 lg:h-16 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-3 lg:px-8 flex items-center justify-between sticky top-0 z-50 gap-2">
        {/* Burger menu — mobile only */}
        <button
          data-tour="nav-mobile"
          onClick={() => setMobileNavOpen(true)}
          className="lg:hidden w-10 h-10 -ml-2 rounded-lg flex items-center justify-center text-white/70 hover:text-white hover:bg-white/5 transition-colors shrink-0"
          aria-label="Ouvrir le menu"
        >
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
            <line x1="4" y1="7" x2="20" y2="7" />
            <line x1="4" y1="12" x2="20" y2="12" />
            <line x1="4" y1="17" x2="20" y2="17" />
          </svg>
        </button>

        <div className="flex items-center gap-3 lg:gap-4 min-w-0 flex-1">
          <h1 className="text-base lg:text-xl font-black whitespace-nowrap shrink-0">
            Ma <span className="text-orange-500">Table</span>
          </h1>
          {restaurantName && (
            <span className="text-xs lg:text-sm text-white/40 truncate">{restaurantName}</span>
          )}
          {slug && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex text-sm text-white/50 hover:text-white/70 transition-colors items-center gap-1"
              title="Voir la page publique"
            >
              🌐 <span className="font-mono text-xs">matable.pro/{slug}</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-2 lg:gap-3 shrink-0">
          {/* Raccourcis rapides programmables — visibles dès md */}
          {resolvedQuickActions.length > 0 && (
            <div data-tour="quick" className="hidden md:flex items-center gap-1 rounded-xl bg-white/[0.035] border border-white/[0.06] p-1">
              {resolvedQuickActions.map((href) => {
                const action = destByHref.get(href);
                if (!action) return null;
                return (
                  <Link
                    key={href}
                    href={href}
                    className="px-2.5 py-1.5 rounded-lg text-xs text-white/45 hover:text-white hover:bg-white/[0.06] transition-colors whitespace-nowrap"
                    title={action.label}
                  >
                    <span className="mr-1">{action.icon}</span>
                    <span className="hidden lg:inline">{action.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => setPaletteOpen(true)}
                className="px-2 py-1.5 rounded-lg text-xs text-white/35 hover:text-orange-400 hover:bg-white/[0.06] transition-colors"
                title="Personnaliser mes raccourcis"
                aria-label="Personnaliser mes raccourcis"
              >
                ✎
              </button>
            </div>
          )}

          {/* Recherche rapide (⌘K) — fonctionne aussi au tap mobile */}
          <button
            data-tour="search"
            onClick={() => { setMobileNavOpen(false); setPaletteOpen(true); }}
            className="flex items-center gap-2 h-9 lg:h-10 px-2.5 lg:px-3 rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors shrink-0"
            title="Rechercher (Ctrl/⌘ K)"
            aria-label="Rechercher"
          >
            <span className="text-base">🔍</span>
            <kbd className="hidden lg:inline-block text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5">⌘K</kbd>
          </button>

          {/* Chip version d'essai — visible sur toute la navigation pour suivre les jours restants */}
          {trial.isTrial && (
            <Link
              data-tour="trial"
              href="/dashboard/abonnement"
              className="flex items-center gap-1.5 h-9 lg:h-10 px-2.5 lg:px-3 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/20 transition-colors text-xs font-bold shrink-0"
              title="Vous êtes en version d'essai — gérer mon abonnement"
            >
              <span>🎁</span>
              <span className="hidden sm:inline">Essai</span>
              {typeof trial.daysRemaining === "number" && (
                <span className="text-emerald-400">{trial.daysRemaining > 0 ? `${trial.daysRemaining} j` : "fin"}</span>
              )}
            </Link>
          )}

          {/* Rouvrir le guide de démarrage à tout moment */}
          <button
            data-tour="help"
            onClick={() => { setMobileNavOpen(false); setOnboardingOpen(true); }}
            className="hidden sm:flex w-9 h-9 lg:w-10 lg:h-10 items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 hover:text-white transition-colors shrink-0"
            title="Revoir le guide de démarrage"
            aria-label="Revoir le guide de démarrage"
          >
            <span className="text-sm font-bold">?</span>
          </button>

          {hasAnyIa && (
            <span className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-semibold">
              ✨ Nova IA actif
            </span>
          )}
          {/* Bouton thème masqué (aucun mode clair implémenté) — logique conservée pour réactivation future */}
          <button
            onClick={toggleTheme}
            className="hidden"
            aria-hidden="true"
            tabIndex={-1}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            onClick={logout}
            className="hidden sm:inline-block text-sm text-white/50 hover:text-white transition-colors whitespace-nowrap"
            title="Deconnexion"
          >
            Deconnexion
          </button>
          <button
            onClick={logout}
            className="sm:hidden w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors shrink-0"
            aria-label="Deconnexion"
            title="Deconnexion"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
              <polyline points="16 17 21 12 16 7" />
              <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Desktop Sidebar */}
        <aside data-tour="nav-desktop" className="hidden lg:block w-60 border-r border-white/[0.06] bg-[#0a0a0a] p-4 space-y-0.5 overflow-y-auto shrink-0">
          {sidebarContent}
        </aside>

        {/* Mobile drawer */}
        {mobileNavOpen && (
          <div className="lg:hidden fixed inset-0 z-[60] flex">
            {/* Overlay */}
            <button
              type="button"
              aria-label="Fermer le menu"
              onClick={() => setMobileNavOpen(false)}
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
            />
            {/* Drawer panel */}
            <aside className="relative w-72 max-w-[80vw] h-full bg-[#0a0a0a] border-r border-white/[0.06] p-4 space-y-0.5 overflow-y-auto animate-slide-in-left">
              <div className="flex items-center justify-between mb-3 px-2">
                <h2 className="text-base font-black">
                  Ma <span className="text-orange-500">Table</span>
                </h2>
                <button
                  onClick={() => setMobileNavOpen(false)}
                  className="w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/70 hover:text-white transition-colors"
                  aria-label="Fermer"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                    <line x1="6" y1="6" x2="18" y2="18" />
                    <line x1="18" y1="6" x2="6" y2="18" />
                  </svg>
                </button>
              </div>

              {restaurantName && (
                <div className="px-3 pb-3 mb-1 border-b border-white/[0.06]">
                  <p className="text-[11px] text-white/40 truncate">{restaurantName}</p>
                  {slug && (
                    <a
                      href={`/${slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[11px] text-orange-400/70 font-mono truncate block hover:text-orange-300"
                    >
                      matable.pro/{slug}
                    </a>
                  )}
                </div>
              )}

              {sidebarContent}
            </aside>
          </div>
        )}

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#0a0a0a] p-4 sm:p-6 lg:p-8 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-8">
          {billingPastDue && (
            <Link
              href="/dashboard/abonnement"
              className="flex items-center gap-3 mb-4 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300 hover:bg-red-500/15 transition-colors"
            >
              <span className="text-lg">⚠️</span>
              <span className="flex-1 font-semibold">
                Paiement de votre abonnement échoué — mettez à jour votre moyen de paiement pour éviter toute coupure.
              </span>
              <span className="text-red-200 font-bold whitespace-nowrap">Régulariser →</span>
            </Link>
          )}
          {children}
        </main>
      </div>

      {/* Barre de navigation mobile (< lg) */}
      <MobileBottomNav
        items={bottomNavItems}
        pathname={pathname}
        onMore={() => setMobileNavOpen(true)}
      />

      {/* Palette de recherche / commandes (⌘K) */}
      <CommandPalette
        open={paletteOpen}
        onClose={() => setPaletteOpen(false)}
        destinations={allDestinations}
        pinned={resolvedQuickActions}
        onTogglePin={togglePin}
        pinnedBottom={resolvedBottomHrefs}
        onTogglePinBottom={togglePinBottom}
        bottomFull={resolvedBottomHrefs.length >= 5}
      />

      {/* Onboarding guidé 1er login */}
      <OnboardingDrawer
        open={onboardingOpen}
        onComplete={completeOnboarding}
        onStartTour={() => setTourOpen(true)}
        enabledApps={enabledApps}
        restaurantName={restaurantName}
        hasAnyIa={hasAnyIa}
        isTrial={trial.isTrial}
        daysRemaining={trial.daysRemaining}
      />

      {/* Tour guidé interactif — surligne les vrais éléments à la 1re visite */}
      <GuidedTour
        open={tourOpen}
        steps={tourSteps}
        onClose={() => setTourOpen(false)}
      />

      {/* Rappel parrainage J-5 avant facturation */}
      <ReferralReminderPopup
        daysRemaining={trial.daysRemaining}
        isTrial={trial.isTrial}
      />

      {/* Toast notifications */}
      <div className="fixed bottom-20 lg:bottom-6 right-6 z-[100] flex flex-col gap-2 pointer-events-none pb-[env(safe-area-inset-bottom)]">
        {toasts.map((t) => (
          <div
            key={t.id}
            className="pointer-events-auto bg-[#1a1a1a] border border-orange-500/40 text-white text-sm px-4 py-3 rounded-xl shadow-xl shadow-black/40 flex items-center gap-3 animate-slide-in-right"
          >
            <span>{t.text}</span>
            <button
              onClick={() => setToasts((prev) => prev.filter((x) => x.id !== t.id))}
              className="text-white/40 hover:text-white text-xs"
            >✕</button>
          </div>
        ))}
      </div>
    </div>
  );
}
