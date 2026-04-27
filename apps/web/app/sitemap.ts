import { MetadataRoute } from 'next';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://matable.pro';

  // Static pages
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/register`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/login`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  // Try to fetch restaurants from API for their public pages
  let restaurantPages: MetadataRoute.Sitemap = [];
  try {
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
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
    console.error('Failed to fetch restaurants for sitemap:', error);
  }

  return [...staticPages, ...restaurantPages];
}
