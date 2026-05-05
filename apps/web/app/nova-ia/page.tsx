import type { Metadata } from "next";
import NovaIAClient from "./NovaIAClient";

export const metadata: Metadata = {
  title: "Nova IA — MaTable Pro",
  description: "Nova IA : l'intelligence artificielle intégrée à votre restaurant. Sommelier IA, gestion de stock prédictive, comptabilité automatisée, génération d'avis Google, descriptions de plats et planning IA.",
  alternates: { canonical: "https://matable.pro/nova-ia" },
  openGraph: {
    title: "Nova IA — L'IA qui gère votre restaurant",
    description: "Sommelier IA, Nova Stock, Nova Finance, Nova Contab, génération d'avis Google, descriptions de plats. L'IA au service des restaurateurs.",
    url: "https://matable.pro/nova-ia",
    type: "website",
  },
};

export default function NovaIAPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://matable.pro/nova-ia#webpage",
    url: "https://matable.pro/nova-ia",
    name: "Nova IA — MaTable Pro",
    description: "L'intelligence artificielle intégrée pour les restaurateurs.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://matable.pro/" },
        { "@type": "ListItem", position: 2, name: "Nova IA", item: "https://matable.pro/nova-ia" },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <NovaIAClient />
    </>
  );
}
