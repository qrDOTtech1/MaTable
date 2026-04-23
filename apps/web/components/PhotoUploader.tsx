"use client";
import { useEffect, useRef, useState } from "react";
import { API_URL, api, apiUpload } from "@/lib/api";

export type Photo = {
  id: string;
  kind: "RESTAURANT" | "DISH";
  menuItemId?: string | null;
  mimeType: string;
  size: number;
  position: number;
  path: string; // /api/photo/:id
};

/**
 * Gère une galerie de photos multiples pour :
 *  - le restaurant (kind=RESTAURANT) si menuItemId non fourni
 *  - un plat (kind=DISH) si menuItemId fourni
 *
 * Features : upload multi-fichiers, aperçu, suppression, réordonnancement.
 */
export default function PhotoUploader({
  menuItemId,
  label = "Photos",
  max = 20,
}: {
  menuItemId?: string;
  label?: string;
  max?: number;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [photos, setPhotos] = useState<Photo[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const kind = menuItemId ? "DISH" : "RESTAURANT";

  async function reload() {
    try {
      const qs = new URLSearchParams({ kind });
      if (menuItemId) qs.set("menuItemId", menuItemId);
      const r = await api<{ photos: Photo[] }>(`/api/pro/photos?${qs}`);
      setPhotos(r.photos);
    } catch (e: any) {
      setError(e?.message ?? "Erreur de chargement");
    }
  }

  useEffect(() => { reload(); /* eslint-disable-next-line */ }, [menuItemId]);

  async function onPick(files: FileList | null) {
    if (!files || files.length === 0) return;
    if (photos.length + files.length > max) {
      setError(`Maximum ${max} photos.`);
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await apiUpload<{ photos: Photo[] }>(
        "/api/pro/photos",
        Array.from(files),
        { query: { menuItemId, kind } }
      );
      await reload();
    } catch (e: any) {
      setError(e?.message ?? "Upload impossible");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function remove(id: string) {
    if (!confirm("Supprimer cette photo ?")) return;
    try {
      await api(`/api/pro/photos/${id}`, { method: "DELETE" });
      setPhotos((p) => p.filter((x) => x.id !== id));
    } catch (e: any) {
      setError(e?.message ?? "Suppression impossible");
    }
  }

  async function move(id: string, dir: -1 | 1) {
    const idx = photos.findIndex((p) => p.id === id);
    const j = idx + dir;
    if (idx < 0 || j < 0 || j >= photos.length) return;
    const next = [...photos];
    [next[idx], next[j]] = [next[j], next[idx]];
    setPhotos(next);
    try {
      await api("/api/pro/photos/reorder", {
        method: "PATCH",
        body: JSON.stringify({ order: next.map((p, i) => ({ id: p.id, position: i })) }),
      });
    } catch (e: any) {
      setError(e?.message ?? "Réordonnancement impossible");
    }
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-bold text-white">{label}</h3>
          <p className="text-xs text-white/50">
            {photos.length}/{max} — {kind === "DISH" ? "photos du plat" : "photos du restaurant"}
          </p>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy || photos.length >= max}
          className="px-3 py-2 bg-orange-500 hover:bg-orange-400 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors"
        >
          {busy ? "Upload…" : "📷 Importer des images"}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={(e) => onPick(e.target.files)}
        />
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs px-3 py-2 rounded-lg">
          {error}
        </div>
      )}

      {photos.length === 0 ? (
        <div
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-white/10 hover:border-orange-400/50 rounded-xl p-8 text-center cursor-pointer transition-colors"
        >
          <div className="text-4xl mb-2">📸</div>
          <p className="text-sm text-white/60">Cliquez pour importer plusieurs images</p>
          <p className="text-[10px] text-white/30 mt-1">JPG, PNG, WEBP — max 8 Mo par fichier</p>
        </div>
      ) : (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2">
          {photos.map((p, i) => (
            <div
              key={p.id}
              className="group relative aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10"
            >
              <img
                src={`${API_URL}${p.path}`}
                alt=""
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 p-1">
                <div className="flex gap-1">
                  <button
                    onClick={() => move(p.id, -1)}
                    disabled={i === 0}
                    className="p-1 bg-white/20 hover:bg-white/30 disabled:opacity-30 rounded text-xs"
                    title="Reculer"
                  >
                    ◀
                  </button>
                  <button
                    onClick={() => move(p.id, +1)}
                    disabled={i === photos.length - 1}
                    className="p-1 bg-white/20 hover:bg-white/30 disabled:opacity-30 rounded text-xs"
                    title="Avancer"
                  >
                    ▶
                  </button>
                </div>
                <button
                  onClick={() => remove(p.id)}
                  className="px-2 py-0.5 bg-rose-600 hover:bg-rose-500 text-white text-[10px] font-bold rounded"
                >
                  Supprimer
                </button>
              </div>
              <div className="absolute top-1 left-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                {i + 1}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
