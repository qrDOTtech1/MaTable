"use client";
import { useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { API_URL } from "@/lib/api";

const KEYS = ["1", "2", "3", "4", "5", "6", "7", "8", "9", "⌫", "0", "✓"];

type ServerInfo = { id: string; name: string; photoUrl?: string | null };
type RestaurantInfo = { id: string; name: string; subscription: string };

function setServerToken(token: string) {
  localStorage.setItem("server_token", token);
}

export default function ServerLoginPage() {
  const { slug } = useParams<{ slug: string }>();
  const router = useRouter();
  const [pin, setPin] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [shake, setShake] = useState(false);

  function press(key: string) {
    if (loading) return;
    if (key === "⌫") {
      setPin((p) => p.slice(0, -1));
      return;
    }
    if (key === "✓") {
      if (pin.length >= 4) submit(pin);
      return;
    }
    if (pin.length >= 6) return;
    const next = pin + key;
    setPin(next);
    if (next.length >= 4) submit(next);
  }

  async function submit(code: string) {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/server/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, pin: code }),
      });
      const data = await res.json();
      if (!res.ok) {
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPin("");
        if (res.status === 401) setError("Code PIN incorrect.");
        else if (res.status === 404) setError("Restaurant introuvable.");
        else setError("Erreur de connexion.");
        setLoading(false);
        return;
      }
      const { token, server, restaurant } = data as { token: string; server: ServerInfo; restaurant: RestaurantInfo };
      setServerToken(token);
      localStorage.setItem("server_info", JSON.stringify(server));
      localStorage.setItem("restaurant_info", JSON.stringify(restaurant));
      router.push(`/${slug}/serveurdash`);
    } catch {
      setError("Impossible de contacter le serveur.");
      setPin("");
      setLoading(false);
    }
  }

  const dots = Array.from({ length: 4 }, (_, i) => i < pin.length);

  return (
    <main className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-xs space-y-8">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-2xl font-black">Ma <span className="text-orange-500">Table</span></h1>
          <p className="text-white/50 text-sm">Espace serveur · <span className="font-mono text-orange-400">{slug}</span></p>
        </div>

        {/* PIN dots */}
        <div className={`flex justify-center gap-4 transition-all ${shake ? "animate-bounce" : ""}`}>
          {dots.map((filled, i) => (
            <div
              key={i}
              className={`w-5 h-5 rounded-full border-2 transition-all duration-150 ${
                filled
                  ? "bg-orange-500 border-orange-500 scale-110"
                  : "bg-transparent border-white/20"
              }`}
            />
          ))}
        </div>

        {error && (
          <p className="text-center text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl py-2">
            {error}
          </p>
        )}

        {/* PIN Pad */}
        <div className="grid grid-cols-3 gap-3">
          {KEYS.map((key) => {
            const isAction = key === "⌫" || key === "✓";
            const isConfirm = key === "✓";
            const isDisabled =
              loading ||
              (key === "✓" && pin.length < 4) ||
              (!isAction && pin.length >= 6);

            return (
              <button
                key={key}
                onClick={() => press(key)}
                disabled={isDisabled}
                className={`
                  h-16 rounded-2xl text-xl font-bold transition-all active:scale-95
                  ${isConfirm
                    ? "bg-orange-500 hover:bg-orange-400 text-white disabled:opacity-30"
                    : isAction
                    ? "bg-white/5 border border-white/10 hover:bg-white/10 text-white/70 disabled:opacity-30"
                    : "bg-white/[0.06] border border-white/[0.08] hover:bg-white/10 hover:border-white/20 text-white disabled:opacity-30"
                  }
                `}
              >
                {loading && key === "✓" ? (
                  <span className="inline-block w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : key}
              </button>
            );
          })}
        </div>

        <p className="text-center text-xs text-white/20">
          Entrez le code PIN qui vous a été attribué par le gérant
        </p>
      </div>
    </main>
  );
}
