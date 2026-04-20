"use client";

import { useEffect, useState } from "react";

export function ImageLightbox({
  src,
  alt,
  className,
}: {
  src: string;
  alt: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  return (
    <>
      <button
        type="button"
        className="shrink-0"
        onClick={() => setOpen(true)}
        aria-label="Agrandir l'image"
      >
        <img src={src} alt={alt} className={className} />
      </button>

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/70 backdrop-blur-sm flex items-center justify-center p-4"
          onMouseDown={() => setOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div
            className="relative max-w-5xl w-full"
            onMouseDown={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              className="absolute -top-3 -right-3 w-10 h-10 rounded-full bg-white text-slate-700 shadow flex items-center justify-center"
              onClick={() => setOpen(false)}
              aria-label="Fermer"
            >
              ✕
            </button>

            <img
              src={src}
              alt={alt}
              className="w-full max-h-[85vh] object-contain rounded-2xl bg-white"
            />
          </div>
        </div>
      )}
    </>
  );
}
