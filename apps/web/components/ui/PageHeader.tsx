"use client";
import Link from "next/link";
import type { ReactNode } from "react";

/**
 * En-tête de page standardisé pour le dashboard.
 * - title : titre principal (string ou node, pour inclure des emojis/compteurs)
 * - subtitle : ligne de contexte secondaire
 * - actions : boutons d'action (passe tes propres .btn*) — scrollable horizontalement sur mobile
 * - backHref : flèche de retour optionnelle
 *
 * N'impose aucun style de bouton : les pages gardent la main sur leurs actions.
 */
export function PageHeader({
  title,
  subtitle,
  actions,
  backHref,
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  actions?: ReactNode;
  backHref?: string;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-6">
      <div className="min-w-0 flex items-start gap-3">
        {backHref && (
          <Link
            href={backHref}
            className="shrink-0 w-9 h-9 rounded-lg flex items-center justify-center bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors mt-0.5"
            aria-label="Retour"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </Link>
        )}
        <div className="min-w-0">
          <h1 className="text-2xl font-black text-white leading-tight truncate">{title}</h1>
          {subtitle && <p className="text-sm text-white/40 mt-0.5">{subtitle}</p>}
        </div>
      </div>

      {actions && (
        <div className="flex items-center gap-2 overflow-x-auto -mx-4 px-4 sm:mx-0 sm:px-0 sm:overflow-visible scrollbar-none shrink-0">
          {actions}
        </div>
      )}
    </div>
  );
}
