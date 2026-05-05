"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import LandingNav from "@/components/landing/LandingNav";
import PageTransition from "@/components/landing/PageTransition";
import SectionCTA from "@/components/landing/SectionCTA";

const novaModules = [
  {
    title: "Nova Sommelier",
    desc: "L'IA analyse chaque plat et propose les meilleurs accords mets & vins. Elle suggère aussi les boissons manquantes à votre carte pour maximiser le ticket moyen.",
    icon: "🍷",
    color: "purple",
  },
  {
    title: "Nova Contab",
    desc: "Analyse URSSAF, TVA, synthèse fiscale complète. Exportez vos données pour votre comptable en un clic. Fini les fins de mois stressantes.",
    icon: "🧮",
    color: "blue",
  },
  {
    title: "Nova Stock & Finance",
    desc: "Génère vos listes de courses auto, calcule le Food Cost réel, prédit vos marges et vous alerte avant les ruptures. L'IA qui veille sur votre rentabilité.",
    icon: "📦",
    color: "green",
  },
];

const extraModules = [
  { icon: "📷", title: "Magic Scan", desc: "Photographiez un plat — Nova extrait ingrédients, allergènes et rédige une description gastronomique." },
  { icon: "🗓️", title: "Planning IA", desc: "Générez vos plats du jour pour la semaine en un clic selon les stocks restants." },
  { icon: "📝", title: "Menu Generator", desc: "Créez un menu complet depuis une liste d'ingrédients ou une photo. En 30 secondes." },
  { icon: "✍️", title: "Descriptions IA", desc: "Des descriptions de plats qui font saliver. Rédigées par l'IA, publiées en un clic." },
];

const chatMessages = [
  { role: "user", text: "J'ai 3kg de tomates qui vont se perdre, que faire ?" },
  { role: "ai", text: "✨ Je vous suggère 2 plats du jour :\n• Gazpacho andalou (marge estimée: 82%)\n• Tarte tatin à la tomate (marge: 76%)\n\nVoulez-vous que je les ajoute à la carte ?" },
  { role: "user", text: "Oui, et génère les descriptions." },
  { role: "ai", text: "✅ Fait. Les 2 plats sont en ligne avec photos auto-générées et allergènes détectés." },
];

