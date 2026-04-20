"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { clearProToken, api } from "@/lib/api";

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const path = usePathname();
  const active = path === href;
  return (
    <Link
      href={href}
      className={`block px-3 py-2 rounded text-sm transition-colors ${
        active
          ? "bg-brand/10 text-brand font-semibold"
          : "text-slate-600 hover:bg-slate-100"
      }`}
    >
      {children}
    </Link>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    api<{ restaurant: { slug?: string | null } }>("/api/pro/me")
      .then((r) => setSlug(r.restaurant.slug ?? null))
      .catch(() => {});
  }, []);

  function logout() {
    clearProToken();
    window.location.href = "/login";
  }

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 h-14 flex items-center justify-between shrink-0">
        <span className="text-brand font-bold text-xl">A table !</span>
        <div className="flex items-center gap-4">
          {slug && (
            <a
              href={`/${slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-brand hover:underline flex items-center gap-1"
              title="Voir la page publique"
            >
              🌐 <span className="font-mono text-xs">matable.pro/{slug}</span>
            </a>
          )}
          <button onClick={logout} className="text-sm text-slate-400 hover:text-slate-700 transition-colors">
            Déconnexion
          </button>
        </div>
      </nav>

      <div className="flex flex-1 overflow-hidden">
        <aside className="w-52 bg-white border-r border-slate-200 p-4 space-y-0.5 overflow-y-auto shrink-0">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 mt-1">Service</p>
          <NavLink href="/dashboard">⚡ Live cuisine</NavLink>
          <NavLink href="/dashboard/tables">🪑 Tables</NavLink>
          <NavLink href="/dashboard/service-calls">🔔 Appels serveur</NavLink>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 mt-3">Contenu</p>
          <NavLink href="/dashboard/menu">🍽️ Menu</NavLink>
          <NavLink href="/dashboard/servers">👤 Serveurs</NavLink>
          <NavLink href="/dashboard/print">🖨️ QR Codes</NavLink>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 mt-3">Analyse</p>
          <NavLink href="/dashboard/analytics">📊 Statistiques</NavLink>
          <NavLink href="/dashboard/reviews">⭐ Avis</NavLink>
          <NavLink href="/dashboard/reservations">📅 Réservations</NavLink>

          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-3 py-1 mt-3">Config</p>
          <NavLink href="/dashboard/settings">⚙️ Paramètres</NavLink>

          {/* Page publique shortcut */}
          {slug && (
            <div className="mt-4 px-3">
              <a
                href={`/${slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-brand/70 hover:text-brand transition-colors py-1"
              >
                🌐 Voir ma page publique ↗
              </a>
            </div>
          )}
        </aside>

        <main className="flex-1 p-6 overflow-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
