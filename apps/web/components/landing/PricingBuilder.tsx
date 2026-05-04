"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { MODULES, DURATIONS, type DurationKey } from "./landingData";

/*
  Grille réelle (interne) — prix de référence = 12 mois
  3 mois  +7%  |  6 mois  +5%  |  9 mois  +3%  |  12 mois  0%  |  12 mois annuel  -5%

  Perception visiteur — prix affiché de base = 3 mois (le plus cher)
  On présente les durées longues comme des "réductions" par rapport au 3 mois.
  Fake discount visible :  3m = 0%  |  6m = -2%  |  9m = -4%  |  12m = -7%  |  12m annuel = -12%
*/

export default function PricingBuilder() {
  const [selected, setSelected] = useState<string[]>(["avis"]);
  const [duration, setDuration] = useState<DurationKey>("3m");

  const toggleModule = (id: string) => {
    if (id === "avis") return;
    setSelected(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const dur = DURATIONS.find(d => d.key === duration)!;
  const isAnnualPay = duration === "12a";

  const selectedCount = selected.length;
  let volumePercent = 0;
  if (selectedCount === 2) volumePercent = 10;
  if (selectedCount === 3) volumePercent = 15;
  if (selectedCount >= 4) volumePercent = 20;

  const baseTotal = selected.reduce((sum, id) => {
    const mod = MODULES.find(m => m.id === id);
    return sum + (mod ? +(mod.price * 1.07).toFixed(2) : 0);
  }, 0);

  const realTotal = selected.reduce((sum, id) => {
    const mod = MODULES.find(m => m.id === id);
    return sum + (mod ? +(mod.price * dur.realMult).toFixed(2) : 0);
  }, 0);

  const volumeAmount = realTotal * (volumePercent / 100);
  const afterVolume = realTotal - volumeAmount;

  const baseAfterVolume = baseTotal - baseTotal * (volumePercent / 100);
  const fakeSaving = baseAfterVolume - afterVolume;

  const finalMonthly = afterVolume;
  const finalDisplay = isAnnualPay ? +(finalMonthly * 12).toFixed(2) : finalMonthly;

  const fmt = (n: number) => Number.isInteger(n) ? String(n) : n.toFixed(2);
  const modulePrice = (basePrice: number) => +(basePrice * dur.realMult).toFixed(2);
  const moduleBasePrice = (basePrice: number) => +(basePrice * 1.07).toFixed(2);

  return (
    <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
      {/* Module list */}
      <div className="space-y-3">
        {MODULES.map((mod, i) => {
          const isSelected = selected.includes(mod.id);
          const display = modulePrice(mod.price);
          const base = moduleBasePrice(mod.price);
          const showStrike = dur.fakeDiscount > 0;
          return (
            <motion.div
              key={mod.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05, duration: 0.4 }}
              onClick={() => toggleModule(mod.id)}
              className={`flex items-center justify-between p-5 rounded-2xl border transition-all cursor-pointer ${
                isSelected
                  ? "bg-orange-500/10 border-orange-500/30 shadow-lg shadow-orange-500/5"
                  : "bg-white/5 border-white/10 hover:border-white/20 hover:bg-white/10"
              }`}
            >
              <div className="flex items-center gap-4">
                <div className={`w-6 h-6 rounded flex items-center justify-center border-2 transition-colors ${
                  isSelected ? "bg-orange-500 border-orange-500" : "border-white/20 bg-transparent"
                }`}>
                  {isSelected && <span className="text-black text-sm font-bold">✓</span>}
                </div>
                <div>
                  <h3 className="font-bold text-lg text-white flex items-center gap-2 flex-wrap">
                    {mod.name}
                    {mod.required && (
                      <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-white/50">
                        Base obligatoire
                      </span>
                    )}
                  </h3>
                  <p className="text-sm text-white/50">{mod.desc}</p>
                </div>
              </div>
              <div className="text-right shrink-0 ml-4">
                {showStrike && (
                  <div className="text-xs text-white/30 line-through mb-0.5">{fmt(base)} €</div>
                )}
                <div className="font-bold text-xl text-white">{fmt(display)} €</div>
                <div className="text-xs text-white/40">/ mois</div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Sticky summary */}
      <div className="relative">
        <div className="sticky top-24 rounded-3xl bg-[#111] border border-white/10 p-8 shadow-2xl">
          {/* Duration selector */}
          <div className="mb-6 pb-5 border-b border-white/10">
            <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-3 text-center">Engagement</p>
            <div className="flex flex-wrap justify-center gap-2">
              {DURATIONS.map(d => {
                const active = duration === d.key;
                return (
                  <button
                    key={d.key}
                    onClick={() => setDuration(d.key)}
                    className={`relative px-4 py-2.5 rounded-xl text-sm font-bold transition-all ${
                      active
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-white/5 text-white/50 hover:text-white hover:bg-white/10"
                    }`}
                  >
                    <span>{d.label}</span>
                    {d.key === "12a" && (
                      <span className="block text-[10px] font-medium opacity-70">paiement unique</span>
                    )}
                    {d.fakeDiscount > 0 && (
                      <span className={`absolute -top-2 -right-2 text-[10px] px-1.5 py-0.5 rounded font-black ${
                        active ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-400"
                      }`}>
                        -{d.fakeDiscount}%
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <p className="text-center text-[11px] text-white/30 mt-3">{dur.sub}</p>
          </div>

          <h3 className="text-xl font-bold mb-6">Votre Abonnement</h3>

          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-white/70">
              <span>Applications ({selectedCount})</span>
              <span>{fmt(baseTotal)} €/mois</span>
            </div>
            {volumePercent > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Remise volume (-{volumePercent}%)</span>
                <span>-{fmt(baseTotal * (volumePercent / 100))} €</span>
              </div>
            )}
            {dur.fakeDiscount > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Remise engagement (-{dur.fakeDiscount}%)</span>
                <span>-{fmt(fakeSaving)} €</span>
              </div>
            )}
          </div>

          <div className="border-t border-white/10 pt-6 mb-8">
            <div className="flex items-end justify-between">
              <span className="text-white/60">Total HT</span>
              <div className="text-right">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={`${finalDisplay}-${duration}`}
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 10 }}
                    transition={{ duration: 0.2 }}
                    className="text-5xl font-black text-white"
                  >
                    {fmt(finalDisplay)} €
                  </motion.div>
                </AnimatePresence>
                <div className="text-sm text-white/40 mt-1">
                  {isAnnualPay
                    ? `soit ${fmt(finalMonthly)} €/mois · facture annuelle`
                    : `/ mois · engagement ${dur.label}`}
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/register"
            className="block w-full py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-lg text-center transition-all shadow-xl shadow-orange-500/20 hover:-translate-y-1"
          >
            Creer mon compte
          </Link>
          <p className="text-center text-xs text-white/40 mt-4">14 jours d'essai offerts · Sans carte bancaire.</p>
        </div>
      </div>
    </div>
  );
}
