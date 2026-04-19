"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "@/lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("demo@atable.fr");
  const [password, setPassword] = useState("demo1234");
  const [err, setErr] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setErr(null);
    try {
      await api(`/api/pro/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });
      router.push("/dashboard");
    } catch (e: any) {
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
        />
        <input
          className="w-full border rounded-lg px-3 py-2"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="Mot de passe"
        />
        {err && <div className="text-sm text-red-600">{err}</div>}
        <button className="btn-primary w-full" disabled={loading}>
          {loading ? "…" : "Se connecter"}
        </button>
      </form>
    </main>
  );
}
