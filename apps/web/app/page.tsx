import Link from "next/link";

const features = [
  {
    icon: "📱",
    title: "Zéro friction client",
    desc: "Scan → menu → commande en 15 secondes. Pas d'app, pas de compte, pas de caissier.",
  },
  {
    icon: "⚡",
    title: "Cuisine en temps réel",
    desc: "Chaque commande apparaît instantanément sur votre tableau de bord. Fini les bons papier.",
  },
  {
    icon: "💳",
    title: "Paiement intégré",
    desc: "Stripe Checkout directement depuis la table. La session se ferme automatiquement.",
  },
  {
    icon: "🔒",
    title: "Isolation par table",
    desc: "Chaque table a un UUID unique. La table 3 ne voit jamais la commande de la table 7.",
  },
  {
    icon: "🖨️",
    title: "QR Codes en 1 clic",
    desc: "Générez un PDF prêt à imprimer avec les QR de toutes vos tables en quelques secondes.",
  },
  {
    icon: "📊",
    title: "Dashboard complet",
    desc: "Gérez votre menu, vos tables et suivez les commandes depuis une seule interface.",
  },
];

const steps = [
  {
    n: "01",
    title: "Créez votre restaurant",
    desc: "Inscription en 30 secondes. Ajoutez vos tables et votre menu en quelques clics.",
  },
  {
    n: "02",
    title: "Imprimez les QR codes",
    desc: "Générez et imprimez les QR codes. Collez-les sur chaque table, c'est prêt.",
  },
  {
    n: "03",
    title: "Les clients commandent",
    desc: "Scan → menu → commande → paiement. Vous recevez tout en temps réel.",
  },
];

const stats = [
  { value: "0", label: "compte requis pour commander" },
  { value: "15s", label: "de la table à la cuisine" },
  { value: "100%", label: "digital, zéro papier" },
  { value: "∞", label: "tables supportées" },
];

