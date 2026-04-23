"use client";
import { useEffect } from "react";

export default function DashboardError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="flex-1 flex items-center justify-center p-8">
      <div className="text-center max-w-sm">
        <p className="text-4xl mb-3">⚠️</p>
        <h2 className="text-lg font-bold text-white mb-2">Erreur de chargement</h2>
        <p className="text-white/40 text-sm mb-4">{error.message}</p>
        <button onClick={reset} className="px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-semibold text-sm transition-all">
          Réessayer
        </button>
      </div>
    </div>
  );
}
