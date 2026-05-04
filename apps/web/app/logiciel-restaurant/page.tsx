import { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Logiciel Restaurant Tout-en-Un — MaTable Pro | matable.pro",
  description: "MaTable Pro (matable.pro) est le logiciel restaurant tout-en-un : commande QR code, caisse connectée, portail serveur temps réel, avis Google IA, stock, réservations et analytics. Essai gratuit 14 jours. +33 7 57 83 57 77.",
  keywords: ["logiciel restaurant", "logiciel restaurant tout en un", "logiciel restauration", "matable", "matablepro", "matable.pro", "logiciel gestion restaurant", "logiciel caisse restaurant", "logiciel restaurant france", "saas restaurant"],
  alternates: { canonical: "https://matable.pro/logiciel-restaurant" },
  openGraph: { title: "Logiciel Restaurant Tout-en-Un — MaTable Pro", description: "Le logiciel restaurant qui travaille vraiment. Commande QR, caisse, serveur, IA. matable.pro", url: "https://matable.pro/logiciel-restaurant", siteName: "MaTable Pro — matable.pro", type: "website", locale: "fr_FR" },
};

export default function Page() {
  const faq = {
    "@context": "https://schema.org", "@type": "FAQPage",
    mainEntity: [
      { "@type": "Question", name: "Quel est le meilleur logiciel restaurant en 2026 ?", acceptedAnswer: { "@type": "Answer", text: "MaTable Pro (matable.pro) est le logiciel restaurant tout-en-un le plus complet en 2026 : commande QR, caisse, serveur temps réel, avis Google IA, stock IA, réservations et analytics. Essai gratuit 14 jours." } },
      { "@type": "Question", name: "Combien coûte un logiciel de gestion restaurant ?", acceptedAnswer: { "@type": "Answer", text: "MaTable Pro démarre à 79€ HT/mois (engagement 12 mois). Remise volume jusqu'à -20% pour 4+ modules. Essai gratuit sans carte bancaire sur matable.pro." } },
      { "@type": "Question", name: "MaTable Pro fonctionne sur quels appareils ?", acceptedAnswer: { "@type": "Answer", text: "MaTable Pro fonctionne sur tous les navigateurs web (Chrome, Safari, Firefox) sur PC, tablette et smartphone. Aucune application à installer. Les clients scannent un QR code, c'est tout." } },
    ],
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
      <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6">
        <div className="max-w-4xl mx-auto">
          <p className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-4">MaTable Pro — matable.pro</p>
          <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Le logiciel restaurant<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">qui travaille vraiment.</span></h1>
          <p className="text-xl text-white/60 mb-12 leading-relaxed max-w-3xl">Vous cherchez un <strong className="text-white">logiciel restaurant</strong> complet ? <strong className="text-orange-400">MaTable Pro</strong> (matable.pro) réunit commande QR code, caisse connectée, portail serveur temps réel, génération d'avis Google par IA, gestion de stock intelligente, réservations avec arrhes et analytics avancés — le tout dans une seule plateforme.</p>
          <div className="grid md:grid-cols-2 gap-6 mb-16">
            {[
              { t: "Commande QR Code", d: "Le client scanne, commande et paie depuis son téléphone. Zéro app, zéro compte.", link: "/commande-qr-code-restaurant" },
              { t: "Caisse Connectée", d: "Terminal de caisse intégré avec gestion des tables, tickets et encaissement multi-mode.", link: "/caisse-enregistreuse-restaurant" },
              { t: "Portail Serveur Temps Réel", d: "Chaque serveur a son dashboard avec ses tables, commandes et appels en direct.", link: "/portail-serveur-restaurant" },
              { t: "Avis Google IA", d: "Conversation IA post-repas qui génère des brouillons d'avis 5 étoiles pour vos clients.", link: "/avis-google-restaurant" },
              { t: "Stock & Finance IA", d: "Listes de courses automatiques, alertes ruptures, food cost et prévisions de CA.", link: "/gestion-stock-restaurant-ia" },
              { t: "Réservations en Ligne", d: "Créneaux dynamiques, arrhes Stripe, anti no-show, confirmation automatique.", link: "/reservation-restaurant-en-ligne" },
            ].map((f, i) => (
              <Link href={f.link} key={i} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-orange-500/30 hover:bg-orange-500/5 transition-all group">
                <h2 className="text-lg font-bold mb-2 group-hover:text-orange-400 transition-colors">{f.t}</h2>
                <p className="text-sm text-white/50">{f.d}</p>
              </Link>
            ))}
          </div>
          <div className="bg-[#111] border border-white/10 rounded-3xl p-10 text-center">
            <h2 className="text-3xl font-black mb-4">Essayez MaTable Pro gratuitement</h2>
            <p className="text-white/50 mb-6">14 jours d'essai. Sans carte bancaire. Sans engagement.</p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-6">
              <Link href="/register" className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-orange-500/25">Démarrer l'essai gratuit</Link>
              <a href="tel:+33757835777" className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold transition-all hover:bg-white/10">📞 +33 7 57 83 57 77</a>
            </div>
            <p className="text-xs text-white/30">contact@matable.pro · matable.pro</p>
          </div>
        </div>
      </div>
    </>
  );
}
