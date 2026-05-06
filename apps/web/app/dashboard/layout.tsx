"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearProToken, api } from "@/lib/api";

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const [restaurantName, setRestaurantName] = useState<string>("");
  const [enabledApps, setEnabledApps] = useState<string[]>(["reviews"]);
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const pathname = usePathname();

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
    api<{ restaurant: { slug?: string | null; name?: string }; enabledApps?: string[] }>("/api/pro/me")
      .then((r) => {
        setSlug(r.restaurant.slug ?? null);
        setRestaurantName(r.restaurant.name ?? "");
        setEnabledApps(r.enabledApps ?? ["reviews"]);
      })
      .catch(() => {});
  }, []);

  function logout() {
    clearProToken();
    window.location.href = "/login";
  }

  // Helper
  const has = (app: string) => enabledApps.includes(app);
  const hasAnyIa = has("nova_ia") || has("nova_stock") || has("nova_contab") || has("nova_finance");

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
        ...(has("nova_stock") ? [{ href: "/dashboard/stock", icon: "📦", label: "Stock & Ingredients" }] : []),
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
        ...(has("reservations") ? [{ href: "/dashboard/reservations", icon: "📅", label: "Reservations" }] : []),
        ...(has("orders") ? [{ href: "/dashboard/invoices", icon: "🧾", label: "Factures" }] : []),
      ],
    },
    {
      label: "CONFIG",
      items: [
        { href: "/dashboard/settings", icon: "⚙️", label: "Parametres" },
        { href: "/dashboard/support", icon: "🎧", label: "Support / SAV" },
        { href: "/dashboard/testimonial", icon: "💬", label: "Temoignage" },
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

  // Sidebar content — réutilisé dans desktop ET mobile drawer
  const sidebarContent = (
    <>
      {navSections.map((section) => (
        <div key={section.label}>
          <p className="text-[10px] font-bold text-white/30 uppercase tracking-wider px-3 py-2 mt-2">
            {section.label}
          </p>
          {section.items.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block px-3 py-2.5 rounded-lg text-sm transition-all ${
                  isActive
                    ? "bg-orange-500/20 border border-orange-500/30 text-orange-400 font-semibold"
                    : "text-white/50 hover:text-white/70 hover:bg-white/5"
                }`}
              >
                <span className="mr-2">{item.icon}</span>
                {item.label}
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

        <div className="flex items-center gap-2 lg:gap-4 shrink-0">
          {hasAnyIa && (
            <span className="hidden lg:flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-semibold">
              ✨ Nova IA actif
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="w-9 h-9 lg:w-10 lg:h-10 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 text-white/50 hover:text-white shrink-0"
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
            aria-label={theme === "dark" ? "Mode clair" : "Mode sombre"}
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
        <aside className="hidden lg:block w-60 border-r border-white/[0.06] bg-[#0a0a0a] p-4 space-y-0.5 overflow-y-auto shrink-0">
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
        <main className="flex-1 overflow-auto bg-[#0a0a0a] p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
