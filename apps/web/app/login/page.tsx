"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { api, setProToken, ApiError } from "@/lib/api";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const justRegistered = searchParams.get("registered") === "1";
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      const res = await api<{ token: string }>(`/api/pro/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
        pro: false,
      });
      setProToken(res.token);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        if (err.status === 401) setErr("Identifiants invalides.");
        else setErr(`Erreur serveur (${err.status}). Réessayez.`);
      } else {
        const msg = String((err as any)?.message ?? err);
        if (msg.includes("Failed to fetch") || msg.includes("fetch"))
          setErr("Impossible de contacter le serveur. Vérifiez votre connexion.");
        else setErr(`Erreur: ${msg}`);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold">Ma <span className="text-orange-500">Table</span></h1>
        <p className="text-sm text-white/50">Connexion restaurateur</p>
        {justRegistered && (
          <div className="text-sm text-green-400 bg-green-500/10 border border-green-500/20 p-2 rounded">
            Compte créé avec succès ! Connectez-vous.
          </div>
        )}
        <input
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Email"
          required
        />
        <input
          className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
          required
        />
        {err && <div className="text-sm text-red-400">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : "Se connecter"}
        </button>
        <p className="text-sm text-white/50 text-center">
          Pas encore inscrit ?{" "}
          <Link href="/register" className="text-brand font-medium">Créer un compte</Link>
        </p>
      </form>
    </main>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
