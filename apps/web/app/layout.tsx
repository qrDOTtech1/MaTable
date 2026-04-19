import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "A table !",
  description: "Commandez depuis votre table — scanner, choisir, payer.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
