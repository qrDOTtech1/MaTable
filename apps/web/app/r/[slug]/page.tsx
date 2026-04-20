import { redirect } from "next/navigation";

// Legacy route — now superseded by matable.pro/:slug (root-level [slug])
// Keep this for backward compat: any /r/:slug link just bounces to /:slug
export default function LegacyRestaurantPage({ params }: { params: { slug: string } }) {
  redirect(`/${params.slug}`);
}
