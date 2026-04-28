"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { value: "15 s", label: "Temps moyen de commande" },
  { value: "−78%", label: "Erreurs de commande" },
  { value: "+34%", label: "Panier moyen" },
  { value: "×4", label: "Moins de no-shows" },
];

const features = [
  { icon: "📱", title: "Scan → Commande. C'est tout.", desc: "Pas d'app. Pas de compte. Le client scanne, choisit, commande. Simplicite desarmante.", highlight: true },
  { icon: "⚡", title: "Temps reel absolu", desc: "Chaque commande frappe l'ecran cuisine. Le client voit son statut evoluer en direct : en cours, pret, servi.", highlight: false },
  { icon: "⏱️", title: "Attente estimee & Retards", desc: "Compte a rebours en direct. Si ca depasse, message d'excuse envoye et cuisine alertee.", highlight: false },
  { icon: "💳", title: "Paiement fractionne", desc: "Chacun paie sa part. Carte, especes, caisse. La table se ferme automatiquement a la fin.", highlight: true },
  { icon: "🧾", title: "Flux d'addition complet", desc: "Client demande → serveur confirme → encaissement. Et ticket de caisse par email automatique.", highlight: false },
  { icon: "🍷", title: "Nova Sommelier", desc: "L'IA analyse le plat et propose les meilleurs accords mets & vins, et suggere des boissons manquantes.", highlight: true },
  { icon: "📦", title: "Nova Stock IA", desc: "Analyse des ventes, generation de listes de courses et creation d'articles manquants. Plus de ruptures.", highlight: true },
  { icon: "💹", title: "Nova Finance IA", desc: "Calcul du Food Cost reel, KPIs, marges et recommandations pour maximiser la rentabilite.", highlight: false },
  { icon: "🧮", title: "Nova Contab IA", desc: "Analyse fiscale, synthese URSSAF, TVA, impots, CA ht/ttc. La comptabilite demystifiee par l'IA.", highlight: true },
  { icon: "📷", title: "Magic Scan IA", desc: "Photographiez un plat. Nova extrait ingredients, allergenes et redige une description gastronomique.", highlight: false },
  { icon: "🗓️", title: "Planning IA Intelligent", desc: "Generez vos plats du jour pour la semaine en un clic en fonction de vos stocks restants.", highlight: false },
  { icon: "👤", title: "Portail Serveur", desc: "Dashboard individuel avec PIN. Appels de table en direct, fermetures de session, vue Kanban.", highlight: false },
  { icon: "🎯", title: "Up-Selling Intelligent", desc: "Suggestions d'ajouts lors de la commande (ex: 'Un supplement frites ?') pour gonfler le panier moyen.", highlight: true },
  { icon: "📅", title: "Reservations de fer", desc: "Creneaux dynamiques et arrhes Stripe. Les no-shows sont desormais un mauvais souvenir.", highlight: false },
  { icon: "🌿", title: "Allergenes EU (14)", desc: "14 allergenes affiches automatiquement. Vous etes en regle, vos clients en securite.", highlight: false },
  { icon: "⭐", title: "Avis verifies", desc: "Seuls ceux qui ont paye peuvent noter. Fini les faux avis Google, place a la verite.", highlight: false },
  { icon: "📊", title: "Analytics Recharts", desc: "CA, ticket moyen, top serveurs, top plats. Des graphiques clairs et interactifs.", highlight: false },
  { icon: "🔔", title: "Appel Serveur", desc: "Un bouton, une alerte sonore sur le dashboard du serveur. Precision chirurgicale.", highlight: false },
];

