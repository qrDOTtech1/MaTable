"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import LandingNav from "@/components/landing/LandingNav";
import PageTransition from "@/components/landing/PageTransition";
import SectionCTA from "@/components/landing/SectionCTA";
import { features, comparisons } from "@/components/landing/landingData";

const TABS = [
  { key: "tous", label: "Tous" },
  { key: "commande", label: "Commande" },
  { key: "ia", label: "IA" },
  { key: "gestion", label: "Gestion" },
] as const;

type TabKey = typeof TABS[number]["key"];

export default function FonctionnalitesPage() {
  const [activeTab, setActiveTab] = useState<TabKey>("tous");

  const filtered = activeTab === "tous"
    ? features
    : features.filter(f => f.category === activeTab);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <LandingNav />

      <PageTransition>
        <div className="pt-16">

          {/* ── Page Hero ─────────────────────────────────────────────────── */}
          <section className="py-28 px-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-orange-900/10 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-4xl mx-auto">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-block py-1 px-3 rounded-full bg-orange-500/10 text-orange-400 border border-orange-500/20 text-xs font-bold tracking-widest uppercase mb-6"
              >
                Fonctionnalités
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
                className="text-5xl md:text-7xl font-black mb-6 leading-[1.05]"
              >
                Un arsenal.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                  Rien ne manque.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-white/50 max-w-2xl mx-auto"
              >
                De la prise de commande à la comptabilité, tout est intégré et synchronisé en temps réel.
              </motion.p>
            </div>
          </section>

          {/* ── Features Grid ─────────────────────────────────────────────── */}
          <section className="py-10 px-6">
            <div className="max-w-7xl mx-auto">

              {/* Filter tabs */}
              <div className="flex justify-center gap-3 mb-14 flex-wrap">
                {TABS.map(tab => (
                  <button
                    key={tab.key}
                    onClick={() => setActiveTab(tab.key)}
                    className={`px-5 py-2 rounded-full text-sm font-bold transition-all ${
                      activeTab === tab.key
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.25 }}
                  className="grid md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filtered.map((f, i) => (
                    <motion.div
                      key={f.title}
                      initial={{ opacity: 0, y: 30 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: (i % 6) * 0.06, duration: 0.4 }}
                      whileHover={{ scale: 1.02, rotateZ: 0.3 }}
                      className={`group rounded-2xl border p-6 transition-all duration-300 cursor-default ${
                        f.highlight
                          ? "bg-gradient-to-br from-orange-500/10 to-amber-500/5 border-orange-500/30 hover:shadow-lg hover:shadow-orange-500/10 hover:border-orange-500/50"
                          : "bg-white/[0.02] border-white/10 hover:bg-white/[0.04] hover:border-white/20"
                      }`}
                    >
                      <div className="text-4xl mb-4 transform group-hover:scale-110 transition-transform origin-left">{f.icon}</div>
                      <h3 className="text-lg font-bold text-white mb-2">{f.title}</h3>
                      <p className="text-sm text-white/50 leading-relaxed">{f.desc}</p>
                    </motion.div>
                  ))}
                </motion.div>
              </AnimatePresence>
            </div>
          </section>

          {/* ── Test du Pourboire ─────────────────────────────────────────── */}
          <section className="border-y border-white/5 bg-black px-6 py-32 relative overflow-hidden mt-16">
            <div className="w-full max-w-6xl relative perspective-[2000px] mt-10 mx-auto">
              <motion.div
                initial={{ opacity: 0, rotateX: 20, y: 100 }}
                whileInView={{ opacity: 1, rotateX: 0, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 1.2, type: "spring", stiffness: 50 }}
                className="relative z-10 max-w-5xl mx-auto text-left border border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-[2rem] p-10 md:p-16 shadow-2xl"
              >
                <div
                  className="absolute inset-0 rounded-[2rem] opacity-[0.03] pointer-events-none"
                  style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 12px)" }}
                />
                <div className="inline-block px-4 py-1 border-2 border-orange-500 text-orange-500 font-black tracking-widest text-sm mb-10 rotate-[-2deg]">
                  LE TEST DU POURBOIRE
                </div>
                <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[0.9] text-white">
                  VOUS PENSEZ QUE VOS CLIENTS<br />
                  <span className="text-orange-500">SONT RADINS ?</span>
                </h2>
                <p className="text-xl md:text-3xl font-bold text-white/90 max-w-3xl leading-snug">
                  Activez notre module de paiement in-app avec suggestion de pourboire. Regardez les 10%, 15%, 20% pleuvoir sur votre staff à chaque fin de repas.<br />
                  La psychologie UI bat toujours la radinerie.
                </p>
              </motion.div>
            </div>
          </section>

          {/* ── Comparison Table ──────────────────────────────────────────── */}
          <section className="py-32 px-6 bg-[#0a0a0a]">
            <div className="max-w-5xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="text-center mb-16"
              >
                <h2 className="text-4xl md:text-5xl font-black mb-4">Pourquoi nous ? Et pas les dinosaures ?</h2>
                <p className="text-white/40 text-lg">Comparez les fonctionnalites point par point. La difference est ecrasante.</p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0f0f0f]"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="text-white/40 text-sm bg-white/[0.02]">
                      <th className="p-5 border-b border-white/10 font-bold w-1/2">Fonctionnalite</th>
                      <th className="p-5 border-b border-white/10 text-center font-black text-orange-400">Ma Table</th>
                      <th className="p-5 border-b border-white/10 text-center font-bold text-white/80">Concurrents SaaS</th>
                      <th className="p-5 border-b border-white/10 text-center font-bold text-white/50">Cahier / Papier</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {comparisons.map((c, i) => (
                      <motion.tr
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        whileInView={{ opacity: 1, x: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: i * 0.025, duration: 0.3 }}
                        className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="p-5 font-medium text-white/80">{c.feature}</td>
                        <td className={`p-5 text-center font-black ${c.us === "✓" ? "text-orange-400" : c.us === "Bientôt" ? "text-amber-400 text-xs" : "text-orange-300"}`}>
                          {c.us}
                        </td>
                        <td className={`p-5 text-center text-sm font-semibold ${c.starter === "✓" ? "text-white/60" : c.starter === "Partiel" || c.starter === "Basique" ? "text-yellow-500/60 text-xs" : "text-white/20"}`}>
                          {c.starter}
                        </td>
                        <td className="p-5 text-center text-white/20 font-semibold">{c.dino}</td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            </div>
          </section>

          <SectionCTA
            headline="Vous avez vu la puissance. Voyez le prix."
            ctaLabel="Construire mon offre"
            ctaHref="/tarifs"
            secondaryLabel="Essai gratuit →"
            secondaryHref="/register"
          />

        </div>
      </PageTransition>
    </div>
  );
}
