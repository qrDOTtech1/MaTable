import Link from "next/link";
import LandingTestimonials from "./LandingTestimonials";

// ─── Comparison data ──────────────────────────────────────────────────────────
const comparisons = [
  { feature: "Commande QR sans app ni compte", us: true, them: false },
  { feature: "Temps réel cuisine (Socket.io)", us: true, them: false },
  { feature: "Avis vérifiés par plat & serveur", us: true, them: false },
  { feature: "Réservations + arrhes Stripe", us: true, them: false },
  { feature: "14 allergènes EU (INCO 1169/2011)", us: true, them: false },
  { feature: "Analytics & export Z comptable", us: true, them: false },
  { feature: "Page vitrine publique (matable.pro/slug)", us: true, them: false },
  { feature: "Matériel POS disponible à la commande", us: true, them: false },
  { feature: "Support QR vinyle livré chez vous", us: true, them: false },
  { feature: "Essai gratuit 14 jours sans CB", us: true, them: false },
  { feature: "Prix transparent sans engagement", us: true, them: false },
  { feature: "Hébergement 100 % France / Europe", us: true, them: false },
];

// ─── Demo steps ───────────────────────────────────────────────────────────────
const demoSteps = [
  {
    step: "01",
    title: "Créez votre menu en 5 minutes",
    desc: "Ajoutez vos plats, photos, allergènes, prix et variantes depuis le dashboard. Tout se synchronise instantanément.",
    screen: "menu-editor",
    color: "from-orange-500/20 to-amber-500/10",
  },
  {
    step: "02",
    title: "Imprimez ou commandez vos QR codes",
    desc: "Générez un PDF A4 à imprimer chez vous, ou commandez nos supports vinyle avec QR intégré — livrés sous 5 jours.",
    screen: "qr-print",
    color: "from-violet-500/20 to-purple-500/10",
  },
  {
    step: "03",
    title: "Vos clients commandent depuis leur téléphone",
    desc: "Scan → menu → commande → paiement. Pas d'app à télécharger, pas de compte à créer. Ça marche en 4G comme en WiFi.",
    screen: "client-order",
    color: "from-emerald-500/20 to-teal-500/10",
  },
  {
    step: "04",
    title: "Cuisine et caisse reçoivent tout en temps réel",
    desc: "Les commandes arrivent sur votre écran cuisine, caisse et tableau de bord simultanément. Aucune saisie manuelle.",
    screen: "kitchen",
    color: "from-blue-500/20 to-cyan-500/10",
  },
];

// ─── Hardware products ────────────────────────────────────────────────────────
const hardware = [
  {
    name: "POS Client",
    desc: "Tablette murale dédiée à la commande client. Idéale pour les comptoirs, fast-casuals et food courts.",
    icon: "🖥️",
    tag: "Sur devis",
  },
  {
    name: "POS Serveur",
    desc: "Tablette de prise de commande en salle pour vos serveurs. Synchronisée avec le dashboard en temps réel.",
    icon: "📱",
    tag: "Sur devis",
  },
  {
    name: "POS Caisse",
    desc: "Terminal de caisse connecté à vos sessions de table. Encaissement en un clic, export Z automatique.",
    icon: "🖨️",
    tag: "Sur devis",
  },
  {
    name: "Support QR Vinyle",
    desc: "Étiquette vinyle résistante avec QR unique par table, découpée à vos dimensions. Livraison 5 jours.",
    icon: "🎯",
    tag: "Dès 3€/table",
  },
  {
    name: "Chevalet QR Acrylique",
    desc: "Chevalet acrylique premium avec QR sérigraphié et logo restaurant. Parfait pour les tables gastronomiques.",
    icon: "💎",
    tag: "Dès 8€/table",
  },
  {
    name: "PDF A4 à imprimer",
    desc: "Planche A4 gratuite générée depuis votre dashboard, un QR par table. Prêt en 30 secondes.",
    icon: "📄",
    tag: "Gratuit",
  },
];

