import "./globals.css";
import type { Metadata } from "next";
import { Footer } from "@/components/layout/Footer";
import { FloatingCTAWrapper } from "@/components/landing/FloatingCTA";

export const metadata: Metadata = {
  metadataBase: new URL("https://matable.pro"),
  title: {
    default: "MaTable Pro",
    template: "%s | MaTable Pro",
  },
  description: "Logiciel restaurant MaTable Pro : QR code, commande à table, caisse, portail serveur, IA, réservations et analytics.",
  applicationName: "MaTable Pro",
  alternates: { canonical: "https://matable.pro/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f97316" />
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://matable.pro" />
        <link rel="alternate" hrefLang="fr" href="https://matable.pro/" />
        <link rel="alternate" hrefLang="x-default" href="https://matable.pro/" />
      </head>
      <body className="flex flex-col min-h-screen">
        <div className="flex-1">{children}</div>
        <FloatingCTAWrapper />
        <Footer />
      </body>
    </html>
  );
}
