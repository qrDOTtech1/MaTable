import Link from "next/link";
import { getProToken, clearProToken } from "@/lib/api";
import { redirect } from "next/navigation";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const token = getProToken();
  if (!token) redirect("/login");

  return (
    <div className="min-h-screen flex flex-col">
      <nav className="bg-white border-b border-slate-200 px-6 h-16 flex items-center justify-between">
        <div className="text-brand font-bold text-xl">A table !</div>
        <div className="text-sm text-slate-500">
          <a href="/login" className="text-slate-600 hover:text-slate-900">Déconnexion</a>
        </div>
      </nav>
      <div className="flex flex-1">
        <aside className="w-56 bg-white border-r border-slate-200 p-4 space-y-1">
          <div className="text-xs font-semibold text-slate-400 uppercase mb-3">Service</div>
          <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Live cuisine</Link>
          <Link href="/dashboard/tables" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Tables & sessions</Link>
          <Link href="/dashboard/service-calls" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Appels serveur</Link>

          <div className="text-xs font-semibold text-slate-400 uppercase mb-3 mt-4">Contenu</div>
          <Link href="/dashboard/menu" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Menu</Link>
          <Link href="/dashboard/servers" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Serveurs</Link>
          <Link href="/dashboard/print" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">QR Codes</Link>

          <div className="text-xs font-semibold text-slate-400 uppercase mb-3 mt-4">Analyse</div>
          <Link href="/dashboard/reviews" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Avis</Link>
          <Link href="/dashboard/analytics" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Statistiques</Link>
          <Link href="/dashboard/reservations" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Réservations</Link>

          <div className="text-xs font-semibold text-slate-400 uppercase mb-3 mt-4">Config</div>
          <Link href="/dashboard/settings" className="block px-3 py-2 rounded hover:bg-slate-100 text-sm">Paramètres</Link>
        </aside>
        <div className="flex-1 p-6 overflow-auto">{children}</div>
      </div>
    </div>
  );
}
