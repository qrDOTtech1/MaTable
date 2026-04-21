import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Ma Table — La Révolution QR, IA & Portail Serveur",
  description: "La plateforme SaaS qui transforme votre restaurant : commande QR sans friction, temps réel absolu, Nova IA (Magic Scan, chatbot, planning), portail serveur et analytics de pointe.",
  keywords: ["commande restaurant QR code","menu digital restaurant","SaaS restaurant France","Nova IA restaurant","Magic Scan plats","planning IA restaurant","portail serveur restaurant","réservations restaurant","analytics restaurant","Ma Table"],
  robots: { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 } },
  openGraph: {
    type: "website", locale: "fr_FR", url: "https://matable.pro", siteName: "Ma Table",
    title: "Ma Table — La plateforme SaaS qui ne plaisante pas avec votre service",
    description: "Commande QR, Nova IA, portail serveur, réservations, analytics. La technologie au service du goût.",
    images: [{ url: "https://matable.pro/og-image.png", width: 1200, height: 630, alt: "Ma Table — SaaS restaurant" }],
  },
  twitter: { card: "summary_large_image", title: "Ma Table — La plateforme restaurant la plus puissante au monde", description: "Commande QR, IA, portail serveur. Moins de paperasse, plus de service.", images: ["https://matable.pro/og-image.png"] },
  alternates: { canonical: "https://matable.pro" },
  authors: [{ name: "Ma Table — SNHTech & Novavivo.online" }],
};

// ─── Data ────────────────────────────────────────────────────────────────────

const stats = [
  { value: "15 s", label: "Temps moyen de commande" },
  { value: "−78%", label: "Erreurs de commande" },
  { value: "+34%", label: "Panier moyen" },
  { value: "×4", label: "Moins de no-shows" },
];

const features = [
  { icon: "📱", title: "Scan → Commande. C'est tout.", desc: "Pas d'app. Pas de compte. Pas de perte de temps. Le client scanne, choisit, commande. C'est d'une simplicité désarmante.", highlight: true },
  { icon: "⚡", title: "Temps réel absolu", desc: "Chaque commande frappe l'écran cuisine à la vitesse de la lumière. Pas de délai. Pas de 'peut-être'. Juste de l'efficacité brute.", highlight: false },
  { icon: "🤖", title: "Nova IA — Votre nouveau chef adjoint", desc: "Un assistant IA qui connaît votre carte mieux que vous. Il répond, conseille et vend. Sans jamais demander d'augmentation.", highlight: false },
  { icon: "📷", title: "Magic Scan : La fin de la saisie", desc: "Photographiez un plat. Nova extrait les ingrédients, les allergènes et rédige une description gastronomique. C'est de la magie pure.", highlight: false },
  { icon: "🗓️", title: "Planning IA Intelligent", desc: "Générez vos plats du jour pour la semaine en un clic. L'IA gère la cohérence, les thèmes et vos stocks. Brillant.", highlight: false },
  { icon: "✍️", title: "Descriptions de génie", desc: "Transformez 'Poulet riz' en une expérience sensorielle inoubliable. 3 variantes, un seul but : faire saliver le client.", highlight: false },
  { icon: "👤", title: "Portail Serveur : La maîtrise", desc: "Chaque serveur a son espace PIN. Tables, plannings, défis. C'est l'outil ultime pour une équipe qui veut gagner.", highlight: false },
  { icon: "📅", title: "Réservations de fer", desc: "Créneaux dynamiques et arrhes Stripe. Les no-shows sont désormais un mauvais souvenir du passé.", highlight: false },
  { icon: "🌿", title: "Allergènes : Conformité totale", desc: "14 allergènes EU affichés automatiquement. Vous êtes en règle, vos clients sont en sécurité. Sans lever le petit doigt.", highlight: false },
  { icon: "⭐", title: "Avis vérifiés et réels", desc: "Seuls ceux qui ont payé peuvent noter. C'est la fin des faux avis et le début de la vérité.", highlight: false },
  { icon: "📊", title: "Analytics sans pitié", desc: "CA, ticket moyen, performances. Vous voyez tout. Vous savez tout. Vous dirigez avec des données, pas des intuitions.", highlight: false },
  { icon: "🔔", title: "Appel Serveur instantané", desc: "Un bouton, une alerte. Votre équipe intervient là où c'est nécessaire, quand c'est nécessaire. Précision chirurgicale.", highlight: false },
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
      "Jusqu'à 30 tables",
      "Menu illimité",
      "Commandes QR temps réel",
      "Réservations en ligne",
      "Page vitrine publique",
      "Portail serveur (PIN)",
      "Analytics de base",
      "Support par email",
    ],
  },
  {
    name: "Pro",
    price: "139,99 €",
    period: "/ mois HT",
    trial: "Démo personnalisée",
    color: "border-orange-500 bg-gradient-to-b from-orange-500/10 to-transparent ring-1 ring-orange-500/30",
    ctaColor: "bg-orange-500 hover:bg-orange-400 text-white",
    badge: "L'excellence",
    features: [
      "Tables illimitées",
      "Multi-utilisateurs",
      "Analytics avancées",
      "Pourboires digitaux",
      "Avis vérifiés",
      "Portail serveur complet",
      "Matériel POS sur devis",
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
      "Chatbot Nova IA",
      "Magic Scan IA Vision",
      "Planning IA hebdomadaire",
      "Descriptions IA",
      "Suggestions serveurs IA",
      "Modèles configurables",
      "Clé API Ollama dédiée",
      "Support IA prioritaire",
    ],
  },
];

