"use client";
import { useEffect, useState, useCallback } from "react";
import { api, redirectOn401 } from "@/lib/api";
import { DashboardLayout } from "@/components/ui";

type Server = {
  id: string;
  name: string;
  photoUrl?: string | null;
  active: boolean;
  pin?: string | null;
  avgRating: number | null;
  reviewsCount: number;
  createdAt: string;
};

const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];

export default function ServeursDashboard() {
  const [servers, setServers] = useState<Server[]>([]);
  const [restaurantName, setRestaurantName] = useState("Restaurant");
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState<{ msg: string; type: "ok" | "err" } | null>(null);

  // Add/Edit modal
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Server | null>(null);
  const [formName, setFormName] = useState("");
  const [formPin, setFormPin] = useState("");
  const [formActive, setFormActive] = useState(true);
  const [saving, setSaving] = useState(false);

  // Delete confirm
  const [deleting, setDeleting] = useState<string | null>(null);

  const showToast = (msg: string, type: "ok" | "err" = "ok") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  const load = useCallback(async () => {
    try {
      const [meRes, svRes] = await Promise.all([
        api<{ restaurant: { name: string } }>("/api/pro/me"),
        api<{ servers: Server[] }>("/api/pro/servers"),
      ]);
      setRestaurantName(meRes.restaurant.name);
      setServers(svRes.servers);
    } catch (e: any) {
      redirectOn401(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  function openAdd() {
    setEditing(null);
    setFormName("");
    setFormPin("");
    setFormActive(true);
    setShowModal(true);
  }

  function openEdit(s: Server) {
    setEditing(s);
    setFormName(s.name);
    setFormPin(s.pin ?? "");
    setFormActive(s.active);
    setShowModal(true);
  }

  async function handleSave() {
    if (!formName.trim()) return;
    if (formPin && !/^\d{4,6}$/.test(formPin)) {
      showToast("PIN : 4 à 6 chiffres uniquement", "err");
      return;
    }
    setSaving(true);
    try {
      if (editing) {
        await api(`/api/pro/servers/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: formName.trim(),
            pin: formPin || null,
            active: formActive,
          }),
        });
        showToast("Serveur modifié ✓");
      } else {
        await api("/api/pro/servers", {
          method: "POST",
          body: JSON.stringify({ name: formName.trim() }),
        });
        // Set PIN if provided
        if (formPin) {
          const svRes = await api<{ servers: Server[] }>("/api/pro/servers");
          const fresh = svRes.servers.find(s => s.name === formName.trim());
          if (fresh) {
            await api(`/api/pro/servers/${fresh.id}`, {
              method: "PATCH",
              body: JSON.stringify({ pin: formPin }),
            });
          }
        }
        showToast("Serveur ajouté ✓");
      }
      setShowModal(false);
      load();
    } catch (e: any) {
      showToast(e.message ?? "Erreur", "err");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      await api(`/api/pro/servers/${id}`, { method: "DELETE" });
      showToast("Serveur supprimé");
      setDeleting(null);
      load();
    } catch (e: any) {
      showToast(e.message ?? "Erreur", "err");
    }
  }

  async function toggleActive(s: Server) {
    try {
      await api(`/api/pro/servers/${s.id}`, {
        method: "PATCH",
        body: JSON.stringify({ active: !s.active }),
      });
      load();
    } catch (e: any) {
      showToast(e.message ?? "Erreur", "err");
    }
  }

  const tabs = [
    { id: "live",         icon: "🔴", label: "Cuisine en direct" },
    { id: "stats",        icon: "📊", label: "Statistiques" },
    { id: "commandes",    icon: "📋", label: "Commandes" },
    { id: "menu",         icon: "🍽️", label: "Menu" },
    { id: "serveurs",     icon: "👥", label: "Serveurs", badge: servers.filter(s => s.active).length || undefined },
    { id: "reservations", icon: "📅", label: "Réservations" },
  ];

  const sorted = [...servers].sort((a, b) => (b.avgRating ?? 0) - (a.avgRating ?? 0));

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <DashboardLayout
      activeTabId="serveurs"
      tabs={tabs}
      onTabChange={() => {}}
      restaurantName={restaurantName}
      title="Gestion des serveurs"
    >
      {/* Toast */}
      {toast && (
        <div className={`fixed top-4 right-4 z-[100] px-5 py-3 rounded-2xl shadow-2xl font-semibold text-sm ${
          toast.type === "ok" ? "bg-emerald-500 text-white" : "bg-red-500 text-white"
        }`}>
          {toast.msg}
        </div>
      )}

      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-white">Équipe — {servers.length} serveur{servers.length !== 1 ? "s" : ""}</h2>
            <p className="text-white/40 text-sm">
              {servers.filter(s => s.active).length} actif{servers.filter(s => s.active).length !== 1 ? "s" : ""}
              {servers.filter(s => !s.active).length > 0 && ` · ${servers.filter(s => !s.active).length} inactif`}
            </p>
          </div>
          <button
            onClick={openAdd}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm transition-all"
          >
            + Ajouter un serveur
          </button>
        </div>

        {/* Leaderboard */}
        {servers.length > 0 && (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] overflow-hidden">
            <div className="px-5 py-4 border-b border-white/[0.06] flex items-center justify-between">
              <h3 className="font-bold text-white flex items-center gap-2">🏆 Classement</h3>
              <span className="text-xs text-white/30 uppercase tracking-widest">Par note client</span>
            </div>
            <div className="divide-y divide-white/[0.04]">
              {sorted.map((s, idx) => (
                <div key={s.id} className="px-5 py-3 flex items-center gap-4">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-black flex-shrink-0 ${
                    idx === 0 ? "bg-yellow-500/20 text-yellow-400"
                    : idx === 1 ? "bg-slate-400/20 text-slate-300"
                    : idx === 2 ? "bg-orange-700/20 text-orange-600"
                    : "bg-white/5 text-white/30"
                  }`}>
                    {idx + 1}
                  </div>
                  <div className={`w-8 h-8 rounded-full border flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                    s.active ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-white/5 border-white/10 text-white/30"
                  }`}>
                    {s.name[0]?.toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`font-semibold ${s.active ? "text-white" : "text-white/40 line-through"}`}>{s.name}</p>
                    <p className="text-xs text-white/30">{s.reviewsCount} avis{s.pin ? " · PIN configuré" : " · Pas de PIN"}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    {s.avgRating ? (
                      <p className="text-orange-400 font-bold">⭐ {s.avgRating.toFixed(1)}</p>
                    ) : (
                      <p className="text-white/20 text-sm">–</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Server Cards */}
        {servers.length === 0 ? (
          <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-12 text-center">
            <p className="text-4xl mb-3">👥</p>
            <p className="text-white/50 font-medium">Aucun serveur enregistré</p>
            <p className="text-white/25 text-sm mt-1">Ajoutez vos serveurs pour qu'ils puissent se connecter via leur PIN</p>
            <button onClick={openAdd} className="mt-4 px-5 py-2.5 bg-orange-500 hover:bg-orange-400 text-white font-semibold rounded-xl text-sm transition-all">
              + Ajouter le premier serveur
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {servers.map((s) => (
              <div key={s.id} className={`rounded-2xl border p-5 space-y-3 transition-all ${
                s.active ? "bg-white/[0.02] border-white/[0.06]" : "bg-white/[0.01] border-white/[0.03] opacity-60"
              }`}>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl border flex items-center justify-center text-lg font-black ${
                      s.active ? "bg-orange-500/20 border-orange-500/30 text-orange-400" : "bg-white/5 border-white/10 text-white/30"
                    }`}>
                      {s.name[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="font-bold text-white">{s.name}</p>
                      <p className="text-xs text-white/30">
                        {s.reviewsCount > 0 ? `⭐ ${s.avgRating?.toFixed(1)} · ${s.reviewsCount} avis` : "Pas encore d'avis"}
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => toggleActive(s)}
                    className={`text-[10px] px-2 py-1 rounded-full font-semibold border transition-all ${
                      s.active
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-red-500/10 hover:border-red-500/20 hover:text-red-400"
                        : "bg-white/5 border-white/10 text-white/30 hover:bg-emerald-500/10 hover:text-emerald-400"
                    }`}
                  >
                    {s.active ? "Actif" : "Inactif"}
                  </button>
                </div>

                <div className={`flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${
                  s.pin ? "bg-emerald-500/5 border border-emerald-500/10 text-emerald-400/70" : "bg-white/[0.03] border border-white/[0.06] text-white/30"
                }`}>
                  <span>{s.pin ? "🔐 PIN configuré" : "⚠️ Pas de PIN — connexion impossible"}</span>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    onClick={() => openEdit(s)}
                    className="flex-1 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white text-xs font-medium transition-all"
                  >
                    ✏️ Modifier
                  </button>
                  <button
                    onClick={() => setDeleting(s.id)}
                    className="py-1.5 px-3 rounded-lg bg-red-500/5 border border-red-500/10 text-red-400/60 hover:text-red-400 text-xs transition-all"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Access info */}
        {servers.length > 0 && (
          <div className="rounded-2xl bg-orange-500/5 border border-orange-500/20 px-5 py-4">
            <p className="text-sm text-orange-300 font-semibold mb-1">🔗 Accès serveurs</p>
            <p className="text-xs text-white/40">
              Vos serveurs se connectent via :{" "}
              <span className="font-mono text-orange-400">
                {typeof window !== "undefined" ? `${window.location.origin}/[slug]/serveurdash` : "votre-domaine/[slug]/serveurdash"}
              </span>
            </p>
            <p className="text-xs text-white/30 mt-1">Ils utilisent leur PIN pour accéder à leur vue temps réel (tables, commandes, planning…)</p>
          </div>
        )}
      </div>

      {/* ── Add/Edit Modal ───────────────────────────────────────────────── */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-6 py-5 border-b border-white/[0.06] flex items-center justify-between">
              <h2 className="font-bold text-white">{editing ? "Modifier le serveur" : "Ajouter un serveur"}</h2>
              <button onClick={() => setShowModal(false)} className="text-white/40 hover:text-white transition-colors text-lg">✕</button>
            </div>
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">Nom complet *</label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => setFormName(e.target.value)}
                  placeholder="Ex: Marie Dupont"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-white/50 mb-1.5">PIN de connexion (4-6 chiffres)</label>
                <input
                  type="text"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  value={formPin}
                  onChange={(e) => setFormPin(e.target.value.replace(/\D/g, ""))}
                  placeholder="Ex: 1234"
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white font-mono tracking-widest text-lg placeholder:text-white/30 placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-orange-500"
                />
                <p className="text-[11px] text-white/25 mt-1">Le serveur utilise ce PIN pour accéder à son portail. Laissez vide pour ne pas changer.</p>
              </div>
              {editing && (
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-white/50">Statut</label>
                  <button
                    type="button"
                    onClick={() => setFormActive(v => !v)}
                    className={`text-xs px-3 py-1.5 rounded-lg border font-semibold transition-all ${
                      formActive ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400" : "bg-white/5 border-white/10 text-white/40"
                    }`}
                  >
                    {formActive ? "✓ Actif" : "Inactif"}
                  </button>
                </div>
              )}
            </div>
            <div className="px-6 py-4 border-t border-white/[0.06] flex gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 hover:text-white text-sm font-medium transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleSave}
                disabled={!formName.trim() || saving}
                className="flex-1 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white font-bold text-sm transition-all"
              >
                {saving ? "Enregistrement..." : editing ? "Modifier" : "Ajouter"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Delete confirm ───────────────────────────────────────────────── */}
      {deleting && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-sm bg-[#111] border border-white/10 rounded-2xl p-6 space-y-4 shadow-2xl">
            <p className="font-bold text-white">Supprimer ce serveur ?</p>
            <p className="text-sm text-white/50">Cette action est irréversible. Toutes les données liées seront supprimées.</p>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleting(null)} className="flex-1 py-2.5 rounded-xl bg-white/5 border border-white/10 text-white/60 text-sm font-medium">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleting)} className="flex-1 py-2.5 rounded-xl bg-red-500 hover:bg-red-400 text-white font-bold text-sm">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
