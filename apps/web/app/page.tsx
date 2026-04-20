import Link from "next/link";

// ─── Data ─────────────────────────────────────────────────────────────────────

const features = [
  {
    icon: "📱",
    title: "Scan → commande en 15 s",
    desc: "Vos clients scannent, choisissent, commandent. Sans app, sans compte, sans serveur pour prendre les commandes.",
    highlight: true,
  },
  {
    icon: "⚡",
    title: "Cuisine en temps réel",
    desc: "Chaque commande arrive instantanément sur votre tableau de bord. Fini les bons papier et les cris depuis la salle.",
    highlight: false,
  },
  {
    icon: "📅",
    title: "Réservations avec arrhes",
    desc: "Vos clients réservent en ligne sur votre page publique. Acompte Stripe intégré pour sécuriser les no-shows.",
    highlight: false,
  },
  {
    icon: "🌿",
    title: "Allergènes EU & régimes",
    desc: "14 allergènes réglementaires (INCO 1169/2011) affichés automatiquement. Badges végétarien, halal, sans gluten…",
    highlight: false,
  },
  {
    icon: "⭐",
    title: "Avis vérifiés par plat",
    desc: "Vos clients notent chaque plat et chaque serveur après paiement. Les avis sont liés à une vraie commande.",
    highlight: false,
  },
  {
    icon: "📊",
    title: "Analytics & export Z",
    desc: "CA par jour, ticket moyen, top plats, performance par serveur. Export Z comptable en un clic.",
    highlight: false,
  },
  {
    icon: "🔔",
    title: "Appel serveur à table",
    desc: "Un bouton sur la page client envoie une alerte temps réel au dashboard. La table reçoit de l'aide en secondes.",
    highlight: false,
  },
  {
    icon: "🌐",
    title: "Page vitrine gratuite",
    desc: "Chaque restaurant obtient sa page publique sur matable.pro/votrenom. Menu, horaires, avis, réservations — tout inclus.",
    highlight: false,
  },
  {
    icon: "💳",
    title: "Paiement Stripe intégré",
    desc: "Carte, espèces, caisse — le client choisit. Pourboire optionnel. La session se clôture automatiquement.",
    highlight: false,
  },
];

const steps = [
  {
    n: "01",
    icon: "🏪",
    title: "Créez en 2 minutes",
    desc: "Inscrivez-vous, nommez votre restaurant, ajoutez vos plats. Aucune installation, aucun matériel.",
  },
  {
    n: "02",
    icon: "🖨️",
    title: "Imprimez les QR codes",
    desc: "Générez un PDF A4 avec un QR par table. Plastifiez et collez — c'est fait pour durer.",
  },
  {
    n: "03",
    icon: "🚀",
    title: "Les clients commandent",
    desc: "Scan → menu → panier → paiement. Vous recevez tout en direct. Vos serveurs s'occupent du service, pas des commandes.",
  },
];

const testimonials = [
  {
    name: "Sophie M.",
    role: "Propriétaire, Brasserie des Halles",
    quote: "On a réduit le temps de prise de commande de 40 %. Les erreurs de commande ont disparu. Mes serveurs passent maintenant leur temps à accueillir, pas à griffonner.",
    avatar: "SM",
  },
  {
    name: "Karim B.",
    role: "Chef, Restaurant L'Atelier",
    quote: "En cuisine, on voit les commandes arriver en temps réel, classées par table. Plus besoin de déchiffrer les tickets papier. C'est calme, c'est propre.",
    avatar: "KB",
  },
  {
    name: "Lucie V.",
    role: "Gérante, Café du Port",
    quote: "La page vitrine avec les réservations, c'est ce qui m'a convaincue. J'ai une présence pro en ligne sans payer une agence web.",
    avatar: "LV",
  },
];

const competitors = [
  { feat: "Commande depuis la table", us: true, sunday: false },
  { feat: "Réservations avec arrhes", us: true, sunday: false },
  { feat: "Dashboard cuisine temps réel", us: true, sunday: false },
  { feat: "Page vitrine publique incluse", us: true, sunday: false },
  { feat: "Allergènes 14 EU réglementaires", us: true, sunday: false },
  { feat: "Avis vérifiés par plat", us: true, sunday: false },
  { feat: "Appel serveur à table", us: true, sunday: false },
  { feat: "Analytics & export Z", us: true, sunday: false },
  { feat: "Paiement Stripe", us: true, sunday: true },
  { feat: "Sans app client", us: true, sunday: true },
];

