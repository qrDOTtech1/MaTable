"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function CuisineLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/cuisine/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pin }),
      });
      const json = await res.json();
      if (!res.ok) {
        if (json.error === "CUISINE_NOT_CONFIGURED") throw new Error("Service cuisine non configuré. Contactez le gérant.");
        if (json.error === "INVALID_PIN") throw new Error("PIN incorrect.");
        throw new Error(json.message ?? "Erreur de connexion");
      }
      localStorage.setItem("cuisine_token", json.token);
      router.push(`/${slug}/cuisine/dash`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKey = (k: string) => {
    if (k === "⌫") { setPin((p) => p.slice(0, -1)); return; }
    if (pin.length >= 8) return;
    setPin((p) => p + k);
  };

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-xs space-y-6">
        <div className="text-center space-y-2">
          <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-3xl">
            🍳
          </div>
          <h1 className="text-2xl font-black text-white">Vue Cuisine</h1>
          <p className="text-sm text-white/40">Saisissez le PIN pour accéder</p>
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* PIN display */}
          <div className="flex justify-center gap-2">
            {Array.from({ length: Math.max(4, pin.length) }).map((_, i) => (
              <div key={i} className={`w-10 h-12 rounded-xl border flex items-center justify-center text-xl font-black transition-all ${
                i < pin.length
                  ? "border-amber-500/50 bg-amber-500/10 text-amber-400"
                  : "border-white/10 bg-white/[0.03] text-white/20"
              }`}>
                {i < pin.length ? "●" : "○"}
              </div>
            ))}
          </div>

          {/* Numpad */}
          <div className="grid grid-cols-3 gap-2">
            {["1","2","3","4","5","6","7","8","9","","0","⌫"].map((k, i) => (
              k === "" ? <div key={i} /> : (
                <button
                  key={k}
                  type="button"
                  onClick={() => handleKey(k)}
                  className="h-14 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] active:bg-white/[0.15] text-white font-bold text-lg transition-colors border border-white/[0.06]"
                >
                  {k}
                </button>
              )
            ))}
          </div>

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3 text-center">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading || pin.length < 4}
            className="w-full py-4 bg-amber-600 hover:bg-amber-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl transition-all"
          >
            {loading ? "Connexion…" : "Accéder à la cuisine"}
          </button>
        </form>
      </div>
    </div>
  );
}
