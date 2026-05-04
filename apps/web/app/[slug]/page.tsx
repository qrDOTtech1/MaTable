import { API_URL } from "@/lib/api";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { ImageLightbox } from "./ImageLightbox";

// ─── Types ────────────────────────────────────────────────────────────────────
type Photo = { id: string; url: string };
type OpeningHour = { dayOfWeek: number; openMin: number; closeMin: number; service?: string | null };
type MenuItem = {
  id: string; name: string; description?: string | null; priceCents: number;
  imageUrl?: string | null; allergens?: string[]; diets?: string[];
  category?: string | null; avgRating?: number; reviewsCount?: number;
  photos?: Photo[];
};
type Restaurant = {
  id: string; name: string; slug: string;
  description?: string | null; address?: string | null; city?: string | null;
  phone?: string | null; email?: string | null; website?: string | null;
  coverImageUrl?: string | null; logoUrl?: string | null;
  acceptReservations: boolean; depositPerGuestCents: number;
  menuItems: MenuItem[];
  openingHours: OpeningHour[];
  photos?: Photo[];
};
type Review = { rating: number; comment?: string | null; menuItem: { name: string }; createdAt: string };
type PageData = {
  restaurant: Restaurant;
  reviews: { avgRating: number | null; count: number; latest: Review[] };
};

const ALLERGEN_LABELS: Record<string, string> = {
  GLUTEN: "Gluten", CRUSTACEANS: "Crustacés", EGGS: "Œufs", FISH: "Poisson",
  PEANUTS: "Arachides", SOYBEANS: "Soja", MILK: "Lait", NUTS: "Fruits à coque",
  CELERY: "Céleri", MUSTARD: "Moutarde", SESAME: "Sésame", SULPHITES: "Sulfites",
  LUPIN: "Lupin", MOLLUSCS: "Mollusques",
};
const DIET_LABELS: Record<string, string> = {
  VEGETARIAN: "🌿 Végé", VEGAN: "🌱 Vegan", GLUTEN_FREE: "🌾 Sans gluten",
  LACTOSE_FREE: "🥛 Sans lactose", HALAL: "☪️ Halal", KOSHER: "✡️ Casher", SPICY: "🌶️ Épicé",
};
const DAYS = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
const minToTime = (m: number) =>
  `${String(Math.floor(m / 60)).padStart(2, "0")}h${String(m % 60).padStart(2, "0")}`;

