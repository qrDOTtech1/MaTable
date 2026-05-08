"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { chainApi, setChainToken } from "@/lib/chainApi";

export default function ChainLoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [form, setForm] = useState({ name: "", adminEmail: "", adminPassword: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const f = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm(p => ({ ...p, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const path = mode === "login" ? "/login" : "/register";
      const body =
        mode === "login"
          ? { adminEmail: form.adminEmail, adminPassword: form.adminPassword }
          : { name: form.name, adminEmail: form.adminEmail, adminPassword: form.adminPassword };
      const data = await chainApi<{ token: string; chain: { name: string } }>(path, {
        method: "POST",
        body: JSON.stringify(body),
        skipAuth: true,
      });
      setChainToken(data.token);
      router.push("/chain/dashboard");
    } catch (err: any) {
      const msg: Record<string, string> = {
        invalid_credentials: "Email ou mot de passe incorrect.",
        email_taken: "Cet email est déjà utilisé.",
      };
      setError(msg[err.message] ?? "Une erreur est survenue.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#080810] text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-orange-500/5 blur-[100px] rounded-full pointer-events-none" />
      <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-purple-500/5 blur-[80px] rounded-full pointer-events-none" />

      {/* Logo */}
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-black">
          Ma<span className="text-orange-500">Table</span>
          <span className="ml-2 text-sm font-semibold text-white/30 tracking-widest uppercase">Chaîne</span>
        </h1>
        <p className="text-white/40 text-sm mt-2">Espace directeurs & groupes d'établissements</p>
      </div>

      {/* Card */}
      <div className="w-full max-w-md bg-white/[0.03] border border-white/[0.08] rounded-2xl p-8 backdrop-blur-xl shadow-2xl">
        {/* Mode toggle */}
        <div className="flex bg-white/5 rounded-xl p-1 mb-7">
          {(["login", "register"] as const).map(m => (
            <button
              key={m}
              type="button"
              onClick={() => { setMode(m); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all ${
                mode === m
                  ? "bg-orange-500 text-white shadow-lg shadow-orange-500/30"
                  : "text-white/40 hover:text-white/70"
              }`}
            >
              {m === "login" ? "Connexion" : "Créer un espace chaîne"}
            </button>
          ))}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {mode === "register" && (
            <div>
              <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-1.5">
                Nom du groupe / enseigne
              </label>
              <input
                type="text"
                value={form.name}
                onChange={f("name")}
                required
                placeholder="Ex: Groupe Dupont Restauration"
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/60 transition-colors"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-1.5">
              Email administrateur
            </label>
            <input
              type="email"
              value={form.adminEmail}
              onChange={f("adminEmail")}
              required
              placeholder="pdg@groupe-dupont.fr"
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/60 transition-colors"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-white/50 uppercase tracking-wider block mb-1.5">
              Mot de passe
            </label>
            <input
              type="password"
              value={form.adminPassword}
              onChange={f("adminPassword")}
              required
              minLength={mode === "register" ? 8 : 1}
              placeholder={mode === "register" ? "Minimum 8 caractères" : "••••••••"}
              className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-white/20 focus:outline-none focus:border-orange-500/60 transition-colors"
            />
          </div>

          {error && (
            <div className="px-4 py-3 bg-red-500/10 border border-red-500/30 rounded-xl text-sm text-red-400 text-center">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-all shadow-lg shadow-orange-500/20 mt-2"
          >
            {loading
              ? "Chargement…"
              : mode === "login"
              ? "Accéder à mon espace"
              : "Créer l'espace chaîne"}
          </button>
        </form>
      </div>

      <p className="mt-6 text-xs text-white/20">
        Vous êtes un restaurant ?{" "}
        <a href="/login" className="text-orange-400/70 hover:text-orange-400 transition-colors underline underline-offset-2">
          Connexion établissement →
        </a>
      </p>
    </div>
  );
}
