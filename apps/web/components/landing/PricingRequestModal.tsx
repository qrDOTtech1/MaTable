"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { API_URL } from "@/lib/api";

type Props = {
  open: boolean;
  onClose: () => void;
  selectedModules: string[];
  engagement: string;
  monthlyHt: number;       // en euros
  totalHt: number;         // en euros
  volumePercent: number;
};

export default function PricingRequestModal({
  open,
  onClose,
  selectedModules,
  engagement,
  monthlyHt,
  totalHt,
  volumePercent,
}: Props) {
  const [form, setForm] = useState({
    restaurantName: "",
    managerName: "",
    email: "",
    phone: "",
    city: "",
    message: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/pricing-request`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          selectedModules,
          engagement,
          monthlyHtCents: Math.round(monthlyHt * 100),
          totalHtCents: Math.round(totalHt * 100),
          volumePercent,
          sourceUrl: typeof window !== "undefined" ? window.location.href : "",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erreur");
      setDone(true);
    } catch (err: any) {
      setError(err.message ?? "Une erreur est survenue.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto"
        >
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            onClick={(e) => e.stopPropagation()}
            className="bg-[#0f0f0f] border border-white/10 rounded-2xl p-8 max-w-lg w-full my-8 max-h-[90vh] overflow-y-auto"
          >
            {!done ? (
              <>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-orange-400 font-bold">Demande de souscription</p>
                    <h2 className="text-2xl font-black mt-1 text-white">Recevez votre contrat</h2>
                  </div>
                  <button onClick={onClose} className="text-white/40 hover:text-white text-2xl leading-none">✕</button>
                </div>
                <p className="text-sm text-white/60 mb-4">
                  Steven vous rappelle sous 24h pour valider votre configuration et vous envoyer
                  votre contrat personnalisé.
                </p>

                {/* Récap de la commande */}
                <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-5 text-sm">
                  <div className="flex justify-between text-white/60">
                    <span>{selectedModules.length} module{selectedModules.length > 1 ? "s" : ""} · {engagement.replace("m", " mois").replace("12a", "12 mois (annuel)")}</span>
                    <span className="font-bold text-orange-400">{monthlyHt.toFixed(2)} € HT/mois</span>
                  </div>
                  {volumePercent > 0 && (
                    <div className="text-xs text-emerald-400 mt-1">Remise volume -{volumePercent}% appliquée</div>
                  )}
                </div>

                <form onSubmit={submit} className="space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="text" required placeholder="Nom de l'établissement *"
                      value={form.restaurantName}
                      onChange={(e) => setForm({ ...form, restaurantName: e.target.value })}
                      className="bg-white/5 border border-white/10 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                    />
                    <input
                      type="text" required placeholder="Votre nom *"
                      value={form.managerName}
                      onChange={(e) => setForm({ ...form, managerName: e.target.value })}
                      className="bg-white/5 border border-white/10 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                    />
                  </div>
                  <input
                    type="email" required placeholder="Email professionnel *"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <input
                      type="tel" placeholder="Téléphone (recommandé)"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="bg-white/5 border border-white/10 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                    />
                    <input
                      type="text" placeholder="Ville"
                      value={form.city}
                      onChange={(e) => setForm({ ...form, city: e.target.value })}
                      className="bg-white/5 border border-white/10 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none"
                    />
                  </div>
                  <textarea
                    placeholder="Précisions sur votre activité (facultatif)"
                    rows={3}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 focus:border-orange-500 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 outline-none resize-none"
                  />

                  {error && (
                    <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg p-2">
                      {error}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-bold transition-colors disabled:opacity-50"
                  >
                    {submitting ? "Envoi…" : "Envoyer ma demande →"}
                  </button>
                  <p className="text-xs text-white/40 text-center">
                    Aucun paiement n'est demandé maintenant. Le contrat est envoyé sous 24h.
                  </p>
                </form>
              </>
            ) : (
              <div className="text-center py-8">
                <div className="text-6xl mb-4">🎉</div>
                <h2 className="text-2xl font-black text-white mb-2">Demande envoyée !</h2>
                <p className="text-white/60 mb-6">
                  Steven vous rappelle sous 24h au <b className="text-white">{form.phone || form.email}</b> pour
                  finaliser votre contrat.
                </p>
                <button
                  onClick={onClose}
                  className="px-8 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-bold transition-colors"
                >
                  Fermer
                </button>
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
