"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { PLANS, ANNUAL_DISCOUNT_PERCENT } from "./landingData";
import PricingRequestModal from "./PricingRequestModal";

export default function PricingBuilder() {
  const [billing, setBilling] = useState<"monthly" | "annual">("monthly");
  const [selectedPlanId, setSelectedPlanId] = useState<string>("pro");
  const [modalOpen, setModalOpen] = useState(false);

  const selectedPlan = PLANS.find((p) => p.id === selectedPlanId) ?? PLANS[1];
  const monthlyPrice = billing === "annual"
    ? Math.round(selectedPlan.priceMonthly * (1 - ANNUAL_DISCOUNT_PERCENT / 100))
    : selectedPlan.priceMonthly;
  const annualTotal = monthlyPrice * 12;

  const colorMap: Record<string, { ring: string; badge: string; btn: string; tag: string }> = {
    emerald: { ring: "border-emerald-500/50 shadow-emerald-500/10", badge: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20", btn: "bg-emerald-500 hover:bg-emerald-400 shadow-emerald-500/20", tag: "text-emerald-400" },
    orange:  { ring: "border-orange-500/60 shadow-orange-500/10",   badge: "bg-orange-500/10 text-orange-400 border-orange-500/20",   btn: "bg-orange-500 hover:bg-orange-400 shadow-orange-500/20",   tag: "text-orange-400"  },
    purple:  { ring: "border-purple-500/50 shadow-purple-500/10",   badge: "bg-purple-500/10 text-purple-400 border-purple-500/20",   btn: "bg-purple-500 hover:bg-purple-400 shadow-purple-500/20",   tag: "text-purple-400"  },
  };

  return (
    <div className="space-y-10">

      {/* Billing toggle */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-0 bg-white/5 border border-white/10 rounded-xl p-1">
          <button
            onClick={() => setBilling("monthly")}
            className={`px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              billing === "monthly"
                ? "bg-white text-black shadow"
                : "text-white/50 hover:text-white"
            }`}
          >
            Mensuel
          </button>
          <button
            onClick={() => setBilling("annual")}
            className={`relative px-5 py-2.5 rounded-lg text-sm font-bold transition-all ${
              billing === "annual"
                ? "bg-white text-black shadow"
                : "text-white/50 hover:text-white"
            }`}
          >
            Annuel
            <span className="absolute -top-2.5 -right-2 text-[10px] px-1.5 py-0.5 rounded font-black bg-emerald-500 text-white">
              −{ANNUAL_DISCOUNT_PERCENT}%
            </span>
          </button>
        </div>
        {billing === "annual" && (
          <motion.p
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            className="ml-4 text-xs text-emerald-400 self-center font-semibold"
          >
            2 mois offerts par rapport au mensuel
          </motion.p>
        )}
      </div>

      {/* Plan cards */}
      <div className="grid md:grid-cols-3 gap-6">
        {PLANS.map((plan, i) => {
          const price = billing === "annual"
            ? Math.round(plan.priceMonthly * (1 - ANNUAL_DISCOUNT_PERCENT / 100))
            : plan.priceMonthly;
          const isSelected = selectedPlanId === plan.id;
          const c = colorMap[plan.color];
          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              onClick={() => setSelectedPlanId(plan.id)}
              className={`relative rounded-3xl border p-7 cursor-pointer transition-all hover:scale-[1.02] shadow-xl ${
                isSelected
                  ? `${c.ring} bg-white/5 shadow-2xl scale-[1.02]`
                  : "border-white/10 bg-white/[0.03] hover:border-white/20"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                  <span className={`text-[11px] px-3 py-1 rounded-full font-black border ${c.badge}`}>
                    LE PLUS POPULAIRE
                  </span>
                </div>
              )}

              <div className="mb-5">
                <h3 className={`text-xl font-black mb-1 ${c.tag}`}>{plan.name}</h3>
                <p className="text-sm text-white/50">{plan.desc}</p>
              </div>

              <div className="mb-6">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${plan.id}-${billing}`}
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    transition={{ duration: 0.18 }}
                    className="flex items-end gap-1"
                  >
                    <span className="text-5xl font-black text-white">{price}</span>
                    <span className="text-white/40 mb-2 text-sm">€/mois HT</span>
                  </motion.div>
                </AnimatePresence>
                {billing === "annual" && (
                  <p className="text-xs text-white/30 mt-1">
                    soit {price * 12} €/an · {plan.priceMonthly} €/mois sans engagement
                  </p>
                )}
              </div>

              <ul className="space-y-2 mb-6">
                {plan.features.map((f, fi) => (
                  <li key={fi} className="flex items-start gap-2 text-sm text-white/70">
                    <span className={`mt-0.5 font-bold ${c.tag}`}>✓</span>
                    <span>{f}</span>
                  </li>
                ))}
              </ul>

              <div className={`w-full py-3 rounded-xl text-center text-sm font-bold transition-all ${
                isSelected
                  ? `${c.btn} text-white shadow-lg`
                  : "bg-white/5 text-white/60 border border-white/10"
              }`}>
                {isSelected ? "Sélectionné ✓" : "Choisir ce forfait"}
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Chaîne note */}
      <p className="text-center text-sm text-white/30">
        Multi-établissements / Chaîne ?{" "}
        <a href="mailto:contact@matable.pro" className="text-orange-400 hover:text-orange-300 underline font-semibold">
          Devis sur mesure →
        </a>
      </p>

      {/* CTA row — souscription directe en primary */}
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch justify-center gap-3">
          <Link
            href={`/souscrire?plan=${selectedPlan.id}&billing=${billing === "annual" ? "yearly" : "monthly"}`}
            className="flex-1 max-w-md mx-auto sm:mx-0 px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-black text-base text-center transition-all shadow-xl shadow-orange-500/30 hover:-translate-y-1"
          >
            💳 Souscrire & payer — Forfait {selectedPlan.name}
          </Link>
        </div>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => setModalOpen(true)}
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm transition-all"
          >
            📩 Recevoir mon contrat
          </button>
          <Link
            href="/register"
            className="px-5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl font-bold text-sm transition-all"
          >
            Essai gratuit 14 jours
          </Link>
        </div>
      </div>
      <p className="text-center text-xs text-white/40">
        <b className="text-white/60">Souscrire & payer</b> : compte activé immédiatement, contrat signé en ligne ·{" "}
        <b className="text-white/60">Essai gratuit</b> : sans carte bancaire ·{" "}
        <b className="text-white/60">Recevoir le contrat</b> : Steven vous rappelle sous 24 h.
      </p>

      <PricingRequestModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        selectedModules={[selectedPlan.id]}
        engagement={billing}
        monthlyHt={monthlyPrice}
        totalHt={billing === "annual" ? annualTotal : monthlyPrice}
        volumePercent={0}
      />
    </div>
  );
}
