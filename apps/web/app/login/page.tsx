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

  // Mot de passe oublié
  const [showForgot, setShowForgot] = useState(false);
  const [forgotEmail, setForgotEmail] = useState("");
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSent, setForgotSent] = useState(false);
  const [forgotErr, setForgotErr] = useState<string | null>(null);

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

  async function onForgot(e: React.FormEvent) {
    e.preventDefault();
    setForgotLoading(true);
    setForgotErr(null);
    try {
      await api("/api/pro/forgot-password", {
        method: "POST",
        body: JSON.stringify({ email: forgotEmail.trim() }),
        pro: false,
      });
      setForgotSent(true);
    } catch {
      setForgotErr("Une erreur est survenue. Vérifiez votre connexion et réessayez.");
    } finally {
      setForgotLoading(false);
    }
  }

  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm space-y-3">

        {/* Formulaire de connexion */}
        {!showForgot && (
          <form onSubmit={onSubmit} className="card space-y-4">
            <h1 className="text-2xl font-bold">MaTable<span className="text-orange-500">Pro</span></h1>
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
            <div className="flex items-center justify-between text-sm">
              <p className="text-white/50">
                Pas encore inscrit ?{" "}
                <Link href="/register" className="text-brand font-medium">Créer un compte</Link>
              </p>
              <button
                type="button"
                onClick={() => { setShowForgot(true); setForgotEmail(email); setForgotSent(false); setForgotErr(null); }}
                className="text-white/40 hover:text-orange-400 transition-colors text-xs"
              >
                Mot de passe oublié ?
              </button>
            </div>
          </form>
        )}

        {/* Formulaire mot de passe oublié */}
        {showForgot && (
          <div className="card space-y-4">
            <div>
              <h1 className="text-2xl font-bold">MaTable<span className="text-orange-500">Pro</span></h1>
            <p className="text-lg font-semibold text-white/80 mt-1">Mot de passe oublié</p>
              <p className="text-sm text-white/50 mt-1">
                Entrez votre email — nous vous envoyons un mot de passe temporaire.
              </p>
            </div>

            {forgotSent ? (
              <div className="space-y-4">
                <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-4 text-sm text-green-400">
                  ✅ Si un compte existe pour <strong>{forgotEmail}</strong>, un email a été envoyé avec un mot de passe temporaire.<br/>
                  <span className="text-green-400/70 text-xs mt-1 block">Pensez à vérifier vos spams.</span>
                </div>
                <button
                  type="button"
                  onClick={() => { setShowForgot(false); setForgotSent(false); }}
                  className="btn-primary w-full"
                >
                  Retour à la connexion
                </button>
              </div>
            ) : (
              <form onSubmit={onForgot} className="space-y-3">
                <input
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500 transition-colors"
                  type="email"
                  value={forgotEmail}
                  onChange={(e) => setForgotEmail(e.target.value)}
                  placeholder="votre@email.com"
                  required
                  autoFocus
                />
                {forgotErr && <div className="text-sm text-red-400">{forgotErr}</div>}
                <button className="btn-primary w-full" disabled={forgotLoading}>
                  {forgotLoading ? "Envoi en cours…" : "Envoyer le mot de passe temporaire"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForgot(false)}
                  className="w-full text-sm text-white/40 hover:text-white/70 transition-colors py-1"
                >
                  ← Retour à la connexion
                </button>
              </form>
            )}
          </div>
        )}

      </div>
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
