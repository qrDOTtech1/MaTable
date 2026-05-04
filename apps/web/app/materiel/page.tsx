"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import LandingNav from "@/components/landing/LandingNav";
import PageTransition from "@/components/landing/PageTransition";
import SectionCTA from "@/components/landing/SectionCTA";
import LandingContactForm from "../LandingContactForm";
import { hardware } from "@/components/landing/landingData";

export default function MaterielPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <LandingNav />

      <PageTransition>
        <div className="pt-16">

          {/* ── Page Hero ─────────────────────────────────────────────────── */}
          <section className="py-28 px-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-blue-900/10 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-4xl mx-auto">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-block py-1 px-3 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 text-xs font-bold tracking-widest uppercase mb-6"
              >
                Matériel
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
                className="text-5xl md:text-7xl font-black mb-6 leading-[1.05]"
              >
                Le Matériel.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-cyan-400">
                  Robuste.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-white/50 max-w-2xl mx-auto"
              >
                Démarrez gratuitement avec vos propres appareils, ou passez à la vitesse supérieure.
              </motion.p>
            </div>
          </section>

          {/* ── Hardware Grid ─────────────────────────────────────────────── */}
          <section className="py-10 px-6">
            <div className="max-w-6xl mx-auto">
              <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
                {hardware.map((h, i) => {
                  const isFree = h.tag === "Gratuit";
                  const isDevis = h.tag === "Sur devis";
                  return (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, scale: 0.9 }}
                      whileInView={{ opacity: 1, scale: 1 }}
                      viewport={{ once: true }}
                      transition={{ delay: i * 0.08 }}
                      whileHover={{ y: -8, boxShadow: "0 20px 40px rgba(249,115,22,0.12)" }}
                      className={`relative bg-white/5 border rounded-2xl p-6 text-center transition-all ${
                        isFree
                          ? "border-emerald-500/30 bg-emerald-500/5"
                          : "border-white/10"
                      }`}
                    >
                      <div className="text-4xl mb-4">{h.icon}</div>
                      <h3 className="font-bold text-white mb-2">{h.name}</h3>
                      <p className="text-xs text-white/50 mb-4 h-10">{h.desc}</p>
                      <motion.div
                        animate={isDevis ? { opacity: [0.6, 1, 0.6] } : {}}
                        transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${
                          isFree
                            ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/30"
                            : "bg-white/10 text-white/70"
                        }`}
                      >
                        {h.tag}
                      </motion.div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </section>

          {/* ── Free PDF highlight ────────────────────────────────────────── */}
          <section className="py-16 px-6">
            <div className="max-w-3xl mx-auto">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="rounded-3xl border border-emerald-500/30 bg-emerald-500/5 p-10 text-center"
              >
                <div className="text-5xl mb-4">📄</div>
                <h2 className="text-2xl font-black mb-3 text-emerald-400">Commencez pour 0€.</h2>
                <p className="text-white/60 mb-6">
                  Téléchargez votre QR code en PDF A4 et imprimez-le vous-même. Aucun matériel requis pour démarrer.
                </p>
                <Link
                  href="/register"
                  className="inline-block px-8 py-3 bg-emerald-500 hover:bg-emerald-400 text-white rounded-xl font-bold transition-all hover:-translate-y-1"
                >
                  Créer mon QR code gratuit →
                </Link>
              </motion.div>
            </div>
          </section>

          {/* ── Devis Contact ─────────────────────────────────────────────── */}
          <section className="py-10 px-6">
            <div className="max-w-3xl mx-auto text-center mb-10">
              <motion.h2
                initial={{ opacity: 0 }}
                whileInView={{ opacity: 1 }}
                viewport={{ once: true }}
                className="text-3xl font-black mb-4"
              >
                Une question sur le matériel ?
              </motion.h2>
              <p className="text-white/50">Notre équipe vous répond sous 24h avec un devis sur mesure.</p>
            </div>
            <LandingContactForm />
          </section>

          <SectionCTA
            headline="Prêt à équiper votre restaurant ?"
            subtext="Matériel ou sans matériel — MaTable s'adapte."
            ctaLabel="Démarrer l'essai gratuit →"
            ctaHref="/register"
            secondaryLabel="Voir les tarifs"
            secondaryHref="/tarifs"
          />

        </div>
      </PageTransition>
    </div>
  );
}
