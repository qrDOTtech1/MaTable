import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: ["/", "/blog", "/register", "/r/", "/favicon.svg", "/manifest.json"],
        disallow: [
          "/dashboard/",
          "/order/",
          "/login",
          "/api/",
          "/mockup",
          "/*?utm_*",
          "/*?affiliate_*",
        ],
      },
    ],
    sitemap: "https://matable.pro/sitemap.xml",
    host: "https://matable.pro",
  };
}
