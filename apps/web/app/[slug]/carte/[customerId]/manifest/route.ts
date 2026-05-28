import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: { slug: string; customerId: string } }
) {
  const { slug, customerId } = params;
  const startUrl = `/${slug}/carte/${customerId}`;

  const manifest = {
    name: "Ma Carte Fidélité",
    short_name: "Fidélité",
    description: "Votre carte fidélité — points, offres et QR code",
    start_url: startUrl,
    scope: startUrl,
    display: "standalone",
    orientation: "portrait-primary",
    background_color: "#0a0a0a",
    theme_color: "#f97316",
    icons: [
      { src: "/favicon.svg", sizes: "any", type: "image/svg+xml", purpose: "any maskable" },
    ],
  };

  return NextResponse.json(manifest, {
    headers: { "Content-Type": "application/manifest+json" },
  });
}
