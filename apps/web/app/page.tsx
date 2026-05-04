import { Metadata } from "next";
import LandingPage from "./LandingPage";

export const metadata: Metadata = {
  metadataBase: new URL("https://matable.pro"),
  title: {
    default: "MaTable Pro — Logiciel restaurant tout-en-un | matable.pro",
    template: "%s | MaTable Pro — matable.pro",
  },
  description:
    "MaTable Pro (matable.pro) est LE logiciel restaurant tout-en-un : commande QR code, caisse, portail serveur temps réel, avis Google IA, gestion de stock, réservations et analytics. Essai gratuit 14 jours. +33 7 57 83 57 77.",
  keywords: [
    "matable",
    "MaTable Pro",
    "matablepro",
    "matable pro",
    "matable.pro",
    "Ma Table Pro",
    "matable logiciel restaurant",
    "matable pro logiciel",
    "logiciel matablepro",
    "logiciel restaurant matable",
    "logiciel restaurant QR code",
    "logiciel caisse restaurant",
    "logiciel restaurant tout en un",
    "logiciel restaurant IA",
    "SaaS restaurant France",
    "commande restaurant QR code",
    "menu digital restaurant",
    "portail serveur restaurant",
    "avis Google restaurant IA",
    "gestion restaurant",
    "caisse enregistreuse restaurant",
    "reservation restaurant en ligne",
    "analytics restaurant",
    "stock restaurant IA",
    "Nova IA restaurant",
    "alternative ma-table.com",
    "matable vs ma-table",
  ],
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-video-preview": -1, "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://matable.pro/",
    siteName: "MaTable Pro — matable.pro",
    title: "MaTable Pro — Logiciel restaurant tout-en-un | matable.pro",
    description:
      "MaTable Pro (matable.pro) : commande QR, caisse, portail serveur, avis Google IA, stock, réservations et analytics. Le logiciel restaurant qui travaille vraiment. Essai gratuit.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MaTable Pro — logiciel restaurant tout-en-un — matable.pro",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MaTable Pro — Logiciel restaurant tout-en-un | matable.pro",
    description: "MaTable Pro (matable.pro) : commande QR, caisse, serveur, avis Google IA, stock, réservations. Essai gratuit 14 jours.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://matable.pro/" },
  authors: [{ name: "MaTable Pro", url: "https://matable.pro" }],
  applicationName: "MaTable Pro",
  category: "restaurant software",
  other: {
    "google-site-verification": process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || "",
  },
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://matable.pro/#organization",
        name: "MaTable Pro",
        legalName: "MaTable Pro — Steven Franco",
        alternateName: ["matable", "matablepro", "Ma Table Pro", "Ma Table", "matable.pro", "MaTable"],
        url: "https://matable.pro/",
        logo: "https://matable.pro/favicon.svg",
        image: "https://matable.pro/opengraph-image",
        email: "contact@matable.pro",
        telephone: "+33757835777",
        contactPoint: [
          {
            "@type": "ContactPoint",
            telephone: "+33757835777",
            email: "contact@matable.pro",
            contactType: "sales",
            areaServed: "FR",
            availableLanguage: ["French", "English"],
          },
          {
            "@type": "ContactPoint",
            telephone: "+33757835777",
            email: "contact@matable.pro",
            contactType: "customer service",
            areaServed: "FR",
            availableLanguage: ["French"],
          },
        ],
        address: {
          "@type": "PostalAddress",
          addressCountry: "FR",
        },
        sameAs: [
          "https://matable.pro/",
        ],
        foundingDate: "2025",
        description: "MaTable Pro (matable.pro) est un logiciel restaurant tout-en-un français : commande QR code, caisse, portail serveur, avis Google IA, stock, réservations et analytics.",
      },
      {
        "@type": "WebSite",
        "@id": "https://matable.pro/#website",
        name: "MaTable Pro",
        alternateName: ["matable", "matablepro", "MaTable Pro", "matable.pro", "MaTable"],
        url: "https://matable.pro/",
        publisher: { "@id": "https://matable.pro/#organization" },
        inLanguage: "fr-FR",
        potentialAction: {
          "@type": "SearchAction",
          target: "https://matable.pro/?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "SoftwareApplication",
        "@id": "https://matable.pro/#software",
        name: "MaTable Pro",
        alternateName: ["matable", "matablepro", "Ma Table Pro", "matable.pro", "MaTable"],
        applicationCategory: "BusinessApplication",
        applicationSubCategory: "Restaurant Management Software",
        operatingSystem: "Web",
        url: "https://matable.pro/",
        description: "MaTable Pro (matable.pro) est le logiciel restaurant tout-en-un : commande QR code à table, portail serveur temps réel, caisse connectée, avis Google générés par IA, gestion de stock, sommelier IA, comptabilité IA, réservations avec arrhes Stripe, et analytics avancés.",
        featureList: "Commande QR code, Menu digital, Portail serveur temps réel, Caisse connectée, Avis Google IA, Gestion de stock IA, Sommelier IA, Comptabilité IA, Réservations en ligne, Analytics, Paiement fractionné, Pourboires digitaux, Allergènes EU 14, Multi-langue",
        screenshot: "https://matable.pro/opengraph-image",
        softwareVersion: "2026",
        releaseNotes: "Commande QR, portail serveur, caisse, Nova IA, stock, réservations",
        author: { "@id": "https://matable.pro/#organization" },
        offers: {
          "@type": "AggregateOffer",
          url: "https://matable.pro/tarifs",
          priceCurrency: "EUR",
          lowPrice: "75.05",
          highPrice: "129",
          offerCount: 7,
          availability: "https://schema.org/InStock",
        },
        aggregateRating: {
          "@type": "AggregateRating",
          ratingValue: "4.9",
          ratingCount: "12",
          bestRating: "5",
        },
      },
      {
        "@type": "WebPage",
        "@id": "https://matable.pro/#webpage",
        url: "https://matable.pro/",
        name: "MaTable Pro — Logiciel restaurant tout-en-un | matable.pro",
        description: "MaTable Pro (matable.pro) : le logiciel restaurant tout-en-un avec commande QR, caisse, serveur, avis Google IA, stock, réservations. Essai gratuit 14 jours. Contact : +33 7 57 83 57 77.",
        isPartOf: { "@id": "https://matable.pro/#website" },
        about: { "@id": "https://matable.pro/#software" },
        inLanguage: "fr-FR",
        datePublished: "2025-01-01",
        dateModified: new Date().toISOString().split("T")[0],
      },
      {
        "@type": "FAQPage",
        "@id": "https://matable.pro/#faq",
        mainEntity: [
          {
            "@type": "Question",
            name: "Quel est le site officiel de MaTable Pro ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Le site officiel de MaTable Pro est https://matable.pro/. Le logiciel est aussi recherché sous les noms matable, matablepro, MaTable ou matable pro. Attention à ne pas confondre avec ma-table.com qui est un autre service.",
            },
          },
          {
            "@type": "Question",
            name: "Quelle est la différence entre MaTable Pro (matable.pro) et ma-table.com ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "MaTable Pro (matable.pro) est un logiciel restaurant tout-en-un avec commande QR, caisse, portail serveur temps réel, avis Google IA, gestion de stock IA, réservations et analytics. Il ne faut pas confondre avec ma-table.com qui est un service de fidélisation. MaTable Pro est disponible sur matable.pro.",
            },
          },
          {
            "@type": "Question",
            name: "Combien coûte MaTable Pro ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "MaTable Pro démarre à 79€ HT/mois pour le module Avis Google & Réputation avec un engagement de 12 mois. Les prix varient selon la durée d'engagement (3, 6, 9 ou 12 mois) et les modules choisis. Remise volume jusqu'à -20% pour 4+ modules. Essai gratuit de 14 jours sans carte bancaire.",
            },
          },
          {
            "@type": "Question",
            name: "Comment contacter MaTable Pro ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Vous pouvez contacter l'équipe MaTable Pro par téléphone au +33 7 57 83 57 77 ou par email à contact@matable.pro. Le site officiel est matable.pro.",
            },
          },
          {
            "@type": "Question",
            name: "MaTable Pro c'est quoi exactement ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "MaTable Pro est un logiciel SaaS français pour les restaurateurs. Il intègre : commande QR code sans application, portail serveur en temps réel, caisse connectée, génération automatique d'avis Google par IA, gestion de stock IA, sommelier IA, comptabilité IA, réservations avec arrhes Stripe, paiement fractionné, pourboires digitaux, allergènes EU, et analytics complets.",
            },
          },
          {
            "@type": "Question",
            name: "Est-ce que matable, matablepro et MaTable Pro c'est la même chose ?",
            acceptedAnswer: {
              "@type": "Answer",
              text: "Oui. MaTable Pro, matable, matablepro, matable pro — ce sont tous des noms désignant le même logiciel restaurant, disponible sur le site officiel matable.pro. Le nom complet est MaTable Pro.",
            },
          },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />
      <LandingPage />
    </>
  );
}
