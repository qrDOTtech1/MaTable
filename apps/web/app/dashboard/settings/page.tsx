"use client";
import { useEffect, useState } from "react";
import { api, redirectOn401 } from "@/lib/api";

type OpeningHour = { id?: string; dayOfWeek: number; openMin: number; closeMin: number; service?: string };
type Server = { id: string; name: string; schedules: ServerSchedule[] };
type ServerSchedule = { id: string; dayOfWeek: number; openMin: number; closeMin: number };
type Restaurant = {
  id: string; name: string; slug?: string | null;
  description?: string | null; address?: string | null; city?: string | null;
  phone?: string | null; email?: string | null; coverImageUrl?: string | null;
  acceptReservations: boolean; depositPerGuestCents: number;
  avgPrepMinutes: number; reservationPolicy?: string | null;
  tipsEnabled: boolean; serviceCallEnabled: boolean; reviewsEnabled: boolean;
  openingHours?: OpeningHour[];
};

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default function SettingsPage() {
  const [form, setForm] = useState<Partial<Restaurant>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api<{ restaurant: Restaurant }>("/api/pro/me")
      .then((r) => setForm(r.restaurant))
      .catch(redirectOn401);
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await api("/api/pro/restaurant", {
        method: "PATCH",
        body: JSON.stringify({
          name: form.name,
          slug: form.slug?.trim() || undefined,
          description: form.description?.trim() || undefined,
          address: form.address?.trim() || undefined,
          city: form.city?.trim() || undefined,
          phone: form.phone?.trim() || undefined,
          // email vide → on ne l'envoie pas (évite l'erreur Zod email)
          email: form.email?.trim() || undefined,
          // URL vide → on ne l'envoie pas (évite l'erreur Zod url)
          coverImageUrl: form.coverImageUrl?.trim() || undefined,
          acceptReservations: form.acceptReservations ?? false,
          depositPerGuestCents: form.depositPerGuestCents ?? 0,
          avgPrepMinutes: form.avgPrepMinutes ?? 90,
          reservationPolicy: form.reservationPolicy?.trim() || undefined,
          tipsEnabled: form.tipsEnabled ?? true,
          serviceCallEnabled: form.serviceCallEnabled ?? true,
          reviewsEnabled: form.reviewsEnabled ?? true,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const f = (field: keyof Restaurant) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.value }));

  const fBool = (field: keyof Restaurant) =>
    (e: React.ChangeEvent<HTMLInputElement>) =>
      setForm((p) => ({ ...p, [field]: e.target.checked }));

  const timeToMin = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  };

  const saveOpeningHours = async () => {
    try {
      await api("/api/pro/restaurant", {
        method: "PATCH",
        body: JSON.stringify({ openingHours: form.openingHours ?? [] }),
      });
    } catch (err) {
      console.error("Failed to save opening hours:", err);
    }
  };

  const addOpeningHour = () => {
    setForm(p => ({
      ...p,
      openingHours: [...(p.openingHours ?? []), { dayOfWeek: 1, openMin: 540, closeMin: 1380 }]
    }));
  };

  const updateOpeningHour = (idx: number, field: keyof OpeningHour, value: number) => {
    setForm(p => ({
      ...p,
      openingHours: (p.openingHours ?? []).map((h, i) => i === idx ? { ...h, [field]: value } : h)
    }));
  };

  const removeOpeningHour = (idx: number) => {
    setForm(p => ({
      ...p,
      openingHours: (p.openingHours ?? []).filter((_, i) => i !== idx)
    }));
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres du restaurant</h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded text-sm text-red-700 flex items-start gap-2">
          <span className="shrink-0">⚠️</span>
          <span className="flex-1">{error}</span>
          <button className="text-red-400 hover:text-red-600 shrink-0" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <form onSubmit={save} className="space-y-6 max-w-2xl">
        {/* Opening Hours */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-slate-700">Horaires d'ouverture</h2>
            <button type="button" className="text-sm text-brand hover:underline" onClick={addOpeningHour}>
              + Ajouter un créneau
            </button>
          </div>
          {(form.openingHours ?? []).length === 0 ? (
            <p className="text-sm text-slate-400">Aucun horaire défini. Cliquez pour ajouter.</p>
          ) : (
            <div className="space-y-2">
              {(form.openingHours ?? []).map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    className="border rounded px-2 py-1"
                    value={h.dayOfWeek}
                    onChange={(e) => updateOpeningHour(idx, "dayOfWeek", parseInt(e.target.value))}
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <input
                    type="time"
                    className="border rounded px-2 py-1"
                    value={minToTime(h.openMin)}
                    onChange={(e) => updateOpeningHour(idx, "openMin", timeToMin(e.target.value))}
                  />
                  <span>-</span>
                  <input
                    type="time"
                    className="border rounded px-2 py-1"
                    value={minToTime(h.closeMin)}
                    onChange={(e) => updateOpeningHour(idx, "closeMin", timeToMin(e.target.value))}
                  />
                  <button type="button" className="text-red-500 hover:text-red-700" onClick={() => removeOpeningHour(idx)}>✕</button>
                </div>
              ))}
            </div>
          )}
          {(form.openingHours ?? []).length > 0 && (
            <button type="button" className="btn-secondary text-sm" onClick={saveOpeningHours}>
              Sauvegarder les horaires
            </button>
          )}
        </div>

        {/* Identité */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-700">Identité</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nom du restaurant *</label>
              <input className="w-full border rounded px-2 py-1" value={form.name ?? ""} onChange={f("name")} required />
            </div>
            <div>
              <label className="label">Slug public <span className="text-slate-400 text-xs">(minuscules, chiffres, tirets)</span></label>
              <input className="w-full border rounded px-2 py-1 font-mono" value={form.slug ?? ""} onChange={f("slug")}
                pattern="[a-z0-9\-]+" title="Minuscules, chiffres et tirets uniquement" />
            </div>
          </div>

          {/* Live URL preview */}
          {form.slug && (
            <div className="flex items-center gap-2 bg-brand/5 border border-brand/20 rounded-lg px-3 py-2">
              <span className="text-xs text-slate-500">Votre page publique :</span>
              <a
                href={`/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-brand font-semibold hover:underline flex items-center gap-1"
              >
                matable.pro/{form.slug} ↗
              </a>
              <button
                type="button"
                className="ml-auto text-xs text-slate-400 hover:text-slate-600"
                onClick={() => navigator.clipboard.writeText(`https://matable.pro/${form.slug}`)}
                title="Copier le lien"
              >
                📋 Copier
              </button>
            </div>
          )}

          <div>
            <label className="label">Description (affichée sur votre page publique)</label>
            <textarea className="w-full border rounded px-2 py-1" rows={3} value={form.description ?? ""} onChange={f("description")} />
          </div>
          <div>
            <label className="label">URL photo de couverture</label>
            <input className="w-full border rounded px-2 py-1" placeholder="https://…" value={form.coverImageUrl ?? ""} onChange={f("coverImageUrl")} />
          </div>
        </div>

        {/* Contact */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-700">Contact & adresse</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Adresse</label>
              <input className="w-full border rounded px-2 py-1" value={form.address ?? ""} onChange={f("address")} />
            </div>
            <div>
              <label className="label">Ville</label>
              <input className="w-full border rounded px-2 py-1" value={form.city ?? ""} onChange={f("city")} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="w-full border rounded px-2 py-1" value={form.phone ?? ""} onChange={f("phone")} />
            </div>
            <div>
              <label className="label">Email contact</label>
              {/* type="text" intentionnel : on valide côté API, pas de blocage navigateur sur vide */}
              <input className="w-full border rounded px-2 py-1" type="text" placeholder="contact@monresto.fr" value={form.email ?? ""} onChange={f("email")} />
            </div>
          </div>
        </div>

        {/* Réservations */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-700">Réservations</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.acceptReservations ?? false} onChange={fBool("acceptReservations")} />
            <span className="text-sm font-medium">Activer les réservations en ligne</span>
          </label>
          {form.acceptReservations && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Durée moyenne d'un repas (min)</label>
                  <input className="w-full border rounded px-2 py-1" type="number" min="30" max="300"
                    value={form.avgPrepMinutes ?? 90}
                    onChange={(e) => setForm((p) => ({ ...p, avgPrepMinutes: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Arrhes par couvert (€)</label>
                  <input className="w-full border rounded px-2 py-1" type="number" min="0" step="0.50"
                    value={((form.depositPerGuestCents ?? 0) / 100).toFixed(2)}
                    onChange={(e) => setForm((p) => ({ ...p, depositPerGuestCents: Math.round(parseFloat(e.target.value) * 100) }))} />
                </div>
              </div>
              <div>
                <label className="label">Politique d'annulation</label>
                <textarea className="w-full border rounded px-2 py-1" rows={2} value={form.reservationPolicy ?? ""} onChange={f("reservationPolicy")} />
              </div>
            </>
          )}
        </div>

        {/* Fonctionnalités */}
        <div className="card space-y-2">
          <h2 className="font-semibold text-slate-700 mb-3">Fonctionnalités client</h2>
          {[
            { field: "tipsEnabled" as const, label: "💳 Pourboires", desc: "Les clients peuvent laisser un pourboire lors du paiement" },
            { field: "serviceCallEnabled" as const, label: "🔔 Appel serveur", desc: "Bouton d'appel depuis la table client" },
            { field: "reviewsEnabled" as const, label: "⭐ Avis clients", desc: "Avis sur les plats et les serveurs après paiement" },
          ].map(({ field, label, desc }) => (
            <label key={field} className="flex items-start gap-3 cursor-pointer py-1">
              <input type="checkbox" className="mt-0.5" checked={(form[field] as boolean) ?? false} onChange={fBool(field)} />
              <div>
                <span className="text-sm font-medium">{label}</span>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            className="btn-primary px-6"
            type="submit"
            disabled={saving}
          >
            {saving ? "Enregistrement…" : "Enregistrer"}
          </button>
          {saved && (
            <span className="text-green-600 text-sm font-medium flex items-center gap-1">
              ✓ Sauvegardé
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
