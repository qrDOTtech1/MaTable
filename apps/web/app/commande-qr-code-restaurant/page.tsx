import { Metadata } from "next";
import Link from "next/link";
export const metadata: Metadata = {
  title: "Commande QR Code Restaurant — Menu Digital | MaTable Pro",
  description: "Commande QR code restaurant avec MaTable Pro (matable.pro) : le client scanne, commande et paie depuis son téléphone. Zéro application, zéro compte. Menu digital multilingue automatique. +33 7 57 83 57 77.",
  keywords: ["commande qr code restaurant", "menu qr code restaurant", "menu digital restaurant", "commande à table qr", "commande restaurant sans application", "matable", "matablepro", "matable.pro", "qr code menu restaurant"],
  alternates: { canonical: "https://matable.pro/commande-qr-code-restaurant" },
  openGraph: { title: "Commande QR Code Restaurant — MaTable Pro", description: "Le client scanne, commande, paie. Zéro app. matable.pro", url: "https://matable.pro/commande-qr-code-restaurant", siteName: "MaTable Pro — matable.pro", type: "website", locale: "fr_FR" },
};
export default function Page() {
  const faq = { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: [
    { "@type": "Question", name: "Comment fonctionne la commande QR code MaTable Pro ?", acceptedAnswer: { "@type": "Answer", text: "Le client scanne un QR code sur sa table avec son téléphone, accède au menu digital, choisit ses plats et valide sa commande. La commande arrive instantanément en cuisine sur l'écran dédié. Pas d'application à télécharger, pas de compte à créer." } },
    { "@type": "Question", name: "Le menu QR code est-il multilingue ?", acceptedAnswer: { "@type": "Answer", text: "Oui. MaTable Pro détecte automatiquement la langue du téléphone du client et affiche le menu dans sa langue. Plus de 7 langues supportées : français, anglais, espagnol, italien, allemand, portugais, japonais, chinois." } },
    { "@type": "Question", name: "Les clients doivent-ils installer une application ?", acceptedAnswer: { "@type": "Answer", text: "Non. MaTable Pro fonctionne directement dans le navigateur du smartphone. Le client scanne le QR code et accède immédiatement au menu. Aucune app, aucun compte, aucune inscription." } },
  ]};
  return (
    <><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faq) }} />
    <div className="min-h-screen bg-[#0a0a0a] text-white pt-24 pb-32 px-6"><div className="max-w-4xl mx-auto">
      <p className="text-orange-400 font-bold text-sm uppercase tracking-widest mb-4">MaTable Pro — matable.pro</p>
      <h1 className="text-5xl md:text-7xl font-black mb-8 leading-tight">Commande QR Code<br /><span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-300">Restaurant</span></h1>
      <p className="text-xl text-white/60 mb-12 leading-relaxed max-w-3xl">Avec <strong className="text-orange-400">MaTable Pro</strong>, vos clients scannent un QR code, consultent votre menu digital, commandent et paient — directement depuis leur téléphone. Pas d'app à télécharger, pas de compte à créer. La commande arrive en cuisine en temps réel.</p>
      <div className="space-y-8 mb-16">
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8"><h2 className="text-2xl font-bold mb-3">Scan → Commande → Cuisine. En 15 secondes.</h2><p className="text-white/50">Le client scanne le QR vinyle sur sa table. Le menu s'ouvre dans son navigateur, dans sa langue. Il choisit, personnalise (suppléments, allergènes), et valide. La commande frappe instantanément l'écran cuisine via WebSocket. Le serveur est alerté. Temps moyen : 15 secondes.</p></div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8"><h2 className="text-2xl font-bold mb-3">Menu multilingue automatique</h2><p className="text-white/50">MaTable Pro détecte la langue du téléphone du client et traduit automatiquement votre menu. Plus besoin de menus papier en 4 langues. Français, anglais, espagnol, italien, allemand, portugais, japonais, chinois — tout est couvert.</p></div>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-8"><h2 className="text-2xl font-bold mb-3">+34% de panier moyen</h2><p className="text-white/50">L'up-selling intelligent de MaTable Pro suggère des accompagnements et boissons lors de la commande. Résultat mesuré : +34% de panier moyen par rapport à la prise de commande classique.</p></div>
      </div>
      <div className="bg-[#111] border border-white/10 rounded-3xl p-10 text-center">
        <h2 className="text-3xl font-black mb-4">Testez la commande QR code</h2>
        <p className="text-white/50 mb-6">14 jours d'essai gratuit. Vos clients commanderont dès demain.</p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-4">
          <Link href="/register" className="px-8 py-4 bg-orange-500 hover:bg-orange-400 text-white rounded-xl font-bold text-lg transition-all shadow-xl shadow-orange-500/25">Essai gratuit →</Link>
          <a href="tel:+33757835777" className="px-8 py-4 bg-white/5 border border-white/10 rounded-xl font-bold transition-all hover:bg-white/10">📞 +33 7 57 83 57 77</a>
        </div>
        <p className="text-xs text-white/30">contact@matable.pro · matable.pro</p>
      </div>
    </div></div></>
  );
}
