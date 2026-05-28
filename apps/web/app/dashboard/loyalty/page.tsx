"use client";
import { useEffect, useRef, useState, useCallback } from "react";
import { api } from "@/lib/api";

// ── Types ────────────────────────────────────────────────────────────────────

type Tier = "bronze" | "silver" | "gold" | "platinum";

type Customer = {
  id: string;
  firstName: string | null;
  lastName: string | null;
  email: string | null;
  phone: string | null;
  points: number;
  tier: Tier;
  totalSpent: number;
  visitCount: number;
  birthDate: string | null;
  notes: string | null;
  source: string;
  createdAt: string;
};

type Transaction = {
  id: string;
  type: "earn" | "redeem" | "adjust" | "expire";
  points: number;
  description: string | null;
  createdAt: string;
  offerId: string | null;
};

type Offer = {
  id: string;
  name: string;
  description: string | null;
  type: "discount_pct" | "discount_fixed" | "free_item" | "double_points" | "birthday";
  value: number;
  pointsCost: number;
  minTier: Tier | null;
  active: boolean;
  expiresAt: string | null;
  usageLimit: number | null;
  usageCount: number;
  createdAt: string;
};

type Stats = {
  customers: { total: number; totalPoints: number; totalSpent: number };
  tiers: Partial<Record<Tier, number>>;
  offers: { total: number; active: number; totalRedemptions: number };
  recentActivity: Array<{
    type: string; points: number; description: string | null;
    createdAt: string; firstName: string | null; lastName: string | null;
  }>;
};

// ── Constants ────────────────────────────────────────────────────────────────

const TIERS: Record<Tier, { label: string; icon: string; color: string; bg: string; border: string; minPts: number }> = {
  bronze:   { label: "Bronze",   icon: "🥉", color: "text-amber-600",  bg: "bg-amber-500/10",  border: "border-amber-500/30",  minPts: 0    },
  silver:   { label: "Argent",   icon: "🥈", color: "text-slate-300",  bg: "bg-slate-500/10",  border: "border-slate-400/30",  minPts: 500  },
  gold:     { label: "Or",       icon: "🥇", color: "text-yellow-400", bg: "bg-yellow-500/10", border: "border-yellow-400/30", minPts: 2000 },
  platinum: { label: "Platine",  icon: "💎", color: "text-violet-400", bg: "bg-violet-500/10", border: "border-violet-400/30", minPts: 5000 },
};

const OFFER_TYPES: Record<string, { label: string; icon: string; hint: string }> = {
  discount_pct:   { label: "Remise %",          icon: "🏷️",  hint: "% de remise sur l'addition" },
  discount_fixed: { label: "Remise fixe",        icon: "💶",  hint: "€ de réduction immédiate" },
  free_item:      { label: "Article offert",     icon: "🎁",  hint: "Article gratuit au choix" },
  double_points:  { label: "Points × 2",         icon: "⚡",  hint: "Prochaine visite : points doublés" },
  birthday:       { label: "Offre anniversaire", icon: "🎂",  hint: "Offre automatique le jour J" },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

function fullName(c: Pick<Customer, "firstName" | "lastName" | "email" | "phone">) {
  const n = [c.firstName, c.lastName].filter(Boolean).join(" ");
  return n || c.email || c.phone || "—";
}

function formatPts(n: number) {
  return n.toLocaleString("fr-FR");
}

function humanApiError(message?: string) {
  const raw = message ?? "erreur inconnue";
  const match = raw.match(/"error"\s*:\s*"([^"]+)"/) || raw.match(/"([a-z_]+)"/);
  const code = match?.[1];
  const labels: Record<string, string> = {
    unauthorized: "session expirée, reconnectez-vous",
    discount_pct_too_high: "une remise en pourcentage ne peut pas dépasser 100%",
    missing_customer_identity: "ajoutez au moins un nom, email ou téléphone",
  };
  return code ? (labels[code] ?? code.replace(/_/g, " ")) : raw;
}

function nextTierInfo(tier: Tier, points: number) {
  const order: Tier[] = ["bronze", "silver", "gold", "platinum"];
  const idx = order.indexOf(tier);
  if (idx === order.length - 1) return null;
  const next = order[idx + 1];
  const needed = TIERS[next].minPts - points;
  return { next, needed };
}