const plans = [
  {
    name: "Starter",
    price: "49,99 €",
    period: "/ mois HT",
    trial: "14 jours d'essai gratuit",
    color: "border-white/10 bg-white/[0.02]",
    ctaColor: "bg-orange-500 hover:bg-orange-400 text-white",
    badge: null,
    features: [
      "Jusqu'a 30 tables",
      "Menu illimite + attente par plat",
      "Commandes QR temps reel",
      "Paiement fractionne / Especes / Caisse",
      "Ticket de caisse email",
      "Reservations en ligne",
      "Listes de courses (manuel)",
      "Portail serveur (PIN)",
      "Support par email",
    ],
  },
  {
    name: "Pro",
    price: "139,99 €",
    period: "/ mois HT",
    trial: "Demo personnalisee",
    color: "border-orange-500 bg-gradient-to-b from-orange-500/10 to-transparent ring-1 ring-orange-500/30",
    ctaColor: "bg-orange-500 hover:bg-orange-400 text-white",
    badge: "L'excellence",
    features: [
      "Tables illimitees",
      "Multi-utilisateurs",
      "Analytics avancees (Recharts, stats)",
      "Pourboires digitaux",
      "Avis verifies",
      "Portail serveur complet avec alertes",
      "Fermeture session par serveur",
      "Materiel POS sur devis",
      "Support prioritaire 7j/7",
    ],
  },
  {
    name: "NovaTech IA",
    price: "299 €",
    period: "/ mois HT",
    trial: "La puissance absolue",
    color: "border-purple-500/60 bg-gradient-to-b from-purple-500/10 to-transparent ring-1 ring-purple-500/30",
    ctaColor: "bg-purple-500 hover:bg-purple-400 text-white",
    badge: "✨ Nova IA Inclus",
    features: [
      "Tout l'offre Pro",
      "Nova Contab IA (URSSAF / TVA)",
      "Nova Stock IA (courses auto)",
      "Nova Finance IA (food cost)",
      "Nova Sommelier (accords mets/vins)",
      "Nova Menu IA & Magic Scan Vision",
      "Up-Selling IA automatisé",
      "Planning hebdomadaire IA",
      "Defis serveurs IA quotidiens",
      "Support IA prioritaire",
    ],
  },
];

const hardware = [
  { name: "POS Client", desc: "Une tablette murale pour la commande.", icon: "🖥️", tag: "Sur devis" },
  { name: "POS Serveur", desc: "La prise de commande mobile synchronisee.", icon: "📱", tag: "Sur devis" },
  { name: "POS Caisse", desc: "Terminal connecte.", icon: "🖨️", tag: "Sur devis" },
  { name: "QR Vinyle", desc: "Indestructible. QR unique par table.", icon: "🎯", tag: "Des 3€/table" },
  { name: "Chevalet Acrylique", desc: "Le luxe sur table. QR serigraphie.", icon: "💎", tag: "Des 8€/table" },
  { name: "PDF A4 Gratuit", desc: "Imprimez-le vous-meme. Gratuit.", icon: "📄", tag: "Gratuit" },
];

