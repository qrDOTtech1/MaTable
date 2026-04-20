"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { api, setProToken, API_URL } from "@/lib/api";

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
      console.log("[login] starting request to /api/pro/login with:", { email });
      const res = await api<{ token: string }>(`/api/pro/login`, {
        method: "POST",
        body: JSON.stringify({ email, password }),
        pro: false,
      });
      console.log("[login] success, token received");
      setProToken(res.token);
      router.push("/dashboard");
    } catch (err: any) {
      const msg = String(err?.message ?? err);
      console.error("[login] error:", msg, "| API_URL:", API_URL);
      if (msg.includes("401")) setErr("Identifiants invalides.");
      else if (msg.includes("Failed to fetch") || msg.includes("fetch"))
        setErr(`Impossible de contacter le serveur (${API_URL}). Vérifie la config.`);
      else setErr(`Erreur: ${msg}`);
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
