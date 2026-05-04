import Link from "next/link";
import { motion } from "framer-motion";

interface SectionCTAProps {
  headline?: string;
  subtext?: string;
  ctaLabel?: string;
  ctaHref?: string;
  secondaryLabel?: string;
  secondaryHref?: string;
}

export default function SectionCTA({
  headline = "Prêt à démarrer ?",
  subtext = "14 jours d'essai. Sans carte bancaire.",
  ctaLabel = "Créer mon restaurant gratuitement",
  ctaHref = "/register",
  secondaryLabel,
  secondaryHref,
}: SectionCTAProps) {
  return (
    <section className="py-24 px-6 relative overflow-hidden text-center">
      <div className="absolute inset-0 bg-gradient-to-t from-orange-900/15 to-transparent pointer-events-none" />
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6 }}
        className="relative z-10 max-w-3xl mx-auto"
      >
        <h2 className="text-4xl md:text-6xl font-black mb-6 leading-tight">
          {headline}
        </h2>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href={ctaHref}
            className="px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-black text-lg transition-all shadow-xl shadow-orange-500/25 hover:scale-105 hover:-translate-y-1"
          >
            {ctaLabel}
          </Link>
          {secondaryLabel && secondaryHref && (
            <Link
              href={secondaryHref}
              className="px-10 py-4 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-xl font-bold transition-all"
            >
              {secondaryLabel}
            </Link>
          )}
        </div>
        <p className="mt-5 text-white/40 text-sm">{subtext}</p>
      </motion.div>
    </section>
  );
}
