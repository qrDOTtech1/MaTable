import { api, API_URL } from "@/lib/api";
import Link from "next/link";

type MenuItem = { id: string; name: string; description?: string; priceCents: number; imageUrl?: string; allergens: string[] };
type Restaurant = { id: string; name: string; slug: string; description?: string; address?: string; phone?: string; coverImageUrl?: string };

export default async function RestaurantPage({ params }: { params: { slug: string } }) {
  let restaurant: Restaurant | null = null;
  let menu: MenuItem[] = [];
  let reviews = { avgRating: null as number | null, count: 0, latest: [] as any[] };

  try {
    const res = await fetch(`${API_URL}/api/r/${params.slug}`, { next: { revalidate: 60 } });
    if (res.ok) {
      const data = await res.json();
      restaurant = data.restaurant;
      menu = data.restaurant.menuItems || [];
      reviews = data.reviews || {};
    }
  } catch (e) {
    console.error("Failed to load restaurant:", e);
  }

  if (!restaurant) {
    return <div className="p-8 text-center text-slate-600">Restaurant non trouvé</div>;
  }

  return (
    <main className="min-h-screen bg-white">
      {/* Header */}
      <div className="bg-gradient-to-b from-brand to-orange-500 text-white py-8 px-6">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{restaurant.name}</h1>
          <p className="text-orange-100">{restaurant.description}</p>
          {restaurant.address && <p className="text-sm text-orange-100 mt-2">📍 {restaurant.address}</p>}
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        {/* CTA */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <Link href={`/r/${restaurant.slug}/reserve`} className="btn-primary text-center py-3">
            📅 Réserver une table
          </Link>
          <button className="btn-ghost text-center py-3" disabled>
            ⭐ {reviews.avgRating ? reviews.avgRating.toFixed(1) : "—"} ({reviews.count} avis)
          </button>
        </div>

        {/* Menu */}
        <section className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Menu</h2>
          <div className="space-y-4">
            {menu.map((m) => (
              <div key={m.id} className="card">
                <div className="flex gap-4">
                  {m.imageUrl && (
                    <img src={m.imageUrl} alt={m.name} className="w-24 h-24 object-cover rounded" />
                  )}
                  <div className="flex-1">
                    <h3 className="font-semibold">{m.name}</h3>
                    {m.description && <p className="text-sm text-slate-600">{m.description}</p>}
                    {m.allergens.length > 0 && (
                      <p className="text-xs text-slate-500 mt-1">⚠️ {m.allergens.join(", ")}</p>
                    )}
                    <div className="font-bold text-brand mt-2">{(m.priceCents / 100).toFixed(2)} €</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Latest reviews */}
        {reviews.latest.length > 0 && (
          <section>
            <h2 className="text-2xl font-bold mb-4">Derniers avis</h2>
            <div className="space-y-3">
              {reviews.latest.map((r, i) => (
                <div key={i} className="card text-sm">
                  <div className="flex items-start justify-between mb-1">
                    <div className="font-medium">{r.menuItem.name}</div>
                    <div className="text-xs text-brand">{"⭐".repeat(r.rating)}</div>
                  </div>
                  {r.comment && <p className="text-slate-600 italic">&quot;{r.comment}&quot;</p>}
                </div>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
