/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ['image/avif', 'image/webp'],
    domains: ['matable.pro', 'cdn.matable.pro', 'images.unsplash.com'],
    minimumCacheTTL: 31536000,
  },
  compress: true,
  poweredByHeader: false,
  swcMinify: true,
  headers: async () => [
    {
      source: '/:path*',
      headers: [
        { key: 'X-Content-Type-Options', value: 'nosniff' },
        { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
        { key: 'X-XSS-Protection', value: '1; mode=block' },
        { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      ],
    },
  ],
  redirects: async () => [
    { source: '/r/:slug', destination: '/:slug', permanent: true },
  ],
};

module.exports = nextConfig;
