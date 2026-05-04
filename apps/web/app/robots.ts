import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: [
          "/",
          "/tarifs",
          "/fonctionnalites",
          "/nova-ia",
          "/materiel",
          "/register",
          "/blog",
          "/r/",
          "/logiciel-restaurant",
          "/commande-qr-code-restaurant",
          "/caisse-enregistreuse-restaurant",
          "/avis-google-restaurant",
          "/menu-digital-qr-code",
          "/gestion-stock-restaurant-ia",
          "/reservation-restaurant-en-ligne",
          "/portail-serveur-restaurant",
          "/logiciel-restaurant-ia",
          "/paiement-table-restaurant",
          "/pourboire-digital-restaurant",
          "/allergenes-restaurant",
          "/cgv",
          "/confidentialite",
          "/mentions-legales",
          "/favicon.svg",
          "/manifest.json",
          "/opengraph-image",
        ],
        disallow: [
          "/dashboard/",
          "/order/",
          "/login",
          "/api/",
          "/mockup",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: ["/"],
        disallow: ["/dashboard/", "/order/", "/login", "/api/"],
      },
    ],
    sitemap: "https://matable.pro/sitemap.xml",
    host: "https://matable.pro",
  };
}
