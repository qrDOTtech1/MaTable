import Link from "next/link";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex">
      <aside className="w-56 bg-white border-r border-slate-200 p-4 space-y-1">
        <div className="text-brand font-bold text-xl mb-4">A table !</div>
        <Link href="/dashboard" className="block px-3 py-2 rounded hover:bg-slate-100">Live cuisine</Link>
        <Link href="/dashboard/tables" className="block px-3 py-2 rounded hover:bg-slate-100">Tables</Link>
        <Link href="/dashboard/menu" className="block px-3 py-2 rounded hover:bg-slate-100">Menu</Link>
        <Link href="/dashboard/print" className="block px-3 py-2 rounded hover:bg-slate-100">QR Codes</Link>
      </aside>
      <div className="flex-1 p-6">{children}</div>
    </div>
  );
}