function ChatMockup() {
  const [visibleCount, setVisibleCount] = useState(0);

  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    chatMessages.forEach((_, i) => {
      timers.push(setTimeout(() => setVisibleCount(i + 1), i * 1800));
    });
    return () => timers.forEach(clearTimeout);
  }, []);

  return (
    <div className="relative rounded-3xl border border-white/10 bg-[#111] overflow-hidden p-8 min-h-[320px]">
      <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
      <div className="relative w-full max-w-sm mx-auto space-y-4">
        <AnimatePresence>
          {chatMessages.slice(0, visibleCount).map((msg, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.4, type: "spring", stiffness: 200 }}
              className={msg.role === "user"
                ? "bg-white/10 p-4 rounded-2xl rounded-tl-none border border-white/10 max-w-[85%]"
                : "bg-purple-500/20 p-4 rounded-2xl rounded-tr-none border border-purple-500/30 max-w-[90%] ml-auto shadow-lg shadow-purple-500/10"
              }
            >
              <p className="text-xs text-white/80 whitespace-pre-line">{msg.text}</p>
            </motion.div>
          ))}
        </AnimatePresence>
        {visibleCount < chatMessages.length && (
          <motion.div
            animate={{ opacity: [0.4, 1, 0.4] }}
            transition={{ duration: 1.2, repeat: Infinity }}
            className="flex gap-1 ml-auto w-fit"
          >
            {[0, 1, 2].map(i => (
              <span key={i} className="w-2 h-2 rounded-full bg-purple-400 block" style={{ animationDelay: `${i * 0.2}s` }} />
            ))}
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default function NovaIAPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <LandingNav />

      <PageTransition>
        <div className="pt-16">

          {/* ── Page Hero ─────────────────────────────────────────────────── */}
          <section className="py-28 px-6 text-center relative overflow-hidden">
            {/* Rotating purple blob */}
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 40, repeat: Infinity, ease: "linear" }}
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none"
            />
            <div className="absolute inset-0 bg-purple-900/10 pointer-events-none" />
            <div className="relative z-10 max-w-4xl mx-auto">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-block py-1 px-3 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold tracking-widest uppercase mb-6"
              >
                Intelligence Artificielle
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
                className="text-5xl md:text-7xl font-black mb-6 leading-[1.05]"
              >
                Nova IA.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">
                  Votre brigade digitale.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-white/50 max-w-2xl mx-auto"
              >
                Sommelier, Comptabilité, Stock, Finance, Vision. Nova IA travaille 24h/24 pour que vous travailliez mieux.
              </motion.p>
            </div>
          </section>

          {/* ── 3 Main Modules (alternating layout) ──────────────────────── */}
          <section className="py-10 px-6">
            <div className="max-w-6xl mx-auto space-y-24">
              {novaModules.map((mod, i) => {
                const isEven = i % 2 === 0;
                return (
                  <div
                    key={mod.title}
                    className={`grid md:grid-cols-2 gap-12 items-center ${!isEven ? "md:flex-row-reverse" : ""}`}
                  >
                    <motion.div
                      initial={{ opacity: 0, x: isEven ? -60 : 60 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                      className={!isEven ? "md:order-2" : ""}
                    >
                      <div className="text-5xl mb-5">{mod.icon}</div>
                      <h2 className="text-3xl md:text-4xl font-black mb-4 text-purple-300">{mod.title}</h2>
                      <p className="text-lg text-white/60 leading-relaxed">{mod.desc}</p>
                    </motion.div>

                    <motion.div
                      initial={{ opacity: 0, x: isEven ? 60 : -60 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
                      className={`rounded-3xl border border-purple-500/20 bg-purple-900/10 p-8 ${!isEven ? "md:order-1" : ""}`}
                    >
                      <div className="text-6xl text-center mb-4">{mod.icon}</div>
                      <div className="space-y-3">
                        {[1, 2, 3].map(j => (
                          <div key={j} className="h-3 rounded-full bg-purple-500/20 animate-pulse" style={{ width: `${90 - j * 15}%` }} />
                        ))}
                      </div>
                    </motion.div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* ── Chat Mockup ───────────────────────────────────────────────── */}
          <section className="py-20 px-6">
            <div className="max-w-4xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-12"
              >
                <h2 className="text-3xl md:text-4xl font-black mb-4">Nova en action.</h2>
                <p className="text-white/40">Une conversation, deux plats créés et publiés.</p>
              </motion.div>
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
              >
                <ChatMockup />
              </motion.div>
            </div>
          </section>

          {/* ── Extra IA Modules ──────────────────────────────────────────── */}
          <section className="py-20 px-6 bg-black">
            <div className="max-w-5xl mx-auto">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-3xl font-black text-center mb-12 text-white/80"
              >
                Et encore plus...
              </motion.h2>
              <div className="grid sm:grid-cols-2 gap-6">
                {extraModules.map((mod, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08 }}
                    className="p-6 rounded-2xl bg-white/5 border border-purple-500/15 hover:border-purple-500/30 transition-colors"
                  >
                    <div className="text-3xl mb-3">{mod.icon}</div>
                    <h3 className="font-bold text-lg text-purple-300 mb-2">{mod.title}</h3>
                    <p className="text-sm text-white/50 leading-relaxed">{mod.desc}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          <SectionCTA
            headline="L'IA travaille 24h/24. Commencez maintenant."
            subtext="14 jours d'essai. Sans carte bancaire."
            ctaLabel="Activer Nova IA →"
            ctaHref="/register"
            secondaryLabel="Voir les tarifs"
            secondaryHref="/tarifs"
          />

        </div>
      </PageTransition>
    </div>
  );
}
