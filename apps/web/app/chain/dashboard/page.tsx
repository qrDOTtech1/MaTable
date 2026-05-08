"use client";
import { useEffect, useState, useCallback, useRef } from "react";
import dynamic from "next/dynamic";
import {
  chainApi, clearChainToken, setChainToken,
  type ChainRestaurant, type ChainStats, type ChainInfo,
} from "@/lib/chainApi";
import { setProToken } from "@/lib/api";

// Map loaded only client-side — Leaflet is not SSR-compatible
const ChainMap = dynamic(() => import("./ChainMap"), { ssr: false });

// ── helpers ──────────────────────────────────────────────────────────────────
function fmtEur(cents: number) {
  if (cents >= 100_000_00) return `${(cents / 100_000_00).toFixed(1)} M€`;
  if (cents >= 100_000)    return `${(cents / 100_000).toFixed(0)} K€`;
  return `${(cents / 100).toFixed(0)} €`;
}
function StatChip({ icon, value, label, color = "text-white" }: { icon: string; value: string; label: string; color?: string }) {
  return (
    <div className="flex flex-col items-center min-w-[70px]">
      <span className="text-lg">{icon}</span>
      <span className={`font-black text-base leading-tight ${color}`}>{value}</span>
      <span className="text-[10px] text-white/30 uppercase tracking-wider whitespace-nowrap">{label}</span>
    </div>
  );
}

