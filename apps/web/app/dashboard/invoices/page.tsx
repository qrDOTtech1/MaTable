"use client";
import { useEffect, useState, useCallback } from "react";
import { api, redirectOn401, API_URL } from "@/lib/api";

type Invoice = {
  id: string;
  closedAt: string | null;
  billPaymentMode: string | null;
  tipCents: number | null;
  customerEmail: string | null;
  tableNumber: number;
  subtotalCents: number;
  totalCents: number;
};

const MODE_LABEL: Record<string, string> = { CARD: "💳 Carte", CASH: "💵 Espèces", COUNTER: "🏪 Caisse" };
const fmt = (cents: number) => (cents / 100).toFixed(2) + " €";

export default function InvoicesPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [query, setQuery] = useState("");

  const load = useCallback(async (email?: string) => {
    setLoading(true);
    try {
      const qs = email ? `?email=${encodeURIComponent(email)}` : "";
      const res = await api<{ invoices: Invoice[] }>(`/api/pro/invoices${qs}`);
      setInvoices(res.invoices);
    } catch (err) {
      redirectOn401(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setQuery(search);
    load(search.trim() || undefined);
  };

  const revenue = invoices.reduce((s, i) => s + (i.subtotalCents ?? 0), 0);
  const tips = invoices.reduce((s, i) => s + (i.tipCents ?? 0), 0);

  return (
    <div className="p-6 max-w-5xl space-y-6">
      <div>
        <h1 className="text-2xl font-black text-white">Factures & Tickets</h1>
        <p className="text-sm text-white/40 mt-1">Historique des sessions clôturées · recherche par email client</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: "Tickets", value: invoices.length.toString(), color: "text-white" },
          { label: "CA total", value: fmt(revenue), color: "text-emerald-400" },
          { label: "Pourboires", value: fmt(tips), color: "text-orange-400" },
          { label: "Avec email", value: invoices.filter(i => i.customerEmail).length.toString(), color: "text-blue-400" },
        ].map(s => (
          <div key={s.label} className="rounded-2xl bg-white/[0.03] border border-white/[0.06] p-4 text-center">
            <p className={`text-2xl font-black ${s.color}`}>{s.value}</p>
            <p className="text-xs text-white/40 mt-1">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Recherche email */}
      <form onSubmit={handleSearch} className="flex gap-2">
        <input
          type="email"
          placeholder="Rechercher par email client…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="flex-1 bg-white/[0.05] border border-white/[0.08] rounded-xl px-4 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
        />
        <button type="submit" className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm transition-colors">
          Chercher
        </button>
        {query && (
          <button type="button" onClick={() => { setSearch(""); setQuery(""); load(); }}
            className="px-4 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/60 font-bold rounded-xl text-sm transition-colors">
            ✕
          </button>
        )}
      </form>

      {/* Liste */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
        </div>
      ) : invoices.length === 0 ? (
        <div className="rounded-2xl bg-white/[0.02] border border-white/[0.05] p-12 text-center">
          <p className="text-4xl mb-3">🧾</p>
          <p className="text-white/40">{query ? `Aucun ticket pour "${query}"` : "Aucun ticket clôturé"}</p>
        </div>
      ) : (
        <div className="space-y-2">
          {invoices.map(inv => (
            <div key={inv.id} className="rounded-2xl bg-white/[0.02] border border-white/[0.06] px-5 py-4 flex items-center gap-4 flex-wrap hover:bg-white/[0.04] transition-colors">
              <div className="w-10 h-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-sm font-black text-orange-400 shrink-0">
                {inv.tableNumber}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-bold text-white">Table {inv.tableNumber}</span>
                  {inv.billPaymentMode && (
                    <span className="text-xs text-white/40">{MODE_LABEL[inv.billPaymentMode] ?? inv.billPaymentMode}</span>
                  )}
                  {inv.customerEmail && (
                    <span className="text-xs text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full border border-blue-500/20">{inv.customerEmail}</span>
                  )}
                </div>
                {inv.closedAt && (
                  <p className="text-xs text-white/30 mt-0.5">
                    {new Date(inv.closedAt).toLocaleDateString("fr-FR")} à {new Date(inv.closedAt).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                )}
              </div>
              <div className="text-right shrink-0">
                <p className="font-black text-white">{fmt(inv.totalCents)}</p>
                {(inv.tipCents ?? 0) > 0 && (
                  <p className="text-xs text-orange-400">dont {fmt(inv.tipCents!)} pourboire</p>
                )}
              </div>
              <a
                href={`/api/invoice/${inv.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 px-3 py-1.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/60 hover:text-white text-xs font-bold rounded-lg transition-all"
              >
                🧾 Voir
              </a>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