// ─── Component ────────────────────────────────────────────────────────────────

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

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/70 backdrop-blur-xl"
      >
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-black text-white">Ma <span className="text-orange-500">Table</span></span>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#features" className="hover:text-white transition-colors">Fonctionnalites</a>
            <a href="#nova-ia" className="hover:text-white transition-colors">Nova IA</a>
            <a href="#hardware" className="hover:text-white transition-colors">Materiel</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors hidden sm:block">Se connecter</Link>
            <Link href="/register" className="text-sm px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-medium transition-colors shadow-lg shadow-orange-500/20">
              Essai gratuit
            </Link>
          </div>
        </div>
      </motion.nav>

      <div className="relative z-10 pt-16">
        
        {/* ── Hero ────────────────────────────────────────────────────────────── */}
        <motion.section 
          style={{ opacity: opacityHero, scale: scaleHero }}
          className="relative min-h-[90vh] flex flex-col items-center justify-center px-6"
        >
          <div className="max-w-5xl mx-auto text-center">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1, duration: 0.8 }}
              className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm mb-8"
            >
              <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              La version NovaTech 3.0 est en ligne
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2, duration: 0.8 }}
              className="text-5xl md:text-7xl lg:text-8xl font-black leading-[1.05] tracking-tight mb-6"
            >
              Le futur de la<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 via-amber-300 to-orange-500">
                restauration.
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4, duration: 1 }}
              className="text-xl md:text-2xl text-white/50 max-w-3xl mx-auto mb-10 leading-relaxed font-medium"
            >
              Commande QR sans friction, Portail Serveur en temps reel, et Nova IA pour piloter vos stocks, vos accords mets & vins et votre comptabilite.
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

          {/* Floating UI Elements Showcase */}
          <div className="w-full max-w-6xl relative h-64 md:h-96 perspective-[2000px]">
            <motion.div 
              initial={{ opacity: 0, rotateX: 20, y: 100 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ delay: 0.6, duration: 1.2, type: "spring", stiffness: 50 }}
              className="absolute left-1/2 top-0 -translate-x-1/2 w-[90%] md:w-[800px] h-full bg-[#111] rounded-t-3xl border border-white/10 shadow-2xl overflow-hidden flex flex-col"
            >
              <div className="h-12 bg-[#1a1a1a] border-b border-white/5 flex items-center px-4 gap-2">
                <div className="w-3 h-3 rounded-full bg-red-500" />
                <div className="w-3 h-3 rounded-full bg-yellow-500" />
                <div className="w-3 h-3 rounded-full bg-green-500" />
                <div className="ml-4 text-xs font-medium text-white/30">matable.pro/dashboard/serveurdash</div>
              </div>
              <div className="flex-1 p-6 bg-gradient-to-br from-[#0f0f0f] to-[#1a1a1a] flex gap-6">
                <div className="w-1/3 space-y-4">
                  <div className="h-20 rounded-xl bg-orange-500/10 border border-orange-500/20 p-4">
                    <div className="text-orange-400 text-sm font-bold mb-1">🛎️ Appel Serveur</div>
                    <div className="text-white text-xs">Table 4 - L'addition</div>
                  </div>
                  <div className="h-24 rounded-xl bg-white/5 border border-white/10 p-4">
                    <div className="text-white/60 text-sm font-bold mb-2">T7 - En preparation</div>
                    <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full w-2/3 bg-orange-500 rounded-full" /></div>
                  </div>
                </div>
                <div className="flex-1 rounded-xl bg-white/5 border border-white/10 p-4 relative overflow-hidden">
                   <div className="absolute inset-0 bg-gradient-to-tr from-purple-500/5 to-transparent" />
                   <div className="text-white text-sm font-bold mb-4">Nova Sommelier IA ✨</div>
                   <div className="space-y-2">
                     <div className="h-6 w-3/4 bg-white/10 rounded-md" />
                     <div className="h-6 w-1/2 bg-white/10 rounded-md" />
                     <div className="h-6 w-5/6 bg-white/10 rounded-md" />
                   </div>
                </div>
              </div>
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

        {/* ── Features Grid ─────────────────────────────────────────────────── */}
        <section id="features" className="py-32 px-6">
          <div className="max-w-7xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-black mb-6">Un arsenal complet. Rien ne manque.</h2>
              <p className="text-xl text-white/40 max-w-2xl mx-auto">De la prise de commande a la comptabilite, tout est integre et synchronise en temps reel.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-50px" }}
                  transition={{ delay: (i % 3) * 0.1, duration: 0.5 }}
                  className={`group rounded-2xl border p-6 transition-all duration-300 hover:-translate-y-1 ${
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
            </div>
          </div>
        </section>

        {/* ── Nova IA Showcase ──────────────────────────────────────────────── */}
        <section id="nova-ia" className="py-32 px-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-purple-900/10" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[500px] bg-purple-500/10 blur-[120px] rounded-full pointer-events-none" />
          
          <div className="max-w-6xl mx-auto relative z-10">
            <div className="text-center mb-20">
              <span className="inline-block py-1 px-3 rounded-full bg-purple-500/20 text-purple-300 border border-purple-500/30 text-xs font-bold tracking-widest uppercase mb-4">
                Intelligence Artificielle
              </span>
              <h2 className="text-4xl md:text-6xl font-black mb-6">
                Nova IA.<br/>Votre brigade <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-fuchsia-400">digitale.</span>
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-8 lg:gap-12">
              <motion.div 
                initial={{ opacity: 0, x: -50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="space-y-6"
              >
                {[
                  { title: "Nova Sommelier", desc: "Associe automatiquement vos plats avec les vins parfaits et propose des boissons a ajouter a la carte." },
                  { title: "Nova Contab", desc: "Analyse URSSAF, TVA, et extractions de donnees fiscales. Exportez pour votre comptable en un clic." },
                  { title: "Nova Stock & Finance", desc: "Genere vos listes de courses manuelles ou auto, calcule le Food Cost et predit vos marges." },
                ].map((ia, i) => (
                  <div key={i} className="p-6 rounded-2xl bg-white/5 border border-purple-500/20 hover:border-purple-500/40 transition-colors">
                    <h3 className="text-xl font-bold text-purple-300 mb-2">{ia.title}</h3>
                    <p className="text-white/60 text-sm leading-relaxed">{ia.desc}</p>
                  </div>
                ))}
              </motion.div>
              
              <motion.div 
                initial={{ opacity: 0, x: 50 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                className="relative rounded-3xl border border-white/10 bg-[#111] overflow-hidden flex items-center justify-center p-8"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-transparent" />
                <div className="relative w-full max-w-sm space-y-4">
                  {/* Chat UI mockup */}
                  <div className="bg-white/10 p-4 rounded-2xl rounded-tl-none border border-white/10 max-w-[85%]">
                     <p className="text-xs text-white/80">J'ai 3kg de tomates qui vont se perdre, que faire ?</p>
                  </div>
                  <div className="bg-purple-500/20 p-4 rounded-2xl rounded-tr-none border border-purple-500/30 max-w-[90%] ml-auto shadow-lg shadow-purple-500/10">
                     <p className="text-xs text-purple-100 mb-2">✨ Je vous suggere 2 plats du jour :</p>
                     <ul className="text-[10px] text-white/70 space-y-1">
                       <li>• Gazpacho andalou (marge estimée: 82%)</li>
                       <li>• Tarte tatin a la tomate (marge estimée: 76%)</li>
                     </ul>
                     <p className="text-[10px] text-purple-300 mt-2">Voulez-vous que je les ajoute a la carte ?</p>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* ── Hardware ──────────────────────────────────────────────────────── */}
        <section id="hardware" className="py-32 px-6 bg-[#0a0a0a]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-black mb-4">Le Materiel. Robuste.</h2>
              <p className="text-xl text-white/40">Demarrez gratuitement avec vos propres appareils, ou passez a la vitesse superieure.</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-6">
              {hardware.map((h, i) => (
                <motion.div 
                  key={i}
                  initial={{ opacity: 0, scale: 0.9 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1 }}
                  className="bg-white/5 border border-white/10 rounded-2xl p-6 text-center hover:bg-white/10 transition-colors"
                >
                  <div className="text-4xl mb-4">{h.icon}</div>
                  <h3 className="font-bold text-white mb-2">{h.name}</h3>
                  <p className="text-xs text-white/50 mb-4 h-10">{h.desc}</p>
                  <div className="inline-block px-3 py-1 rounded-full bg-white/10 text-xs font-semibold text-white/70">{h.tag}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────────────────────── */}
        <section id="pricing" className="py-32 px-6 bg-[#0f0f0f]">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-20">
              <h2 className="text-4xl md:text-5xl font-black mb-4">Tarifs transparents.</h2>
              <p className="text-white/40 text-lg">Resiliation a tout moment. Pas d'asterisque cachee.</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-start">
              {plans.map((plan, i) => (
                <motion.div 
                  key={plan.name} 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.15 }}
                  className={`relative rounded-3xl border p-8 bg-[#0a0a0a] shadow-2xl ${plan.color}`}
                >
                  {plan.badge && (
                    <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-xs font-bold rounded-full shadow-lg ${plan.name.includes("Nova") ? "bg-purple-500" : "bg-orange-500"}`}>
                      {plan.badge}
                    </div>
                  )}
                  <div className="text-xl font-bold text-white mb-2">{plan.name}</div>
                  <div className="flex items-end gap-1 mb-2">
                    <span className="text-4xl lg:text-5xl font-black text-white">{plan.price}</span>
                    <span className="text-white/40 mb-2 text-sm">{plan.period}</span>
                  </div>
                  <div className={`text-sm font-semibold mb-8 ${plan.name.includes("IA") ? "text-purple-400" : "text-orange-400"}`}>{plan.trial}</div>
                  
                  <div className="h-px w-full bg-white/10 mb-8" />
                  
                  <ul className="space-y-4 mb-10">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-3 text-sm text-white/70">
                        <span className={`mt-0.5 flex-shrink-0 text-lg ${plan.name.includes("IA") ? "text-purple-400" : "text-orange-400"}`}>✓</span>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <Link href="/register" className={`block w-full py-4 rounded-xl font-bold text-center transition-all shadow-lg hover:scale-[1.02] ${plan.ctaColor}`}>
                    {plan.name === "Pro" ? "Demander une demo" : "Demarrer maintenant"}
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
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
