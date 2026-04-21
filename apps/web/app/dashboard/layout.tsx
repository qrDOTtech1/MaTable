"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearProToken, api } from "@/lib/api";

export default function DashboardLayoutWrapper({ children }: { children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);
  const pathname = usePathname();

  useEffect(() => {
    api<{ restaurant: { slug?: string | null } }>("/api/pro/me")
      .then((r) => setSlug(r.restaurant.slug ?? null))
      .catch(() => {});
  }, []);

  function logout() {
    clearProToken();
    window.location.href = "/login";
  }

  // Navigation menu
  const navSections = [
    {
      label: "SERVICE",
      items: [
        { href: "/dashboard", icon: "🔴", label: "Live cuisine" },
        { href: "/dashboard/tables", icon: "🪑", label: "Tables" },
        { href: "/dashboard/service-calls", icon: "🔔", label: "Appels serveur" },
      ],
    },
    {
      label: "CONTENU",
      items: [
        { href: "/dashboard/menu", icon: "🍽️", label: "Menu" },
        { href: "/dashboard/servers", icon: "👤", label: "Serveurs" },
        { href: "/dashboard/print", icon: "🖨️", label: "QR Codes" },
      ],
    },
    {
      label: "ANALYSE",
      items: [
        { href: "/dashboard/analytics", icon: "📊", label: "Statistiques" },
        { href: "/dashboard/reviews", icon: "⭐", label: "Avis" },
        { href: "/dashboard/reservations", icon: "📅", label: "Réservations" },
      ],
    },
    {
      label: "CONFIG",
      items: [
        { href: "/dashboard/settings", icon: "⚙️", label: "Paramètres" },
        { href: "/dashboard/testimonial", icon: "💬", label: "Témoignage" },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white flex flex-col">
      {/* Top Bar */}
      <div className="h-16 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl px-8 flex items-center justify-between sticky top-0 z-50">
        <div className="flex items-center gap-4">
          <h1 className="text-xl font-black">A<span className="text-orange-500">table</span>!</h1>
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

        <div className="flex items-center gap-6">
          <button
            onClick={logout}
            className="text-sm text-white/50 hover:text-white transition-colors"
            title="Déconnexion"
          >
            Déconnexion
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
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-auto bg-[#0a0a0a]">
          {children}
        </main>
      </div>
    </div>
  );
}
