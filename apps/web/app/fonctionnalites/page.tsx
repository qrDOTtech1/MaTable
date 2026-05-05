import type { Metadata } from "next";
import FonctionnalitesClient from "./FonctionnalitesClient";

export const metadata: Metadata = {
  title: "Fonctionnalités — MaTable Pro",
  description: "18 fonctionnalités restaurant en un seul logiciel : commande QR, caisse, portail serveur temps réel, avis Google IA, stock, réservations, paiement fractionné, allergènes, multi-langue et plus.",
  alternates: { canonical: "https://matable.pro/fonctionnalites" },
  openGraph: {
    title: "Fonctionnalités MaTable Pro — Un arsenal. Rien ne manque.",
    description: "Commande QR, caisse connectée, portail serveur live, avis Google IA, Nova Stock & Finance IA, réservations Stripe, allergènes EU 14, multi-langue. Tout en un.",
    url: "https://matable.pro/fonctionnalites",
    type: "website",
  },
};

export default function FonctionnalitesPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://matable.pro/fonctionnalites#webpage",
    url: "https://matable.pro/fonctionnalites",
    name: "Fonctionnalités MaTable Pro",
    description: "18 fonctionnalités restaurant en un seul logiciel.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://matable.pro/" },
        { "@type": "ListItem", position: 2, name: "Fonctionnalités", item: "https://matable.pro/fonctionnalites" },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <FonctionnalitesClient />
    </>
  );
}
