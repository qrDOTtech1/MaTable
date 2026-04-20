"use client";

import { useEffect, useState } from "react";
import { api, redirectOn401 } from "@/lib/api";

type Testimonial = {
  id: string;
  displayName: string;
  displayRole?: string | null;
  quote: string;
  rating: number;
  published: boolean;
};

export default function TestimonialPage() {
  const [form, setForm] = useState<Partial<Testimonial>>({ rating: 5, published: true });
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ restaurant: { name: string } }>("/api/pro/me")
      .then((r) => setForm((p) => ({ ...p, displayName: p.displayName ?? r.restaurant.name })))
      .catch(() => {});

    api<{ testimonial: Testimonial | null }>("/api/pro/testimonial")
      .then((r) => {
        if (r.testimonial) setForm(r.testimonial);
      })
      .catch(redirectOn401);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await api<{ testimonial: Testimonial }>("/api/pro/testimonial", {
        method: "PUT",
        body: JSON.stringify({
          displayName: (form.displayName ?? "").trim(),
          displayRole: (form.displayRole ?? "").trim() || undefined,
          quote: (form.quote ?? "").trim(),
          rating: form.rating ?? 5,
          published: form.published ?? true,
        }),
      });
      setForm(res.testimonial);
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <div className="flex items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Témoignage</h1>
          <p className="text-sm text-slate-500">Ce témoignage peut apparaître sur la page d'accueil.</p>
        </div>
        {saved && <span className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-1">Enregistré ✓</span>}
      </div>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
          <span className="shrink-0">⚠️</span>
          <span className="flex-1">{error}</span>
          <button className="text-red-400 hover:text-red-600 shrink-0" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <form onSubmit={save} className="card space-y-4 max-w-2xl">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">Nom affiché *</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.displayName ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, displayName: e.target.value }))}
              placeholder="Ex: Brasserie des Halles"
              required
            />
          </div>
          <div>
            <label className="label">Rôle (optionnel)</label>
            <input
              className="w-full border rounded px-2 py-1"
              value={form.displayRole ?? ""}
              onChange={(e) => setForm((p) => ({ ...p, displayRole: e.target.value }))}
              placeholder="Ex: Propriétaire"
            />
          </div>
        </div>

        <div>
          <label className="label">Votre témoignage *</label>
          <textarea
            className="w-full border rounded px-2 py-1"
            rows={5}
            value={form.quote ?? ""}
            onChange={(e) => setForm((p) => ({ ...p, quote: e.target.value }))}
            placeholder="Qu'est-ce qui a changé dans votre salle depuis A table ! ?"
            required
          />
          <p className="text-xs text-slate-400 mt-1">Min 20 caractères. Évitez les infos sensibles (téléphone, emails).</p>
        </div>

        <div className="grid grid-cols-2 gap-3 items-end">
          <div>
            <label className="label">Note</label>
            <select
              className="w-full border rounded px-2 py-1"
              value={String(form.rating ?? 5)}
              onChange={(e) => setForm((p) => ({ ...p, rating: parseInt(e.target.value, 10) }))}
            >
              {[5, 4, 3, 2, 1].map((n) => (
                <option key={n} value={n}>{n}/5</option>
              ))}
            </select>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={form.published ?? true}
              onChange={(e) => setForm((p) => ({ ...p, published: e.target.checked }))}
            />
            Publier sur la home
          </label>
        </div>

        <div className="flex items-center gap-2">
          <button className="btn-primary" type="submit" disabled={saving}>
            {saving ? "Sauvegarde…" : "Enregistrer"}
          </button>
          <span className="text-xs text-slate-400">La home affiche uniquement les témoignages publiés.</span>
        </div>
      </form>
    </div>
  );
}
