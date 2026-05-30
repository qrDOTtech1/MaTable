"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * Section parrainage de la landing — promet 12 mois offerts par an si on
 * parraine 12 confrères. Ton Clarkson : hyperbole assumée, math directe.
 */
export default function LandingReferral() {
  return (
    <section className="bg-[#0a0a0a] border-y border-white/[0.06] px-6 py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_85%_15%,rgba(168,85,247,0.14),transparent_45%),radial-gradient(circle_at_15%_85%,rgba(249,115,22,0.10),transparent_45%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto grid gap-12 md:grid-cols-[1.1fr_0.9fr] md:items-center">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true }}
          className="space-y-5"
        >
          <span className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-4 py-2 text-xs font-black uppercase tracking-widest text-purple-300">
            🎁 Programme parrainage
          </span>
          <h2 className="text-4xl md:text-6xl font-black leading-[1.05] tracking-tight">
            Vous connaissez d'autres restaurateurs ?
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-purple-300 via-orange-300 to-amber-300">
              Faites-les payer.
            </span>
          </h2>
          <p className="text-lg text-white/55 leading-relaxed">
            Chaque mois, un <strong className="text-white">nouveau code parrainage</strong> apparaît dans votre dashboard.
            Un confrère s'inscrit avec, paie sa première facture, et on vous offre
            <strong className="text-emerald-400"> 30 jours d'abonnement</strong>. C'est presque embarrassant.
          </p>
          <p className="text-lg text-white/55 leading-relaxed">
            Faites le calcul : <strong className="text-white">12 codes par an, 12 confrères convertis</strong> =
            <strong className="text-orange-300"> une année entière offerte</strong>. On a accepté volontairement
            de faire cette promo. Personne ne nous y a forcés. Vraiment.
          </p>
          <div className="flex flex-wrap gap-3 pt-2">
            <Link
              href="/register"
              className="inline-block px-7 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-orange-500/25"
            >
              Démarrer pour avoir mon 1er code →
            </Link>
            <Link
              href="/tarifs"
              className="inline-block px-7 py-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-black text-lg transition-all"
            >
              Voir les forfaits
            </Link>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="rounded-[2rem] border border-purple-500/20 bg-gradient-to-br from-purple-500/[0.08] to-orange-500/[0.04] p-6 shadow-2xl shadow-purple-500/10"
        >
          <p className="text-xs uppercase tracking-widest text-purple-300 font-black mb-4">Les règles, sans foutaise</p>
          <ul className="space-y-3">
            {[
              ["📅", "1 code par mois", "Un nouveau code apparaît chaque mois dans votre dashboard. Pas utilisé = perdu. Désolé, c'est volontaire."],
              ["🎯", "1 filleul par code", "Un seul nouveau restaurateur peut utiliser un code donné. Pas de chaîne pyramidale."],
              ["💰", "Récompense à la 1ère facture", "On vous offre 30 jours uniquement quand votre filleul paie pour de vrai. Pas avant. Sinon on ferait faillite."],
              ["🛡️", "Anti-abus assumé", "On ne se fait pas avoir par un cousin qui s'inscrit puis disparaît. C'est marqué dans les CGV. Lisez-les, c'est court."],
            ].map(([icon, title, desc]) => (
              <li key={title} className="flex items-start gap-3 rounded-xl border border-white/8 bg-white/[0.03] p-3">
                <span className="text-xl shrink-0 leading-none mt-0.5">{icon}</span>
                <div className="min-w-0">
                  <p className="font-black text-white text-sm">{title}</p>
                  <p className="text-[12px] text-white/50 leading-snug">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-xs text-white/35 mt-4 leading-relaxed">
            Plafond théorique : 12 mois offerts par an. Ce qui rend le programme honnêtement risqué pour nous.
            Le risque, on l'a accepté. À vous de jouer.
          </p>
        </motion.div>
      </div>
    </section>
  );
}
