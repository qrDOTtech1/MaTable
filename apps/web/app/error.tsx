"use client";
import { useEffect } from "react";

export default function GlobalError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center p-6">
      <div className="text-center max-w-md">
        <p className="text-5xl mb-4">⚠️</p>
        <h2 className="text-xl font-bold text-white mb-2">Quelque chose s'est mal passé</h2>
        <p className="text-white/40 text-sm mb-6">{error.message ?? "Erreur inattendue"}</p>
        <button onClick={reset} className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold transition-all">
          Réessayer
        </button>
      </div>
    </div>
  );
}
