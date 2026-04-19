"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api } from "@/lib/api";

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
      router.push("/login");
    } catch (e: any) {
      setErr(e.message?.includes("409") ? "Email déjà utilisé." : "Erreur — réessaie.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-brand">A table !</h1>
        <p className="text-sm text-slate-500">Créer votre compte restaurateur</p>
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="text"
          value={restaurantName}
          onChange={(e) => setRestaurantName(e.target.value)}
          placeholder="Nom du restaurant"
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe (min. 6 caractères)"
          minLength={6}
          required
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : "S'inscrire"}
        </button>
        <p className="text-sm text-slate-600 text-center">
          Déjà inscrit ?{" "}
          <Link href="/login" className="text-brand font-medium">Se connecter</Link>
        </p>
      </form>
    </main>
  );
}
