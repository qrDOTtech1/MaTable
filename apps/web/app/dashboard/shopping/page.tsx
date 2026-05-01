"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import { useRouter } from "next/navigation";

type ShoppingEntry = {
  id: string;
  title: string;
  itemCount: number;
  estimatedBudget: number;
  realCost: number | null;
  completedAt: string | null;
  notes: string | null;
  createdAt: string;
};

export default function ShoppingPage() {
  const router = useRouter();
  const [history, setHistory] = useState<ShoppingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNovaActive, setIsNovaActive] = useState(true);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    Promise.all([
      api<{ history: ShoppingEntry[] }>("/api/pro/shopping-history"),
      api<{ restaurant: { enabledApps?: string[] } }>("/api/pro/me")
    ])
      .then(([r, me]) => {
        setHistory(r.history);
        setIsNovaActive(me.restaurant.enabledApps?.includes("nova_stock") ?? false);
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const createEmptyList = async () => {
    setCreating(true); setError(null);
    try {
      const res = await api<{ id: string }>("/api/pro/shopping-history", {
        method: "POST",
        body: JSON.stringify({
          title: `Courses du ${new Date().toLocaleDateString("fr-FR")}`,
          itemCount: 0,
          estimatedBudget: 0,
          shoppingList: [],
        })
      });
      router.push(`/dashboard/shopping/${res.id}`);
    } catch (e: any) {
      setError(e.message);
      setCreating(false);
    }
  };

  const pending = history.filter(h => !h.completedAt);
  const completed = history.filter(h => h.completedAt);

  return (
    <div className="p-6 max-w-4xl space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-3">
            <span className="text-3xl">🛒</span> Listes de courses
          </h1>
          <p className="text-sm text-white/40 mt-1">
            {isNovaActive ? "Générées par Nova Stock IA · " : "Création manuelle · "}Confirmez les achats pour mettre à jour votre stock
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={createEmptyList}
            disabled={creating}
            className="text-sm px-4 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white border border-white/[0.08] rounded-xl transition-all disabled:opacity-50"
          >
            {creating ? "..." : "+ Liste vide"}
          </button>
          <Link
            href="/dashboard/ia/stock"
            className="text-sm px-4 py-2.5 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-all flex items-center gap-2"
          >
            ✨ Générer avec IA
          </Link>
        </div>
      </div>

      {/* Upsell Banner for non-PRO_IA */}
      {!loading && !isNovaActive && (
        <div className="bg-gradient-to-br from-purple-500/10 to-violet-500/5 border border-purple-500/20 rounded-2xl p-5 flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h2 className="text-sm font-bold text-purple-300 flex items-center gap-2 mb-1">
              <span>✨</span> Passez à Nova Stock IA
            </h2>
            <p className="text-xs text-white/50 max-w-xl leading-relaxed">
              Laissez l'intelligence artificielle analyser vos ventes, vos stocks actuels et votre menu pour générer automatiquement vos listes de courses avec les justes quantités. Fini le gaspillage et les ruptures.
            </p>
          </div>
          <a
            href="mailto:contact@novavivo.online?subject=Demande démo Nova Stock IA"
            className="shrink-0 px-4 py-2 rounded-xl bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs font-bold transition-all"
          >
            Demander une démo →
          </a>
        </div>
      )}

      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-red-400 text-sm">{error}</div>
      )}

      {loading && (
        <div className="flex items-center gap-3 text-white/40 text-sm">
          <div className="w-4 h-4 rounded-full border-2 border-white/20 border-t-white/60 animate-spin" />
          Chargement...
        </div>
      )}

      {!loading && history.length === 0 && (
        <div className="bg-white/[0.03] border border-white/[0.07] rounded-2xl p-12 text-center">
          <p className="text-4xl mb-4">🛒</p>
          <p className="text-white/50 text-sm">Aucune liste de courses pour l&apos;instant.</p>
          <p className="text-white/30 text-xs mt-1 mb-5">Lancez Nova Stock IA pour en générer une automatiquement ou créez une liste manuelle.</p>
          <div className="flex items-center justify-center gap-3">
            <button onClick={createEmptyList} disabled={creating} className="px-5 py-2.5 bg-white/[0.04] hover:bg-white/[0.08] text-white/60 hover:text-white rounded-xl text-sm font-semibold transition-colors disabled:opacity-50 border border-white/[0.08]">
              {creating ? "..." : "+ Liste vide"}
            </button>
            <Link href="/dashboard/ia/stock" className="px-5 py-2.5 bg-orange-600 hover:bg-orange-500 text-white rounded-xl text-sm font-semibold transition-colors">
              ✨ Générer avec IA
            </Link>
          </div>
        </div>
      )}

      {/* À faire */}
      {pending.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
            À faire · {pending.length}
          </h2>
          {pending.map(entry => (
            <Link key={entry.id} href={`/dashboard/shopping/${entry.id}`}>
              <div className="bg-orange-500/5 border border-orange-500/20 hover:border-orange-500/40 rounded-2xl p-5 cursor-pointer transition-all group">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-orange-400 shrink-0" />
                      <p className="text-sm font-semibold text-white truncate">{entry.title}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/40 mt-1">
                      <span>{entry.itemCount} articles</span>
                      <span>Budget estimé : <strong className="text-white/60">~{entry.estimatedBudget.toFixed(0)}€</strong></span>
                      <span>{new Date(entry.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })}</span>
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-orange-500/20 text-orange-400 font-semibold shrink-0 group-hover:bg-orange-500/30 transition-colors">
                    Faire les courses →
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* Historique complété */}
      {completed.length > 0 && (
        <div className="space-y-3">
          <h2 className="text-xs font-bold text-white/40 uppercase tracking-widest">
            Effectuées · {completed.length}
          </h2>
          {completed.map(entry => (
            <Link key={entry.id} href={`/dashboard/shopping/${entry.id}`}>
              <div className="bg-white/[0.03] border border-white/[0.07] hover:border-white/[0.15] rounded-2xl p-5 cursor-pointer transition-all">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-400 shrink-0" />
                      <p className="text-sm font-semibold text-white/70 truncate">{entry.title}</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs text-white/30 mt-1">
                      <span>{entry.itemCount} articles</span>
                      <span>Estimé : ~{entry.estimatedBudget.toFixed(0)}€</span>
                      {entry.realCost != null && (
                        <span>Réel HT : <strong className="text-emerald-400">{entry.realCost.toFixed(2)}€</strong></span>
                      )}
                      {entry.completedAt && (
                        <span>Fait le {new Date(entry.completedAt).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</span>
                      )}
                    </div>
                  </div>
                  <span className="text-xs px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 font-semibold shrink-0">
                    Effectuée
                  </span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
