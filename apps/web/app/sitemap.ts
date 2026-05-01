import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL || 'https://matable.pro').replace(/\/$/, '');
  const now = new Date();

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/`,
      lastModified: now,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/blog`,
      lastModified: now,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
  ];

  // Try to fetch restaurants from API for their public pages
  let restaurantPages: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'https://matable-api-production.up.railway.app';
    const res = await fetch(`${apiUrl}/api/restaurants`, {
      next: { revalidate: 86400 }, // Revalidate every 24 hours
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

  return [...staticPages, ...restaurantPages];
}
