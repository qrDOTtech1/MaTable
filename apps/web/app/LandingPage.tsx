"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import LandingProductCarousel from "./LandingProductCarousel";
import LandingNav from "@/components/landing/LandingNav";
import { stats, languageLines, teaserCards } from "@/components/landing/landingData";

const teaserColors: Record<string, { border: string; glow: string; text: string }> = {
  orange: { border: "border-orange-500/30", glow: "hover:shadow-orange-500/10", text: "text-orange-400" },
  purple: { border: "border-purple-500/30", glow: "hover:shadow-purple-500/10", text: "text-purple-400" },
  blue:   { border: "border-blue-500/30",   glow: "hover:shadow-blue-500/10",   text: "text-blue-400"   },
  green:  { border: "border-emerald-500/30", glow: "hover:shadow-emerald-500/10", text: "text-emerald-400" },
};

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const yBg = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);
  const scaleHero = useTransform(scrollYProgress, [0, 0.2], [1, 0.95]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">

      {/* Background Parallax */}
      <motion.div
        className="fixed inset-0 z-0 pointer-events-none opacity-40"
        style={{ y: yBg }}
      >
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-orange-600/20 blur-[150px] rounded-full mix-blend-screen" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-purple-600/20 blur-[150px] rounded-full mix-blend-screen" />
      </motion.div>

      <LandingNav />

      <div className="relative z-10 pt-16">

        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <motion.section
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="relative min-h-[90vh] flex flex-col items-center justify-center px-6"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
              className="inline-flex items-center gap-4 px-5 py-2 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm font-bold mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              Plus d'infos ? Contactez-nous :
              <div className="flex items-center gap-3 font-mono">
                <a href="tel:+33757835777" className="hover:text-orange-300 transition-colors">+33 7 57 83 57 77</a>
                <span className="text-orange-500/50">•</span>
                <a href="mailto:contact@matable.pro" className="hover:text-orange-300 transition-colors">contact@matable.pro</a>
              </div>
            </motion.div>

            <motion.h1
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-6"
            >
              MaTable Pro,<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                le logiciel restaurant qui travaille vraiment.
              </span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}
              className="text-xl md:text-2xl text-white/50 max-w-4xl mx-auto mb-10 leading-relaxed font-medium"
            >
              MaTable Pro (matable / matablepro), c'est le logiciel restaurant tout-en-un : commande QR, portail serveur en temps réel, caisse, avis Google IA, stock, réservations et analytics dans une seule solution cohérente.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5, duration: 0.8 }}
              className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-20"
            >
              <Link href="/register" className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-lg transition-all hover:scale-105 shadow-xl shadow-orange-500/25">
                Demarrer l'essai gratuit →
              </Link>
              <a href="#demo" className="px-8 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold transition-all backdrop-blur-md">
                Voir la demo interactive
              </a>
            </motion.div>
          </div>
        </motion.section>

        {/* ── Stats ───────────────────────────────────────────────────────────── */}
        <section className="border-y border-white/[0.06] bg-[#0a0a0a]/50 backdrop-blur-sm relative z-10">
          <div className="max-w-6xl mx-auto px-6 py-12 grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((s, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: i * 0.1, duration: 0.5 }}
                className="text-center"
              >
                <div className="text-4xl md:text-5xl font-black text-orange-400 mb-2">{s.value}</div>
                <div className="text-sm font-medium text-white/50">{s.label}</div>
              </motion.div>
            ))}
          </div>
        </section>

        <div id="demo">
          <LandingProductCarousel />
        </div>

        {/* ── Language Campaign ─────────────────────────────────────────────── */}
        <section className="border-b border-white/5 bg-black px-6 py-24">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="space-y-4 text-left">
              {languageLines.map(([code, text], i) => (
                <motion.div
                  key={code}
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.4 }}
                  className={`flex items-baseline gap-4 font-black uppercase tracking-tight ${i === languageLines.length - 1 ? "text-white" : "text-white/40"}`}
                >
                  <span className="w-12 text-right text-2xl md:text-3xl">{code}</span>
                  <span className="text-3xl md:text-5xl">{text}</span>
                </motion.div>
              ))}
            </div>
            <div className="text-center md:text-left">
              <h2 className="mb-6 text-6xl font-black uppercase leading-none tracking-[-0.07em] text-orange-500 md:text-8xl">Et toi ?</h2>
              <p className="text-3xl font-black leading-tight text-white md:text-4xl">
                Votre menu cartonne est muet face a un touriste. Ma Table, lui, parle la langue du telephone qui scanne.
              </p>
              <p className="mt-8 text-2xl font-black leading-tight text-white md:text-3xl">
                L'argent n'a pas de barriere de langue. Votre menu ne devrait pas en avoir non plus.
              </p>
              <Link href="/register" className="mt-10 inline-block -skew-x-6 bg-orange-500 px-10 py-5 text-2xl font-black uppercase tracking-wide text-black transition hover:bg-orange-400">
                Captez 100% des touristes.
              </Link>
            </div>
          </div>
        </section>

        {/* ── Teaser Cards (liens vers sous-pages) ─────────────────────────── */}
        <section className="py-20 px-6 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto">
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              className="text-center text-white/30 text-sm font-bold uppercase tracking-widest mb-10"
            >
              Explorez en détail
            </motion.p>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {teaserCards.map((card, i) => {
                const c = teaserColors[card.color] || teaserColors.orange;
                return (
                  <motion.div
                    key={card.href}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.08, duration: 0.4 }}
                    whileHover={{ scale: 1.02, y: -4 }}
                  >
                    <Link
                      href={card.href}
                      className={`block h-full rounded-2xl border ${c.border} bg-white/[0.02] hover:bg-white/[0.05] hover:shadow-xl ${c.glow} p-6 transition-all`}
                    >
                      <div className="text-3xl mb-3">{card.icon}</div>
                      <h3 className={`font-black text-lg mb-2 ${c.text}`}>{card.title}</h3>
                      <p className="text-sm text-white/50 mb-4 leading-relaxed">{card.desc}</p>
                      <span className={`text-sm font-bold ${c.text}`}>{card.cta}</span>
                    </Link>
                  </motion.div>
                );
              })}
            </div>
          </div>
        </section>

        {/* ── Défi / Prouvez-nous qu'on a tort ────────────────────────────────── */}
        <section className="border-y border-white/5 bg-black px-6 py-32 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-4xl mx-auto text-center"
          >
            <div className="inline-block px-4 py-1 border-2 border-white/20 text-white font-black tracking-widest text-sm mb-12 rotate-[-2deg]">
              LE DÉFI OFFICIEL
            </div>

            <h2 className="text-6xl md:text-8xl lg:text-9xl font-black mb-10 leading-[0.9] text-white">
              PROUVEZ-NOUS<br />QU'ON A TORT.
            </h2>

            <p className="text-2xl md:text-3xl font-bold text-white/80 max-w-3xl mx-auto leading-snug">
              Installez Ma Table. Si vous ne gagnez pas plus d'argent et ne gagnez pas de temps dans les 14 premiers jours, désinstallez-le. On s'inclinera.
            </p>
          </motion.div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────────────────────── */}
        <section className="py-32 px-6 relative overflow-hidden text-center">
          <div className="absolute inset-0 bg-gradient-to-t from-orange-900/20 to-transparent pointer-events-none" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="relative z-10 max-w-4xl mx-auto"
          >
            <h2 className="text-5xl md:text-7xl font-black mb-8 leading-tight">
              Prenez de l'avance.<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Restez-y.</span>
            </h2>
            <Link href="/register" className="inline-block px-12 py-5 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl font-black text-xl transition-all shadow-2xl shadow-orange-500/30 hover:scale-105 hover:-translate-y-1">
              Creer mon restaurant gratuitement
            </Link>
            <p className="mt-6 text-white/40 text-sm">14 jours d'essai. Sans carte bancaire.</p>
          </motion.div>
        </section>

      </div>
    </div>
  );
}