const comparisons = [
  { feature: "Commande QR sans friction", us: true, them: false },
  { feature: "Temps réel WebSocket", us: true, them: false },
  { feature: "Portail serveur avec PIN", us: true, them: false },
  { feature: "IA Vision (Magic Scan)", us: true, them: false },
  { feature: "Planning hebdomadaire IA", us: true, them: false },
  { feature: "Descriptions de plats IA", us: true, them: false },
  { feature: "Avis vérifiés anti-fraude", us: true, them: false },
  { feature: "Réservations + arrhes", us: true, them: false },
  { feature: "Allergènes EU automatiques", us: true, them: false },
  { feature: "Analytics de précision", us: true, them: false },
  { feature: "Page vitrine SEO incluse", us: true, them: false },
  { feature: "Essai gratuit sans CB", us: true, them: false },
];

const hardware = [
  { name: "POS Client", desc: "Une tablette murale pour la commande. Solide, élégante, infatigable.", icon: "🖥️", tag: "Sur devis" },
  { name: "POS Serveur", desc: "La prise de commande mobile synchronisée. Vos serveurs vont l'adorer.", icon: "📱", tag: "Sur devis" },
  { name: "POS Caisse", desc: "Terminal connecté. L'encaissement devient une simple formalité.", icon: "🖨️", tag: "Sur devis" },
  { name: "QR Vinyle", desc: "Indestructible. QR unique par table. Livraison éclair.", icon: "🎯", tag: "Dès 3€/table" },
  { name: "Chevalet Acrylique", desc: "Le luxe sur table. QR sérigraphié et logo. Magnifique.", icon: "💎", tag: "Dès 8€/table" },
  { name: "PDF A4 Gratuit", desc: "Imprimez-le vous-même. En 30 secondes. C'est gratuit.", icon: "📄", tag: "Gratuit" },
];

