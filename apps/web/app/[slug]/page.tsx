import { API_URL } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ImageLightbox } from "./ImageLightbox";

// ─── Types ────────────────────────────────────────────────────────────────────
type OpeningHour = { dayOfWeek: number; openMin: number; closeMin: number; service?: string };
type ModifierGroup = {
  id: string; name: string; required: boolean; multiple: boolean;
  options: Array<{ id: string; name: string; priceDeltaCents: number }>;
};
type MenuItem = {
  id: string; name: string; description?: string; priceCents: number;
  imageUrl?: string; allergens: string[]; diets: string[]; category?: string;
  avgRating?: number; reviewsCount?: number;
  modifierGroups?: ModifierGroup[];
};
type Restaurant = {
  id: string; name: string; slug: string;
  description?: string; address?: string; city?: string; phone?: string;
  email?: string; website?: string; coverImageUrl?: string; logoUrl?: string;
  acceptReservations: boolean; depositPerGuestCents: number;
  menuItems: MenuItem[];
  openingHours: OpeningHour[];
};
type Review = { rating: number; comment?: string; menuItem: { name: string }; createdAt: string };
type PageData = {
  restaurant: Restaurant;
  reviews: { avgRating: number | null; count: number; latest: Review[] };
};

const ALLERGEN_LABELS: Record<string, string> = {
  GLUTEN:"Gluten", CRUSTACEANS:"Crustacés", EGGS:"Œufs", FISH:"Poisson",
  PEANUTS:"Arachides", SOYBEANS:"Soja", MILK:"Lait", NUTS:"Fruits à coque",
  CELERY:"Céleri", MUSTARD:"Moutarde", SESAME:"Sésame", SULPHITES:"Sulfites",
  LUPIN:"Lupin", MOLLUSCS:"Mollusques",
};
const DIET_LABELS: Record<string, string> = {
  VEGETARIAN:"🌿 Végétarien", VEGAN:"🌱 Vegan", GLUTEN_FREE:"🌾 Sans gluten",
  LACTOSE_FREE:"🥛 Sans lactose", HALAL:"☪️ Halal", KOSHER:"✡️ Casher", SPICY:"🌶️ Épicé",
};
const DAYS = ["Dim","Lun","Mar","Mer","Jeu","Ven","Sam"];
const minToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}h${String(m % 60).padStart(2, "0")}`;

// ─── Fetch ─────────────────────────────────────────────────────────────────────
async function getPageData(slug: string): Promise<PageData | null> {
  try {
    const res = await fetch(`${API_URL}/api/r/${slug}`, { next: { revalidate: 60 } });
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

// ─── Metadata ──────────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const data = await getPageData(params.slug);
  if (!data || !data.restaurant) return { title: "Restaurant introuvable — A table !" };
  const { restaurant, reviews } = data;
  const desc = restaurant.description
    ?? `Retrouvez le menu de ${restaurant.name}${restaurant.city ? ` à ${restaurant.city}` : ""}. Commandez en ligne via QR code.`;

  return {
    title: `${restaurant.name} — A table !`,
    description: desc,
    openGraph: {
      title: restaurant.name,
      description: desc,
      images: restaurant.coverImageUrl ? [{ url: restaurant.coverImageUrl }] : [],
      type: "website",
    },
    other: {
      "schema:type": "Restaurant",
      "schema:name": restaurant.name,
      ...(restaurant.address ? { "schema:address": restaurant.address } : {}),
      ...(reviews.avgRating ? { "schema:ratingValue": String(reviews.avgRating.toFixed(1)) } : {}),
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function RestaurantPublicPage({ params }: { params: { slug: string } }) {
  const data = await getPageData(params.slug);
  if (!data || !data.restaurant) notFound();

  const { restaurant, reviews } = data;
  const menu = restaurant.menuItems ?? [];

  // Group menu by category
  const byCat = menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    const k = m.category || "Menu";
    (acc[k] ||= []).push(m);
    return acc;
  }, {});

  // Group opening hours by day
  const hoursByDay = restaurant.openingHours.reduce<Record<number, OpeningHour[]>>((acc, h) => {
    (acc[h.dayOfWeek] ||= []).push(h);
    return acc;
  }, {});

  const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));

  return (
    <div className="min-h-screen bg-slate-50">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-brand font-bold text-lg">A table !</Link>
          {restaurant.acceptReservations && (
            <Link href={`/${restaurant.slug}/reserve`} className="btn-primary text-sm py-1.5 px-4">
              📅 Réserver
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero ── */}
      <div className="relative">
        {restaurant.coverImageUrl ? (
          <div className="h-56 md:h-80 overflow-hidden">
            <img src={restaurant.coverImageUrl} alt={restaurant.name}
              className="w-full h-full object-cover" />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
          </div>
        ) : (
          <div className="h-40 bg-gradient-to-br from-brand to-orange-400" />
        )}
        <div className={`max-w-5xl mx-auto px-4 pb-4 ${restaurant.coverImageUrl ? "absolute bottom-0 left-0 right-0 text-white" : "pt-6"}`}>
          <h1 className={`text-3xl md:text-5xl font-extrabold ${restaurant.coverImageUrl ? "drop-shadow" : "text-slate-900"}`}>
            {restaurant.name}
          </h1>
          {restaurant.description && (
            <p className={`mt-1 text-sm md:text-base max-w-xl ${restaurant.coverImageUrl ? "text-white/80 drop-shadow" : "text-slate-600"}`}>
              {restaurant.description}
            </p>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6 grid md:grid-cols-3 gap-6">

        {/* ── Main column ── */}
        <div className="md:col-span-2 space-y-8">

          {/* Rating bar */}
          {reviews.count > 0 && (
            <div className="card flex items-center gap-4">
              <div className="text-center">
                <div className="text-4xl font-extrabold text-brand">{reviews.avgRating!.toFixed(1)}</div>
                <div className="text-amber-400 text-lg">{stars(reviews.avgRating!)}</div>
                <div className="text-xs text-slate-500">{reviews.count} avis vérifiés</div>
              </div>
              <div className="flex-1 space-y-1">
                {reviews.latest.slice(0, 2).map((r, i) => (
                  <div key={i} className="text-sm bg-slate-50 rounded p-2">
                    <span className="font-medium">{r.menuItem.name}</span>
                    <span className="text-amber-400 ml-2 text-xs">{stars(r.rating)}</span>
                    {r.comment && <p className="text-slate-600 italic text-xs mt-0.5">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CTA Réservation */}
          {restaurant.acceptReservations && (
            <div className="card bg-brand/5 border-brand/20 border-2 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-brand text-lg">Réservez votre table</div>
                <div className="text-sm text-slate-600">
                  {restaurant.depositPerGuestCents > 0
                    ? `${(restaurant.depositPerGuestCents / 100).toFixed(0)} € d'arrhes par couvert · annulation gratuite`
                    : "Réservation gratuite, annulation flexible"}
                </div>
              </div>
              <Link href={`/${restaurant.slug}/reserve`} className="btn-primary whitespace-nowrap">
                📅 Réserver
              </Link>
            </div>
          )}

          {/* Menu */}
          {Object.entries(byCat).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="text-xl font-bold mb-3 border-b border-slate-200 pb-2">{cat}</h2>
              <div className="space-y-3">
                {items.map((item) => (
                  <div key={item.id} className="card flex gap-4">
                    {item.imageUrl && (
                      <ImageLightbox
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-24 h-24 rounded-xl object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold">{item.name}</h3>
                        <span className="font-bold text-brand shrink-0">
                          {(item.priceCents / 100).toFixed(2)} €
                        </span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-slate-600 mt-0.5">{item.description}</p>
                      )}
                      {item.reviewsCount && item.reviewsCount > 0 && (
                        <div className="text-xs text-amber-500 mt-1">
                          {stars(item.avgRating!)} {item.avgRating!.toFixed(1)} ({item.reviewsCount})
                        </div>
                      )}
                      {/* Diet badges */}
                      {(item.diets?.length > 0 || item.allergens?.length > 0) && (
                        <div className="flex flex-wrap gap-1 mt-1.5">
                          {item.diets?.map((d) => (
                            <span key={d} className="text-[10px] px-1.5 py-0.5 bg-green-50 text-green-700 rounded border border-green-200">
                              {DIET_LABELS[d] ?? d}
                            </span>
                          ))}
                          {item.allergens?.map((a) => (
                            <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-50 text-red-600 rounded border border-red-200">
                              ⚠️ {ALLERGEN_LABELS[a] ?? a}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">

          {/* Infos pratiques */}
          <div className="card space-y-3">
            <h3 className="font-bold text-slate-700">Infos pratiques</h3>
            {restaurant.address && (
              <div className="text-sm flex gap-2">
                <span>📍</span>
                <span>{restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ""}</span>
              </div>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="text-sm flex gap-2 text-brand hover:underline">
                <span>📞</span><span>{restaurant.phone}</span>
              </a>
            )}
            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`} className="text-sm flex gap-2 text-brand hover:underline">
                <span>✉️</span><span>{restaurant.email}</span>
              </a>
            )}
            {restaurant.website && (
              <a href={restaurant.website} target="_blank" rel="noopener" className="text-sm flex gap-2 text-brand hover:underline">
                <span>🌐</span><span>Site web</span>
              </a>
            )}
          </div>

          {/* Horaires */}
          {Object.keys(hoursByDay).length > 0 && (
            <div className="card space-y-1.5">
              <h3 className="font-bold text-slate-700 mb-2">Horaires</h3>
              {[1,2,3,4,5,6,0].map((dow) => {
                const slots = hoursByDay[dow];
                const isToday = new Date().getDay() === dow;
                return (
                  <div key={dow} className={`text-sm flex justify-between gap-2 ${isToday ? "font-semibold text-brand" : "text-slate-600"}`}>
                    <span>{DAYS[dow]}{isToday && " ←"}</span>
                    <span>
                      {slots
                        ? slots.map((h) => `${minToTime(h.openMin)}–${minToTime(h.closeMin)}`).join(", ")
                        : <span className="text-slate-400">Fermé</span>}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tous les avis */}
          {reviews.latest.length > 2 && (
            <div className="card space-y-2">
              <h3 className="font-bold text-slate-700 mb-2">Avis récents</h3>
              {reviews.latest.slice(2).map((r, i) => (
                <div key={i} className="text-xs border-b border-slate-100 pb-2 last:border-0">
                  <div className="flex justify-between">
                    <span className="font-medium">{r.menuItem.name}</span>
                    <span className="text-amber-400">{stars(r.rating)}</span>
                  </div>
                  {r.comment && <p className="text-slate-500 italic mt-0.5">"{r.comment}"</p>}
                </div>
              ))}
            </div>
          )}

          {/* Badge A table! */}
          <div className="card text-center py-3 bg-slate-50 border-slate-200">
            <p className="text-xs text-slate-400">Propulsé par</p>
            <Link href="/" className="text-brand font-bold">A table !</Link>
            <p className="text-xs text-slate-400 mt-1">Commandez depuis votre table en 15s</p>
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-slate-200 mt-8 py-6 text-center text-xs text-slate-400">
        {restaurant.name} · Commande et paiement par QR code ·{" "}
        <Link href="/" className="text-brand hover:underline">A table !</Link>
      </footer>
    </div>
  );
}
