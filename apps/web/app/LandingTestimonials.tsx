"use client";

import { useEffect, useState } from "react";
import { API_URL } from "@/lib/api";

type LandingTestimonial = {
  id: string;
  displayName: string;
  displayRole?: string | null;
  quote: string;
  rating: number;
  restaurantName: string;
  restaurantCity?: string | null;
};

export default function LandingTestimonials() {
  const [items, setItems] = useState<LandingTestimonial[] | null>(null);

  const stars = (rating: number) => {
    const r = Math.max(1, Math.min(5, Math.round(rating || 5)));
    return "★".repeat(r) + "☆".repeat(5 - r);
  };

  useEffect(() => {
    let cancelled = false;
    fetch(`${API_URL}/api/testimonials?limit=3`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled) return;
        setItems((data?.testimonials as LandingTestimonial[] | undefined) ?? []);
      })
      .catch(() => {
        if (cancelled) return;
        setItems([]);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (!items || items.length === 0) return null;

  return (
    <section className="py-24 px-6 border-t border-white/5">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-14">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-4">Ils utilisent A table !</h2>
          <p className="text-white/40">Témoignages de restaurateurs connectés (soumis depuis leur dashboard).</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {items.map((t) => (
            <div key={t.id} className="bg-white/3 border border-white/8 rounded-2xl p-6">
              <div className="flex text-brand text-lg mb-4">{stars(t.rating)}</div>
              <p className="text-sm text-white/60 leading-relaxed mb-6 italic">&ldquo;{t.quote}&rdquo;</p>
              <div className="flex items-center gap-3 border-t border-white/5 pt-4">
                <div className="w-10 h-10 rounded-full bg-brand/20 flex items-center justify-center text-brand font-bold text-sm">
                  {(t.displayName || t.restaurantName).slice(0, 2).toUpperCase()}
                </div>
                <div>
                  <div className="text-sm font-semibold text-white">{t.displayName || t.restaurantName}</div>
                  <div className="text-xs text-white/40">
                    {t.displayRole ? `${t.displayRole} · ` : ""}
                    {t.restaurantCity ? `${t.restaurantName}, ${t.restaurantCity}` : t.restaurantName}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