// ── Main component ────────────────────────────────────────────────────────────
export default function ChainDashboardPage() {
  const [chain,       setChain]       = useState<ChainInfo | null>(null);
  const [restaurants, setRestaurants] = useState<ChainRestaurant[]>([]);
  const [stats,       setStats]       = useState<ChainStats | null>(null);
  const [loading,     setLoading]     = useState(true);
  const [placingId,   setPlacingId]   = useState<string | null>(null);
  const [saveStatus,  setSaveStatus]  = useState<"idle" | "saving" | "saved">("idle");
  const [accessLoading, setAccessLoading] = useState<string | null>(null);

  // Link-establishment modal
  const [showLink, setShowLink]       = useState(false);
  const [linkSlug, setLinkSlug]       = useState("");
  const [linkToken, setLinkToken]     = useState("");
  const [linkLoading, setLinkLoading] = useState(false);
  const [linkError, setLinkError]     = useState<string | null>(null);
  const [linkSuccess, setLinkSuccess] = useState(false);

  const saveDebounce = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Load data ──────────────────────────────────────────────────────────────
  const load = useCallback(async () => {
    try {
      const data = await chainApi<{ chain: ChainInfo; restaurants: ChainRestaurant[]; stats: ChainStats }>("/me");
      setChain(data.chain);
      setRestaurants(data.restaurants);
      setStats(data.stats);
    } catch {
      // unauthorized → redirect handled by chainApi
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // ── Map interactions ───────────────────────────────────────────────────────
  const savePosition = useCallback(async (id: string, lat: number, lng: number) => {
    // Optimistic update
    setRestaurants(prev => prev.map(r => r.id === id ? { ...r, mapLat: lat, mapLng: lng } : r));
    setSaveStatus("saving");
    if (saveDebounce.current) clearTimeout(saveDebounce.current);
    saveDebounce.current = setTimeout(async () => {
      try {
        await chainApi(`/restaurants/${id}/map-position`, {
          method: "PATCH",
          body: JSON.stringify({ lat, lng }),
        });
        setSaveStatus("saved");
        setTimeout(() => setSaveStatus("idle"), 2500);
      } catch {
        setSaveStatus("idle");
      }
    }, 800);
  }, []);

  const handlePlaced = useCallback((id: string, lat: number, lng: number) => {
    setPlacingId(null);
    savePosition(id, lat, lng);
  }, [savePosition]);

  const handleDragEnd = useCallback((id: string, lat: number, lng: number) => {
    savePosition(id, lat, lng);
  }, [savePosition]);

  // ── Impersonate — access a restaurant's dashboard ─────────────────────────
  const handleAccess = useCallback(async (restaurantId: string) => {
    setAccessLoading(restaurantId);
    try {
      const { token } = await chainApi<{ token: string }>(
        `/restaurants/${restaurantId}/impersonate`,
        { method: "POST", body: JSON.stringify({}) }
      );
      setProToken(token);
      window.open("/dashboard", "_blank");
    } catch {
      alert("Impossible d'accéder à ce tableau de bord.");
    } finally {
      setAccessLoading(null);
    }
  }, []);

  // ── Link establishment ─────────────────────────────────────────────────────
  const handleLink = async () => {
    setLinkLoading(true);
    setLinkError(null);
    try {
      const data = await chainApi<{ ok: boolean; restaurant: { name: string } }>("/restaurants/link", {
        method: "POST",
        body: JSON.stringify({ slug: linkSlug.trim(), proToken: linkToken.trim() }),
      });
      setLinkSuccess(true);
      await load();
      setTimeout(() => { setShowLink(false); setLinkSuccess(false); setLinkSlug(""); setLinkToken(""); }, 1800);
    } catch (err: any) {
      const msg: Record<string, string> = {
        restaurant_not_found: "Aucun établissement trouvé avec ce slug.",
        invalid_pro_token: "Token pro invalide ou ne correspond pas au slug.",
      };
      setLinkError(msg[err.message] ?? "Erreur lors de l'ajout.");
    } finally {
      setLinkLoading(false);
    }
  };

  const placed   = restaurants.filter(r => r.mapLat != null);
  const unplaced = restaurants.filter(r => r.mapLat == null);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#080810]">
      <div className="text-center space-y-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/40 text-sm">Chargement de votre espace chaîne…</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col">
      {/* ── TOP BAR ─────────────────────────────────────────────────────── */}
      <header className="h-16 border-b border-white/[0.06] bg-[#080810]/95 backdrop-blur-xl px-6 flex items-center justify-between sticky top-0 z-50 gap-4">
        <div className="flex items-center gap-4 min-w-0">
          <div className="shrink-0">
            <span className="text-xl font-black">
              Ma<span className="text-orange-500">Table</span>
            </span>
            <span className="ml-1.5 text-[10px] font-bold text-orange-500/60 uppercase tracking-[0.2em]">Chaîne</span>
          </div>
          {chain && (
            <>
              <div className="h-5 w-px bg-white/10" />
              <span className="font-bold text-white/80 text-sm truncate">{chain.name}</span>
            </>
          )}
        </div>

        {/* Global stats */}
        {stats && (
          <div className="hidden md:flex items-center gap-6 border border-white/[0.06] rounded-2xl px-6 py-2 bg-white/[0.02]">
            <StatChip icon="🏢" value={String(stats.totalEstablishments)} label="Établissements" />
            <div className="h-8 w-px bg-white/[0.06]" />
            <StatChip icon="💰" value={fmtEur(stats.totalRevenueCents)} label="CA total" color="text-emerald-400" />
            <div className="h-8 w-px bg-white/[0.06]" />
            <StatChip icon="📦" value={stats.totalOrders.toLocaleString("fr-FR")} label="Commandes" />
            <div className="h-8 w-px bg-white/[0.06]" />
            <StatChip icon="⭐" value={stats.avgRating > 0 ? stats.avgRating.toFixed(1) : "—"} label="Note moy." color="text-yellow-400" />
          </div>
        )}

        <button
          onClick={() => { clearChainToken(); window.location.href = "/chain/login"; }}
          className="shrink-0 text-sm text-white/40 hover:text-white transition-colors whitespace-nowrap"
        >
          Déconnexion
        </button>
      </header>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden" style={{ height: "calc(100vh - 64px)" }}>

        {/* ── LEFT SIDEBAR ──────────────────────────────────────────────── */}
        <aside className="w-72 shrink-0 border-r border-white/[0.06] bg-[#080810] flex flex-col overflow-hidden">
          <div className="p-4 border-b border-white/[0.06] flex items-center justify-between">
            <h2 className="text-sm font-bold text-white/60 uppercase tracking-wider">Établissements</h2>
            <button
              onClick={() => setShowLink(true)}
              className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1.5 bg-orange-500/20 hover:bg-orange-500/30 border border-orange-500/30 text-orange-400 rounded-lg transition-colors"
            >
              ➕ Ajouter
            </button>
          </div>

          <div className="flex-1 overflow-y-auto divide-y divide-white/[0.04]">
            {/* Placed restaurants */}
            {placed.map(r => (
              <div key={r.id} className="p-3 hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span>{r.businessType === "BOUTIQUE" ? "🏪" : "🍽️"}</span>
                      <span className="font-semibold text-sm text-white truncate">{r.name}</span>
                    </div>
                    {r.city && <p className="text-[11px] text-white/30 mt-0.5 ml-5">{r.city}</p>}
                  </div>
                  {r.avgRating > 0 && (
                    <span className="text-[11px] text-yellow-400 font-semibold shrink-0">⭐ {r.avgRating.toFixed(1)}</span>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-1.5 mb-2.5">
                  <div className="bg-white/[0.04] rounded-lg px-2 py-1.5 text-center">
                    <div className="text-orange-400 font-black text-sm">{r.ordersToday}</div>
                    <div className="text-[10px] text-white/25">auj.</div>
                  </div>
                  <div className="bg-white/[0.04] rounded-lg px-2 py-1.5 text-center">
                    <div className="text-emerald-400 font-black text-xs">{fmtEur(r.totalRevenueCents)}</div>
                    <div className="text-[10px] text-white/25">CA total</div>
                  </div>
                </div>

                <button
                  onClick={() => handleAccess(r.id)}
                  disabled={accessLoading === r.id}
                  className="w-full py-1.5 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/20 hover:border-orange-500/40 text-orange-400 font-semibold text-xs rounded-lg transition-all disabled:opacity-50"
                >
                  {accessLoading === r.id ? "Chargement…" : "🔓 Accéder au dashboard"}
                </button>
              </div>
            ))}

            {/* Unplaced restaurants */}
            {unplaced.length > 0 && (
              <div className="p-3 pb-1">
                <p className="text-[10px] font-bold text-white/20 uppercase tracking-wider mb-2">
                  📍 À placer sur la carte
                </p>
                {unplaced.map(r => (
                  <div key={r.id} className="mb-2 p-2.5 bg-white/[0.03] border border-white/[0.06] rounded-xl">
                    <div className="flex items-center gap-1.5 mb-1.5">
                      <span>{r.businessType === "BOUTIQUE" ? "🏪" : "🍽️"}</span>
                      <span className="text-sm font-semibold text-white/70 truncate">{r.name}</span>
                    </div>
                    <button
                      onClick={() => setPlacingId(placingId === r.id ? null : r.id)}
                      className={`w-full py-1.5 rounded-lg text-xs font-bold transition-all ${
                        placingId === r.id
                          ? "bg-orange-500 text-white"
                          : "bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/20"
                      }`}
                    >
                      {placingId === r.id ? "✖ Annuler" : "📌 Placer sur la carte"}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {restaurants.length === 0 && (
              <div className="p-6 text-center text-white/25 text-sm">
                <p className="text-3xl mb-2">🏢</p>
                Aucun établissement. Cliquez <strong className="text-white/40">Ajouter</strong> pour rattacher votre premier établissement.
              </div>
            )}
          </div>
        </aside>

        {/* ── MAP AREA ──────────────────────────────────────────────────── */}
        <main className="flex-1 flex flex-col relative overflow-hidden">
          {/* Placement banner */}
          {placingId && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[1000] flex items-center gap-3 px-5 py-3 bg-orange-500 text-white rounded-2xl shadow-2xl shadow-orange-500/40 font-semibold text-sm animate-fade-in">
              <span className="animate-pulse">📌</span>
              Cliquez sur la carte pour placer{" "}
              <strong>{restaurants.find(r => r.id === placingId)?.name}</strong>
              <button onClick={() => setPlacingId(null)} className="ml-1 text-white/70 hover:text-white">✖</button>
            </div>
          )}

          {/* Save status */}
          {saveStatus !== "idle" && (
            <div className={`absolute bottom-4 right-4 z-[1000] flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold transition-all shadow-lg ${
              saveStatus === "saved"
                ? "bg-emerald-500/20 border border-emerald-500/40 text-emerald-400"
                : "bg-white/10 border border-white/10 text-white/60"
            }`}>
              {saveStatus === "saving" ? (
                <><span className="w-4 h-4 border-2 border-white/40 border-t-transparent rounded-full animate-spin" /> Sauvegarde…</>
              ) : (
                <>✅ Positions sauvegardées</>
              )}
            </div>
          )}

          <div className="flex-1 relative p-3">
            <ChainMap
              restaurants={restaurants}
              placingId={placingId}
              onPlaced={handlePlaced}
              onDragEnd={handleDragEnd}
              onAccess={handleAccess}
            />
          </div>

          {/* Bottom legend */}
          <div className="shrink-0 px-4 py-2 border-t border-white/[0.05] flex items-center gap-5 text-[11px] text-white/25">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-orange-500 opacity-80" /> Restaurant
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-purple-500 opacity-80" /> Boutique
            </span>
            <span className="ml-auto">Glissez les marqueurs pour repositionner · Les positions sont sauvegardées automatiquement</span>
          </div>
        </main>
      </div>

      {/* ── LINK ESTABLISHMENT MODAL ────────────────────────────────────── */}
      {showLink && (
        <div className="fixed inset-0 z-[2000] flex items-center justify-center p-6 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#0e0e1a] border border-white/[0.1] rounded-2xl p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between mb-1">
              <h3 className="text-lg font-bold">➕ Rattacher un établissement</h3>
              <button onClick={() => { setShowLink(false); setLinkError(null); }} className="text-white/40 hover:text-white text-xl">✕</button>
            </div>

            <p className="text-sm text-white/40 leading-relaxed">
              Demandez au responsable de l'établissement son <strong className="text-white/60">slug</strong> (visible dans Paramètres) et son <strong className="text-white/60">token pro</strong> (depuis la même page, section API).
            </p>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-1.5">Slug de l'établissement</label>
                <input
                  value={linkSlug}
                  onChange={e => setLinkSlug(e.target.value)}
                  placeholder="ex: le-beau-paris"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono placeholder-white/20 focus:outline-none focus:border-orange-500/60"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-white/40 uppercase tracking-wider block mb-1.5">Token pro de l'établissement</label>
                <input
                  value={linkToken}
                  onChange={e => setLinkToken(e.target.value)}
                  placeholder="eyJhbGciO…"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white font-mono text-xs placeholder-white/20 focus:outline-none focus:border-orange-500/60"
                />
              </div>
            </div>

            {linkError && (
              <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400">{linkError}</div>
            )}
            {linkSuccess && (
              <div className="px-4 py-3 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-sm text-emerald-400">✅ Établissement rattaché !</div>
            )}

            <button
              onClick={handleLink}
              disabled={linkLoading || !linkSlug.trim() || !linkToken.trim()}
              className="w-full py-3 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all"
            >
              {linkLoading ? "Vérification…" : "Rattacher l'établissement"}
            </button>

            <p className="text-[11px] text-white/20 leading-relaxed">
              Le token pro est disponible dans Paramètres → section "Token API". Il est personnel et à ne partager qu'avec votre directeur de chaîne.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
