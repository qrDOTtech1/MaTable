import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A table !",
  description: "Commandez depuis votre table — scanner, choisir, payer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5" />
        <meta name="theme-color" content="#f97316" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="canonical" href="https://matable.pro" />
        <link rel="alternate" hrefLang="en" href="https://en.matable.pro" />
        <link rel="alternate" hrefLang="es" href="https://es.matable.pro" />
      </head>
      <body>{children}</body>
    </html>
  );
}
