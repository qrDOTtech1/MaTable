"use client";

import { motion } from "framer-motion";
import Link from "next/link";

/**
 * "L'inventaire complet" — vue exhaustive de tout ce que fait MaTable.Pro,
 * pour que le prospect comprenne en 30 secondes l'ampleur de la chose.
 * Ton Jeremy Clarkson assumé : hyperbole, sarcasme, comparaisons douteuses.
 */
const modules: Array<{ icon: string; title: string; line: string; cat: "service" | "salle" | "ia" | "pilotage" }> = [
  // ── SERVICE ─────────────────────────────────────────────────────────────
  { icon: "🍽️", cat: "service", title: "Commande par QR", line: "Le client scanne, choisit, commande. Sans appli. Sans compte. Sans drama." },
  { icon: "💳", cat: "service", title: "Paiement & Caisse", line: "Carte, espèces, fractionné, comptoir pour une cannette. Sans Z, sans paperasse." },
  { icon: "👨‍🍳", cat: "service", title: "Écran cuisine « bump »", line: "Les tickets s'affichent en grand. Le cuisto bumpe d'un doigt. Les tickets papier ? Dehors." },
  { icon: "⏱️", cat: "service", title: "Temps client ajustable", line: "Le cuisto rajoute 5 min au countdown du client en un clic. Honnêteté contractuelle." },
  { icon: "🧾", cat: "service", title: "Addition fluide", line: "Le client demande, le serveur confirme, la caisse encaisse. Trois clics, fini." },
  { icon: "📲", cat: "service", title: "Ticket par email", line: "Le client repart avec son reçu. Sans avoir à le réclamer. Sans papier qui jaunit." },

  // ── SALLE ───────────────────────────────────────────────────────────────
  { icon: "🪑", cat: "salle", title: "Plan de salle interactif", line: "Glissez-déposez les tables. Comme un jeu vidéo. Mais qui rapporte." },
  { icon: "👤", cat: "salle", title: "Portail serveur", line: "Chaque serveur a son dashboard, ses tables, ses appels. Plus de « c'est qui ? »." },
  { icon: "🔔", cat: "salle", title: "Appel serveur instantané", line: "Un bouton sur la table, une alerte dans la poche. Précision chirurgicale." },
  { icon: "📅", cat: "salle", title: "Réservations en ligne", line: "Vos clients réservent à 23h41 depuis leur canapé. Vous, vous dormez. Bien." },
  { icon: "🚫", cat: "salle", title: "Anti no-show", line: "Empreinte CB, rappels SMS, alertes. Le no-show devient un mauvais souvenir." },
  { icon: "💎", cat: "salle", title: "Fidélité incluse", line: "Les clients reviennent. Pas par hasard. Par stratégie. Sans module en supplément." },

  // ── IA ──────────────────────────────────────────────────────────────────
  { icon: "⭐", cat: "ia", title: "Avis Google + IA", line: "Seuls les vrais clients notent. L'IA aide à rédiger. Votre réputation décolle toute seule." },
  { icon: "📦", cat: "ia", title: "Nova Stock IA", line: "L'IA fait l'inventaire et la liste de courses. Elle ne fume pas de pause." },
  { icon: "💹", cat: "ia", title: "Nova Finance IA", line: "Food cost, marges, KPIs. L'IA voit ce que votre intuition refuse de voir." },
  { icon: "🧮", cat: "ia", title: "Nova Contab IA", line: "URSSAF, TVA, exports. Votre expert-comptable va vous embrasser. Ou pleurer." },
  { icon: "🤖", cat: "ia", title: "Chatbot client IA", line: "Répond aux clients pendant que vous épluchez l'oignon. À 3h du matin si besoin." },
  { icon: "📷", cat: "ia", title: "Magic Scan", line: "Photographiez un plat — l'IA en sort ingrédients, allergènes et description gastronomique." },
  { icon: "🍷", cat: "ia", title: "Nova Sommelier", line: "Accords mets/vins suggérés. Pas besoin d'un sommelier qui gagne plus que vous." },
  { icon: "🗓️", cat: "ia", title: "Planning IA", line: "Vos plats du jour générés en un clic, selon les stocks. Le hasard, ce n'est plus votre problème." },

  // ── PILOTAGE ────────────────────────────────────────────────────────────
  { icon: "📊", cat: "pilotage", title: "Stats actionnables", line: "CA, plats stars, heatmap d'affluence, plats que personne ne commande (spoiler : il y en a)." },
  { icon: "🌐", cat: "pilotage", title: "Page vitrine SEO", line: "Une page publique propre avec votre carte et vos avis. Google adore. Vos clients aussi." },
  { icon: "🌍", cat: "pilotage", title: "Multilingue auto", line: "Le menu parle 7 langues. L'argent, lui, n'en parle qu'une." },
  { icon: "🎁", cat: "pilotage", title: "Parrainage", line: "Un confrère s'inscrit, vous gagnez 1 mois. De la copinerie facturable." },
];

