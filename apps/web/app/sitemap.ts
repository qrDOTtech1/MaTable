import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://matable.pro').replace(/\/$/, '');
  const now = new Date();

  // ── Core marketing pages (highest priority) ──
  const corePages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/`, lastModified: now, changeFrequency: 'daily', priority: 1.0 },
    { url: `${baseUrl}/tarifs`, lastModified: now, changeFrequency: 'weekly', priority: 0.95 },
    { url: `${baseUrl}/fonctionnalites`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/nova-ia`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/register`, lastModified: now, changeFrequency: 'weekly', priority: 0.9 },
  ];

  // ── SEO long-tail keyword pages ──
  // Each page targets a specific search query to capture traffic
  const seoPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/logiciel-restaurant`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/commande-qr-code-restaurant`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/caisse-enregistreuse-restaurant`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/avis-google-restaurant`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/menu-digital-qr-code`, lastModified: now, changeFrequency: 'weekly', priority: 0.85 },
    { url: `${baseUrl}/gestion-stock-restaurant-ia`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/reservation-restaurant-en-ligne`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/portail-serveur-restaurant`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/logiciel-restaurant-ia`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/paiement-table-restaurant`, lastModified: now, changeFrequency: 'weekly', priority: 0.8 },
    { url: `${baseUrl}/pourboire-digital-restaurant`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/allergenes-restaurant`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
    { url: `${baseUrl}/materiel`, lastModified: now, changeFrequency: 'monthly', priority: 0.75 },
  ];

  // ── Legal & secondary pages ──
  const secondaryPages: MetadataRoute.Sitemap = [
    { url: `${baseUrl}/cgv`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/confidentialite`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
    { url: `${baseUrl}/mentions-legales`, lastModified: now, changeFrequency: 'monthly', priority: 0.4 },
  ];

  // ── Dynamic restaurant pages from API ──
  let restaurantPages: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://matable-api-production.up.railway.app';
    const res = await fetch(`${apiUrl}/api/restaurants`, {
      next: { revalidate: 86400 },
    });

    if (res.ok) {
      const restaurants = await res.json();
      restaurantPages = restaurants
        .filter((r: any) => r.slug)
        .map((r: any) => ({
          url: `${baseUrl}/${r.slug}`,
          lastModified: r.updatedAt ? new Date(r.updatedAt) : new Date(),
          changeFrequency: 'weekly' as const,
          priority: 0.7,
        }))
        .concat(
          restaurants
            .filter((r: any) => r.slug && r.acceptReservations)
            .map((r: any) => ({
              url: `${baseUrl}/${r.slug}/reserve`,
              lastModified: r.updatedAt ? new Date(r.updatedAt) : new Date(),
              changeFrequency: 'weekly' as const,
              priority: 0.6,
            }))
        );
    }
  } catch (error) {
    // Keep the marketing sitemap valid even if the API is unavailable at build time.
  }

  return [...corePages, ...seoPages, ...secondaryPages, ...restaurantPages];
}
