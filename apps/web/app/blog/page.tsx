import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — A table ! | Actualités SaaS restaurant, QR code, menu digital",
  description: "Découvrez nos articles sur la digitalisation des restaurants, les QR codes dynamiques, les menus digitaux, et les meilleures pratiques pour augmenter vos ventes.",
  keywords: [
    "blog restaurant",
    "QR code menu",
    "menu digital restaurant",
    "digitalisation restaurant",
    "SaaS restaurant France",
    "commande sans app",
  ],
};

const posts = [
  {
    id: 1,
    title: "Pourquoi les QR codes dynamiques changent le service en restaurant",
    excerpt: "Découvrez comment les QR codes sécurisés avec rotation trimestrielle protègent votre restaurant tout en offrant une expérience client fluide.",
    slug: "qr-code-dynamique",
    date: "2026-04-21",
    category: "Technologie",
    readTime: 5,
    image: "🔐",
  },
  {
    id: 2,
    title: "Menu digital vs menu papier : l'étude 2026",
    excerpt: "Statistiques en direct : comment les restaurants français augmentent leurs ventes de 34% en passant au menu digital QR.",
    slug: "menu-digital-etude",
    date: "2026-04-15",
    category: "Données",
    readTime: 8,
    image: "📊",
  },
  {
    id: 3,
    title: "Les 14 allergènes obligatoires au restaurant : conformité légale 2026",
    excerpt: "Respectez le règlement EU INCO 1169/2011 en affichant automatiquement les allergènes. Guide complet pour les restaurateurs.",
    slug: "allergens-conformite",
    date: "2026-04-10",
    category: "Réglementation",
    readTime: 6,
    image: "⚖️",
  },
  {
    id: 4,
    title: "Réduction des no-shows : arrhes Stripe et stratégie de réservation",
    excerpt: "Divisez vos no-shows par 4 en 30 jours avec un système d'arrhes Stripe intégré. Case study : restaurants 5-7 tables.",
    slug: "no-shows-reduction",
    date: "2026-04-05",
    category: "Stratégie",
    readTime: 7,
    image: "📅",
  },
  {
    id: 5,
    title: "Export Z comptable automatique : gagner 10h/mois de paperasse",
    excerpt: "Comment automatiser vos exports Z quotidiens avec A table ! et respecter la conformité fiscale sans effort manuel.",
    slug: "export-z-automatique",
    date: "2026-03-28",
    category: "Fiscal",
    readTime: 4,
    image: "📄",
  },
  {
    id: 6,
    title: "La vitrine publique du restaurant : votre page matable.pro/slug",
    excerpt: "Créez une page vitrine SEO pour votre restaurant en 5 minutes. Intégrez menu, réservations et avis vérifiés.",
    slug: "vitrine-publique-seo",
    date: "2026-03-20",
    category: "SEO",
    readTime: 6,
    image: "🌐",
  },
];

export default function BlogPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-32 pb-20">
      <div className="max-w-6xl mx-auto px-6">
        {/* Header */}
        <div className="text-center mb-20">
          <div className="inline-block px-4 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm mb-4">
            Blog A table !
          </div>
          <h1 className="text-5xl md:text-6xl font-black mb-4">
            Actualités et guides pour les{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">
              restaurateurs modernes.
            </span>
          </h1>
          <p className="text-white/40 text-lg max-w-2xl mx-auto">
            Découvrez les dernières tendances en digitalisation de restaurants, les meilleures pratiques et les études de cas.
          </p>
        </div>

        {/* Posts Grid */}
        <div className="grid md:grid-cols-2 gap-6 mb-20">
          {posts.map((post, i) => (
            <Link key={post.id} href={`/blog/${post.slug}`}>
              <article className={`group rounded-2xl border border-white/[0.08] bg-[#111] overflow-hidden hover:border-orange-500/30 transition-all hover:bg-[#141414] ${i === 0 ? "md:col-span-2" : ""}`}>
                <div className="flex flex-col md:flex-row gap-6 p-6 md:p-8">
                  {/* Image/Icon */}
                  <div className={`flex-shrink-0 ${i === 0 ? "w-full md:w-48 h-48" : "w-32 h-32"} rounded-xl bg-gradient-to-br from-orange-500/10 to-amber-500/10 border border-white/5 flex items-center justify-center text-6xl`}>
                    {post.image}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="px-2.5 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-medium">
                        {post.category}
                      </span>
                      <span className="text-white/30 text-xs">{post.readTime} min de lecture</span>
                    </div>

                    <h2 className={`font-bold text-white mb-3 group-hover:text-orange-400 transition-colors ${i === 0 ? "text-2xl md:text-3xl" : "text-lg md:text-xl"}`}>
                      {post.title}
                    </h2>

                    <p className="text-white/50 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>

                    <div className="flex items-center justify-between">
                      <time className="text-sm text-white/30">
                        {new Date(post.date).toLocaleDateString('fr-FR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </time>
                      <span className="text-orange-400 font-medium group-hover:translate-x-1 transition-transform">
                        Lire →
                      </span>
                    </div>
                  </div>
                </div>
              </article>
            </Link>
          ))}
        </div>

        {/* Newsletter CTA */}
        <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-r from-orange-500/10 to-amber-500/5 p-12 text-center">
          <h2 className="text-3xl font-bold mb-4">Restez à jour des dernières actualités</h2>
          <p className="text-white/50 mb-6 max-w-2xl mx-auto">
            Recevez hebdomadairement les meilleures stratégies pour votre restaurant, les nouvelles fonctionnalités A table !, et les cas de succès.
          </p>
          <form className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <input
              type="email"
              placeholder="votre@email.com"
              className="flex-1 px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-orange-500/50"
              required
            />
            <button type="submit" className="px-6 py-3 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-semibold transition-colors">
              S'inscrire
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
