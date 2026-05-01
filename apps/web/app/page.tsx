import { Metadata } from "next";
import LandingPage from "./LandingPage";

export const metadata: Metadata = {
  metadataBase: new URL("https://matable.pro"),
  title: {
    default: "MaTable Pro — Logiciel restaurant QR, caisse, serveur et IA",
    template: "%s | MaTable Pro",
  },
  description:
    "MaTable Pro (matablepro) est le logiciel restaurant tout-en-un : menu QR code, commande à table, portail serveur, caisse, stock, avis Google IA, réservations et analytics.",
  keywords: [
    "MaTable Pro",
    "matablepro",
    "matable.pro",
    "Ma Table Pro",
    "Ma Table restaurant",
    "commande restaurant QR code",
    "menu digital restaurant",
    "logiciel restaurant QR code",
    "logiciel caisse restaurant",
    "SaaS restaurant France",
    "Nova IA restaurant",
    "avis Google restaurant IA",
    "Magic Scan plats",
    "stock IA restaurant",
    "finance IA restaurant",
    "sommelier IA restaurant",
    "comptabilite IA restaurant",
    "planning IA restaurant",
    "portail serveur restaurant",
    "reservations restaurant",
    "analytics restaurant",
    "Ma Table",
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
    siteName: "MaTable Pro",
    title: "MaTable Pro — Logiciel restaurant QR, caisse, serveur et IA",
    description:
      "La plateforme SaaS restaurant pour commander par QR code, piloter la salle, encaisser, gérer les avis Google IA, les stocks, les réservations et les analytics.",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "MaTable Pro — logiciel restaurant QR, caisse, serveur et IA",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "MaTable Pro — Logiciel restaurant QR, caisse, serveur et IA",
    description: "Commande QR, avis Google IA, portail serveur, caisse, stock, réservations et analytics.",
    images: ["/opengraph-image"],
  },
  alternates: { canonical: "https://matable.pro/" },
  authors: [{ name: "MaTable Pro" }],
  applicationName: "MaTable Pro",
  category: "restaurant software",
};

export default function HomePage() {
  const structuredData = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Organization",
        "@id": "https://matable.pro/#organization",
        name: "MaTable Pro",
        alternateName: ["matablepro", "Ma Table Pro", "Ma Table", "matable.pro"],
        url: "https://matable.pro/",
        logo: "https://matable.pro/favicon.svg",
        sameAs: ["https://matable.pro/"],
      },
      {
        "@type": "WebSite",
        "@id": "https://matable.pro/#website",
        name: "MaTable Pro",
        alternateName: "matablepro",
        url: "https://matable.pro/",
        publisher: { "@id": "https://matable.pro/#organization" },
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
        alternateName: "matablepro",
        applicationCategory: "BusinessApplication",
        operatingSystem: "Web",
        url: "https://matable.pro/",
        description: "Logiciel restaurant tout-en-un : menu QR code, commande à table, portail serveur, caisse, avis Google IA, stock, réservations et analytics.",
        offers: {
          "@type": "Offer",
          url: "https://matable.pro/register",
          priceCurrency: "EUR",
          availability: "https://schema.org/InStock",
        },
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