const CAT_LABEL: Record<string, string> = {
  service: "Service en salle",
  salle: "Pilotage de la salle",
  ia: "Brigade IA",
  pilotage: "Visibilité & croissance",
};
const CAT_COLOR: Record<string, string> = {
  service: "border-orange-500/25 bg-orange-500/[0.04]",
  salle: "border-sky-500/25 bg-sky-500/[0.04]",
  ia: "border-purple-500/25 bg-purple-500/[0.04]",
  pilotage: "border-emerald-500/25 bg-emerald-500/[0.04]",
};
const CAT_TEXT: Record<string, string> = {
  service: "text-orange-300",
  salle: "text-sky-300",
  ia: "text-purple-300",
  pilotage: "text-emerald-300",
};

export default function LandingFullStack() {
  const cats: Array<keyof typeof CAT_LABEL> = ["service", "salle", "ia", "pilotage"];

  return (
    <section className="bg-[#070707] border-y border-white/[0.06] px-6 py-24 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_20%,rgba(249,115,22,0.10),transparent_40%),radial-gradient(circle_at_85%_80%,rgba(168,85,247,0.10),transparent_40%)] pointer-events-none" />

      <div className="relative max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-14"
        >
          <p className="text-xs uppercase tracking-[0.35em] text-orange-400 font-black mb-3">L'inventaire complet</p>
          <h2 className="text-4xl md:text-6xl font-black tracking-tight mb-5 leading-[1.05]">
            Tout ce que MaTable fait
            <span className="block text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              pendant que vous coupez l'oignon.
            </span>
          </h2>
          <p className="text-lg md:text-xl text-white/55 max-w-3xl mx-auto leading-relaxed">
            Asseyez-vous. C'est long. C'est volontaire. La plupart des logiciels concurrents tiennent dans deux phrases —
            généralement les mêmes deux phrases. <span className="text-white">Pas nous.</span>
          </p>
        </motion.div>

        {cats.map((cat, ci) => {
          const items = modules.filter((m) => m.cat === cat);
          return (
            <motion.div
              key={cat}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ delay: ci * 0.05 }}
              className="mb-10"
            >
              <p className={`text-[11px] uppercase tracking-[0.3em] font-black mb-4 ${CAT_TEXT[cat]}`}>
                {CAT_LABEL[cat]} — {items.length} modules
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {items.map((m) => (
                  <div
                    key={m.title}
                    className={`rounded-2xl border ${CAT_COLOR[cat]} p-5 hover:bg-white/[0.06] transition-colors`}
                  >
                    <div className="flex items-start gap-3">
                      <span className="text-2xl leading-none shrink-0 mt-0.5">{m.icon}</span>
                      <div className="min-w-0">
                        <p className="text-sm font-black text-white mb-1">{m.title}</p>
                        <p className="text-[13px] text-white/55 leading-snug">{m.line}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          );
        })}

        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center mt-12"
        >
          <p className="text-white/40 text-sm mb-5">
            Et oui, c'est tout inclus. Pas en option. Pas en supplément. Pas dans 6 mois.
          </p>
          <Link
            href="/register"
            className="inline-block px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-black text-lg transition-all hover:scale-105 shadow-xl shadow-orange-500/25"
          >
            Tester gratuitement →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
