"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

// ── Types ─────────────────────────────────────────────────────────────────────
export type HistoryEntry = {
  id: string;
  type: "STOCK" | "MENU" | "CHAT" | "PLANNING" | "FINANCE" | "NOVACONTAB";
  title: string;
  outputData: any;
  createdAt: string;
};

interface IaHistoryPanelProps {
  type: "STOCK" | "MENU" | "CHAT" | "PLANNING" | "FINANCE" | "NOVACONTAB";
  onRestore: (entry: HistoryEntry) => void;
  /** bump this value to trigger a refresh after a new save */
  refreshKey?: number;
  className?: string;
}

const TYPE_LABEL: Record<string, string> = {
  STOCK: "Nova Stock",
  MENU: "Nova Menu",
  CHAT: "Chatbot",
  PLANNING: "Planning",
};

const TYPE_ICON: Record<string, string> = {
  STOCK: "📦",
  MENU: "🍽️",
  CHAT: "💬",
  PLANNING: "📅",
};

const TYPE_COLOR: Record<string, string> = {
  STOCK: "orange",
  MENU: "blue",
  CHAT: "purple",
  PLANNING: "purple",
};

function SubInfo({ entry }: { entry: HistoryEntry }) {
  const { type, outputData } = entry;
  if (type === "STOCK") {
    const list = outputData?.analysis?.shoppingList;
    const budget = outputData?.analysis?.totalShoppingBudget;
    if (list) return <p className="text-xs text-orange-400/70 mt-0.5">{list.length} articles · ~{(budget ?? 0).toFixed(0)}€</p>;
  }
  if (type === "MENU") {
    const items = outputData?.menu?.items;
    const ct = outputData?.meta?.cuisineType;
    if (items) return <p className="text-xs text-blue-400/70 mt-0.5">{items.length} plats{ct ? ` · ${ct}` : ""}</p>;
  }
  if (type === "PLANNING") {
    const week = outputData?.result?.week;
    if (week) return <p className="text-xs text-purple-400/70 mt-0.5">{week.length} jours planifiés</p>;
  }
  if (type === "CHAT") {
    const msgs = outputData?.messages;
    if (msgs) return <p className="text-xs text-purple-400/70 mt-0.5">{msgs.length} messages</p>;
  }
  return null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export function IaHistoryPanel({ type, onRestore, refreshKey, className }: IaHistoryPanelProps) {
  const [open, setOpen]       = useState(false);
  const [entries, setEntries] = useState<HistoryEntry[]>([]);
  const [loading, setLoading] = useState(false);

  const color = TYPE_COLOR[type] ?? "orange";

  useEffect(() => {
    if (open) fetchHistory();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, refreshKey]);

  async function fetchHistory() {
    setLoading(true);
    try {
      const res = await api<{ history: HistoryEntry[] }>(`/api/pro/ia/history?type=${type}`);
      setEntries(res.history ?? []);
    } catch { /* silent */ }
    finally { setLoading(false); }
  }

  async function deleteEntry(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api(`/api/pro/ia/history/${id}`, { method: "DELETE" });
      setEntries(prev => prev.filter(e => e.id !== id));
    } catch { /* silent */ }
  }

  const borderColor = color === "orange"
    ? "border-orange-500/30 hover:border-orange-500/60"
    : color === "blue"
      ? "border-blue-500/30 hover:border-blue-500/60"
      : "border-purple-500/30 hover:border-purple-500/60";

  const badgeBg = color === "orange"
    ? "bg-orange-500/20 text-orange-400"
    : color === "blue"
      ? "bg-blue-500/20 text-blue-400"
      : "bg-purple-500/20 text-purple-400";

  return (
    <>
      {/* Trigger button */}
      <button
        onClick={() => setOpen(true)}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold text-white/50 hover:text-white/80 bg-white/[0.04] hover:bg-white/[0.07] border border-white/[0.08] rounded-xl transition-all ${className ?? ""}`}
      >
        📜 Historique
        {entries.length > 0 && !open && (
          <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${badgeBg}`}>{entries.length}</span>
        )}
      </button>

      {/* Side panel overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Panel */}
          <div className="relative w-96 max-w-[92vw] h-full bg-[#0e0e0e] border-l border-white/[0.08] flex flex-col shadow-2xl">

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.07] shrink-0">
              <div className="flex items-center gap-3">
                <span className="text-2xl">{TYPE_ICON[type]}</span>
                <div>
                  <h3 className="text-sm font-bold text-white">Historique {TYPE_LABEL[type]}</h3>
                  <p className="text-xs text-white/30 mt-0.5">
                    {entries.length} enregistrement{entries.length !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOpen(false)}
                className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white/80 hover:bg-white/[0.06] rounded-lg transition-all"
              >
                ✕
              </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {loading && (
                <div className="flex items-center justify-center py-16">
                  <span className="w-7 h-7 border-2 border-white/10 border-t-orange-400 rounded-full animate-spin" />
                </div>
              )}

              {!loading && entries.length === 0 && (
                <div className="text-center py-16">
                  <div className="text-5xl mb-4">📭</div>
                  <p className="text-sm font-semibold text-white/40">Aucun historique</p>
                  <p className="text-xs text-white/20 mt-2 max-w-[200px] mx-auto leading-relaxed">
                    Les analyses IA apparaîtront ici automatiquement après chaque génération.
                  </p>
                </div>
              )}

              {!loading && entries.map(entry => (
                <div
                  key={entry.id}
                  onClick={() => { onRestore(entry); setOpen(false); }}
                  className={`group cursor-pointer bg-white/[0.03] hover:bg-white/[0.06] border ${borderColor} rounded-xl p-4 transition-all`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-lg shrink-0 mt-0.5">{TYPE_ICON[entry.type]}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-semibold text-white leading-tight">{entry.title}</p>
                        <button
                          onClick={(e) => deleteEntry(entry.id, e)}
                          className="opacity-0 group-hover:opacity-100 text-white/20 hover:text-red-400 text-sm transition-all shrink-0 mt-0.5"
                          title="Supprimer"
                        >
                          🗑
                        </button>
                      </div>
                      <p className="text-[11px] text-white/30 mt-0.5">
                        {new Date(entry.createdAt).toLocaleDateString("fr-FR", {
                          weekday: "short", day: "numeric", month: "short",
                          hour: "2-digit", minute: "2-digit",
                        })}
                      </p>
                      <SubInfo entry={entry} />
                    </div>
                  </div>
                  <p className="text-[10px] text-white/20 mt-2 pl-8">👆 Cliquer pour restaurer</p>
                </div>
              ))}
            </div>

            {/* Footer hint */}
            <div className="px-5 py-3 border-t border-white/[0.06] shrink-0">
              <p className="text-[10px] text-white/20 text-center">
                Les analyses sont sauvegardées automatiquement · Cliquez pour les restaurer
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
