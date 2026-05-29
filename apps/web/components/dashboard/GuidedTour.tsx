"use client";
import { useCallback, useEffect, useState } from "react";

export type TourStep = { selector: string; title: string; text: string };

/**
 * Tour guidé interactif (spotlight + bulles) lancé à la 1re visite.
 * Surligne de vrais éléments de l'interface via des sélecteurs data-tour.
 * Les étapes dont l'élément est absent/masqué (mobile vs desktop) sont ignorées.
 * Aucune dépendance externe.
 */
export function GuidedTour({
  open,
  steps,
  onClose,
}: {
  open: boolean;
  steps: TourStep[];
  onClose: () => void;
}) {
  const [resolved, setResolved] = useState<TourStep[]>([]);
  const [idx, setIdx] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  // Au lancement : ne garder que les étapes dont l'élément est réellement visible
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      const vis = steps.filter((s) => {
        const el = document.querySelector(s.selector) as HTMLElement | null;
        return el && el.offsetParent !== null;
      });
      setResolved(vis);
      setIdx(0);
      if (vis.length === 0) onClose();
    }, 60);
    return () => clearTimeout(t);
  }, [open, steps, onClose]);

  // Mesure l'élément courant (position du spotlight + bulle)
  const measure = useCallback(() => {
    const step = resolved[idx];
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement | null;
    if (!el) return;
    el.scrollIntoView({ block: "center", inline: "center", behavior: "smooth" });
    setRect(el.getBoundingClientRect());
  }, [resolved, idx]);

  useEffect(() => {
    if (!open || resolved.length === 0) return;
    measure();
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    window.addEventListener("scroll", onResize, true);
    return () => {
      window.removeEventListener("resize", onResize);
      window.removeEventListener("scroll", onResize, true);
    };
  }, [open, resolved, idx, measure]);

  // Lock scroll body pendant le tour
  useEffect(() => {
    if (open && resolved.length > 0) {
      document.body.style.overflow = "hidden";
      return () => { document.body.style.overflow = ""; };
    }
  }, [open, resolved.length]);

  if (!open || resolved.length === 0 || !rect) return null;

  const isLast = idx >= resolved.length - 1;
  const step = resolved[idx];
  const pad = 8;
  const holeTop = rect.top - pad;
  const holeLeft = rect.left - pad;
  const holeW = rect.width + pad * 2;
  const holeH = rect.height + pad * 2;

  // Bulle sous l'élément si la place le permet, sinon au-dessus
  const vh = typeof window !== "undefined" ? window.innerHeight : 800;
  const vw = typeof window !== "undefined" ? window.innerWidth : 1200;
  const below = rect.bottom + 160 < vh;
  const tipWidth = Math.min(320, vw - 24);
  let tipLeft = rect.left + rect.width / 2 - tipWidth / 2;
  tipLeft = Math.max(12, Math.min(tipLeft, vw - tipWidth - 12));
  const tipTop = below ? rect.bottom + pad + 12 : Math.max(12, rect.top - pad - 12 - 150);

  const next = () => { if (isLast) onClose(); else setIdx((i) => i + 1); };
  const prev = () => setIdx((i) => Math.max(0, i - 1));

  return (
    <div className="fixed inset-0 z-[120]">
      {/* Catcher : bloque les clics sur l'UI pendant le tour */}
      <div className="absolute inset-0" onClick={() => { /* clic en dehors = ne rien faire */ }} />

      {/* Spotlight : trou lumineux sur l'élément (box-shadow géant = voile sombre) */}
      <div
        className="absolute rounded-xl pointer-events-none transition-all duration-300"
        style={{
          top: holeTop,
          left: holeLeft,
          width: holeW,
          height: holeH,
          boxShadow: "0 0 0 9999px rgba(0,0,0,0.72)",
          border: "2px solid rgba(249,115,22,0.9)",
        }}
      />

      {/* Bulle */}
      <div
        className="absolute rounded-2xl border border-white/10 bg-[#111] shadow-2xl shadow-black/60 p-4 animate-fade-in"
        style={{ top: tipTop, left: tipLeft, width: tipWidth }}
      >
        <div className="flex items-center justify-between mb-1.5">
          {resolved.length > 8 ? (
            <span className="text-[11px] font-bold text-orange-400">Étape {idx + 1} / {resolved.length}</span>
          ) : (
            <div className="flex items-center gap-1">
              {resolved.map((_, i) => (
                <span key={i} className={`h-1.5 rounded-full transition-all ${i === idx ? "w-5 bg-orange-500" : "w-1.5 bg-white/20"}`} />
              ))}
            </div>
          )}
          <button onClick={onClose} className="text-[11px] text-white/35 hover:text-white/70 transition-colors">Passer</button>
        </div>
        <p className="text-sm font-black text-white">{step.title}</p>
        <p className="text-[13px] text-white/55 leading-snug mt-1">{step.text}</p>
        <div className="flex items-center justify-between gap-2 mt-3">
          <button
            onClick={prev}
            disabled={idx === 0}
            className="text-xs text-white/45 hover:text-white disabled:opacity-0 disabled:pointer-events-none transition-colors"
          >
            ← Précédent
          </button>
          <button
            onClick={next}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-xs font-bold transition-colors"
          >
            {isLast ? "Terminer ✓" : "Suivant →"}
          </button>
        </div>
      </div>
    </div>
  );
}