export default function Home() {
  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <nav className="fixed top-0 inset-x-0 z-50 bg-white/80 backdrop-blur border-b border-slate-100">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <span className="text-xl font-bold text-brand">A table !</span>
          <div className="flex items-center gap-3">
            <Link href="/login" className="btn-ghost text-sm py-2">Connexion</Link>
            <Link href="/register" className="btn-primary text-sm py-2">Essai gratuit</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-32 pb-24 px-6 text-center bg-gradient-to-b from-white to-orange-50">
        <div className="max-w-4xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-brand/10 text-brand text-sm font-semibold px-4 py-1.5 rounded-full mb-6">
            ✨ Commande à table sans friction
          </div>
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-6 leading-tight">
            Vos clients commandent{" "}
            <span className="text-brand">en 15 secondes</span>
          </h1>
          <p className="text-xl text-slate-500 max-w-2xl mx-auto mb-10">
            QR code sur la table → menu sur leur téléphone → commande en cuisine.
            Aucun serveur pour prendre les commandes, aucune app à télécharger.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register" className="btn-primary btn-lg">
              Créer mon restaurant gratuitement →
            </Link>
            <Link href="/login" className="btn-ghost btn-lg">
              J'ai déjà un compte
            </Link>
          </div>
          <p className="text-sm text-slate-400 mt-4">
            Aucune carte bancaire requise · Prêt en 5 minutes
          </p>
        </div>

        {/* Mock UI */}
        <div className="mt-16 max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
          {/* Client side */}
          <div className="card shadow-xl border-slate-100 animate-float">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-green-400" />
              <span className="text-xs font-medium text-slate-500">Vue client — Table 4</span>
            </div>
            <div className="space-y-2">
              {[
                { name: "Burger maison", price: "14,00 €", qty: 1 },
                { name: "Frites", price: "5,00 €", qty: 2 },
                { name: "Coca 33cl", price: "3,50 €", qty: 2 },
              ].map((it) => (
                <div key={it.name} className="flex items-center justify-between py-2 border-b border-slate-100 last:border-0">
                  <div>
                    <div className="font-medium text-sm">{it.name}</div>
                    <div className="text-xs text-slate-400">{it.price}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="w-6 h-6 rounded-lg bg-slate-100 flex items-center justify-center text-xs">−</span>
                    <span className="text-sm font-medium">{it.qty}</span>
                    <span className="w-6 h-6 rounded-lg bg-brand text-white flex items-center justify-center text-xs">+</span>
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 flex justify-between items-center">
              <span className="font-semibold">Total</span>
              <span className="font-bold text-brand">31,00 €</span>
            </div>
            <div className="mt-3 bg-brand text-white text-center py-2.5 rounded-xl text-sm font-semibold">
              Commander
            </div>
          </div>

          {/* Kitchen side */}
          <div className="card shadow-xl border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="w-2.5 h-2.5 rounded-full bg-orange-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-500">Dashboard cuisine — En direct</span>
            </div>
            <div className="space-y-2">
              {[
                { table: 4, items: "1× Burger · 2× Frites", status: "Nouveau", color: "bg-green-100 text-green-700" },
                { table: 2, items: "2× Salade César", status: "En cuisson", color: "bg-orange-100 text-orange-700" },
                { table: 6, items: "3× Tiramisu", status: "Servi", color: "bg-blue-100 text-blue-700" },
              ].map((o) => (
                <div key={o.table} className="flex items-center justify-between p-2.5 bg-slate-50 rounded-xl">
                  <div>
                    <div className="text-xs font-bold text-slate-700">Table {o.table}</div>
                    <div className="text-xs text-slate-500">{o.items}</div>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${o.color}`}>
                    {o.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-brand">
        <div className="max-w-5xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 text-center text-white">
          {stats.map((s) => (
            <div key={s.label}>
              <div className="text-4xl font-extrabold mb-1">{s.value}</div>
              <div className="text-sm text-orange-200">{s.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6 bg-slate-50">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center mb-4">Opérationnel en 5 minutes</h2>
          <p className="text-slate-500 text-center mb-14">Pas de matériel, pas de formation. Juste un téléphone et une imprimante.</p>
          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s) => (
              <div key={s.n} className="relative">
                <div className="text-6xl font-extrabold text-brand/10 mb-3">{s.n}</div>
                <h3 className="text-lg font-bold mb-2">{s.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-24 px-6 bg-white">
        <div className="max-w-5xl mx-auto">
          <h2 className="text-4xl font-extrabold text-center mb-4">Tout ce qu'il vous faut</h2>
          <p className="text-slate-500 text-center mb-14">Une plateforme complète, sans la complexité.</p>
          <div className="grid md:grid-cols-3 gap-6">
            {features.map((f) => (
              <div key={f.title} className="card hover:shadow-md transition-shadow">
                <div className="text-3xl mb-3">{f.icon}</div>
                <h3 className="font-bold mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="py-24 px-6 bg-gradient-to-br from-brand to-brand-dark text-white text-center">
        <div className="max-w-2xl mx-auto">
          <h2 className="text-4xl font-extrabold mb-4">Prêt à digitalisez votre salle ?</h2>
          <p className="text-orange-200 mb-10 text-lg">
            Rejoignez les restaurants qui ont supprimé les bons papier et les files d'attente.
          </p>
          <Link href="/register" className="inline-flex items-center gap-2 bg-white text-brand font-bold px-10 py-4 rounded-2xl text-lg hover:bg-orange-50 transition shadow-xl">
            Commencer gratuitement →
          </Link>
          <p className="text-orange-300 text-sm mt-4">Aucune carte bancaire · Annulation à tout moment</p>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-100 bg-white">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4 text-sm text-slate-400">
          <span className="font-bold text-brand text-base">A table !</span>
          <span>© 2026 A table ! — SaaS de commande par QR code</span>
          <div className="flex gap-4">
            <Link href="/login" className="hover:text-slate-600">Connexion</Link>
            <Link href="/register" className="hover:text-slate-600">S'inscrire</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
