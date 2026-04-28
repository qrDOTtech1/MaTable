import { Metadata } from "next";
import LandingPage from "./LandingPage";

export const metadata: Metadata = {
  title: "Ma Table — La Revolution QR, IA & Portail Serveur pour Restaurants",
  description:
    "La plateforme SaaS qui transforme votre restaurant : commande QR sans friction, temps reel absolu, Nova IA (Stock, Finance, Sommelier, Comptabilite, Magic Scan, chatbot, planning), portail serveur, analytics et plus.",
  keywords: [
    "commande restaurant QR code",
    "menu digital restaurant",
    "SaaS restaurant France",
    "Nova IA restaurant",
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
    googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1 },
  },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://matable.pro",
    siteName: "Ma Table",
    title: "Ma Table — La plateforme SaaS restaurant la plus puissante",
    description:
      "Commande QR, Nova IA (Stock, Finance, Sommelier, Contab), portail serveur, reservations, analytics.",
    images: [
      {
        url: "https://matable.pro/og-image.png",
        width: 1200,
        height: 630,
        alt: "Ma Table — SaaS restaurant",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Ma Table — La plateforme restaurant la plus puissante au monde",
    description: "Commande QR, IA, portail serveur. Moins de paperasse, plus de service.",
    images: ["https://matable.pro/og-image.png"],
  },
  alternates: { canonical: "https://matable.pro" },
  authors: [{ name: "Ma Table — SNHTech & Novavivo.online" }],
};

export default function HomePage() {
  return <LandingPage />;
}
