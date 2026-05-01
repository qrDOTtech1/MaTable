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
  const pathname = usePathname();

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme") as "dark" | "light" | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.classList.toggle("dark", savedTheme === "dark");
    }
  }, []);

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

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black">Ma <span className="text-orange-500">Table</span></h1>
          {restaurantName && (
            <span className="text-sm text-white/40">{restaurantName}</span>
          )}
          {slug && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-white/50 hover:text-white/70 transition-colors flex items-center gap-1"
              title="Voir la page publique"
            >
              🌐 <span className="font-mono text-xs">matable.pro/{slug}</span>
            </a>
          )}
        </div>

        <div className="flex items-center gap-4">
          {hasAnyIa && (
            <span className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-semibold">
              ✨ Nova IA actif
            </span>
          )}
          <button
            onClick={toggleTheme}
            className="w-10 h-10 rounded-lg flex items-center justify-center transition-all bg-white/5 hover:bg-white/10 text-white/50 hover:text-white"
            title={theme === "dark" ? "Mode clair" : "Mode sombre"}
          >
            {theme === "dark" ? "🌙" : "☀️"}
          </button>
          <button
            onClick={logout}
            className="text-sm text-white/50 hover:text-white transition-colors"
            title="Deconnexion"
          >
            Deconnexion
          </button>
        </div>
      </div>

      {/* Sidebar + Content */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar Navigation */}
        <aside className="w-60 border-r border-white/[0.06] bg-[#0a0a0a] p-4 space-y-0.5 overflow-y-auto shrink-0">
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#0a0a0a] p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
