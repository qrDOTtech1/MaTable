"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { faqCategories } from "./landingData";

export default function LandingFAQ() {
  const [activeCategory, setActiveCategory] = useState(faqCategories[0]?.id ?? "general");
  const [openItems, setOpenItems] = useState<Record<string, boolean>>({
    "general-0": true,
    "transition-0": true,
  });

  const category = useMemo(
    () => faqCategories.find((item) => item.id === activeCategory) ?? faqCategories[0],
    [activeCategory]
  );

  const toggleItem = (key: string) => {
    setOpenItems((current) => ({ ...current, [key]: !current[key] }));
  };

  if (!category) return null;

  return (
    <section id="faq" className="border-t border-white/5 bg-[#080808] px-6 py-28 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute left-[-10%] top-10 h-72 w-72 rounded-full bg-orange-500/10 blur-[120px]" />
        <div className="absolute right-[-10%] bottom-0 h-80 w-80 rounded-full bg-amber-500/10 blur-[140px]" />
      </div>

      <div className="relative z-10 mx-auto max-w-6xl">
        <div className="mx-auto mb-14 max-w-3xl text-center">
          <span className="inline-block rounded-full border border-orange-500/25 bg-orange-500/10 px-4 py-1 text-xs font-black uppercase tracking-[0.3em] text-orange-400">
            FAQ restaurateurs
          </span>
          <h2 className="mt-6 text-4xl font-black leading-tight text-white md:text-6xl">
            Les vraies questions avant de choisir ou de quitter une autre solution.
          </h2>
          <p className="mt-5 text-lg leading-relaxed text-white/55">
            Nous avons rassemble les objections, hesitations et questions que se posent le plus souvent les restaurateurs,
            y compris ceux qui ont deja un contrat en cours chez un concurrent.
          </p>
        </div>

        <div className="grid gap-8 lg:grid-cols-[280px_minmax(0,1fr)] lg:items-start">
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-3 backdrop-blur-sm">
            {faqCategories.map((item) => {
              const selected = item.id === category.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setActiveCategory(item.id)}
                  className={`mb-2 w-full rounded-2xl px-4 py-4 text-left transition last:mb-0 ${
                    selected
                      ? "bg-orange-500 text-white shadow-lg shadow-orange-500/15"
                      : "bg-transparent text-white/65 hover:bg-white/[0.04] hover:text-white"
                  }`}
                >
                  <div className="text-sm font-black uppercase tracking-[0.22em]">{item.label}</div>
                  <div className={`mt-2 text-sm leading-relaxed ${selected ? "text-white/80" : "text-white/40"}`}>
                    {item.items.length} reponses claires
                  </div>
                </button>
              );
            })}
          </div>

          <div className="rounded-[2rem] border border-white/10 bg-gradient-to-b from-white/[0.04] to-white/[0.02] p-6 md:p-8">
            <div className="mb-8 border-b border-white/8 pb-6">
              <p className="text-sm font-black uppercase tracking-[0.24em] text-orange-400">{category.label}</p>
              <h3 className="mt-3 text-3xl font-black text-white md:text-4xl">{category.title}</h3>
              <p className="mt-4 max-w-3xl text-base leading-relaxed text-white/55">{category.intro}</p>
            </div>

            <div className="space-y-4">
              {category.items.map((item, index) => {
                const key = `${category.id}-${index}`;
                const isOpen = !!openItems[key];

                return (
                  <div key={key} className="overflow-hidden rounded-2xl border border-white/10 bg-black/30">
                    <button
                      type="button"
                      onClick={() => toggleItem(key)}
                      className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left"
                    >
                      <span className="text-base font-bold leading-snug text-white md:text-lg">{item.question}</span>
                      <span
                        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg transition ${
                          isOpen
                            ? "border-orange-400/40 bg-orange-500/15 text-orange-300"
                            : "border-white/10 bg-white/5 text-white/60"
                        }`}
                        aria-hidden="true"
                      >
                        {isOpen ? "-" : "+"}
                      </span>
                    </button>

                    <AnimatePresence initial={false}>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                          className="overflow-hidden"
                        >
                          <div className="px-5 pb-5 pt-0 text-sm leading-7 text-white/68 md:text-[15px]">{item.answer}</div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            <div className="mt-8 rounded-2xl border border-orange-500/20 bg-orange-500/8 p-5 text-sm leading-7 text-white/75">
              Un cas particulier ? Un contrat concurrent en cours ? Appelez-nous au <a className="font-bold text-orange-300 hover:text-orange-200" href="tel:+33757835777">+33 7 57 83 57 77</a> ou ecrivez a <a className="font-bold text-orange-300 hover:text-orange-200" href="mailto:contact@matable.pro">contact@matable.pro</a>.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
