"use client";

import { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
import LandingProductCarousel from "./LandingProductCarousel";
import LandingTestimonials from "./LandingTestimonials";

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { value: "15 s", label: "Temps moyen de commande" },
  { value: "−78%", label: "Erreurs de commande" },
  { value: "+34%", label: "Panier moyen" },
  { value: "×4", label: "Moins de no-shows" },
];

const MODULES = [
  { id: "avis", name: "Avis Google & Réputation", desc: "Campagne QR, IA rédactionnelle, Bons de réduction auto.", price: 45.99, required: true },
  { id: "qr", name: "Commande & Paiement", desc: "Menu digital QR, paiement fractionné ou espèces, tickets.", price: 59.99, required: false },
  { id: "server", name: "Portail Serveur (Live)", desc: "Gestion des tables, suivi cuisine, appels serveur instantanés.", price: 39.99, required: false },
  { id: "stock", name: "Nova Stock IA", desc: "Listes de courses auto, alertes de ruptures, food cost.", price: 49.99, required: false },
  { id: "sommelier", name: "Nova Sommelier IA", desc: "Accords mets-vins, up-selling, et optimisation de la carte.", price: 29.99, required: false },
  { id: "contab", name: "Nova Contab IA", desc: "Exports comptables, TVA, rapports de fin de mois intelligents.", price: 29.99, required: false },
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

// REMOVED PLANS

const hardware = [
  { name: "POS Client", desc: "Une tablette murale pour la commande.", icon: "🖥️", tag: "Sur devis" },
  { name: "POS Serveur", desc: "La prise de commande mobile synchronisee.", icon: "📱", tag: "Sur devis" },
  { name: "POS Caisse", desc: "Terminal connecte.", icon: "🖨️", tag: "Sur devis" },
  { name: "QR Vinyle", desc: "Indestructible. QR unique par table.", icon: "🎯", tag: "Des 3€/table" },
  { name: "Chevalet Acrylique", desc: "Le luxe sur table. QR serigraphie.", icon: "💎", tag: "Des 8€/table" },
  { name: "PDF A4 Gratuit", desc: "Imprimez-le vous-meme. Gratuit.", icon: "📄", tag: "Gratuit" },
];

const languageLines = [
  ["GB", "I speak English."],
  ["ES", "Hablo español."],
  ["IT", "Parlo italiano."],
  ["DE", "Ich spreche Deutsch."],
  ["PT", "Falo português."],
  ["JP", "私は日本語を話します。"],
  ["CN", "我讲中文。"],
];

const comparisons = [
  { feature: "Commande QR sans friction (0 app, 0 compte)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Suivi commande en temps réel côté client", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Temps d'attente estimé + compte à rebours", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Paiement fractionné (égal ou personnalisé)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Flux addition (client → serveur → caisse)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Temps réel WebSocket (cuisine + salle + client)", us: "✓", starter: "Partiel", dino: "✕" },
  { feature: "Dashboard individuel par serveur (PIN)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Tables assignées par serveur", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Planning de service par employé", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Nova Stock IA (liste de courses + alertes frais)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Nova Finance IA (KPIs + prévisions + offres)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Nova Menu IA (génération + import photo)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "IA Vision (Magic Scan plats)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Planning hebdomadaire IA", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Descriptions de plats IA", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Défis serveurs générés par IA (quotidiens)", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Avis vérifiés anti-fraude", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Réservations + arrhes Stripe", us: "✓", starter: "✓", dino: "✕" },
  { feature: "Allergènes EU (14) automatiques", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Analytics de précision (CA, tips, splits)", us: "✓", starter: "Basique", dino: "✕" },
  { feature: "Page vitrine SEO incluse", us: "✓", starter: "✕", dino: "✕" },
  { feature: "Réseau social culinaire (Nova Match)", us: "Bientôt", starter: "✕", dino: "✕" },
  { feature: "Essai gratuit sans CB", us: "✓", starter: "✕", dino: "✕" },
];

// ─── Component ────────────────────────────────────────────────────────────────

function PricingBuilder() {
  const [selected, setSelected] = useState<string[]>(["avis"]);

  const toggleModule = (id: string) => {
    if (id === "avis") return; // always required
    setSelected(prev => 
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    );
  };

  const selectedCount = selected.length;
  let discountPercent = 0;
  if (selectedCount === 2) discountPercent = 10;
  if (selectedCount === 3) discountPercent = 15;
  if (selectedCount >= 4) discountPercent = 20;

  const rawTotal = selected.reduce((sum, id) => {
    const mod = MODULES.find(m => m.id === id);
    return sum + (mod ? mod.price : 0);
  }, 0);

  const discountAmount = rawTotal * (discountPercent / 100);
  const finalTotal = rawTotal - discountAmount;

  return (
    <div className="grid lg:grid-cols-[1.2fr_0.8fr] gap-8">
      {/* Liste des modules */}
      <div className="space-y-3">
        {MODULES.map(mod => {
          const isSelected = selected.includes(mod.id);
          return (
            <div 
              key={mod.id} 
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
                  <h3 className="font-bold text-lg text-white flex items-center gap-2">
                    {mod.name}
                    {mod.required && <span className="text-[10px] uppercase tracking-wider bg-white/10 px-2 py-0.5 rounded text-white/50">Base obligatoire</span>}
                  </h3>
                  <p className="text-sm text-white/50">{mod.desc}</p>
                </div>
              </div>
              <div className="text-right">
                <div className="font-bold text-xl text-white">{mod.price.toFixed(2)}€</div>
                <div className="text-xs text-white/40">/ mois</div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Résumé fixe */}
      <div className="relative">
        <div className="sticky top-24 rounded-3xl bg-[#111] border border-white/10 p-8 shadow-2xl">
          <h3 className="text-xl font-bold mb-6 border-b border-white/10 pb-4">Votre Abonnement</h3>
          
          <div className="space-y-4 mb-6">
            <div className="flex justify-between text-white/70">
              <span>Applications ({selectedCount})</span>
              <span>{rawTotal.toFixed(2)} €</span>
            </div>
            {discountPercent > 0 && (
              <div className="flex justify-between text-emerald-400 font-medium">
                <span>Remise volume (-{discountPercent}%)</span>
                <span>-{discountAmount.toFixed(2)} €</span>
              </div>
            )}
          </div>
          
          <div className="border-t border-white/10 pt-6 mb-8">
            <div className="flex items-end justify-between">
              <span className="text-white/60">Total HT</span>
              <div className="text-right">
                <div className="text-5xl font-black text-white">{finalTotal.toFixed(2)} €</div>
                <div className="text-sm text-white/40 mt-1">/ mois sans engagement</div>
              </div>
            </div>
          </div>

          <Link href="/register" className="block w-full py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-lg text-center transition-all shadow-xl shadow-orange-500/20 hover:-translate-y-1">
            Créer mon compte
          </Link>
          <p className="text-center text-xs text-white/40 mt-4">14 jours d'essai offerts. Pas de CB requise.</p>
        </div>
      </div>
    </div>
  );
}

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
          <span className="text-2xl font-black text-white">MaTable <span className="text-orange-500">Pro</span></span>
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
              MaTable Pro — matablepro — est en ligne. Testez-le gratuitement pendant 14 jours
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
              MaTable Pro (matablepro), c'est le logiciel restaurant tout-en-un : commande QR, portail serveur en temps réel, caisse, avis Google IA, stock, réservations et analytics dans une seule solution cohérente.
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

        <LandingProductCarousel />

        {/* ── Language Campaign ─────────────────────────────────────────────── */}
        <section className="border-b border-white/5 bg-black px-6 py-24">
          <div className="mx-auto grid max-w-6xl gap-12 md:grid-cols-[0.9fr_1.1fr] md:items-center">
            <div className="space-y-4 text-left">
              {languageLines.map(([code, text], i) => (
                <div key={code} className={`flex items-baseline gap-4 font-black uppercase tracking-tight ${i === languageLines.length - 1 ? "text-white" : "text-white/40"}`}>
                  <span className="w-12 text-right text-2xl md:text-3xl">{code}</span>
                  <span className="text-3xl md:text-5xl">{text}</span>
                </div>
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

        {/* ── Test du pourboire ────────────────── */}
        <section className="border-y border-white/5 bg-black px-6 py-32 relative overflow-hidden">
          <div className="w-full max-w-6xl relative perspective-[2000px] mt-10 mx-auto">
            <motion.div 
              initial={{ opacity: 0, rotateX: 20, y: 100 }}
              animate={{ opacity: 1, rotateX: 0, y: 0 }}
              transition={{ delay: 0.6, duration: 1.2, type: "spring", stiffness: 50 }}
              className="relative z-10 max-w-5xl mx-auto text-left border border-white/5 bg-[#0a0a0a]/80 backdrop-blur-xl rounded-[2rem] p-10 md:p-16 shadow-2xl"
            >
              {/* Pattern de fond rayé */}
              <div 
                className="absolute inset-0 rounded-[2rem] opacity-[0.03] pointer-events-none" 
                style={{ backgroundImage: "repeating-linear-gradient(45deg, #fff 0, #fff 2px, transparent 2px, transparent 12px)" }}
              />
              
              <div className="inline-block px-4 py-1 border-2 border-orange-500 text-orange-500 font-black tracking-widest text-sm mb-10 rotate-[-2deg]">
                LE TEST DU POURBOIRE
              </div>
              
              <h2 className="text-5xl md:text-7xl lg:text-8xl font-black mb-8 leading-[0.9] text-white">
                VOUS PENSEZ QUE VOS CLIENTS<br />
                <span className="text-orange-500">SONT RADINS ?</span>
              </h2>
              
              <p className="text-xl md:text-3xl font-bold text-white/90 max-w-3xl leading-snug">
                Activez notre module de paiement in-app avec suggestion de pourboire. Regardez les 10%, 15%, 20% pleuvoir sur votre staff à chaque fin de repas.<br/>
                La psychologie UI bat toujours la radinerie.
              </p>
            </motion.div>
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

        {/* ── Compare ─────────────────────────────────────────────────────────── */}
        <section id="compare" className="py-32 px-6 bg-[#0a0a0a]">
          <div className="max-w-5xl mx-auto">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-16"
            >
              <h2 className="text-4xl md:text-5xl font-black mb-4">Pourquoi nous ? Et pas les dinosaures ?</h2>
              <p className="text-white/40 text-lg">Comparez les fonctionnalites point par point. La difference est ecrasante.</p>
            </motion.div>
            
            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="overflow-x-auto rounded-3xl border border-white/10 bg-[#0f0f0f]"
            >
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="text-white/40 text-sm bg-white/[0.02]">
                    <th className="p-5 border-b border-white/10 font-bold w-1/2">Fonctionnalite</th>
                    <th className="p-5 border-b border-white/10 text-center font-black text-orange-400">Ma Table</th>
                    <th className="p-5 border-b border-white/10 text-center font-bold text-white/80">Concurrents SaaS</th>
                    <th className="p-5 border-b border-white/10 text-center font-bold text-white/50">Cahier / Papier</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {comparisons.map((c, i) => (
                    <tr key={i} className="border-b border-white/[0.04] hover:bg-white/[0.02] transition-colors">
                      <td className="p-5 font-medium text-white/80">{c.feature}</td>
                      <td className={`p-5 text-center font-black ${c.us === "✓" ? "text-orange-400" : c.us === "Bientôt" ? "text-amber-400 text-xs" : "text-orange-300"}`}>
                        {c.us}
                      </td>
                      <td className={`p-5 text-center text-sm font-semibold ${c.starter === "✓" ? "text-white/60" : c.starter === "Partiel" || c.starter === "Basique" ? "text-yellow-500/60 text-xs" : "text-white/20"}`}>
                        {c.starter}
                      </td>
                      <td className="p-5 text-center text-white/20 font-semibold">{c.dino}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </motion.div>
          </div>
        </section>

        {/* ── Pricing Builder ─────────────────────────────────────────────────── */}
        <section id="pricing" className="py-32 px-6 bg-[#0f0f0f]">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-4xl md:text-5xl font-black mb-4">Créez votre solution sur mesure.</h2>
              <p className="text-white/40 text-lg">Ne payez que pour ce que vous utilisez. Tarif dégressif selon le volume d'applications.</p>
            </div>

            <PricingBuilder />
          </div>
        </section>

        <LandingTestimonials />

        {/* ── Defi / Prouvez-nous qu'on a tort ────────────────────────────────── */}
        <section className="border-b border-white/5 bg-black px-6 py-32 relative overflow-hidden">
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
