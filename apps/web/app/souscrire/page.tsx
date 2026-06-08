import { Suspense } from "react";
import SouscrireClient from "./SouscrireClient";

export const metadata = {
  title: "Souscrire à MaTable.Pro",
  description: "Activez votre compte MaTable.Pro immédiatement. Signature en ligne, paiement sécurisé Stripe.",
};

export default function SouscrirePage() {
  return (
    <Suspense fallback={null}>
      <SouscrireClient />
    </Suspense>
  );
}