// ─── Features ─────────────────────────────────────────────────────────────────
const features = [
  { icon: "📱", title: "Scan → commande en 15 s", desc: "Sans app, sans compte, sans friction. Le client scanne et commande en 15 secondes depuis son propre téléphone.", highlight: true },
  { icon: "⚡", title: "Cuisine en temps réel", desc: "Chaque commande arrive instantanément sur votre écran cuisine via WebSocket. Fini les bons papier et les cris.", highlight: false },
  { icon: "📅", title: "Réservations + arrhes", desc: "Page de réservation publique avec créneaux dynamiques. Arrhes Stripe pour sécuriser les no-shows.", highlight: false },
  { icon: "🌿", title: "Allergènes EU légaux", desc: "14 allergènes réglementaires (INCO 1169/2011) affichés automatiquement. Conformité légale garantie.", highlight: false },
  { icon: "⭐", title: "Avis vérifiés", desc: "Notations par plat et par serveur uniquement après paiement réel. Anti-fake par design.", highlight: false },
  { icon: "📊", title: "Analytics & export Z", desc: "CA par jour, ticket moyen, top plats, performance serveur. Export Z comptable en un clic.", highlight: false },
  { icon: "🔔", title: "Appel serveur", desc: "Un bouton sur la page client envoie une alerte temps réel au dashboard. Réponse en secondes.", highlight: false },
  { icon: "🌐", title: "Vitrine publique", desc: "matable.pro/votre-nom — page SEO avec menu, horaires, avis et bouton de réservation.", highlight: false },
  { icon: "💸", title: "Pourboires digitaux", desc: "Suggestions de pourboire au moment du paiement. Augmentez vos tips sans demander en personne.", highlight: false },
];

// ─── Testimonials ─────────────────────────────────────────────────────────────
const testimonials = [
  {
    quote: "On a mis en place A table ! en moins d'une heure. Le soir même, 100% des commandes passaient par QR. Le service est fluide, ma brigade adore.",
    name: "Thomas R.",
    role: "Chef-propriétaire, Le Comptoir du 7e — Paris",
    rating: 5,
  },
  {
    quote: "Les clients paient plus vite, laissent plus de pourboires, et on a réduit les erreurs de commande à zéro. Je recommande sans hésiter.",
    name: "Leïla M.",
    role: "Gérante, Brunch & Co — Lyon",
    rating: 5,
  },
  {
    quote: "Les réservations avec arrhes ont divisé nos no-shows par 4 le premier mois. Ça vaut largement l'abonnement.",
    name: "Antoine P.",
    role: "Restaurateur, La Cave Moderne — Bordeaux",
    rating: 5,
  },
];

// ─── Pricing ──────────────────────────────────────────────────────────────────
const plans = [
  {
    name: "Starter",
    price: "49,99 €",
    period: "/ mois HT",
    trial: "14 jours d'essai gratuit",
    color: "border-orange-500/40 bg-orange-500/5",
    ctaColor: "bg-orange-500 hover:bg-orange-400 text-white",
    features: [
      "Jusqu'à 30 tables",
      "Menu illimité (plats, photos, allergènes)",
      "Commandes QR temps réel",
      "Réservations en ligne",
      "Page vitrine publique",
      "Analytics de base",
      "Support par email",
    ],
  },
  {
    name: "Pro",
    price: "139,99 €",
    period: "/ mois HT",
    trial: "Démo personnalisée offerte",
    color: "border-orange-500 bg-gradient-to-b from-orange-500/10 to-transparent ring-1 ring-orange-500/30",
    ctaColor: "bg-orange-500 hover:bg-orange-400 text-white",
    badge: "Le plus populaire",
    features: [
      "Tables illimitées",
      "Multi-utilisateurs (caisse, cuisine, salle)",
      "Export Z comptable quotidien",
      "Pourboires digitaux",
      "Avis vérifiés par plat & serveur",
      "Analytics avancées + CA par serveur",
      "Matériel POS & supports QR inclus sur devis",
      "Support prioritaire 7j/7",
      "Onboarding dédié",
    ],
  },
];

// ─── Stats ────────────────────────────────────────────────────────────────────
const stats = [
  { value: "15 s", label: "Temps moyen de commande" },
  { value: "−78%", label: "Erreurs de commande" },
  { value: "+34%", label: "Panier moyen" },
  { value: "×4", label: "Moins de no-shows" },
];

