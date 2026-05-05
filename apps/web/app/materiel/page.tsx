import type { Metadata } from "next";
import MaterielClient from "./MaterielClient";

export const metadata: Metadata = {
  title: "Matériel Restaurant — MaTable Pro",
  description: "Matériel restaurant professionnel sur devis : terminaux de commande, imprimantes ticket, bornes QR, chevalets acrylique, QR vinyle. Robuste, plug & play avec MaTable Pro.",
  alternates: { canonical: "https://matable.pro/materiel" },
  openGraph: {
    title: "Matériel Restaurant MaTable Pro — Robuste. Plug & Play.",
    description: "Terminaux, imprimantes, bornes, chevalets acrylique et QR vinyle. Matériel professionnel livré et configuré pour votre restaurant.",
    url: "https://matable.pro/materiel",
    type: "website",
  },
};

export default function MaterielPage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": "https://matable.pro/materiel#webpage",
    url: "https://matable.pro/materiel",
    name: "Matériel Restaurant MaTable Pro",
    description: "Matériel restaurant professionnel sur devis.",
    breadcrumb: {
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Accueil", item: "https://matable.pro/" },
        { "@type": "ListItem", position: 2, name: "Matériel", item: "https://matable.pro/materiel" },
      ],
    },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }} />
      <MaterielClient />
    </>
  );
}