const stats = [
  { value: "15s", label: "de la table à la cuisine", sub: "zéro friction" },
  { value: "0€", label: "pour démarrer", sub: "sans CB requise" },
  { value: "14", label: "allergènes EU inclus", sub: "conformité INCO" },
  { value: "∞", label: "tables simultanées", sub: "0 limite" },
];

// ─── Component ────────────────────────────────────────────────────────────────

export default function Home() {
  return (
    <div className="min-h-screen bg-[#0d0d0d] text-white overflow-x-hidden">

      {/* ── Nav ── */}
      <nav className="fixed top-0 inset-x-0 z-50 border-b border-white/5 bg-[#0d0d0d]/80 backdrop-blur-xl">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-extrabold text-white tracking-tight">
            A<span className="text-brand"> table</span> !
          </span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-sm text-white/60 hover:text-white transition px-4 py-2">
              Connexion
            </Link>
            <Link href="/register" className="bg-brand hover:bg-orange-500 transition text-white text-sm font-semibold px-5 py-2.5 rounded-xl shadow-lg shadow-brand/20">
              Essai gratuit →
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="relative pt-40 pb-28 px-6 text-center overflow-hidden">
        {/* Ambient glow */}
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-brand/20 rounded-full blur-[120px] opacity-60" />
        </div>

        <div className="relative max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-white/5 border border-white/10 text-orange-300 text-xs font-semibold px-4 py-2 rounded-full mb-8 uppercase tracking-widest">
            ✦ La solution que Sunday n'est pas
          </div>

          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-[1.05]">
            Commande, paiement{" "}
            <br className="hidden md:block" />
            <span className="text-brand">et gestion</span> — tout-en-un
          </h1>

          <p className="text-xl text-white/50 max-w-2xl mx-auto mb-10 leading-relaxed">
            Vos clients scannent le QR code, commandent et paient en 15 secondes.
            Vous gérez votre salle, votre cuisine et vos réservations depuis un seul dashboard.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-6">
            <Link
              href="/register"
              className="bg-brand hover:bg-orange-500 text-white font-bold px-8 py-4 rounded-2xl text-lg shadow-xl shadow-brand/30 transition"
            >
              Créer mon restaurant — c'est gratuit
            </Link>
            <Link
              href="/bistrot-demo"
              target="_blank"
              className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-semibold px-8 py-4 rounded-2xl text-lg transition"
            >
              Voir la démo live →
            </Link>
          </div>
          <p className="text-xs text-white/30">Aucune carte bancaire · Prêt en 5 minutes · Annulation quand vous voulez</p>
        </div>

        {/* ── Mock UI ── */}
        <div className="relative mt-20 max-w-5xl mx-auto grid md:grid-cols-3 gap-4 text-left">
          {/* Phone client */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-xs text-white/40 font-medium">Client · Table 4</span>
            </div>
            <div className="space-y-3">
              {[
                { name: "Burger maison", prix: "14,00 €", badge: "🌿", qty: 1 },
                { name: "Frites maison", prix: "5,00 €", badge: null, qty: 2 },
                { name: "Eau pétillante", prix: "3,50 €", badge: null, qty: 1 },
              ].map((it) => (
                <div key={it.name} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <div>
                    <span className="text-sm font-medium text-white">{it.name}</span>
                    {it.badge && <span className="ml-1.5 text-xs">{it.badge}</span>}
                    <div className="text-xs text-white/40">{it.prix}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-white/10 flex items-center justify-center text-xs text-white/60">−</span>
                    <span className="text-sm font-bold">{it.qty}</span>
                    <span className="w-6 h-6 rounded-lg bg-brand flex items-center justify-center text-xs text-white font-bold">+</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 bg-brand rounded-xl py-2.5 text-center text-sm font-bold text-white">
              Commander · 22,50 €
            </div>
          </div>

          {/* Dashboard cuisine */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-xs text-white/40 font-medium">Cuisine · En direct</span>
            </div>
            <div className="space-y-2">
              {[
                { table: 4, items: "1× Burger · 2× Frites", status: "Nouveau", dot: "bg-green-400" },
                { table: 2, items: "2× Salade César · 1× Vin", status: "En cuisson", dot: "bg-orange-400" },
                { table: 7, items: "3× Tiramisu", status: "Servi ✓", dot: "bg-blue-400" },
              ].map((o) => (
                <div key={o.table} className="flex items-start justify-between p-2.5 bg-white/5 rounded-xl gap-2">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full mt-0.5 shrink-0 ${o.dot}`} />
                    <div>
                      <div className="text-xs font-bold text-white">Table {o.table}</div>
                      <div className="text-[11px] text-white/40">{o.items}</div>
                    </div>
                  </div>
                  <span className="text-[10px] bg-white/10 px-2 py-0.5 rounded-full text-white/70 shrink-0">
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Analytics */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-5 backdrop-blur">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-2 h-2 rounded-full bg-purple-400" />
              <span className="text-xs text-white/40 font-medium">Analytics · Aujourd'hui</span>
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <span className="text-xs text-white/40">Chiffre d'affaires</span>
                <span className="text-xl font-extrabold text-white">1 847 €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40">Commandes</span>
                <span className="text-sm font-bold">47</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40">Ticket moyen</span>
                <span className="text-sm font-bold">39,30 €</span>
              </div>
              <div className="flex justify-between">
                <span className="text-xs text-white/40">Top plat</span>
                <span className="text-sm font-bold text-brand">🍔 Burger ×18</span>
              </div>
              <div className="pt-2 border-t border-white/5 flex justify-between items-center">
                <span className="text-xs text-white/40">Pourboires</span>
                <span className="text-sm font-bold text-green-400">+124 €</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-16 border-y border-white/5">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl md:text-5xl font-extrabold text-brand mb-1">{s.value}</div>
              <div className="text-sm text-white/60 font-medium">{s.label}</div>
              <div className="text-xs text-white/30 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Comparatif Sunday ── */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="text-xs text-brand/80 font-bold uppercase tracking-widest mb-3">Pourquoi pas Sunday ?</div>
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">
              Sunday gère le paiement.<br />
              <span className="text-brand">A table ! gère tout le reste aussi.</span>
            </h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Sunday est une solution de paiement par QR code. C'est tout.
              A table ! inclut la commande, la cuisine, les réservations, les avis, les analytics — sans surcoût.
            </p>
          </div>

          <div className="bg-white/3 border border-white/10 rounded-2xl overflow-hidden">
            <div className="grid grid-cols-3 text-xs font-bold uppercase tracking-wider text-white/40 px-5 py-3 border-b border-white/5">
              <span>Fonctionnalité</span>
              <span className="text-center text-brand">A table !</span>
              <span className="text-center text-white/30">Sunday</span>
            </div>
            {competitors.map((c, i) => (
              <div key={c.feat} className={`grid grid-cols-3 items-center px-5 py-3 text-sm ${i % 2 === 0 ? "" : "bg-white/[0.02]"}`}>
                <span className="text-white/70">{c.feat}</span>
                <span className="text-center text-xl">{c.us ? "✅" : "❌"}</span>
                <span className="text-center text-xl">{c.sunday ? "✅" : "❌"}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features grid ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Une plateforme. Tout compris.</h2>
            <p className="text-white/40 max-w-xl mx-auto">
              Pas d'extensions payantes, pas de modules optionnels. Tout est inclus dès le premier jour.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-4">
            {features.map((f) => (
              <div
                key={f.title}
                className={`rounded-2xl p-5 border transition-all ${
                  f.highlight
                    ? "bg-brand/10 border-brand/30 shadow-lg shadow-brand/10"
                    : "bg-white/3 border-white/8 hover:bg-white/5"
                }`}
              >
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold text-white mb-2">{f.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Opérationnel en 5 minutes</h2>
            <p className="text-white/40">Pas de matériel. Pas de formation. Juste un téléphone et une imprimante.</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            {/* Connecting line */}
            <div className="hidden md:block absolute top-8 left-1/3 right-1/3 h-px bg-gradient-to-r from-transparent via-brand/40 to-transparent" />
            {steps.map((s) => (
              <div key={s.n} className="text-center relative">
                <div className="w-16 h-16 rounded-2xl bg-brand/10 border border-brand/20 flex items-center justify-center text-3xl mx-auto mb-4">
                  {s.icon}
                </div>
                <div className="text-xs font-bold text-brand/60 uppercase tracking-widest mb-2">{s.n}</div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ils ont digitalisé leur salle</h2>
            <p className="text-white/40">Témoignages de restaurateurs qui ont adopté A table !</p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t) => (
              <div key={t.name} className="bg-white/3 border border-white/8 rounded-2xl p-6">
                <div className="flex text-brand text-lg mb-4">★★★★★</div>
                <p className="text-sm text-white/60 leading-relaxed mb-6 italic">
                  &ldquo;{t.quote}&rdquo;
                </p>
                <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                  <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white">{t.name}</div>
                    <div className="text-xs text-white/40">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Pricing teaser ── */}
      <section className="py-24 px-6 border-t border-white/5">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Simple et transparent</h2>
            <p className="text-white/40">Commencez gratuitement. Passez à la vitesse supérieure quand vous êtes prêt.</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6 max-w-2xl mx-auto">
            {/* Free */}
            <div className="bg-white/3 border border-white/10 rounded-2xl p-7">
              <div className="text-xs font-bold uppercase tracking-widest text-white/40 mb-4">Starter</div>
              <div className="text-4xl font-extrabold mb-1">Gratuit</div>
              <div className="text-sm text-white/40 mb-6">Pour démarrer sans risque</div>
              <ul className="space-y-2 text-sm text-white/60 mb-8">
                {["Jusqu'à 5 tables", "Menu illimité", "Commande & paiement", "QR codes PDF", "Page vitrine"].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-brand">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-white/8 hover:bg-white/15 border border-white/15 text-white font-semibold py-3 rounded-xl transition">
                Commencer gratuitement
              </Link>
            </div>

            {/* Pro */}
            <div className="bg-brand/10 border border-brand/30 rounded-2xl p-7 relative overflow-hidden shadow-xl shadow-brand/10">
              <div className="absolute top-4 right-4 text-xs bg-brand text-white font-bold px-2 py-0.5 rounded-full">
                Populaire
              </div>
              <div className="text-xs font-bold uppercase tracking-widest text-brand/80 mb-4">Pro</div>
              <div className="text-4xl font-extrabold mb-1">49 €<span className="text-xl text-white/40 font-normal">/mois</span></div>
              <div className="text-sm text-white/40 mb-6">Tout sans limite</div>
              <ul className="space-y-2 text-sm text-white/70 mb-8">
                {[
                  "Tables illimitées",
                  "Réservations + arrhes Stripe",
                  "Analytics & export Z",
                  "Avis vérifiés",
                  "Gestion des stocks",
                  "Appel serveur",
                  "Multi-serveurs avec ratings",
                  "Support prioritaire",
                ].map((f) => (
                  <li key={f} className="flex items-center gap-2">
                    <span className="text-brand">✓</span> {f}
                  </li>
                ))}
              </ul>
              <Link href="/register" className="block text-center bg-brand hover:bg-orange-500 text-white font-bold py-3 rounded-xl transition shadow-lg shadow-brand/20">
                Essayer 14 jours gratuits →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── CTA final ── */}
      <section className="py-32 px-6 text-center relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-brand/15 rounded-full blur-[100px]" />
        </div>
        <div className="relative max-w-2xl mx-auto">
          <h2 className="text-4xl md:text-5xl font-extrabold mb-6 leading-tight">
            Votre salle mérite mieux<br />
            <span className="text-brand">que des bons papier.</span>
          </h2>
          <p className="text-white/40 text-lg mb-10">
            Rejoignez les restaurants qui ont supprimé les erreurs de commande et les files d'attente en caisse.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-3 bg-brand hover:bg-orange-500 text-white font-bold px-10 py-5 rounded-2xl text-lg shadow-2xl shadow-brand/30 transition"
          >
            Créer mon restaurant maintenant →
          </Link>
          <p className="text-white/25 text-sm mt-5">Aucune carte bancaire · 5 minutes pour commencer · Annulable à tout moment</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 py-12 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8 mb-10">
            <div>
              <div className="font-extrabold text-lg mb-3">A<span className="text-brand"> table</span> !</div>
              <p className="text-xs text-white/30 leading-relaxed">
                La plateforme de commande et de gestion à table pour les restaurants modernes.
              </p>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Produit</div>
              <ul className="space-y-2 text-sm text-white/50">
                <li><Link href="/register" className="hover:text-white transition">Essai gratuit</Link></li>
                <li><Link href="/bistrot-demo" className="hover:text-white transition">Voir la démo</Link></li>
                <li><Link href="/login" className="hover:text-white transition">Connexion</Link></li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Fonctionnalités</div>
              <ul className="space-y-2 text-sm text-white/50">
                <li>Commande QR code</li>
                <li>Réservations en ligne</li>
                <li>Dashboard cuisine</li>
                <li>Analytics & export Z</li>
              </ul>
            </div>
            <div>
              <div className="text-xs font-bold uppercase tracking-widest text-white/30 mb-3">Contact</div>
              <ul className="space-y-2 text-sm text-white/50">
                <li>contact@matable.pro</li>
                <li>Support 7j/7</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3 text-xs text-white/25">
            <span>© 2026 A table ! — SaaS de commande par QR code</span>
            <span>Fait avec ❤️ pour les restaurateurs français</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
