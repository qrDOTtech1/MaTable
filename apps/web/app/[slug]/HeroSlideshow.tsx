"use client";

import { useEffect, useState } from "react";

type SlideshowPhoto = { id: string; url: string; alt: string };

export function HeroSlideshow({
  photos,
  fallbackUrl,
  alt,
}: {
  photos: SlideshowPhoto[];
  fallbackUrl: string | null;
  alt: string;
}) {
  // Si aucune photo n'est dispo, on tombe sur la cover ; sinon on construit la liste de slides
  const slides: SlideshowPhoto[] =
    photos.length > 0
      ? photos
      : fallbackUrl
        ? [{ id: "cover", url: fallbackUrl, alt }]
        : [];

  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (slides.length <= 1) return;
    const id = setInterval(() => {
      setIndex((i) => (i + 1) % slides.length);
    }, 5000);
    return () => clearInterval(id);
  }, [slides.length]);

  if (slides.length === 0) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-orange-900/30 via-slate-900 to-black" />
    );
  }

  return (
    <>
      {slides.map((photo, i) => (
        <img
          key={photo.id}
          src={photo.url}
          alt={photo.alt}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
            i === index ? "opacity-100" : "opacity-0"
          }`}
          decoding="async"
          loading={i === 0 ? "eager" : "lazy"}
          referrerPolicy="no-referrer"
          crossOrigin="anonymous"
          onError={(e) => {
            (e.currentTarget as HTMLImageElement).style.display = "none";
          }}
        />
      ))}

      {/* Indicateurs de slides — visibles seulement si plusieurs photos */}
      {slides.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex gap-2">
          {slides.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setIndex(i)}
              aria-label={`Voir la photo ${i + 1}`}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-orange-500" : "w-1.5 bg-white/40 hover:bg-white/70"
              }`}
            />
          ))}
        </div>
      )}
    </>
  );
}
