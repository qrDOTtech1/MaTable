"use client";

import { useState } from "react";

export default function LandingContactForm() {
  const [formData, setFormData] = useState({
    restaurantName: "",
    managerName: "",
    email: "",
    message: ""
  });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001"}/api/public/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Erreur lors de l'envoi du message.");
      }

      setStatus("success");
      setFormData({ restaurantName: "", managerName: "", email: "", message: "" });
    } catch (e: any) {
      setStatus("error");
      setErrorMessage(e.message);
    }
  };

  return (
    <section className="py-32 px-6 bg-[#0a0a0a] border-t border-white/5 relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
      
      <div className="max-w-4xl mx-auto relative z-10">
        <div className="text-center mb-12">
          <span className="inline-block px-4 py-1 border-2 border-orange-500 text-orange-500 font-black tracking-widest text-sm mb-6 rotate-[-2deg]">
            CONTACT DIRECT
          </span>
          <h2 className="text-4xl md:text-5xl font-black mb-4">Une question ? Un projet ?</h2>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Laissez-nous vos coordonnées et quelques mots sur votre établissement. Nous vous recontactons en priorité pour une démo ou répondre à vos questions.
          </p>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-3xl p-8 md:p-12 shadow-2xl">
          {status === "success" ? (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-emerald-500/20 text-emerald-500 rounded-full flex items-center justify-center text-4xl mx-auto mb-6">
                ✓
              </div>
              <h3 className="text-3xl font-black text-white mb-2">Message envoyé !</h3>
              <p className="text-white/60">L'équipe Ma Table vous recontacte très rapidement.</p>
              <button 
                onClick={() => setStatus("idle")}
                className="mt-8 px-6 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm font-bold transition-colors"
              >
                Envoyer un autre message
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                    Nom de l'établissement
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.restaurantName}
                    onChange={e => setFormData({ ...formData, restaurantName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Le Petit Bouchon"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                    Votre nom
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.managerName}
                    onChange={e => setFormData({ ...formData, managerName: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                    placeholder="Jean Dupont"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                  Votre email
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={e => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors"
                  placeholder="jean@lepetitbouchon.fr"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-white/50 uppercase tracking-widest mb-2">
                  Comment pouvons-nous vous aider ?
                </label>
                <textarea
                  required
                  value={formData.message}
                  onChange={e => setFormData({ ...formData, message: e.target.value })}
                  rows={4}
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  placeholder="Nous aimerions voir une démo du portail serveur et de la commande QR..."
                />
              </div>

              {status === "error" && (
                <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-4 rounded-xl text-sm">
                  {errorMessage}
                </div>
              )}

              <button
                type="submit"
                disabled={status === "loading"}
                className="w-full py-4 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white rounded-xl font-bold text-lg text-center transition-all shadow-xl shadow-orange-500/20"
              >
                {status === "loading" ? "Envoi en cours..." : "Envoyer le message"}
              </button>
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
