"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

export type PaletteDestination = {
  href: string;
  icon: string;
  label: string;
  section?: string;
};

/**
 * Palette de commandes / recherche rapide (⌘K).
 * Overlay propre à z-[110] (au-dessus du toast z-100) — NE réutilise PAS Modal (z-50).
 * Chaque résultat a une étoile d'épinglage pour ajouter/retirer des raccourcis.
 */
export function CommandPalette({
  open,
  onClose,
  destinations,
  pinned,
  onTogglePin,
  pinnedBottom,
  onTogglePinBottom,
  bottomFull = false,
}: {
  open: boolean;
  onClose: () => void;
  destinations: PaletteDestination[];
  pinned: string[];
  onTogglePin: (href: string) => void;
  pinnedBottom: string[];
  onTogglePinBottom: (href: string) => void;
  bottomFull?: boolean;   // true si la barre du bas a déjà 5 favoris
}) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return destinations;
    return destinations.filter(
      (d) => d.label.toLowerCase().includes(q) || (d.section ?? "").toLowerCase().includes(q)
    );
  }, [query, destinations]);

  // Reset on open + focus
  useEffect(() => {
    if (open) {
      setQuery("");
      setActiveIdx(0);
      const t = setTimeout(() => inputRef.current?.focus(), 30);
      return () => clearTimeout(t);
    }
  }, [open]);

  // Body scroll lock (même pattern que drawer/Modal)
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open]);

  useEffect(() => {
    if (activeIdx >= results.length) setActiveIdx(Math.max(0, results.length - 1));
  }, [results.length, activeIdx]);

  if (!open) return null;

  const go = (href: string) => {
    onClose();
    router.push(href);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActiveIdx((i) => Math.min(i + 1, results.length - 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActiveIdx((i) => Math.max(i - 1, 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      const target = results[activeIdx];
      if (target) go(target.href);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-[110] flex items-start justify-center pt-[15vh] px-4">
      <button
        type="button"
        aria-label="Fermer"
        onClick={onClose}
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
      />
      <div className="relative w-full max-w-lg rounded-xl border border-white/[0.06] bg-[#111] shadow-2xl shadow-black/50 overflow-hidden animate-fade-in">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/[0.06]">
          <span className="text-white/30 text-lg">🔍</span>
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher une page…"
            className="flex-1 bg-transparent text-white text-sm placeholder-white/30 outline-none"
          />
          <kbd className="hidden sm:inline-block text-[10px] text-white/30 border border-white/10 rounded px-1.5 py-0.5">Échap</kbd>
        </div>

        <div className="max-h-[50vh] overflow-y-auto py-1">
          {results.length === 0 && (
            <p className="px-4 py-6 text-center text-sm text-white/30">Aucun résultat</p>
          )}
          {results.map((d, i) => {
            const isPinned = pinned.includes(d.href);
            const isBottom = pinnedBottom.includes(d.href);
            const bottomLocked = bottomFull && !isBottom; // 5 favoris atteints
            return (
              <div
                key={d.href}
                onMouseEnter={() => setActiveIdx(i)}
                className={`flex items-center gap-2 px-3 py-2.5 mx-1 rounded-lg cursor-pointer transition-colors ${
                  i === activeIdx ? "bg-white/[0.06]" : ""
                }`}
                onClick={() => go(d.href)}
              >
                <span className="text-lg shrink-0">{d.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-white truncate">{d.label}</p>
                  {d.section && <p className="text-[10px] text-white/30 uppercase tracking-wider">{d.section}</p>}
                </div>
                <button
                  type="button"
                  onClick={(e) => { e.stopPropagation(); onTogglePin(d.href); }}
                  className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                    isPinned ? "text-orange-400 hover:bg-orange-500/10" : "text-white/25 hover:text-white/60 hover:bg-white/5"
                  }`}
                  title={isPinned ? "Retirer du haut (desktop)" : "Épingler en haut (desktop)"}
                  aria-label={isPinned ? "Retirer du haut" : "Épingler en haut"}
                >
                  {isPinned ? "★" : "☆"}
                </button>
                <button
                  type="button"
                  disabled={bottomLocked}
                  onClick={(e) => { e.stopPropagation(); if (!bottomLocked) onTogglePinBottom(d.href); }}
                  className={`shrink-0 w-7 h-7 rounded-md flex items-center justify-center transition-colors ${
                    isBottom
                      ? "bg-orange-500/15"
                      : bottomLocked
                      ? "opacity-25 cursor-not-allowed"
                      : "grayscale opacity-40 hover:opacity-100 hover:bg-white/5"
                  }`}
                  title={isBottom ? "Retirer de la barre du bas (mobile)" : bottomLocked ? "Barre du bas pleine (5 max)" : "Ajouter à la barre du bas (mobile)"}
                  aria-label={isBottom ? "Retirer de la barre du bas" : "Ajouter à la barre du bas"}
                >
                  📱
                </button>
              </div>
            );
          })}
        </div>

        <div className="px-4 py-2 border-t border-white/[0.06] flex items-center justify-between gap-2 text-[10px] text-white/25">
          <span>↑↓ naviguer · ↵ ouvrir</span>
          <span className="text-right">★ raccourcis du haut · 📱 barre du bas (mobile)</span>
        </div>
      </div>
    </div>
  );
}
