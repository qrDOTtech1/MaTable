import type { Metadata } from "next";
import TarifsClient from "./TarifsClient";

export const metadata: Metadata = {
  title: "Tarifs — MaTable Pro",
  description: "Construisez votre solution restaurant sur-mesure. Dès 79€/mois : Avis Google IA, Commande QR, Portail Serveur, Réservations, Nova Stock & Finance IA. Essai gratuit 14 jours.",
  alternates: { canonical: "https://matable.pro/tarifs" },
  openGraph: {
    title: "Tarifs MaTable Pro — Payez ce que vous utilisez",
    description: "7 modules indépendants. Dès 79€/mois. Remises jusqu'à -20% selon l'engagement. Essai gratuit 14 jours sans CB.",
    url: "https://matable.pro/tarifs",
    type: "website",
  },
};

export default function TarifsPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://matable.pro/tarifs#webpage",
    url: "https://matable.pro/tarifs",
    name: "Tarifs MaTable Pro",
    description: "Construisez votre solution restaurant sur-mesure. 7 modules indépendants dès 79€/mois.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://matable.pro/" },
        { "@type": "ListItem", position: 2, name: "Tarifs", item: "https://matable.pro/tarifs" },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <TarifsClient />
    </>
  );
}
