"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setProToken } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
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
    } catch {
      setErr("Identifiants invalides.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <form onSubmit={onSubmit} className="card w-full max-w-sm space-y-4">
        <h1 className="text-2xl font-bold text-brand">A table !</h1>
        <p className="text-sm text-slate-500">Connexion restaurateur</p>
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
          placeholder="Mot de passe"
          required
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : "Se connecter"}
        </button>
        <p className="text-sm text-slate-600 text-center">
          Pas encore inscrit ?{" "}
          <Link href="/register" className="text-brand font-medium">Créer un compte</Link>
        </p>
      </form>
    </main>
  );
}