// ─── Component ────────────────────────────────────────────────────────────────
export default function HomePage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white overflow-x-hidden">

      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav className="fixed top-0 left-0 right-0 z-50 border-b border-white/[0.06] bg-[#0a0a0a]/90 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-2xl font-black tracking-tight text-white">A<span className="text-orange-500"> table</span> !</span>
          </div>
          <div className="hidden md:flex items-center gap-8 text-sm text-white/60">
            <a href="#demo" className="hover:text-white transition-colors">Comment ça marche</a>
            <a href="#hardware" className="hover:text-white transition-colors">Matériel</a>
            <a href="#compare" className="hover:text-white transition-colors">Comparatif</a>
            <a href="#pricing" className="hover:text-white transition-colors">Tarifs</a>
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
        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[500px] bg-orange-500/10 rounded-full blur-[120px] pointer-events-none" />
        <div className="absolute top-2/3 left-1/4 w-[300px] h-[300px] bg-violet-500/8 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 max-w-5xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-orange-500/30 bg-orange-500/10 text-orange-400 text-sm mb-8">
            <span className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            Essai gratuit 14 jours · Sans carte bancaire
          </div>

          <h1 className="text-5xl md:text-7xl font-black leading-[1.05] tracking-tight mb-6">
            Vos clients commandent<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              en scannant un QR code.
            </span>
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Pas d'app. Pas de compte. Pas de terminal à acheter.
            Votre menu sur le téléphone de vos clients en 15 secondes —
            commandes en temps réel, réservations, analytics et avis vérifiés.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <Link href="/register" className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold text-lg transition-all hover:scale-[1.02] shadow-lg shadow-orange-500/25">
              Démarrer gratuitement →
            </Link>
            <a href="#demo" className="px-8 py-4 border border-white/10 hover:border-white/20 text-white/70 hover:text-white rounded-xl font-medium transition-all">
              Voir la démo ↓
            </a>
          </div>

          {/* Triple mockup */}
          <div className="relative flex items-end justify-center gap-4 max-w-4xl mx-auto">
            {/* Kitchen display */}
            <div className="hidden md:block w-64 h-80 rounded-2xl border border-white/10 bg-[#111] overflow-hidden shadow-2xl rotate-[-3deg] translate-y-6 opacity-80">
              <div className="h-8 bg-[#161616] border-b border-white/5 flex items-center px-3 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/70" /><div className="w-2 h-2 rounded-full bg-yellow-500/70" /><div className="w-2 h-2 rounded-full bg-green-500/70" />
                <span className="text-white/30 text-xs ml-2">Cuisine</span>
              </div>
              <div className="p-3 space-y-2">
                <div className="text-xs text-white/30 font-medium mb-3">PENDING · 3 commandes</div>
                {[
                  { table: "T.3", item: "Burger Black Angus", mod: "Saignant, sans oignons" },
                  { table: "T.7", item: "Risotto Parmesan", mod: "Vegan ✓" },
                  { table: "T.1", item: "Tartare de bœuf", mod: "Extra câpres" },
                ].map((o, i) => (
                  <div key={i} className="bg-[#1a1a1a] rounded-lg p-2.5 border border-white/5">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[10px] font-bold text-orange-400">{o.table}</span>
                      <span className="text-[10px] text-white/30">{["12:34","12:36","12:41"][i]}</span>
                    </div>
                    <div className="text-xs text-white/80 font-medium">{o.item}</div>
                    <div className="text-[10px] text-white/40 mt-0.5">{o.mod}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Client phone - center, bigger */}
            <div className="w-56 md:w-72 h-[500px] md:h-[560px] rounded-[2.5rem] border-2 border-white/15 bg-[#111] overflow-hidden shadow-2xl shadow-black/60 z-10">
              <div className="h-10 bg-[#0d0d0d] flex items-center justify-center">
                <div className="w-20 h-5 bg-[#1a1a1a] rounded-full" />
              </div>
              <div className="flex flex-col h-[calc(100%-2.5rem)]">
                {/* Restaurant header */}
                <div className="h-24 bg-gradient-to-br from-orange-900/40 to-amber-900/20 flex flex-col items-center justify-center border-b border-white/5">
                  <div className="text-lg font-black text-white">Le Comptoir</div>
                  <div className="text-xs text-orange-400/80 mt-1">Table 3 · Ouvert maintenant</div>
                </div>
                {/* Menu */}
                <div className="flex-1 overflow-hidden p-3 space-y-2 bg-[#0f0f0f]">
                  <div className="text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">🍔 Burgers</div>
                  {[
                    { name: "Black Angus 180g", price: "18,90 €", badge: "🌶️" },
                    { name: "Végétal Shiitaké", price: "16,50 €", badge: "🌿" },
                    { name: "Classic Cheddar", price: "14,90 €", badge: "" },
                  ].map((item, i) => (
                    <div key={i} className={`flex items-center gap-2 p-2 rounded-lg border ${i === 0 ? "border-orange-500/30 bg-orange-500/5" : "border-white/5 bg-[#1a1a1a]"}`}>
                      <div className="w-8 h-8 rounded-lg bg-[#252525] flex items-center justify-center text-sm">🍔</div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs text-white/80 truncate">{item.name}</div>
                        <div className="text-[10px] text-orange-400">{item.price} {item.badge}</div>
                      </div>
                      {i === 0 && <div className="w-5 h-5 rounded-full bg-orange-500 flex items-center justify-center text-[10px] font-bold">1</div>}
                    </div>
                  ))}
                </div>
                {/* Cart button */}
                <div className="p-3 bg-[#0d0d0d] border-t border-white/5">
                  <div className="w-full py-2.5 bg-orange-500 rounded-xl text-xs font-bold text-center text-white">
                    Commander · 18,90 €
                  </div>
                </div>
              </div>
            </div>

            {/* Analytics */}
            <div className="hidden md:block w-64 h-80 rounded-2xl border border-white/10 bg-[#111] overflow-hidden shadow-2xl rotate-[3deg] translate-y-6 opacity-80">
              <div className="h-8 bg-[#161616] border-b border-white/5 flex items-center px-3 gap-1.5">
                <div className="w-2 h-2 rounded-full bg-red-500/70" /><div className="w-2 h-2 rounded-full bg-yellow-500/70" /><div className="w-2 h-2 rounded-full bg-green-500/70" />
                <span className="text-white/30 text-xs ml-2">Analytics</span>
              </div>
              <div className="p-4 space-y-4">
                <div>
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">CA aujourd'hui</div>
                  <div className="text-2xl font-black text-white mt-0.5">2 847 <span className="text-sm font-normal text-white/40">€</span></div>
                  <div className="text-[10px] text-emerald-400 mt-0.5">↑ +23% vs hier</div>
                </div>
                {/* Mini bar chart */}
                <div className="flex items-end gap-1 h-16">
                  {[40, 65, 45, 80, 70, 90, 100].map((h, i) => (
                    <div key={i} className={`flex-1 rounded-sm ${i === 6 ? "bg-orange-500" : "bg-white/10"}`} style={{ height: `${h}%` }} />
                  ))}
                </div>
                <div className="space-y-1.5">
                  <div className="text-[10px] text-white/30 uppercase tracking-wider">Top plats</div>
                  {["Burger Black Angus", "Risotto Parmesan", "Tartare bœuf"].map((p, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded text-[8px] bg-white/5 flex items-center justify-center text-white/40">{i + 1}</div>
                      <div className="text-[10px] text-white/60 flex-1">{p}</div>
                      <div className="text-[10px] text-orange-400">{[47, 31, 28][i]}x</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats bar ───────────────────────────────────────────────────────── */}
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

      {/* ── Demo / Tutorial ─────────────────────────────────────────────────── */}
      <section id="demo" className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20">
            <div className="inline-block px-4 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-400 text-sm mb-4">
              Comment ça marche
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Opérationnel en{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                moins d'une heure.
              </span>
            </h2>
            <p className="text-white/40 mt-4 text-lg max-w-xl mx-auto">
              Quatre étapes. Zéro ligne de code. Zéro technicien.
            </p>
          </div>

          <div className="space-y-8">
            {demoSteps.map((step, i) => (
              <div key={i} className={`relative rounded-3xl border border-white/[0.08] bg-gradient-to-r ${step.color} overflow-hidden`}>
                <div className="flex flex-col md:flex-row items-start gap-8 p-8 md:p-10">
                  {/* Step number */}
                  <div className="flex-shrink-0">
                    <div className="text-6xl font-black text-white/10 select-none leading-none">{step.step}</div>
                  </div>
                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-white mb-3">{step.title}</h3>
                    <p className="text-white/50 text-lg leading-relaxed">{step.desc}</p>
                    {i === 0 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {["Photos HD", "Allergènes EU", "Variantes & modifiers", "Multi-catégories", "Stocks auto"].map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-orange-500/15 border border-orange-500/20 text-orange-300 text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                    {i === 1 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {["PDF A4 gratuit", "Vinyle dès 3€/table", "Acrylique premium", "QR unique par table"].map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-violet-500/15 border border-violet-500/20 text-violet-300 text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                    {i === 2 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {["iPhone & Android", "4G & WiFi", "Allergènes affichés", "Pourboire digital", "Appel serveur"].map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-emerald-500/15 border border-emerald-500/20 text-emerald-300 text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                    {i === 3 && (
                      <div className="mt-6 flex flex-wrap gap-2">
                        {["Socket.io temps réel", "Vue cuisine", "Vue caisse", "Tableau de bord", "Export Z"].map(tag => (
                          <span key={tag} className="px-3 py-1 rounded-full bg-blue-500/15 border border-blue-500/20 text-blue-300 text-xs">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                  {/* Visual */}
                  <div className="flex-shrink-0 w-full md:w-64">
                    <DemoVisual screen={step.screen} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Hardware ────────────────────────────────────────────────────────── */}
      <section id="hardware" className="py-32 px-6 bg-[#0f0f0f]">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-4">
              Matériel & accessoires
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Le logiciel seul. Ou avec<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                le matériel qui va avec.
              </span>
            </h2>
            <p className="text-white/40 mt-4 text-lg max-w-2xl mx-auto">
              Commencez avec votre imprimante et une feuille A4. Passez à nos supports premium quand vous êtes prêt.
              Le logiciel fonctionne avec n'importe quel matériel.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6">
            {hardware.map((h) => (
              <div key={h.name} className="group rounded-2xl border border-white/[0.08] bg-[#141414] p-6 hover:border-orange-500/30 transition-all hover:bg-[#161616]">
                <div className="text-4xl mb-4">{h.icon}</div>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <h3 className="text-lg font-bold text-white">{h.name}</h3>
                  <span className="text-xs px-2 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 whitespace-nowrap">{h.tag}</span>
                </div>
                <p className="text-white/40 text-sm leading-relaxed">{h.desc}</p>
              </div>
            ))}
          </div>

          <div className="mt-10 text-center">
            <p className="text-white/30 text-sm">
              Matériel POS (client, serveur, caisse) disponible sur devis.{" "}
              <Link href="/contact" className="text-orange-400 hover:text-orange-300 transition-colors">Contactez-nous →</Link>
            </p>
          </div>
        </div>
      </section>

      {/* ── Features grid ───────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black">
              Tout ce qu'un restaurant moderne{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                doit avoir.
              </span>
            </h2>
          </div>
          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.title} className={`rounded-2xl border p-6 transition-all hover:scale-[1.01] ${f.highlight ? "border-orange-500/40 bg-orange-500/5 col-span-1 md:col-span-2" : "border-white/[0.08] bg-[#111]"}`}>
                <div className="text-3xl mb-4">{f.icon}</div>
                <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
                <p className="text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Comparison ──────────────────────────────────────────────────────── */}
      <section id="compare" className="py-32 px-6 bg-[#0f0f0f]">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-14">
            <div className="inline-block px-4 py-1 rounded-full bg-white/5 border border-white/10 text-white/50 text-sm mb-4">
              Comparatif
            </div>
            <h2 className="text-4xl md:text-5xl font-black">
              Pourquoi choisir{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
                A table ! ?
              </span>
            </h2>
          </div>

          <div className="rounded-3xl border border-white/[0.08] overflow-hidden">
            {/* Header */}
            <div className="grid grid-cols-3 bg-[#141414] border-b border-white/[0.08]">
              <div className="col-span-1 p-5 text-sm text-white/30 font-medium">Fonctionnalité</div>
              <div className="p-5 text-center">
                <div className="text-sm font-black text-orange-400">A table !</div>
              </div>
              <div className="p-5 text-center">
                <div className="text-sm font-medium text-white/30">Concurrents</div>
              </div>
            </div>
            {/* Rows */}
            {comparisons.map((c, i) => (
              <div key={i} className={`grid grid-cols-3 border-b border-white/[0.04] ${i % 2 === 0 ? "bg-[#0f0f0f]" : "bg-[#111]"}`}>
                <div className="col-span-1 p-4 text-sm text-white/50">{c.feature}</div>
                <div className="p-4 flex justify-center">
                  {c.us
                    ? <span className="text-emerald-400 text-lg">✓</span>
                    : <span className="text-red-500/60 text-lg">✗</span>}
                </div>
                <div className="p-4 flex justify-center">
                  {c.them
                    ? <span className="text-emerald-400 text-lg">✓</span>
                    : <span className="text-red-500/60 text-lg">✗</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <LandingTestimonials />

      {/* ── Testimonials ────────────────────────────────────────────────────── */}
      <section className="py-32 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-black">Ce que disent nos clients</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div key={i} className="rounded-2xl border border-white/[0.08] bg-[#111] p-7 flex flex-col gap-5">
                <div className="flex gap-1">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <span key={i} className="text-orange-400">★</span>
                  ))}
                </div>
                <p className="text-white/60 leading-relaxed text-sm flex-1">"{t.quote}"</p>
                <div>
                  <div className="font-semibold text-white text-sm">{t.name}</div>
                  <div className="text-white/30 text-xs mt-0.5">{t.role}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing ─────────────────────────────────────────────────────────── */}
      <section id="pricing" className="py-32 px-6 bg-[#0f0f0f]">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <div className="inline-block px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-4">
              Tarifs
            </div>
            <h2 className="text-4xl md:text-5xl font-black">Simple. Transparent. Sans surprise.</h2>
            <p className="text-white/40 mt-4">Tous les prix sont HT. Résiliation à tout moment.</p>
          </div>

          <div className="grid md:grid-cols-2 gap-6 items-start">
            {plans.map((plan) => (
              <div key={plan.name} className={`relative rounded-3xl border p-8 ${plan.color}`}>
                {plan.badge && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 bg-orange-500 text-white text-xs font-bold rounded-full shadow-lg shadow-orange-500/30">
                    {plan.badge}
                  </div>
                )}
                <div className="text-xl font-bold text-white mb-1">{plan.name}</div>
                <div className="flex items-end gap-1 mb-1">
                  <span className="text-5xl font-black text-white">{plan.price}</span>
                  <span className="text-white/40 mb-2">{plan.period}</span>
                </div>
                <div className="text-sm text-orange-400 mb-8">{plan.trial}</div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-sm text-white/60">
                      <span className="text-emerald-400 mt-0.5 flex-shrink-0">✓</span>
                      {f}
                    </li>
                  ))}
                </ul>
                <Link href="/register" className={`block w-full py-3.5 rounded-xl font-semibold text-center transition-all ${plan.ctaColor}`}>
                  Commencer →
                </Link>
              </div>
            ))}
          </div>

          <p className="text-center text-white/20 text-sm mt-8">
            Besoin d'une offre sur-mesure pour une chaîne ou un groupe ? {" "}
            <Link href="/contact" className="text-orange-400 hover:text-orange-300">Parlez-nous de votre projet →</Link>
          </p>
        </div>
      </section>

      {/* ── CTA finale ──────────────────────────────────────────────────────── */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-orange-500/10 via-transparent to-amber-500/10 pointer-events-none" />
        <div className="relative max-w-3xl mx-auto text-center">
          <h2 className="text-4xl md:text-6xl font-black mb-6">
            Votre restaurant mérite<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              mieux qu'un stylo et un bloc.
            </span>
          </h2>
          <p className="text-white/40 text-xl mb-10">
            Rejoignez les restaurateurs qui ont déjà modernisé leur service.
            14 jours gratuits. Aucune carte bancaire requise.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href="/register" className="px-10 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-lg transition-all hover:scale-[1.02] shadow-xl shadow-orange-500/30">
              Essayer gratuitement 14 jours →
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="border-t border-white/[0.06] py-12 px-6">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="text-xl font-black text-white">A<span className="text-orange-500"> table</span> !</div>
          <div className="flex items-center gap-6 text-sm text-white/30">
            <Link href="/login" className="hover:text-white/60 transition-colors">Connexion</Link>
            <Link href="/register" className="hover:text-white/60 transition-colors">Inscription</Link>
            <a href="mailto:contact@matable.pro" className="hover:text-white/60 transition-colors">Contact</a>
            <span>© 2026 A table !</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Demo visual component ────────────────────────────────────────────────────
function DemoVisual({ screen }: { screen: string }) {
  if (screen === "menu-editor") {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden text-[10px]">
        <div className="bg-[#161616] border-b border-white/5 px-3 py-2 text-white/30 font-medium">Dashboard · Menu</div>
        <div className="p-3 space-y-2">
          {[
            { name: "Burger Black Angus", price: "18,90 €", tags: ["🌾 Gluten", "🥩 Viande"] },
            { name: "Risotto Parmesan", price: "16,50 €", tags: ["🌿 Végé", "🥛 Lait"] },
            { name: "Tartare de bœuf", price: "22,00 €", tags: ["🥚 Œufs"] },
          ].map((item, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded-lg p-2 border border-white/5">
              <div className="flex justify-between items-center mb-1">
                <span className="text-white/70 font-medium">{item.name}</span>
                <span className="text-orange-400 font-bold">{item.price}</span>
              </div>
              <div className="flex gap-1 flex-wrap">
                {item.tags.map(tag => (
                  <span key={tag} className="px-1.5 py-0.5 rounded bg-white/5 text-white/30">{tag}</span>
                ))}
              </div>
            </div>
          ))}
          <div className="w-full py-1.5 bg-orange-500/80 rounded-lg text-center text-white font-bold">+ Ajouter un plat</div>
        </div>
      </div>
    );
  }

  if (screen === "qr-print") {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden text-[10px]">
        <div className="bg-[#161616] border-b border-white/5 px-3 py-2 text-white/30 font-medium">Dashboard · QR codes</div>
        <div className="p-4 space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {[1,2,3,4,5,6].map(n => (
              <div key={n} className="aspect-square bg-[#1a1a1a] rounded border border-white/5 flex flex-col items-center justify-center gap-1">
                <div className="w-8 h-8 bg-white/10 rounded grid grid-cols-3 gap-0.5 p-1">
                  {Array.from({length:9}).map((_,i) => (
                    <div key={i} className={`${[0,2,6,8,4].includes(i) ? "bg-white/60" : "bg-transparent"} rounded-[1px]`} />
                  ))}
                </div>
                <span className="text-white/30 font-medium">T.{n}</span>
              </div>
            ))}
          </div>
          <div className="flex gap-1.5">
            <div className="flex-1 py-1.5 bg-orange-500/80 rounded text-center text-white font-bold">PDF A4</div>
            <div className="flex-1 py-1.5 bg-white/5 rounded text-center text-white/40">Vinyle</div>
          </div>
        </div>
      </div>
    );
  }

  if (screen === "client-order") {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden text-[10px]">
        <div className="bg-gradient-to-r from-orange-900/30 to-amber-900/20 border-b border-white/5 px-3 py-3 text-center">
          <div className="text-white/80 font-bold text-xs">Le Comptoir · Table 3</div>
          <div className="text-orange-400/70 mt-0.5">Ouvert · Service du midi</div>
        </div>
        <div className="p-2 space-y-1.5">
          {["Burger Black Angus", "Salade César", "Eau plate 50cl"].map((item, i) => (
            <div key={i} className="flex items-center gap-2 p-1.5 bg-[#1a1a1a] rounded border border-white/5">
              <div className="w-6 h-6 rounded bg-white/5 flex items-center justify-center">
                {["🍔","🥗","💧"][i]}
              </div>
              <span className="flex-1 text-white/60">{item}</span>
              <span className="text-orange-400 font-bold">{["18,90","12,50","3,50"][i]}€</span>
            </div>
          ))}
          <div className="w-full py-1.5 bg-orange-500 rounded text-center text-white font-bold mt-2">Payer · 34,90 €</div>
        </div>
      </div>
    );
  }

  if (screen === "kitchen") {
    return (
      <div className="rounded-xl border border-white/10 bg-[#111] overflow-hidden text-[10px]">
        <div className="bg-[#161616] border-b border-white/5 px-3 py-2 flex justify-between">
          <span className="text-white/30 font-medium">Cuisine live</span>
          <span className="text-orange-400 font-bold animate-pulse">● Live</span>
        </div>
        <div className="p-2 space-y-1.5">
          {[
            { table: "T.3", item: "Burger Black Angus", status: "PENDING", color: "text-yellow-400" },
            { table: "T.7", item: "Risotto Parmesan", status: "COOKING", color: "text-orange-400" },
            { table: "T.1", item: "Tartare de bœuf", status: "SERVED", color: "text-emerald-400" },
          ].map((o, i) => (
            <div key={i} className="bg-[#1a1a1a] rounded border border-white/5 p-2">
              <div className="flex justify-between mb-0.5">
                <span className="font-bold text-white/70">{o.table}</span>
                <span className={`font-bold ${o.color}`}>{o.status}</span>
              </div>
              <div className="text-white/40">{o.item}</div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return null;
}