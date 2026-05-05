"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import LandingNav from "@/components/landing/LandingNav";
import LandingFAQ from "@/components/landing/LandingFAQ";
import PageTransition from "@/components/landing/PageTransition";
import PricingBuilder from "@/components/landing/PricingBuilder";
import LandingTestimonials from "../LandingTestimonials";
import LandingContactForm from "../LandingContactForm";

function ScrollProgressBar() {
  const { scrollYProgress } = useScroll();
  const scaleX = useTransform(scrollYProgress, [0, 1], [0, 1]);
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "left" }}
      className="fixed top-16 left-0 right-0 h-[3px] bg-orange-500 z-40 origin-left"
    />
  );
}

function StickyPricingHint({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          className="fixed top-[67px] left-0 right-0 z-30 bg-[#0f0f0f]/90 backdrop-blur-xl border-b border-white/10 px-6 py-2 flex items-center justify-between"
        >
          <span className="text-sm text-white/60">Configurez votre offre ↓</span>
          <Link
            href="/register"
            className="text-sm px-4 py-1.5 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-bold transition-colors"
          >
            Essai gratuit →
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function TarifsPage() {
  const builderRef = useRef<HTMLDivElement>(null);
  const [showHint, setShowHint] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setShowHint(!entry.isIntersecting),
      { threshold: 0.1 }
    );
    if (builderRef.current) observer.observe(builderRef.current);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      <LandingNav />
      <ScrollProgressBar />
      <StickyPricingHint show={showHint} />

      <PageTransition>
        <div className="pt-16">

          {/* ── Page Hero ─────────────────────────────────────────────────── */}
          <section className="py-28 px-6 text-center relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-b from-emerald-900/10 to-transparent pointer-events-none" />
            <div className="relative z-10 max-w-4xl mx-auto">
              <motion.span
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="inline-block py-1 px-3 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-bold tracking-widest uppercase mb-6"
              >
                Tarifs
              </motion.span>
              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15, duration: 0.7 }}
                className="text-5xl md:text-7xl font-black mb-6 leading-[1.05]"
              >
                Créez votre solution.<br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">
                  Payez ce que vous utilisez.
                </span>
              </motion.h1>
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-xl text-white/50 max-w-2xl mx-auto"
              >
                Ne payez que pour ce que vous activez. Plus vous vous engagez, plus le tarif baisse.
              </motion.p>
            </div>
          </section>

          {/* ── Pricing Builder ───────────────────────────────────────────── */}
          <section ref={builderRef} className="py-10 px-6 bg-[#0f0f0f]">
            <div className="max-w-5xl mx-auto">
              <PricingBuilder />
            </div>
          </section>

          {/* ── Testimonials ──────────────────────────────────────────────── */}
          <LandingTestimonials />

          {/* ── Contact Form ──────────────────────────────────────────────── */}
          <LandingContactForm />

          <LandingFAQ />

          {/* ── Final CTA ─────────────────────────────────────────────────── */}
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
              <Link
                href="/register"
                className="inline-block px-12 py-5 bg-orange-500 hover:bg-orange-400 text-white rounded-2xl font-black text-xl transition-all shadow-2xl shadow-orange-500/30 hover:scale-105 hover:-translate-y-1"
              >
                Creer mon restaurant gratuitement
              </Link>
              <p className="mt-6 text-white/40 text-sm">14 jours d'essai. Sans carte bancaire.</p>
            </motion.div>
          </section>

        </div>
      </PageTransition>
    </div>
  );
}
