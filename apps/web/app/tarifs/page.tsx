import type { Metadata } from "next";
import TarifsClient from "./TarifsClient";

export const metadata: Metadata = {
  title: "Tarifs — MaTable Pro",
  description: "3 forfaits clairs pour digitaliser votre restaurant. Starter dès 59€/mois, Pro avec fidélité client incluse — sans engagement, résiliable à tout moment. Essai gratuit 14 jours sans CB.",
  alternates: { canonical: "https://matable.pro/tarifs" },
  openGraph: {
    title: "Tarifs MaTable Pro — Starter 59€, Pro 119€, Business 249€",
    description: "3 forfaits fixes, sans engagement. Starter 59€, Pro 119€ avec fidélité incluse, Business 249€. Annuel −12%. Essai gratuit 14 jours sans CB.",
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
    description: "3 forfaits MaTable.Pro dès 59€/mois. Starter, Pro avec programme fidélité inclus, Business — sans engagement.",
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
