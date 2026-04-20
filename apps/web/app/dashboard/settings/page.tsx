"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Restaurant = {
  id: string; name: string; slug?: string | null;
  description?: string | null; address?: string | null; city?: string | null;
  phone?: string | null; email?: string | null; coverImageUrl?: string | null;
  acceptReservations: boolean; depositPerGuestCents: number;
  avgPrepMinutes: number; reservationPolicy?: string | null;
  tipsEnabled: boolean; serviceCallEnabled: boolean; reviewsEnabled: boolean;
};

export default function SettingsPage() {
  const [form, setForm] = useState<Partial<Restaurant>>({});
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api<{ restaurant: Restaurant }>("/api/pro/me")
      .then((r) => setForm(r.restaurant))
      .catch(() => (window.location.href = "/login"));
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    await api("/api/pro/restaurant", {
      method: "PATCH",
      body: JSON.stringify({
        name: form.name,
        slug: form.slug || undefined,
        description: form.description || undefined,
        address: form.address || undefined,
        city: form.city || undefined,
        phone: form.phone || undefined,
        email: form.email || undefined,
        coverImageUrl: form.coverImageUrl || undefined,
        acceptReservations: form.acceptReservations,
        depositPerGuestCents: form.depositPerGuestCents ?? 0,
        avgPrepMinutes: form.avgPrepMinutes ?? 90,
        reservationPolicy: form.reservationPolicy || undefined,
        tipsEnabled: form.tipsEnabled,
        serviceCallEnabled: form.serviceCallEnabled,
        reviewsEnabled: form.reviewsEnabled,
      }),
    });
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  const f = (field: keyof Restaurant) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.value }));
  const fBool = (field: keyof Restaurant) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((p) => ({ ...p, [field]: e.target.checked }));

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Paramètres du restaurant</h1>
      <form onSubmit={save} className="space-y-6 max-w-2xl">

        {/* Identité */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-slate-700">Identité</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nom du restaurant *</label>
              <input className="w-full border rounded px-2 py-1" value={form.name ?? ""} onChange={f("name")} required />
            </div>
            <div>
              <label className="label">Slug public <span className="text-slate-400 text-xs">(matable.app/r/…)</span></label>
              <input className="w-full border rounded px-2 py-1 font-mono" value={form.slug ?? ""} onChange={f("slug")}
                pattern="[a-z0-9\-]+" title="Minuscules, chiffres et tirets uniquement" />
            </div>
          </div>
          <div>
            <label className="label">Description</label>
            <textarea className="w-full border rounded px-2 py-1" rows={3} value={form.description ?? ""} onChange={f("description")} />
          </div>
          <div>
            <label className="label">URL photo de couverture</label>
            <input className="w-full border rounded px-2 py-1" placeholder="https://..." value={form.coverImageUrl ?? ""} onChange={f("coverImageUrl")} />
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
              <input className="w-full border rounded px-2 py-1" type="email" value={form.email ?? ""} onChange={f("email")} />
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
            { field: "tipsEnabled" as const, label: "💳 Pourboires" },
            { field: "serviceCallEnabled" as const, label: "🔔 Appel serveur depuis la table" },
            { field: "reviewsEnabled" as const, label: "⭐ Avis clients (plats & serveurs)" },
          ].map(({ field, label }) => (
            <label key={field} className="flex items-center gap-2 cursor-pointer">
              <input type="checkbox" checked={(form[field] as boolean) ?? false} onChange={fBool(field)} />
              <span className="text-sm">{label}</span>
            </label>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <button className="btn-primary" type="submit">Enregistrer</button>
          {saved && <span className="text-green-600 text-sm font-medium">✓ Sauvegardé</span>}
        </div>
      </form>
    </div>
  );
}
