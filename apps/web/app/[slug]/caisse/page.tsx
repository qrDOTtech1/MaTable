"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";

export default function CaisseLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleLogin() {
    if (!/^\d{4,8}$/.test(pin)) {
      setError("PIN invalide (4-8 chiffres)");
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/caisse/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pin }),
      });
      if (!res.ok) {
        const data = await res.json() as any;
        throw new Error(data.error === "INVALID_PIN" ? "PIN incorrect" : data.message || "Erreur");
      }
      const { token } = await res.json() as { token: string };
      localStorage.setItem("caisse_token", token);
      router.push(`/${slug}/caisse/dash`);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-black flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-8">
        <div className="text-center space-y-2">
          <div className="text-5xl mb-4">💳</div>
          <h1 className="text-3xl font-black text-white">Caisse</h1>
          <p className="text-slate-400">Accès sécurisé par PIN</p>
        </div>

        <div className="bg-slate-800/50 border border-slate-700 rounded-2xl p-8 space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-400 mb-2">PIN (4-8 chiffres)</label>
            <input
              type="password"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={8}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
              placeholder="••••"
              className="w-full bg-slate-900 border border-slate-700 rounded-xl px-4 py-3 text-white text-center text-3xl tracking-[1em] focus:border-emerald-500 focus:outline-none"
              autoFocus
            />
          </div>

          {error && <p className="text-sm text-red-400 text-center">{error}</p>}

          <button
            onClick={handleLogin}
            disabled={loading || pin.length < 4}
            className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold rounded-xl transition-colors"
          >
            {loading ? "Connexion..." : "Accéder"}
          </button>
        </div>

        <p className="text-xs text-slate-600 text-center">
          Page sécurisée — demandez le PIN au gérant
        </p>
      </div>
    </div>
  );
}