const testimonials = [
  {
    quote: "On a lancé Ma Table en une heure. Le soir même, le service était transformé. C'est brillant.",
    name: "Thomas R.", role: "Chef-propriétaire, Le Comptoir du 7e — Paris", rating: 5,
  },
  {
    quote: "Le Magic Scan a sauvé ma mise à jour de carte. Ce qui prenait des jours prend désormais des secondes.",
    name: "Sophie D.", role: "Gérante, Brasserie du Marché — Nantes", rating: 5,
  },
  {
    quote: "Les réservations avec arrhes ? Mes no-shows ont disparu. Enfin une solution sérieuse.",
    name: "Antoine P.", role: "Restaurateur, La Cave Moderne — Bordeaux", rating: 5,
  },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* JSON-LD */}
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@graph": [
          { "@type": "Organization", "@id": "https://matable.pro/#organization", name: "Ma Table", url: "https://matable.pro",
            description: "Plateforme SaaS de commande par QR code pour restaurants avec IA Nova",
            contactPoint: { "@type": "ContactPoint", contactType: "Customer Support", email: "support@matable.pro" },
            address: { "@type": "PostalAddress", addressCountry: "FR" } },
          { "@type": "Product", name: "Ma Table Starter", offers: { "@type": "Offer", price: "49.99", priceCurrency: "EUR", availability: "https://schema.org/InStock", url: "https://matable.pro/register" } },
          { "@type": "Product", name: "Ma Table Pro + Nova IA", offers: { "@type": "Offer", price: "299", priceCurrency: "EUR", availability: "https://schema.org/InStock", url: "https://matable.pro/register" } },
        ]
      }) }} />

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-2xl font-black text-white">Ma <span className="text-orange-500">Table</span></span>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#demo" className="hover:text-white transition-colors">Comment ça marche</a>
            <a href="#nova-ia" className="hover:text-white transition-colors">Nova IA</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
            <a href="#compare" className="hover:text-white transition-colors">Comparatif</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition-colors">Se connecter</Link>
            <Link href="/register" className="text-sm px-4 py-2 bg-orange-500 hover:bg-orange-400 text-white rounded-lg font-medium transition-colors">
              Essai gratuit 14j
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative min-h-screen flex flex-col items-center justify-center pt-16 px-6 overflow-hidden">
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[900px] h-[600px] bg-orange-500/10 rounded-full blur-[140px] pointer-events-none" />
        <div className="absolute top-2/3 right-1/4 w-[400px] h-[300px] bg-purple-500/8 rounded-full blur-[100px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            Essai gratuit 14 jours · Sans carte bancaire
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Vos concurrents gribouillent encore sur du papier.<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              C'est pathétique.
            </span>
          </h1>
          <p className="text-2xl md:text-3xl font-black text-white/80 mb-8">
            Bienvenue dans l'ère de la puissance brute.
          </p>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Ma Table est la plateforme SaaS ultime. Commande QR instantanée, cuisine en temps réel,
            Nova IA pour vos menus, réservations de fer et portail équipe dédié. 
            En une heure, vous passez de l'âge de pierre à la suprématie digitale.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/25">
              Prendre les commandes maintenant →
            </Link>
            <a href="#demo" className="px-8 py-4 border border-white/10 hover:border-white/20 text-white/70 hover:text-white rounded-xl font-medium transition-all">
              Voir la puissance en action ↓
            </a>
          </div>

          {/* Mockups */}
          <div className="relative flex items-end justify-center gap-4 max-w-4xl mx-auto">
            <div className="hidden md:block w-64 h-80 rounded-2xl border border-white/10 bg-[#111] overflow-hidden shadow-2xl rotate-[-3deg] translate-y-6 opacity-80">
              <div className="h-8 bg-[#161616] border-b border-white/5 flex items-center px-3 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/70" /><div className="w-2 h-2 rounded-full bg-yellow-500/70" /><div className="w-2 h-2 rounded-full bg-green-500/70" />
                <span className="text-white/30 text-xs ml-2">Cuisine · Live</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="text-xs text-white/30 font-medium mb-3">● Commandes en cours</div>
                {[{ table: "T.3", item: "Burger Black Angus", mod: "Saignant" }, { table: "T.7", item: "Risotto Truffe", mod: "Vegan ✓" }].map((o, i) => (
                  <div key={i} className="bg-[#1a1a1a] rounded-lg p-2.5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-orange-400">{o.table}</span>
                      <span className="text-[10px] text-white/30">Juste maintenant</span>
                    </div>
                    <div className="text-xs text-white/80 font-medium">{o.item}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{o.mod}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="w-56 md:w-72 h-[500px] md:h-[560px] rounded-[2.5rem] border-2 border-white/15 bg-[#111] overflow-hidden shadow-2xl shadow-black/60 z-10">
              <div className="h-10 bg-[#0d0d0d] flex items-center justify-center">
                <div className="w-20 h-5 bg-[#1a1a1a] rounded-full" />
              </div>
              <div className="flex flex-col h-[calc(100%-2.5rem)]">
                <div className="h-24 bg-gradient-to-br from-orange-900/40 to-amber-900/20 flex flex-col items-center justify-center border-b border-white/5">
                  <div className="text-lg font-black text-white">Le Comptoir</div>
                  <div className="text-xs text-orange-400/80 mt-1">Table 3 · Prêt pour vous</div>
                </div>
                <div className="flex-1 overflow-hidden p-3 space-y-2 bg-[#0f0f0f]">
                  <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">🍔 La Carte</div>
                  {[{ name: "Black Angus", price: "18,90 €" }, { name: "Risotto Truffe", price: "24,50 €" }].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border border-white/5 bg-[#1a1a1a]`}>
                      <div className="w-8 h-8 rounded-lg bg-[#252525] flex items-center justify-center text-sm">🍽️</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/80 truncate">{item.name}</div>
                        <div className="text-[10px] text-orange-400">{item.price}</div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="p-3 bg-[#0d0d0d] border-t border-white/5">
                  <div className="w-full py-2.5 bg-orange-500 rounded-xl text-xs font-bold text-center text-white">Vraie Commande</div>
                </div>
              </div>
            </div>

            <div className="hidden md:block w-64 h-80 rounded-2xl border border-white/10 bg-[#111] overflow-hidden shadow-2xl rotate-[3deg] translate-y-6 opacity-80">
              <div className="h-8 bg-[#161616] border-b border-white/5 flex items-center px-3 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/70" /><div className="w-2 h-2 rounded-full bg-yellow-500/70" /><div className="w-2 h-2 rounded-full bg-green-500/70" />
                <span className="text-white/30 text-xs ml-2">Nova IA</span>
              </div>
              <div className="p-4 space-y-3">
                <div className="text-[10px] text-purple-400/70 uppercase tracking-wider font-bold">Analyse Vision</div>
                <div className="w-full h-20 rounded-lg bg-[#1a1a1a] border border-white/5 flex items-center justify-center text-2xl">📷</div>
                <div className="space-y-1.5 text-[10px]">
                  <div className="text-white/50 font-medium">Plat détecté : Risotto</div>
                  <div className="text-white/30">Analyse des allergènes en cours... Brillant.</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ───────────────────────────────────────────────────────────── */}
      <section className="border-y border-white/[0.06] bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto px-6 py-10 grid grid-cols-2 md:grid-cols-4 gap-8">
          {stats.map((s) => (
            <div key={s.value} className="text-center">
              <div className="text-3xl md:text-4xl font-black text-orange-400">{s.value}</div>
              <div className="text-sm text-white/40 mt-1">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Demo ────────────────────────────────────────────────────────────── */}
      <section id="demo" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              Vitesse. Puissance. <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Zéro excuse.</span>
            </h2>
            <p className="text-white/40 text-lg max-w-xl mx-auto">
              Ma Table n'est pas qu'un logiciel. C'est une révolution pour votre restaurant. Opérationnel en moins de 60 minutes.
            </p>
          </div>

          <div className="space-y-6">
            {[
              { n: "01", title: "Menu éclair", desc: "Saisissez votre menu. Tout se synchronise. Si votre cuisinier sait lire une recette, il sait utiliser ce dashboard.", color: "from-orange-500/20 to-amber-500/10", tags: ["14 Allergènes", "Gestion Stock", "Variantes"] },
              { n: "02", title: "Déploiement total", desc: "Imprimez vos QR codes. PDF gratuit en 30 secondes. C'est plus rapide que de préparer un espresso.", color: "from-violet-500/20 to-purple-500/10", tags: ["PDF Gratuit", "Supports Vinyle", "Acrylique"] },
              { n: "03", title: "Domination digitale", desc: "Vos clients commandent depuis leur téléphone. Pas d'app. Pas de compte. Pas de barrières.", color: "from-emerald-500/20 to-teal-500/10", tags: ["4G/WiFi", "iOS/Android", "Paiement Rapide"] },
              { n: "04", title: "Contrôle absolu", desc: "Cuisine et salle reçoivent tout en direct. C'est l'orchestration parfaite d'un service réussi.", color: "from-blue-500/20 to-cyan-500/10", tags: ["WebSocket", "Vue Kanban", "Analytics"] },
            ].map((step, i) => (
              <div key={i} className={`rounded-3xl border border-white/[0.08] bg-gradient-to-r ${step.color} overflow-hidden`}>
                <div className="flex flex-col md:flex-row items-start gap-8 p-8 md:p-10">
                  <div className="text-6xl font-black text-white/10 select-none leading-none">{step.n}</div>
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-white/50 text-lg leading-relaxed">{step.desc}</p>
                    <div className="mt-5 flex gap-2">
                      {step.tags.map(tag => (
                        <span key={tag} className="px-3 py-1 rounded-full text-[10px] border border-white/10 bg-white/5">{tag}</span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Nova IA ─────────────────────────────────────────────────────────── */}
      <section id="nova-ia" className="py-32 px-6 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm mb-4">
              Nova IA — La supériorité technologique
            </div>
            <h2 className="text-4xl md:text-5xl font-black mb-4">
              L'IA qui fait le travail<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-violet-300">pendant que vous cuisinez.</span>
            </h2>
            <p className="text-white/40 text-lg max-w-2xl mx-auto">
              Perdre une journée à écrire des descriptions de plats est une perte de temps monumentale. 
              Nova IA analyse vos photos, rédige vos textes et planifie vos semaines. C'est brillant, tout simplement.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {[
              { title: "Magic Scan : Vision du futur", desc: "Photographiez. Nova analyse. Nom, description, allergènes, prix suggéré. Dix secondes au lieu de dix heures.", icon: "📷" },
              { title: "Chatbot Nova : L'expert infatigable", desc: "Il répond aux clients, optimise votre carte et ne prend jamais de pause café.", icon: "🤖" },
              { title: "Planning IA : Stratégie pure", desc: "Générez votre semaine complète en un clic. Entrée, plat, dessert, thèmes. Orchestration parfaite.", icon: "🗓️" },
              { title: "Descriptions de génie", desc: "Transformez vos plats en expériences littéraires. 3 variantes, du ton bistro au gastronomique.", icon: "✍️" },
            ].map((f, i) => (
              <div key={i} className="rounded-2xl border border-purple-500/20 bg-purple-500/5 p-6 hover:border-purple-500/40 transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <span className="text-3xl">{f.icon}</span>
                  <h3 className="text-lg font-bold text-white">{f.title}</h3>
                </div>
                <p className="text-white/50 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6 bg-[#0f0f0f]">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black mb-4">Tarifs. Sans astérisque. Sans surprise.</h2>
            <p className="text-white/40">Tous les prix sont HT. Résiliation à tout moment. Pas de frais cachés, nous ne sommes pas des banquiers.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 items-start">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-3xl border p-8 ${plan.color}`}>
                {plan.badge && (
                  <div className={`absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 text-white text-xs font-bold rounded-full shadow-lg ${plan.name.includes("Nova") ? "bg-purple-500" : "bg-orange-500"}`}>
                    {plan.badge}
                  </div>
                )}
                <div className="text-xl font-bold text-white mb-1">{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-white/40 mb-2 text-sm">{plan.period}</span>
                </div>
                <div className={`text-sm mb-8 ${plan.name.includes("IA") ? "text-purple-400" : "text-orange-400"}`}>{plan.trial}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                      <span className={`mt-0.5 flex-shrink-0 ${plan.name.includes("IA") ? "text-purple-400" : "text-emerald-400"}`}>✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block w-full py-3.5 rounded-xl font-semibold text-center transition-all ${plan.ctaColor}`}>
                  Dominer le marché →
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden text-center">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-purple-500/10 pointer-events-none" />
        <h2 className="text-4xl md:text-6xl font-black mb-6">
          Dans cinq ans, tout le monde fonctionnera comme ça.<br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Soyez le premier. Pas le dernier.</span>
        </h2>
        <div className="flex justify-center mt-10">
          <Link href="/register" className="px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-orange-500/30">
            Démarrer la révolution →
          </Link>
        </div>
      </section>

      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-black text-white">Ma <span className="text-orange-500">Table</span></div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <span>© 2026 Ma Table — SNHTech & Novavivo.online</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
