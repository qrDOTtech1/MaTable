"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

/**
 * Popup "n'oubliez pas de parrainer" — apparait J-5 avant la facturation
 * mensuelle, pour pousser le client à utiliser son code du mois (un code
 * non utilisé étant non reportable). Dismiss persistant par cycle.
 */
export function ReferralReminderPopup({ daysRemaining, isTrial }: { daysRemaining: number | null; isTrial: boolean }) {
  const [open, setOpen] = useState(false);
  const [code, setCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [link, setLink] = useState("");

  useEffect(() => {
    // Affiché uniquement pour les payants, J-5 → J-1 avant l'échéance
    if (isTrial) return;
    if (daysRemaining === null || daysRemaining > 5 || daysRemaining < 1) return;

    // Dismiss persistant pour ce cycle de facturation (~ par échéance)
    const cycleKey = `referral-reminder-dismissed-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    if (typeof window !== "undefined" && localStorage.getItem(cycleKey) === "1") return;

    api<{ currentCode: string | null }>("/api/pro/referrals/me")
      .then((r) => {
        if (!r?.currentCode) return;
        setCode(r.currentCode);
        setLink(`${window.location.origin}/register?ref=${r.currentCode}`);
        setOpen(true);
      })
      .catch(() => {});
  }, [daysRemaining, isTrial]);

  function dismiss() {
    setOpen(false);
    const cycleKey = `referral-reminder-dismissed-${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;
    try { localStorage.setItem(cycleKey, "1"); } catch {}
  }

  async function copyLink() {
    try { await navigator.clipboard.writeText(link); setCopied(true); setTimeout(() => setCopied(false), 1800); } catch {}
  }

  if (!open || !code) return null;

  return (
    <div className="fixed inset-0 z-[105] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={dismiss} />
      <div className="relative w-full max-w-md rounded-2xl border border-purple-500/30 bg-gradient-to-br from-[#15101a] to-[#0f0d10] shadow-2xl shadow-purple-500/20 overflow-hidden animate-fade-in">
        <div className="px-6 pt-6 pb-4">
          <div className="flex items-start gap-3">
            <span className="text-3xl">🎁</span>
            <div className="flex-1">
              <p className="text-xs uppercase tracking-widest text-purple-300 font-black mb-1">Plus que {daysRemaining} jour{daysRemaining! > 1 ? "s" : ""}</p>
              <h3 className="text-lg font-black text-white leading-tight">
                N'oubliez pas de parrainer avant la fin du mois !
              </h3>
              <p className="text-sm text-white/55 mt-2 leading-relaxed">
                Votre code du mois n'a pas encore été utilisé. Un confrère qui s'inscrit avec et passe en payant
                = <strong className="text-emerald-400">30 jours à votre niveau d'abonnement</strong>.
                Un code non utilisé n'est pas reportable.
              </p>
            </div>
          </div>
        </div>

        <div className="px-6 pb-4">
          <div className="rounded-xl border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-orange-300 truncate">{link}</div>
        </div>

        <div className="px-6 pb-6 flex items-center gap-2">
          <button onClick={copyLink}
            className="flex-1 px-4 py-2.5 rounded-xl bg-orange-500 hover:bg-orange-400 text-white text-sm font-bold transition-colors">
            {copied ? "✓ Copié" : "Copier le lien"}
          </button>
          <Link href="/dashboard/abonnement" onClick={dismiss}
            className="px-4 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/70 text-sm font-bold transition-colors">
            Voir mes codes
          </Link>
        </div>

        <button onClick={dismiss}
          className="absolute top-3 right-3 w-8 h-8 rounded-lg flex items-center justify-center text-white/30 hover:text-white hover:bg-white/5 transition-colors">
          ✕
        </button>
      </div>
    </div>
  );
}