function parseImportFile(raw: string, filename: string): Omit<Customer, "id" | "tier" | "totalSpent" | "visitCount" | "source" | "createdAt">[] {
  const ext = filename.split(".").pop()?.toLowerCase();

  if (ext === "json") {
    const data = JSON.parse(raw);
    const arr = Array.isArray(data) ? data : data.customers ?? data.data ?? [];
    return arr.map((row: Record<string, unknown>) => ({
      firstName: String(row.firstName ?? row.first_name ?? row.prenom ?? row.prénom ?? "").trim() || null,
      lastName:  String(row.lastName  ?? row.last_name  ?? row.nom    ?? "").trim() || null,
      email:     String(row.email     ?? row.mail       ?? "").trim().toLowerCase() || null,
      phone:     String(row.phone     ?? row.telephone  ?? row.tel    ?? "").trim() || null,
      points:    Number(row.points    ?? row.pts         ?? 0) || 0,
      birthDate: String(row.birthDate ?? row.birth_date ?? row.dateNaissance ?? "").trim() || null,
      notes:     String(row.notes     ?? row.note       ?? "").trim() || null,
    }));
  }

  // CSV — first line = headers
  const lines = raw.split(/\r?\n/).filter(Boolean);
  if (lines.length < 2) return [];
  const headers = lines[0].split(/[,;|\t]/).map(h => h.trim().toLowerCase().replace(/['"]/g, ""));
  const col = (row: string[], names: string[]) => {
    for (const n of names) {
      const i = headers.indexOf(n);
      if (i !== -1) return (row[i] ?? "").trim().replace(/^["']|["']$/g, "") || null;
    }
    return null;
  };

  return lines.slice(1).map(line => {
    const row = line.split(/[,;|\t]/);
    return {
      firstName: col(row, ["firstname","first_name","prenom","prénom"]),
      lastName:  col(row, ["lastname","last_name","nom"]),
      email:     col(row, ["email","mail","courriel"]),
      phone:     col(row, ["phone","telephone","tel","téléphone"]),
      points:    Number(col(row, ["points","pts"]) ?? "0") || 0,
      birthDate: col(row, ["birthdate","birth_date","datenaissance","date_naissance"]),
      notes:     col(row, ["notes","note","remarque"]),
    };
  });
}

// ── Component principal ──────────────────────────────────────────────────────

export default function LoyaltyPage() {
  const [tab, setTab] = useState<"overview" | "customers" | "offers" | "config">("overview");
  const [stats, setStats]       = useState<Stats | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [custTotal, setCustTotal] = useState(0);
  const [custPage, setCustPage]   = useState(1);
  const [search, setSearch]       = useState("");
  const [tierFilter, setTierFilter] = useState<Tier | "">("");
  const [offers, setOffers]       = useState<Offer[]>([]);
  const [loading, setLoading]     = useState(false);
  const [msg, setMsg]             = useState<{ type: "ok"|"err"; text: string } | null>(null);
  const [repairing, setRepairing] = useState(false);

  // Loyalty config (auto-points)
  const [loyaltyConfig, setLoyaltyConfig] = useState({ enabled: false, ptsPerEuro: 10, minSpendCents: 0 });
  const [configLoaded, setConfigLoaded]   = useState(false);
  const [savingConfig, setSavingConfig]   = useState(false);

  // Modals
  const [addCustOpen, setAddCustOpen]     = useState(false);
  const [addOfferOpen, setAddOfferOpen]   = useState(false);
  const [importOpen, setImportOpen]       = useState(false);
  const [detailCustomer, setDetailCustomer] = useState<{ customer: Customer; transactions: Transaction[] } | null>(null);
  const [redeemOpen, setRedeemOpen]       = useState<Customer | null>(null);

  const toast = (text: string, type: "ok"|"err" = "ok") => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 4000);
  };

  const loadStats = useCallback(async () => {
    try {
      const r = await api<Stats>("/api/pro/loyalty/stats");
      setStats(r);
    } catch {
      await api("/api/pro/loyalty/ensure-schema", { method: "POST" }).catch(() => {});
    }
  }, []);

  const loadCustomers = useCallback(async (page = 1, s = search, t = tierFilter) => {
    setLoading(true);
    try {
      const r = await api<{ customers: Customer[]; total: number }>
        (`/api/pro/loyalty/customers?search=${encodeURIComponent(s)}&tier=${t}&page=${page}&limit=50`);
      setCustomers(r.customers);
      setCustTotal(r.total);
      setCustPage(page);
    } catch {
      await api("/api/pro/loyalty/ensure-schema", { method: "POST" }).catch(() => {});
      setCustomers([]);
      setCustTotal(0);
    } finally { setLoading(false); }
  }, [search, tierFilter]);

  const loadOffers = useCallback(async () => {
    try {
      const r = await api<{ offers: Offer[] }>("/api/pro/loyalty/offers");
      setOffers(r.offers);
    } catch {
      await api("/api/pro/loyalty/ensure-schema", { method: "POST" }).catch(() => {});
      setOffers([]);
    }
  }, []);

  const repairLoyalty = useCallback(async () => {
    setRepairing(true);
    try {
      await api("/api/pro/loyalty/ensure-schema", { method: "POST" });
      await Promise.all([loadStats(), loadOffers(), loadCustomers(custPage)]);
      toast("Module fidélité vérifié et synchronisé.");
    } catch (e: any) {
      toast(`Réparation impossible : ${e?.message ?? "erreur"}`, "err");
    } finally {
      setRepairing(false);
    }
  }, [custPage, loadCustomers, loadOffers, loadStats]);

  useEffect(() => { loadStats(); }, [loadStats]);
  useEffect(() => { if (tab === "customers") loadCustomers(1, search, tierFilter); }, [tab]);
  useEffect(() => { if (tab === "offers") loadOffers(); }, [tab]);
  useEffect(() => {
    if (tab === "config" && !configLoaded) {
      api<{ enabled: boolean; ptsPerEuro: number; minSpendCents: number }>("/api/pro/loyalty/config")
        .then((r) => { setLoyaltyConfig(r); setConfigLoaded(true); })
        .catch(() => {});
    }
  }, [tab, configLoaded]);

  // ── Search debounce
  const searchTimer = useRef<ReturnType<typeof setTimeout>>();
  const handleSearch = (v: string) => {
    setSearch(v);
    clearTimeout(searchTimer.current);
    searchTimer.current = setTimeout(() => loadCustomers(1, v, tierFilter), 400);
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="space-y-6 max-w-6xl">

      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black flex items-center gap-2">
            <span>💎</span> Programme Fidélité
          </h1>
          <p className="text-sm text-white/40 mt-0.5">
            Gérez vos clients fidèles, leurs points et vos offres exclusives
          </p>
          <div className="mt-3 flex flex-wrap gap-2 text-[11px] text-white/45">
            <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-3 py-1">1. Ajoutez/importez vos clients</span>
            <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-3 py-1">2. Créez une offre</span>
            <span className="rounded-full bg-white/[0.04] border border-white/[0.06] px-3 py-1">3. Utilisez-la depuis une fiche client</span>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <button onClick={repairLoyalty} disabled={repairing}
            className="px-3 py-2 text-sm bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 rounded-xl text-emerald-300 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            title="Vérifier et réparer les tables fidélité si une migration est incomplète">
            {repairing ? "Synchronisation…" : "🛠 Vérifier"}
          </button>
          <button onClick={() => { setImportOpen(true); }}
            className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 transition-colors flex items-center gap-1.5">
            📥 Importer
          </button>
          <a href="/dashboard/loyalty/scan"
            className="px-3 py-2 text-sm bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-white/70 transition-colors flex items-center gap-1.5">
            📷 Scanner carte
          </a>
          <button onClick={() => setAddCustOpen(true)}
            className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5">
            ＋ Client
          </button>
        </div>
      </div>

      {/* Toast */}
      {msg && (
        <div className={`p-3 rounded-xl border text-sm ${msg.type === "ok"
          ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-300"
          : "bg-red-500/10 border-red-500/30 text-red-300"}`}>
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 bg-white/[0.03] border border-white/[0.06] rounded-xl p-1">
        {([
          { id: "overview",  icon: "🏠", label: "Vue d'ensemble" },
          { id: "customers", icon: "👥", label: `Clients${stats ? ` (${stats.customers.total})` : ""}` },
          { id: "offers",    icon: "🎁", label: `Offres${stats ? ` (${stats.offers.active} actives)` : ""}` },
          { id: "config",    icon: "⚙️", label: "Config points" },
        ] as const).map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex-1 py-2.5 px-3 rounded-lg text-sm font-medium transition-all ${
              tab === t.id
                ? "bg-orange-500/20 text-orange-300 border border-orange-500/30"
                : "text-white/40 hover:text-white/70 hover:bg-white/5"
            }`}>
            <span className="mr-1.5">{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── TAB: OVERVIEW ── */}
      {tab === "overview" && stats && (
        <div className="space-y-6">
          {/* Stats cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon="👥" label="Clients inscrits" value={stats.customers.total.toLocaleString("fr-FR")} />
            <StatCard icon="⭐" label="Points distribués" value={formatPts(stats.customers.totalPoints)} color="text-yellow-400" />
            <StatCard icon="🎁" label="Offres utilisées" value={stats.offers.totalRedemptions.toLocaleString("fr-FR")} color="text-violet-400" />
            <StatCard icon="💶" label="Dépenses totales" value={`${stats.customers.totalSpent.toFixed(0)} €`} color="text-emerald-400" />
          </div>

          {/* Tier distribution + activity */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Tiers */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Répartition par niveau</h2>
              <div className="space-y-3">
                {(["platinum","gold","silver","bronze"] as Tier[]).map(tier => {
                  const count = stats.tiers[tier] ?? 0;
                  const total = stats.customers.total || 1;
                  const pct   = Math.round((count / total) * 100);
                  const t     = TIERS[tier];
                  return (
                    <div key={tier}>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-sm flex items-center gap-2">
                          <span>{t.icon}</span>
                          <span className={`font-semibold ${t.color}`}>{t.label}</span>
                          <span className="text-xs text-white/30">≥ {t.minPts} pts</span>
                        </span>
                        <span className="text-sm font-bold text-white/70">{count} <span className="text-white/30 text-xs">({pct}%)</span></span>
                      </div>
                      <div className="h-2 rounded-full bg-white/5 overflow-hidden">
                        <div className={`h-full rounded-full transition-all ${
                          tier === "platinum" ? "bg-violet-500" :
                          tier === "gold"     ? "bg-yellow-400" :
                          tier === "silver"   ? "bg-slate-400"  : "bg-amber-600"
                        }`} style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Recent activity */}
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-5">
              <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider mb-4">Activité récente</h2>
              {stats.recentActivity.length === 0 ? (
                <p className="text-white/30 text-sm text-center py-6">Aucune activité pour l'instant</p>
              ) : (
                <div className="space-y-2.5">
                  {stats.recentActivity.map((a, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                        a.type === "earn"   ? "bg-emerald-500/15 text-emerald-400" :
                        a.type === "redeem" ? "bg-orange-500/15 text-orange-400"  :
                                             "bg-slate-500/15 text-slate-400"
                      }`}>
                        {a.type === "earn" ? "+" : a.type === "redeem" ? "🎁" : "~"}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white/80 truncate">
                          {[a.firstName, a.lastName].filter(Boolean).join(" ") || "Client"}
                        </p>
                        <p className="text-[11px] text-white/30 truncate">{a.description}</p>
                      </div>
                      <span className={`text-sm font-bold flex-shrink-0 ${a.points >= 0 ? "text-emerald-400" : "text-orange-400"}`}>
                        {a.points >= 0 ? "+" : ""}{a.points} pts
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Tier legend */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(Object.entries(TIERS) as [Tier, typeof TIERS[Tier]][]).map(([tier, t]) => (
              <div key={tier} className={`rounded-xl p-3 border ${t.bg} ${t.border}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-lg">{t.icon}</span>
                  <span className={`font-bold text-sm ${t.color}`}>{t.label}</span>
                </div>
                <p className="text-xs text-white/40">
                  {tier === "platinum" ? "5 000 pts et +" : `À partir de ${t.minPts} pts`}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── TAB: CUSTOMERS ── */}
      {tab === "customers" && (
        <div className="space-y-4">
          {/* Filters */}
          <div className="flex flex-wrap gap-3">
            <input
              value={search}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Rechercher nom, email, téléphone…"
              className="flex-1 min-w-52 bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/30 outline-none focus:border-orange-500/50"
            />
            <select
              value={tierFilter}
              onChange={e => { setTierFilter(e.target.value as Tier|""); loadCustomers(1, search, e.target.value as Tier|""); }}
              className="bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/70 outline-none"
            >
              <option value="">Tous les niveaux</option>
              {(Object.entries(TIERS) as [Tier, typeof TIERS[Tier]][]).map(([k, v]) => (
                <option key={k} value={k}>{v.icon} {v.label}</option>
              ))}
            </select>
          </div>

          {/* Table */}
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-white/[0.06]">
                    <th className="text-left px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">Client</th>
                    <th className="text-left px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">Contact</th>
                    <th className="text-center px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">Niveau</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">Points</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">Dépenses</th>
                    <th className="text-right px-4 py-3 text-xs font-bold text-white/40 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="text-center py-12 text-white/30">Chargement…</td></tr>
                  ) : customers.length === 0 ? (
                    <tr><td colSpan={6} className="text-center py-12 text-white/30">
                      Aucun client trouvé.{" "}
                      <button onClick={() => setAddCustOpen(true)} className="text-orange-400 hover:underline">Ajouter le premier →</button>
                    </td></tr>
                  ) : customers.map(c => {
                    const t = TIERS[c.tier];
                    const prog = nextTierInfo(c.tier, c.points);
                    return (
                      <tr key={c.id} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-semibold text-white/90">{fullName(c)}</div>
                          {prog && (
                            <div className="text-[10px] text-white/30 mt-0.5">
                              {formatPts(prog.needed)} pts pour {TIERS[prog.next].icon} {TIERS[prog.next].label}
                            </div>
                          )}
                        </td>
                        <td className="px-4 py-3 text-white/50 text-xs">
                          {c.email && <div>{c.email}</div>}
                          {c.phone && <div>{c.phone}</div>}
                        </td>
                        <td className="px-4 py-3 text-center">
                          <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border ${t.bg} ${t.color} ${t.border}`}>
                            {t.icon} {t.label}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-right font-bold text-white">{formatPts(c.points)}</td>
                        <td className="px-4 py-3 text-right text-white/50 text-xs">{c.totalSpent.toFixed(2)} €</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={async () => {
                                const r = await api<{ customer: Customer; transactions: Transaction[] }>(`/api/pro/loyalty/customers/${c.id}`);
                                setDetailCustomer(r);
                              }}
                              className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/60 transition-colors"
                            >Détail</button>
                            <button
                              onClick={() => setRedeemOpen(c)}
                              className="px-2 py-1 text-xs bg-orange-500/10 hover:bg-orange-500/20 border border-orange-500/20 rounded-lg text-orange-400 transition-colors"
                            >🎁 Offre</button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {custTotal > 50 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-white/[0.06] text-xs text-white/40">
                <span>{custTotal} clients au total</span>
                <div className="flex gap-2">
                  <button disabled={custPage === 1} onClick={() => loadCustomers(custPage - 1)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors">← Préc.</button>
                  <span className="px-3 py-1.5">Page {custPage} / {Math.ceil(custTotal / 50)}</span>
                  <button disabled={custPage * 50 >= custTotal} onClick={() => loadCustomers(custPage + 1)}
                    className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg disabled:opacity-30 transition-colors">Suiv. →</button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── TAB: OFFERS ── */}
      {tab === "offers" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button onClick={() => setAddOfferOpen(true)}
              className="px-4 py-2 text-sm bg-orange-500 hover:bg-orange-400 text-white font-bold rounded-xl transition-colors flex items-center gap-1.5">
              ＋ Nouvelle offre
            </button>
          </div>

          {offers.length === 0 ? (
            <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-12 text-center">
              <p className="text-4xl mb-3">🎁</p>
              <p className="text-white/50 mb-4">Aucune offre créée</p>
              <button onClick={() => setAddOfferOpen(true)} className="text-orange-400 hover:underline text-sm">
                Créer votre première offre →
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {offers.map(o => {
                const ot = OFFER_TYPES[o.type];
                const tierInfo = o.minTier ? TIERS[o.minTier] : null;
                return (
                  <div key={o.id} className={`bg-white/[0.03] border rounded-2xl p-5 transition-all ${
                    o.active ? "border-white/[0.08] hover:border-orange-500/30" : "border-white/[0.04] opacity-50"
                  }`}>
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xl">{ot.icon}</span>
                          <span className="font-bold text-white/90">{o.name}</span>
                          {!o.active && <span className="text-[10px] px-1.5 py-0.5 bg-white/5 text-white/30 rounded">inactif</span>}
                        </div>
                        {o.description && <p className="text-xs text-white/40">{o.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        <button
                          onClick={async () => {
                            await api(`/api/pro/loyalty/offers/${o.id}`, {
                              method: "PATCH",
                              body: JSON.stringify({ active: !o.active }),
                            });
                            loadOffers();
                          }}
                          className="px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded-lg text-white/50 transition-colors"
                        >{o.active ? "Désactiver" : "Activer"}</button>
                        <button
                          onClick={async () => {
                            if (!confirm("Supprimer cette offre ?")) return;
                            await api(`/api/pro/loyalty/offers/${o.id}`, { method: "DELETE" });
                            loadOffers();
                            loadStats();
                          }}
                          className="px-2 py-1 text-xs bg-red-500/10 hover:bg-red-500/20 rounded-lg text-red-400 transition-colors"
                        >✕</button>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className="bg-white/[0.04] rounded-xl p-2.5">
                        <p className="text-[10px] text-white/30 mb-0.5">Coût</p>
                        <p className="font-bold text-orange-400">{formatPts(o.pointsCost)} pts</p>
                      </div>
                      <div className="bg-white/[0.04] rounded-xl p-2.5">
                        <p className="text-[10px] text-white/30 mb-0.5">Valeur</p>
                        <p className="font-bold text-white/80">
                          {o.type === "discount_pct"   ? `−${o.value}%`   :
                           o.type === "discount_fixed"  ? `−${o.value}€`   :
                           o.type === "double_points"   ? "×2 pts"          :
                           o.type === "birthday"        ? "Auto"            : "Offert"}
                        </p>
                      </div>
                      <div className="bg-white/[0.04] rounded-xl p-2.5">
                        <p className="text-[10px] text-white/30 mb-0.5">Utilisations</p>
                        <p className="font-bold text-white/80">
                          {o.usageCount}{o.usageLimit ? ` / ${o.usageLimit}` : ""}
                        </p>
                      </div>
                    </div>

                    {tierInfo && (
                      <div className={`mt-3 text-[11px] px-2.5 py-1.5 rounded-lg border inline-flex items-center gap-1 ${tierInfo.bg} ${tierInfo.border} ${tierInfo.color}`}>
                        {tierInfo.icon} Réservée aux membres {tierInfo.label}+
                      </div>
                    )}
                    {o.expiresAt && (
                      <p className="text-[11px] text-white/30 mt-2">
                        Expire le {new Date(o.expiresAt).toLocaleDateString("fr-FR")}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
          <div className="rounded-2xl border border-orange-500/15 bg-orange-500/5 p-4 text-xs text-orange-100/70">
            <p className="font-bold text-orange-300 mb-1">Utilisation des offres</p>
            <p>Une offre s'utilise depuis une fiche client : onglet Clients → Détail → Utiliser une offre. Le coût en points est déduit automatiquement.</p>
          </div>
        </div>
      )}

      {/* ================================================================
          MODALS
      ================================================================ */}

      {/* Modal — Ajouter client */}
      {addCustOpen && (
        <Modal title="Nouveau client fidélité" onClose={() => setAddCustOpen(false)}>
          <AddCustomerForm
            onSubmit={async (data) => {
              await api("/api/pro/loyalty/customers", { method: "POST", body: JSON.stringify(data) });
              setAddCustOpen(false);
              loadCustomers(1);
              loadStats();
              toast("Client ajouté !");
            }}
          />
        </Modal>
      )}

      {/* Modal — Ajouter offre */}
      {addOfferOpen && (
        <Modal title="Nouvelle offre fidélité" onClose={() => setAddOfferOpen(false)}>
          <AddOfferForm
            onSubmit={async (data) => {
              try {
                await api("/api/pro/loyalty/offers", { method: "POST", body: JSON.stringify(data) });
                setAddOfferOpen(false);
                loadOffers();
                loadStats();
                toast("Offre créée !");
              } catch (e: any) {
                await api("/api/pro/loyalty/ensure-schema", { method: "POST" }).catch(() => {});
                toast(`Impossible de créer l'offre : ${humanApiError(e?.message)}. Tables vérifiées, réessayez.`, "err");
              }
            }}
          />
        </Modal>
      )}

      {/* Modal — Import */}
      {importOpen && (
        <Modal title="📥 Importer une liste clients" onClose={() => setImportOpen(false)}>
          <ImportModal
            onImport={async (customers) => {
              const r = await api<{ imported: number; skipped: number }>("/api/pro/loyalty/customers/import", {
                method: "POST",
                body: JSON.stringify({ customers }),
              });
              setImportOpen(false);
              loadCustomers(1);
              loadStats();
              toast(`✓ ${r.imported} client(s) importé(s)${r.skipped ? `, ${r.skipped} ignoré(s)` : ""}`);
            }}
          />
        </Modal>
      )}

      {/* Modal — Détail client */}
      {detailCustomer && (
        <Modal title="Fiche client" onClose={() => setDetailCustomer(null)} wide>
          <CustomerDetail
            customer={detailCustomer.customer}
            transactions={detailCustomer.transactions}
            onAddPoints={async (delta, desc) => {
              const r = await api<{ newPoints: number; newTier: string }>(`/api/pro/loyalty/customers/${detailCustomer.customer.id}/points`, {
                method: "POST",
                body: JSON.stringify({ delta, description: desc }),
              });
              // Refresh detail
              const updated = await api<{ customer: Customer; transactions: Transaction[] }>(`/api/pro/loyalty/customers/${detailCustomer.customer.id}`);
              setDetailCustomer(updated);
              loadCustomers(custPage);
              loadStats();
              toast(`Points mis à jour : ${r.newPoints} pts (${r.newTier})`);
            }}
            onDelete={async () => {
              if (!confirm("Supprimer ce client et tout son historique ?")) return;
              await api(`/api/pro/loyalty/customers/${detailCustomer.customer.id}`, { method: "DELETE" });
              setDetailCustomer(null);
              loadCustomers(custPage);
              loadStats();
              toast("Client supprimé.");
            }}
          />
        </Modal>
      )}

      {/* Modal — Utiliser une offre */}
      {redeemOpen && (
        <Modal title={`🎁 Utiliser une offre — ${fullName(redeemOpen)}`} onClose={() => setRedeemOpen(null)}>
          <RedeemModal
            customer={redeemOpen}
            offers={offers.filter(o => o.active)}
            onRedeem={async (offerId) => {
              try {
                const r = await api<{ ok: boolean; newPoints: number; newTier: string; offer: { name: string } }>("/api/pro/loyalty/redeem", {
                  method: "POST",
                  body: JSON.stringify({ customerId: redeemOpen.id, offerId }),
                });
                setRedeemOpen(null);
                loadCustomers(custPage);
                loadStats();
                loadOffers();
                toast(`✓ Offre "${r.offer.name}" utilisée — il reste ${formatPts(r.newPoints)} pts`);
              } catch (e: any) {
                const body = e?.message ?? "";
                const ERR: Record<string,string> = {
                  insufficient_points: "Points insuffisants.",
                  tier_too_low: "Niveau requis non atteint.",
                  offer_expired: "Cette offre a expiré.",
                  offer_limit_reached: "Limite d'utilisation atteinte.",
                };
                const code = body.match(/"([a-z_]+)"/)?.[1] ?? "";
                toast(ERR[code] ?? "Erreur lors de l'utilisation.", "err");
              }
            }}
          />
        </Modal>
      )}

      {/* ── TAB: CONFIG ── */}
      {tab === "config" && (
        <div className="space-y-6 max-w-xl">
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
            <div>
              <h2 className="text-base font-bold text-white mb-1">⚡ Attribution automatique de points</h2>
              <p className="text-xs text-white/40 leading-relaxed">
                À chaque table réglée, les points sont automatiquement crédités au client fidélité correspondant (recherche par nom).
                Le client doit déjà exister dans votre liste pour recevoir les points.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <div className="relative">
                <input
                  type="checkbox"
                  className="sr-only"
                  checked={loyaltyConfig.enabled}
                  onChange={(e) => setLoyaltyConfig((c) => ({ ...c, enabled: e.target.checked }))}
                />
                <div className={`w-11 h-6 rounded-full transition-colors ${loyaltyConfig.enabled ? "bg-orange-500" : "bg-white/10"}`} />
                <div className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${loyaltyConfig.enabled ? "translate-x-5" : ""}`} />
              </div>
              <div>
                <p className="text-sm font-semibold text-white">Activer les points automatiques</p>
                <p className="text-xs text-white/40">Créditez des points à chaque commande payée</p>
              </div>
            </label>

            {loyaltyConfig.enabled && (
              <div className="space-y-4 pt-2">
                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">
                    Points par euro dépensé
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={1}
                      max={1000}
                      value={loyaltyConfig.ptsPerEuro}
                      onChange={(e) => setLoyaltyConfig((c) => ({ ...c, ptsPerEuro: Math.max(1, parseInt(e.target.value) || 1) }))}
                      className="w-24 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    />
                    <span className="text-sm text-white/50">pts / €</span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">
                    Ex : avec {loyaltyConfig.ptsPerEuro} pts/€, une addition de 50 € = {loyaltyConfig.ptsPerEuro * 50} points
                  </p>
                </div>

                <div>
                  <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-2">
                    Dépense minimale pour gagner des points (€)
                  </label>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      min={0}
                      step={0.5}
                      value={(loyaltyConfig.minSpendCents / 100).toFixed(2)}
                      onChange={(e) => setLoyaltyConfig((c) => ({ ...c, minSpendCents: Math.round(parseFloat(e.target.value) * 100) || 0 }))}
                      className="w-24 bg-white/[0.05] border border-white/[0.1] rounded-xl px-3 py-2 text-white text-sm focus:outline-none focus:border-orange-500/50"
                    />
                    <span className="text-sm text-white/50">€ minimum</span>
                  </div>
                  <p className="text-xs text-white/30 mt-1">
                    Laisser à 0 pour créditer des points dès le 1er euro.
                  </p>
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-white/[0.06]">
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-xl p-3 mb-4">
                <p className="text-xs font-bold text-white/40 uppercase tracking-wider mb-2">Niveaux de fidélité</p>
                <div className="grid grid-cols-2 gap-2">
                  {(["bronze","silver","gold","platinum"] as Tier[]).map(tier => {
                    const t = TIERS[tier];
                    return (
                      <div key={tier} className={`flex items-center gap-2 p-2 rounded-lg ${t.bg} border ${t.border}`}>
                        <span>{t.icon}</span>
                        <div>
                          <p className={`text-xs font-bold ${t.color}`}>{t.label}</p>
                          <p className="text-[10px] text-white/30">≥ {t.minPts.toLocaleString("fr-FR")} pts</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              <button
                disabled={savingConfig}
                onClick={async () => {
                  setSavingConfig(true);
                  try {
                    await api("/api/pro/loyalty/config", {
                      method: "PATCH",
                      body: JSON.stringify(loyaltyConfig),
                    });
                    toast("✓ Configuration sauvegardée");
                  } catch {
                    toast("Erreur lors de la sauvegarde", "err");
                  } finally {
                    setSavingConfig(false);
                  }
                }}
                className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl transition-colors"
              >
                {savingConfig ? "Sauvegarde…" : "Sauvegarder la configuration"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function StatCard({ icon, label, value, color = "text-white" }: { icon: string; label: string; value: string; color?: string }) {
  return (
    <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xl">{icon}</span>
        <span className="text-xs text-white/40 font-medium uppercase tracking-wider">{label}</span>
      </div>
      <p className={`text-2xl font-black ${color}`}>{value}</p>
    </div>
  );
}

function Modal({ title, onClose, children, wide = false }: {
  title: string; onClose: () => void; children: React.ReactNode; wide?: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-[#111] border border-white/[0.08] rounded-2xl p-6 shadow-2xl w-full max-h-[90vh] overflow-y-auto ${wide ? "max-w-2xl" : "max-w-md"}`}>
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">{title}</h2>
          <button onClick={onClose} className="w-8 h-8 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center text-white/50 hover:text-white transition-colors">✕</button>
        </div>
        {children}
      </div>
    </div>
  );
}

function AddCustomerForm({ onSubmit }: { onSubmit: (d: Record<string,unknown>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", points: 0, birthDate: "", notes: "" });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  return (
    <form onSubmit={async e => {
      e.preventDefault(); setSaving(true);
      try { await onSubmit({ ...form, points: Number(form.points) || 0, email: form.email || undefined, phone: form.phone || undefined, birthDate: form.birthDate || undefined, notes: form.notes || undefined }); }
      finally { setSaving(false); }
    }} className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <Field label="Prénom" value={form.firstName} onChange={v => set("firstName", v)} />
        <Field label="Nom"    value={form.lastName}  onChange={v => set("lastName",  v)} />
      </div>
      <Field label="Email" value={form.email}  onChange={v => set("email",  v)} type="email" />
      <Field label="Téléphone" value={form.phone} onChange={v => set("phone", v)} type="tel" />
      <div className="grid grid-cols-2 gap-3">
        <Field label="Points initiaux" value={String(form.points)} onChange={v => set("points", v)} type="number" />
        <Field label="Date de naissance" value={form.birthDate} onChange={v => set("birthDate", v)} type="date" />
      </div>
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Notes</label>
        <textarea value={form.notes} onChange={e => set("notes", e.target.value)} rows={2}
          className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white placeholder-white/30 outline-none focus:border-orange-500/50 resize-none" />
      </div>
      <button type="submit" disabled={saving}
        className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
        {saving ? "Enregistrement…" : "Ajouter le client"}
      </button>
    </form>
  );
}

function AddOfferForm({ onSubmit }: { onSubmit: (d: Record<string,unknown>) => Promise<void> }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "", description: "", type: "discount_pct" as string,
    value: "10", pointsCost: "200", minTier: "" as string,
    expiresAt: "", usageLimit: "" as string,
  });
  const set = (k: string, v: unknown) => setForm(f => ({ ...f, [k]: v }));
  const ot = OFFER_TYPES[form.type];

  return (
    <form onSubmit={async e => {
      e.preventDefault();
      setError("");
      if (!form.name.trim()) { setError("Donnez un nom à l'offre."); return; }
      if (form.type === "discount_pct" && Number(form.value) > 100) { setError("La remise en pourcentage ne peut pas dépasser 100%."); return; }
      setSaving(true);
      try {
        await onSubmit({
          ...form,
          value: Number(form.value) || 0,
          pointsCost: Math.max(0, Math.floor(Number(form.pointsCost) || 0)),
          minTier: form.minTier || undefined,
          expiresAt: form.expiresAt || undefined,
          usageLimit: form.usageLimit ? Number(form.usageLimit) : undefined,
        });
      } catch (e: any) {
        setError(humanApiError(e?.message));
      } finally { setSaving(false); }
    }} className="space-y-4">
      <Field label="Nom de l'offre" value={form.name} onChange={v => set("name", v)} placeholder="Ex : Café offert, Remise anniversaire…" required />
      <div>
        <label className="block text-xs font-medium text-white/50 mb-1">Type d'offre</label>
        <div className="grid grid-cols-1 gap-1.5">
          {Object.entries(OFFER_TYPES).map(([k, v]) => (
            <label key={k} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
              form.type === k ? "border-orange-500/40 bg-orange-500/10" : "border-white/[0.06] hover:border-white/20 bg-white/[0.02]"
            }`}>
              <input type="radio" name="offerType" value={k} checked={form.type === k} onChange={() => set("type", k)} className="accent-orange-500" />
              <span className="text-lg">{v.icon}</span>
              <div>
                <p className="text-sm font-semibold text-white/90">{v.label}</p>
                <p className="text-[11px] text-white/40">{v.hint}</p>
              </div>
            </label>
          ))}
        </div>
      </div>

      {(form.type === "discount_pct" || form.type === "discount_fixed") && (
        <Field label={form.type === "discount_pct" ? "Valeur (%)" : "Valeur (€)"}
          value={String(form.value)} onChange={v => set("value", v)} type="number" placeholder={form.type === "discount_pct" ? "10" : "5"} />
      )}

      <div className="grid grid-cols-2 gap-3">
        <Field label="Coût en points" value={String(form.pointsCost)} onChange={v => set("pointsCost", v)} type="number" />
        <div>
          <label className="block text-xs font-medium text-white/50 mb-1">Niveau minimum</label>
          <select value={form.minTier} onChange={e => set("minTier", e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/80 outline-none focus:border-orange-500/50">
            <option value="">Tous niveaux</option>
            {(Object.entries(TIERS) as [Tier, typeof TIERS[Tier]][]).map(([k,v]) => (
              <option key={k} value={k}>{v.icon} {v.label}+</option>
            ))}
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <Field label="Date d'expiration" value={form.expiresAt} onChange={v => set("expiresAt", v)} type="date" />
        <Field label="Limite d'utilisations" value={form.usageLimit} onChange={v => set("usageLimit", v)} type="number" placeholder="Illimitée" />
      </div>

      {error && <p className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded-xl px-3 py-2">{error}</p>}

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.025] p-3 text-[11px] text-white/40 leading-relaxed">
        Aperçu : cette offre coûtera <span className="text-orange-300 font-bold">{Number(form.pointsCost) || 0} points</span>
        {form.type === "discount_pct" && <> pour une remise de <span className="text-white/70 font-bold">{Number(form.value) || 0}%</span></>}
        {form.type === "discount_fixed" && <> pour une remise de <span className="text-white/70 font-bold">{Number(form.value) || 0}€</span></>}
        {form.type === "double_points" && <> et doublera les points sur la prochaine visite</>}
        {form.type === "free_item" && <> pour un article offert</>}
        {form.minTier && <> · réservé aux clients {TIERS[form.minTier as Tier].label}+</>}.
      </div>

      <button type="submit" disabled={saving || !form.name}
        className="w-full py-3 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl transition-colors">
        {saving ? "Création…" : `Créer — ${ot.icon} ${ot.label}`}
      </button>
    </form>
  );
}

function ImportModal({ onImport }: { onImport: (customers: unknown[]) => Promise<void> }) {
  const [parsed, setParsed]   = useState<unknown[] | null>(null);
  const [filename, setFilename] = useState("");
  const [error, setError]     = useState("");
  const [importing, setImporting] = useState(false);
  const dropRef = useRef<HTMLLabelElement>(null);

  const handleFile = (file: File) => {
    setError("");
    setFilename(file.name);
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const raw = e.target?.result as string;
        const result = parseImportFile(raw, file.name);
        if (result.length === 0) { setError("Fichier vide ou format non reconnu."); return; }
        setParsed(result);
      } catch (err) {
        setError("Fichier invalide. Vérifiez le format JSON/CSV.");
      }
    };
    reader.readAsText(file, "utf-8");
  };

  return (
    <div className="space-y-4">
      <div className="bg-blue-500/10 border border-blue-500/20 rounded-xl p-4 text-xs text-blue-300 space-y-1">
        <p className="font-bold">Formats acceptés : JSON, CSV</p>
        <p>CSV — colonnes reconnues : <code className="bg-white/10 px-1 rounded">firstName</code>, <code className="bg-white/10 px-1 rounded">lastName</code>, <code className="bg-white/10 px-1 rounded">email</code>, <code className="bg-white/10 px-1 rounded">phone</code>, <code className="bg-white/10 px-1 rounded">points</code>, <code className="bg-white/10 px-1 rounded">birthDate</code></p>
        <p>JSON — tableau d'objets ou <code className="bg-white/10 px-1 rounded">{"{"} "customers": [...] {"}"}</code></p>
        <p>Les doublons (même email) sont mis à jour automatiquement.</p>
      </div>

      {!parsed ? (
        <label
          ref={dropRef}
          className="flex flex-col items-center justify-center border-2 border-dashed border-white/20 hover:border-orange-500/50 rounded-2xl p-10 cursor-pointer transition-colors text-center"
          onDragOver={e => { e.preventDefault(); }}
          onDrop={e => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        >
          <input type="file" accept=".json,.csv" className="hidden" onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
          <p className="text-4xl mb-3">📄</p>
          <p className="text-sm font-bold text-white/70">Glissez votre fichier ici</p>
          <p className="text-xs text-white/30 mt-1">ou cliquez pour parcourir (.json, .csv)</p>
        </label>
      ) : (
        <div className="space-y-3">
          <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3">
            <span className="text-2xl">✅</span>
            <div>
              <p className="text-sm font-bold text-emerald-300">{parsed.length} client(s) détectés dans <em>{filename}</em></p>
              <p className="text-xs text-white/40 mt-0.5">Prévisualisation des 3 premiers :</p>
            </div>
          </div>
          <div className="bg-white/[0.02] rounded-xl border border-white/[0.06] overflow-hidden">
            <table className="w-full text-xs">
              <thead><tr className="border-b border-white/[0.06]">
                {["Prénom","Nom","Email","Tél","Points"].map(h => (
                  <th key={h} className="text-left px-3 py-2 text-white/40 font-medium">{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {(parsed.slice(0, 3) as any[]).map((c, i) => (
                  <tr key={i} className="border-b border-white/[0.04]">
                    <td className="px-3 py-2 text-white/70">{c.firstName ?? "—"}</td>
                    <td className="px-3 py-2 text-white/70">{c.lastName  ?? "—"}</td>
                    <td className="px-3 py-2 text-white/50">{c.email     ?? "—"}</td>
                    <td className="px-3 py-2 text-white/50">{c.phone     ?? "—"}</td>
                    <td className="px-3 py-2 text-white/50">{c.points    ?? 0}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setParsed(null)} className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 text-sm transition-colors">
              Changer de fichier
            </button>
            <button
              disabled={importing}
              onClick={async () => { setImporting(true); try { await onImport(parsed); } finally { setImporting(false); } }}
              className="flex-1 py-2.5 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 rounded-xl text-white font-bold text-sm transition-colors"
            >
              {importing ? "Importation…" : `Importer ${parsed.length} clients`}
            </button>
          </div>
        </div>
      )}

      {error && <p className="text-red-400 text-xs">{error}</p>}
    </div>
  );
}

function CustomerDetail({
  customer, transactions, onAddPoints, onDelete
}: {
  customer: Customer;
  transactions: Transaction[];
  onAddPoints: (delta: number, desc: string) => Promise<void>;
  onDelete: () => Promise<void>;
}) {
  const [delta, setDelta]   = useState(0);
  const [desc, setDesc]     = useState("");
  const [saving, setSaving] = useState(false);
  const t = TIERS[customer.tier];
  const prog = nextTierInfo(customer.tier, customer.points);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className={`rounded-2xl p-4 border ${t.bg} ${t.border}`}>
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xl font-black text-white">{fullName(customer)}</p>
            {customer.email && <p className="text-sm text-white/50 mt-0.5">{customer.email}</p>}
            {customer.phone && <p className="text-sm text-white/50">{customer.phone}</p>}
            {customer.birthDate && (
              <p className="text-xs text-white/30 mt-1">🎂 {new Date(customer.birthDate).toLocaleDateString("fr-FR")}</p>
            )}
          </div>
          <div className="text-right">
            <p className={`text-3xl font-black ${t.color}`}>{formatPts(customer.points)}</p>
            <p className="text-xs text-white/40">points</p>
            <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full border mt-1 ${t.bg} ${t.color} ${t.border}`}>
              {t.icon} {t.label}
            </span>
          </div>
        </div>
        {prog && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-white/40 mb-1">
              <span>{TIERS[prog.next].icon} {TIERS[prog.next].label} dans {formatPts(prog.needed)} pts</span>
              <span>{Math.round((customer.points / TIERS[prog.next].minPts) * 100)}%</span>
            </div>
            <div className="h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-orange-500 rounded-full transition-all"
                style={{ width: `${Math.min(100, (customer.points / TIERS[prog.next].minPts) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 text-center">
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
          <p className="text-[10px] text-white/30 mb-0.5">Visites</p>
          <p className="font-bold text-white">{customer.visitCount}</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
          <p className="text-[10px] text-white/30 mb-0.5">Dépenses</p>
          <p className="font-bold text-emerald-400">{customer.totalSpent.toFixed(2)} €</p>
        </div>
        <div className="bg-white/[0.03] rounded-xl p-3 border border-white/[0.06]">
          <p className="text-[10px] text-white/30 mb-0.5">Source</p>
          <p className="font-bold text-white/60 text-xs capitalize">{customer.source}</p>
        </div>
      </div>

      {/* Add/remove points */}
      <div className="bg-white/[0.02] border border-white/[0.06] rounded-xl p-4">
        <p className="text-sm font-bold text-white/60 mb-3">⚡ Ajuster les points manuellement</p>
        <div className="flex gap-2">
          <input type="number" value={delta === 0 ? "" : delta} onChange={e => setDelta(Number(e.target.value))}
            placeholder="ex : +50 ou -20"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50" />
          <input value={desc} onChange={e => setDesc(e.target.value)} placeholder="Raison (optionnel)"
            className="flex-1 bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-sm text-white outline-none focus:border-orange-500/50" />
          <button disabled={saving || delta === 0} onClick={async () => {
            setSaving(true);
            try { await onAddPoints(delta, desc); setDelta(0); setDesc(""); }
            finally { setSaving(false); }
          }} className="px-4 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold rounded-xl text-sm transition-colors">
            {saving ? "…" : "OK"}
          </button>
        </div>
      </div>

      {/* Transaction history */}
      <div>
        <p className="text-sm font-bold text-white/60 mb-3">Historique des points</p>
        {transactions.length === 0 ? (
          <p className="text-xs text-white/30 text-center py-4">Aucune transaction</p>
        ) : (
          <div className="space-y-1.5 max-h-48 overflow-y-auto">
            {transactions.map(tx => (
              <div key={tx.id} className="flex items-center gap-3 py-2 border-b border-white/[0.04]">
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded ${
                  tx.points >= 0 ? "bg-emerald-500/15 text-emerald-400" : "bg-orange-500/15 text-orange-400"
                }`}>
                  {tx.points >= 0 ? "+" : ""}{tx.points}
                </span>
                <span className="text-xs text-white/50 flex-1 truncate">{tx.description}</span>
                <span className="text-[10px] text-white/20 flex-shrink-0">
                  {new Date(tx.createdAt).toLocaleDateString("fr-FR")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Delete */}
      <button onClick={onDelete} className="w-full py-2 text-xs text-red-400/60 hover:text-red-400 transition-colors border border-red-500/10 hover:border-red-500/30 rounded-xl">
        Supprimer ce client
      </button>
    </div>
  );
}

function RedeemModal({ customer, offers, onRedeem }: {
  customer: Customer;
  offers: Offer[];
  onRedeem: (offerId: string) => Promise<void>;
}) {
  const [loading, setLoading] = useState<string | null>(null);
  const TIER_RANK: Record<Tier, number> = { bronze: 0, silver: 1, gold: 2, platinum: 3 };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 pb-3 border-b border-white/[0.06]">
        <div>
          <p className="font-bold">{fullName(customer)}</p>
          <p className="text-sm text-white/40">{formatPts(customer.points)} points disponibles · {TIERS[customer.tier].icon} {TIERS[customer.tier].label}</p>
        </div>
      </div>
      {offers.length === 0 ? (
        <p className="text-white/30 text-sm text-center py-6">Aucune offre active disponible</p>
      ) : offers.map(o => {
        const ot = OFFER_TYPES[o.type];
        const canAfford = customer.points >= o.pointsCost;
        const tierOk = !o.minTier || TIER_RANK[customer.tier] >= TIER_RANK[o.minTier];
        const disabled = !canAfford || !tierOk || loading !== null;
        return (
          <div key={o.id} className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
            disabled ? "border-white/[0.04] opacity-50" : "border-white/[0.08] hover:border-orange-500/30 cursor-pointer"
          }`}>
            <span className="text-2xl flex-shrink-0">{ot.icon}</span>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-white/90">{o.name}</p>
              <p className="text-[11px] text-white/40">
                {!canAfford && `Points insuffisants (besoin : ${formatPts(o.pointsCost)})`}
                {canAfford && !tierOk && `Niveau ${TIERS[o.minTier!].label} requis`}
                {canAfford && tierOk && `Coût : ${formatPts(o.pointsCost)} pts`}
              </p>
            </div>
            <button
              disabled={disabled}
              onClick={async () => {
                setLoading(o.id);
                try { await onRedeem(o.id); }
                finally { setLoading(null); }
              }}
              className="px-3 py-1.5 text-xs bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-40 border border-orange-500/30 rounded-lg text-orange-300 font-bold transition-colors flex-shrink-0"
            >
              {loading === o.id ? "…" : "Utiliser"}
            </button>
          </div>
        );
      })}
    </div>
  );
}

function Field({ label, value, onChange, type = "text", placeholder = "", required = false }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; required?: boolean;
}) {
  return (
    <div>
      <label className="block text-xs font-medium text-white/50 mb-1">{label}</label>
      <input
        type={type} value={value} onChange={e => onChange(e.target.value)}
        placeholder={placeholder} required={required}
        className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white placeholder-white/20 outline-none focus:border-orange-500/50 transition-colors"
      />
    </div>
  );
}
