"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, ApiError, API_URL } from "@/lib/api";

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await api(`/api/pro/register`, {
        method: "POST",
        body: JSON.stringify({ email, password, restaurantName }),
        pro: false,
      });
      router.push("/login?registered=1");
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        if (e.status === 409) setErr("Email déjà utilisé.");
        else setErr(`Erreur serveur (${e.status}). Réessayez.`);
      } else {
        const msg = String((e as any)?.message ?? e);
        if (msg.includes("Failed to fetch") || msg.includes("fetch"))
          setErr("Impossible de contacter le serveur. Vérifiez votre connexion.");
        else setErr(`Erreur: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors";

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Ma <span className="text-orange-500">Table</span></h1>
        <p className="text-sm text-white/50">Créer votre compte restaurateur</p>
        <input
          className={inputClass}
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="Nom du restaurant"
          required
        />
        <input
          className={inputClass}
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          className={inputClass}
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe (min. 6 caractères)"
          minLength={6}
          required
        />
        {err && (
          <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 p-2 rounded break-all">{err}</div>
        )}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : "S'inscrire"}
        </button>
        {process.env.NODE_ENV !== "production" && (
          <p className="text-xs text-white/30 text-center">API: {API_URL}</p>
        )}
        <p className="text-sm text-white/50 text-center">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-orange-400 font-medium hover:text-orange-300">Se connecter</Link>
        </p>
      </form>
    </main>
  );
}