function abs(url: string | null | undefined) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${API_URL}${url}`;
}

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
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data?.restaurant) return { title: "Restaurant introuvable — Ma Table" };
  const { restaurant, reviews } = data;
  const desc = restaurant.description
    ?? `Retrouvez le menu de ${restaurant.name}${restaurant.city ? ` à ${restaurant.city}` : ""}. Commandez en ligne via QR code.`;
  return {
    title: `${restaurant.name} — Ma Table`,
    description: desc,
    openGraph: {
      title: restaurant.name,
      description: desc,
      images: abs(restaurant.coverImageUrl) ? [{ url: abs(restaurant.coverImageUrl)! }] : [],
      type: "website",
    },
  };
}

// ─── Page ──────────────────────────────────────────────────────────────────────
export default async function RestaurantPublicPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const data = await getPageData(slug);
  if (!data?.restaurant) notFound();

  const { restaurant, reviews } = data;
  const menu = restaurant.menuItems ?? [];

  const byCat = menu.reduce<Record<string, MenuItem[]>>((acc, m) => {
    const k = m.category || "Menu";
    (acc[k] ||= []).push(m);
    return acc;
  }, {});

  const hoursByDay = (restaurant.openingHours ?? []).reduce<Record<number, OpeningHour[]>>((acc, h) => {
    (acc[h.dayOfWeek] ||= []).push(h);
    return acc;
  }, {});

  const stars = (n: number) => "★".repeat(Math.round(n)) + "☆".repeat(5 - Math.round(n));
  const coverUrl = abs(restaurant.coverImageUrl);
  const logoUrl = abs(restaurant.logoUrl);

  // Galerie publique :
  // - Photos de config resto (salle, ambiance…) depuis restaurant.photos[]
  // - Photos de plats depuis menuItem.imageUrl / menuItem.photos[]
  // Les photos serveurs (server.photoUrl) sont un champ séparé jamais inclus ici
  const restaurantConfigPhotos = (restaurant.photos ?? []).map((p) => ({ id: p.id, url: abs(p.url)!, alt: restaurant.name }));
  const dishGalleryPhotos = menu.flatMap((item) => {
    const itemPhotos = (item.photos ?? []).map((p) => ({ id: p.id, url: abs(p.url)!, alt: item.name }));
    if (itemPhotos.length > 0) return itemPhotos;
    if (item.imageUrl) return [{ id: item.id, url: abs(item.imageUrl)!, alt: item.name }];
    return [];
  });
  // Config photos first, then dish photos (deduped by id)
  const seen = new Set<string>();
  const galleryPhotos = [...restaurantConfigPhotos, ...dishGalleryPhotos].filter((p) => {
    if (seen.has(p.id)) return false;
    seen.add(p.id);
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0a0a0b] text-white">
      {/* ── Nav ── */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0b]/90 backdrop-blur-xl border-b border-white/5">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href="/" className="text-orange-500 font-black text-lg tracking-tight">
            MA <span className="text-white">TABLE</span>
          </Link>
          {restaurant.acceptReservations && (
            <Link
              href={`/${restaurant.slug}/reserve`}
              className="bg-orange-600 hover:bg-orange-500 transition-colors text-white text-sm font-bold px-4 py-2 rounded-xl"
            >
              📅 Réserver
            </Link>
          )}
        </div>
      </nav>

      {/* ── Hero Cover ── */}
      <div className="relative w-full h-64 md:h-96 overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt={restaurant.name} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-orange-900/30 via-slate-900 to-black" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0b] via-[#0a0a0b]/30 to-transparent" />

        {/* Info overlay */}
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-6 max-w-5xl mx-auto">
          <div className="flex items-end gap-4">
            {logoUrl && (
              <div className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-white/10 overflow-hidden bg-slate-800 shrink-0 shadow-2xl">
                <img src={logoUrl} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            <div className="pb-1">
              <h1 className="text-2xl md:text-4xl font-black drop-shadow-lg">{restaurant.name}</h1>
              <div className="flex flex-wrap items-center gap-3 mt-1 text-sm text-white/60">
                {restaurant.city && <span className="flex items-center gap-1">📍 {restaurant.city}</span>}
                {reviews.count > 0 && (
                  <span className="flex items-center gap-1 text-amber-400 font-bold">
                    ★ {reviews.avgRating!.toFixed(1)} <span className="text-white/40 font-normal">({reviews.count} avis)</span>
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-3 gap-8">

        {/* ── Main column ── */}
        <div className="md:col-span-2 space-y-10">

          {/* Description */}
          {restaurant.description && (
            <p className="text-white/60 leading-relaxed">{restaurant.description}</p>
          )}

          {/* CTA Réservation */}
          {restaurant.acceptReservations && (
            <div className="bg-orange-500/10 border border-orange-500/20 rounded-2xl p-5 flex items-center justify-between gap-4">
              <div>
                <div className="font-bold text-orange-400 text-base">Réservez votre table</div>
                <div className="text-sm text-white/50 mt-0.5">
                  {restaurant.depositPerGuestCents > 0
                    ? `${(restaurant.depositPerGuestCents / 100).toFixed(0)} € d'arrhes par couvert`
                    : "Réservation gratuite · annulation flexible"}
                </div>
              </div>
              <Link
                href={`/${restaurant.slug}/reserve`}
                className="shrink-0 bg-orange-600 hover:bg-orange-500 transition-colors text-white font-bold text-sm px-5 py-2.5 rounded-xl"
              >
                📅 Réserver
              </Link>
            </div>
          )}

          {/* Galerie : photos de plats si menu présent, sinon photos de config du resto */}
          {galleryPhotos.length > 0 && (
            <section>
              <h2 className="text-lg font-black mb-4 text-white/80">
                📸 {dishGalleryPhotos.length > 0 ? "Nos plats" : "Galerie"}
              </h2>
              <div className="grid grid-cols-3 gap-2">
                {galleryPhotos.slice(0, 7).map((p, i) => (
                  <ImageLightbox
                    key={p.id}
                    src={p.url}
                    alt={p.alt}
                    className={`w-full rounded-xl object-cover cursor-pointer hover:opacity-90 transition-opacity ${i === 0 ? "col-span-3 h-52" : "h-28"}`}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Menu */}
          {Object.entries(byCat).map(([cat, items]) => (
            <section key={cat}>
              <h2 className="text-base font-black uppercase tracking-widest text-orange-400 mb-4 flex items-center gap-2">
                <span className="w-6 h-px bg-orange-500/50 inline-block" />
                {cat}
              </h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const dishPhotos = (item.photos ?? []).map((p) => ({ ...p, url: abs(p.url)! }));
                  const primaryPhoto = dishPhotos[0]?.url ?? (item.imageUrl ? abs(item.imageUrl) : null);
                  return (
                    <div key={item.id} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:bg-white/[0.05] transition-colors">
                      <div className="flex gap-4 p-4">
                        {primaryPhoto && (
                          <ImageLightbox
                            src={primaryPhoto}
                            alt={item.name}
                            className="w-24 h-24 rounded-xl object-cover shrink-0 cursor-pointer"
                          />
                        )}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2">
                            <h3 className="font-bold text-sm text-white">{item.name}</h3>
                            <span className="font-black text-orange-400 shrink-0 text-sm">
                              {(item.priceCents / 100).toFixed(2)} €
                            </span>
                          </div>
                          {item.description && (
                            <p className="text-xs text-white/40 mt-1 leading-relaxed line-clamp-2">
                              {item.description}
                            </p>
                          )}
                          {item.reviewsCount && item.reviewsCount > 0 ? (
                            <div className="text-xs text-amber-400 mt-1">
                              {stars(item.avgRating!)} {item.avgRating!.toFixed(1)}
                              <span className="text-white/30 ml-1">({item.reviewsCount})</span>
                            </div>
                          ) : null}
                          <div className="flex flex-wrap gap-1 mt-2">
                            {item.diets?.map((d) => (
                              <span key={d} className="text-[10px] px-1.5 py-0.5 bg-green-500/10 text-green-400 rounded border border-green-500/20">
                                {DIET_LABELS[d] ?? d}
                              </span>
                            ))}
                            {item.allergens?.map((a) => (
                              <span key={a} className="text-[10px] px-1.5 py-0.5 bg-red-500/10 text-red-400 rounded border border-red-500/20">
                                ⚠️ {ALLERGEN_LABELS[a] ?? a}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                      {/* Photos supplémentaires du plat */}
                      {dishPhotos.length > 1 && (
                        <div className="flex gap-2 px-4 pb-4">
                          {dishPhotos.slice(1).map((p) => (
                            <ImageLightbox
                              key={p.id}
                              src={p.url}
                              alt={item.name}
                              className="w-16 h-16 rounded-lg object-cover cursor-pointer hover:opacity-80 transition-opacity"
                            />
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          ))}

          {/* Avis */}
          {reviews.latest.length > 0 && (
            <section>
              <h2 className="text-lg font-black mb-4 text-white/80">⭐ Avis clients</h2>
              <div className="space-y-3">
                {reviews.latest.map((r, i) => (
                  <div key={i} className="bg-white/[0.03] border border-white/5 rounded-2xl p-4">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="font-bold text-sm text-orange-400">{r.menuItem.name}</span>
                      <span className="text-amber-400 text-xs">{stars(r.rating)}</span>
                    </div>
                    {r.comment && <p className="text-xs text-white/50 italic">"{r.comment}"</p>}
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* ── Sidebar ── */}
        <aside className="space-y-4">

          {/* Infos pratiques */}
          <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5 space-y-3">
            <h3 className="font-bold text-white/80 text-sm uppercase tracking-widest">Infos pratiques</h3>
            {restaurant.address && (
              <div className="text-sm flex gap-2 text-white/60">
                <span>📍</span>
                <span>{restaurant.address}{restaurant.city ? `, ${restaurant.city}` : ""}</span>
              </div>
            )}
            {restaurant.phone && (
              <a href={`tel:${restaurant.phone}`} className="text-sm flex gap-2 text-orange-400 hover:text-orange-300 transition-colors">
                <span>📞</span><span>{restaurant.phone}</span>
              </a>
            )}
            {restaurant.email && (
              <a href={`mailto:${restaurant.email}`} className="text-sm flex gap-2 text-orange-400 hover:text-orange-300 transition-colors">
                <span>✉️</span><span className="break-all">{restaurant.email}</span>
              </a>
            )}
            {restaurant.website && (
              <a href={restaurant.website} target="_blank" rel="noopener" className="text-sm flex gap-2 text-orange-400 hover:text-orange-300 transition-colors">
                <span>🌐</span><span>Site web ↗</span>
              </a>
            )}
          </div>

          {/* Horaires */}
          {Object.keys(hoursByDay).length > 0 && (
            <div className="bg-white/[0.03] border border-white/5 rounded-2xl p-5">
              <h3 className="font-bold text-white/80 text-sm uppercase tracking-widest mb-3">🕐 Horaires</h3>
              <div className="space-y-1.5">
                {[1, 2, 3, 4, 5, 6, 0].map((dow) => {
                  const slots = hoursByDay[dow];
                  const isToday = new Date().getDay() === dow;
                  return (
                    <div key={dow} className={`text-sm flex justify-between gap-2 ${isToday ? "text-orange-400 font-bold" : "text-white/50"}`}>
                      <span>{DAYS[dow]}{isToday && " ·"}</span>
                      <span>
                        {slots
                          ? slots.map((h) => `${minToTime(h.openMin)}–${minToTime(h.closeMin)}`).join(", ")
                          : <span className="text-white/20">Fermé</span>}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Badge Ma Table */}
          <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-center">
            <p className="text-xs text-white/30 mb-1">Propulsé par</p>
            <Link href="/" className="text-orange-500 font-black text-sm tracking-tight">
              MA TABLE
            </Link>
            <p className="text-xs text-white/20 mt-1">Commandez depuis votre table en 15s</p>
          </div>
        </aside>
      </div>

      {/* ── Footer ── */}
      <footer className="border-t border-white/5 mt-8 py-8 text-center">
        <p className="text-xs text-white/20">
          {restaurant.name} · Commande et paiement par QR code ·{" "}
          <Link href="/" className="text-orange-400 hover:text-orange-300">Ma Table</Link>
        </p>
      </footer>
    </div>
  );
}
