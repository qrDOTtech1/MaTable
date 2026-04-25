"use client";
import { useEffect, useState } from "react";
import { api, redirectOn401 } from "@/lib/api";
import PhotoUploader from "@/components/PhotoUploader";

type OpeningHour = { id?: string; dayOfWeek: number; openMin: number; closeMin: number; service?: string };
type Server = { id: string; name: string; schedules: ServerSchedule[] };
type ServerSchedule = { id: string; dayOfWeek: number; openMin: number; closeMin: number };
type Restaurant = {
  id: string; name: string; slug?: string | null;
  description?: string | null; address?: string | null; city?: string | null;
  phone?: string | null; email?: string | null;
  acceptReservations: boolean; depositPerGuestCents: number;
  avgPrepMinutes: number; reservationPolicy?: string | null;
  tipsEnabled: boolean; serviceCallEnabled: boolean; reviewsEnabled: boolean;
  isPartner: boolean;
  openingHours?: OpeningHour[];
};
type ServicePins = { caissePin: string | null; cuisinePin: string | null };

const DAYS = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
const minToTime = (m: number) => `${String(Math.floor(m / 60)).padStart(2, "0")}:${String(m % 60).padStart(2, "0")}`;

export default function SettingsPage() {
  const [form, setForm] = useState<Partial<Restaurant>>({});
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Service PINs
  const [pins, setPins] = useState<ServicePins>({ caissePin: null, cuisinePin: null });
  const [savingPins, setSavingPins] = useState(false);
  const [savedPins, setSavedPins] = useState(false);

  useEffect(() => {
    api<{ restaurant: Restaurant }>("/api/pro/me")
      .then((r) => setForm(r.restaurant))
      .catch(redirectOn401);
    api<ServicePins>("/api/pro/service-pins")
      .then((r) => setPins(r))
      .catch(() => {});
  }, []);

  const savePins = async () => {
    setSavingPins(true);
    try {
      await api("/api/pro/service-pins", {
        method: "PATCH",
        body: JSON.stringify({
          caissePin:  pins.caissePin?.trim()  || null,
          cuisinePin: pins.cuisinePin?.trim() || null,
        }),
      });
      setSavedPins(true);
      setTimeout(() => setSavedPins(false), 2500);
    } catch (err: any) {
      setError(err?.message ?? "Erreur lors de la sauvegarde des PINs");
    } finally {
      setSavingPins(false);
    }
  };

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
          acceptReservations: form.acceptReservations ?? false,
          depositPerGuestCents: form.depositPerGuestCents ?? 0,
          avgPrepMinutes: form.avgPrepMinutes ?? 90,
          reservationPolicy: form.reservationPolicy?.trim() || undefined,
          tipsEnabled: form.tipsEnabled ?? true,
          serviceCallEnabled: form.serviceCallEnabled ?? true,
          reviewsEnabled: form.reviewsEnabled ?? true,
          isPartner: form.isPartner ?? false,
          openingHours: form.openingHours ?? [],
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
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6 text-white">Paramètres du restaurant</h1>

      {error && (
        <div className="mb-4 px-4 py-3 bg-red-500/10 border border-red-500/30 rounded text-sm text-red-400 flex items-start gap-2">
          <span className="shrink-0">⚠️</span>
          <span className="flex-1">{error}</span>
          <button className="text-red-400/50 hover:text-red-400 shrink-0" onClick={() => setError(null)}>✕</button>
        </div>
      )}

      <form onSubmit={save} className="space-y-6 max-w-2xl">
        {/* Opening Hours */}
        <div className="card space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-white">Horaires d'ouverture</h2>
            <button type="button" className="text-sm text-orange-400 hover:text-orange-300" onClick={addOpeningHour}>
              + Ajouter un créneau
            </button>
          </div>
          {(form.openingHours ?? []).length === 0 ? (
            <p className="text-sm text-white/50">Aucun horaire défini. Cliquez pour ajouter.</p>
          ) : (
            <div className="space-y-2">
              {(form.openingHours ?? []).map((h, idx) => (
                <div key={idx} className="flex items-center gap-2">
                  <select
                    className="border border-white/10 rounded px-2 py-1 bg-white/5 text-white"
                    value={h.dayOfWeek}
                    onChange={(e) => updateOpeningHour(idx, "dayOfWeek", parseInt(e.target.value))}
                  >
                    {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
                  </select>
                  <input
                    type="time"
                    className="border border-white/10 rounded px-2 py-1 bg-white/5 text-white"
                    value={minToTime(h.openMin)}
                    onChange={(e) => updateOpeningHour(idx, "openMin", timeToMin(e.target.value))}
                  />
                  <span className="text-white/50">-</span>
                  <input
                    type="time"
                    className="border border-white/10 rounded px-2 py-1 bg-white/5 text-white"
                    value={minToTime(h.closeMin)}
                    onChange={(e) => updateOpeningHour(idx, "closeMin", timeToMin(e.target.value))}
                  />
                  <button type="button" className="text-red-400/50 hover:text-red-400" onClick={() => removeOpeningHour(idx)}>✕</button>
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
          <h2 className="font-semibold text-white">Identité</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Nom du restaurant *</label>
              <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" value={form.name ?? ""} onChange={f("name")} required />
            </div>
            <div>
              <label className="label">Slug public <span className="text-white/40 text-xs">(minuscules, chiffres, tirets)</span></label>
              <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white font-mono placeholder-white/30" value={form.slug ?? ""} onChange={f("slug")}
                pattern="[a-z0-9\-]+" title="Minuscules, chiffres et tirets uniquement" />
            </div>
          </div>

          {/* Live URL preview */}
          {form.slug && (
            <div className="flex items-center gap-2 bg-orange-500/10 border border-orange-500/30 rounded-lg px-3 py-2">
              <span className="text-xs text-white/50">Votre page publique :</span>
              <a
                href={`/${form.slug}`}
                target="_blank"
                rel="noopener noreferrer"
                className="font-mono text-sm text-orange-400 font-semibold hover:text-orange-300 flex items-center gap-1"
              >
                matable.pro/{form.slug} ↗
              </a>
              <button
                type="button"
                className="ml-auto text-xs text-white/40 hover:text-white/60"
                onClick={() => navigator.clipboard.writeText(`https://matable.pro/${form.slug}`)}
                title="Copier le lien"
              >
                📋 Copier
              </button>
            </div>
          )}

          <div>
            <label className="label">Description (affichée sur votre page publique)</label>
            <textarea className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" rows={3} value={form.description ?? ""} onChange={f("description")} />
          </div>
        </div>

        {/* Contact */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Contact & adresse</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label">Adresse</label>
              <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" value={form.address ?? ""} onChange={f("address")} />
            </div>
            <div>
              <label className="label">Ville</label>
              <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" value={form.city ?? ""} onChange={f("city")} />
            </div>
            <div>
              <label className="label">Téléphone</label>
              <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" value={form.phone ?? ""} onChange={f("phone")} />
            </div>
            <div>
              <label className="label">Email contact</label>
              {/* type="text" intentionnel : on valide côté API, pas de blocage navigateur sur vide */}
              <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" type="text" placeholder="contact@monresto.fr" value={form.email ?? ""} onChange={f("email")} />
            </div>
          </div>
        </div>

        {/* Réservations */}
        <div className="card space-y-3">
          <h2 className="font-semibold text-white">Réservations</h2>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="checkbox" checked={form.acceptReservations ?? false} onChange={fBool("acceptReservations")} />
            <span className="text-sm font-medium text-white">Activer les réservations en ligne</span>
          </label>
          {form.acceptReservations && (
            <>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Durée moyenne d'un repas (min)</label>
                  <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" type="number" min="30" max="300"
                    value={form.avgPrepMinutes ?? 90}
                    onChange={(e) => setForm((p) => ({ ...p, avgPrepMinutes: parseInt(e.target.value) }))} />
                </div>
                <div>
                  <label className="label">Arrhes par couvert (€)</label>
                  <input className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" type="number" min="0" step="0.50"
                    value={((form.depositPerGuestCents ?? 0) / 100).toFixed(2)}
                    onChange={(e) => setForm((p) => ({ ...p, depositPerGuestCents: Math.round(parseFloat(e.target.value) * 100) }))} />
                </div>
              </div>
              <div>
                <label className="label">Politique d'annulation</label>
                <textarea className="w-full border border-white/10 rounded px-3 py-2 bg-white/5 text-white placeholder-white/30" rows={2} value={form.reservationPolicy ?? ""} onChange={f("reservationPolicy")} />
              </div>
            </>
          )}
        </div>

        {/* Fonctionnalités */}
        <div className="card space-y-2">
          <h2 className="font-semibold text-white mb-3">Fonctionnalités client</h2>
          {[
            { field: "tipsEnabled" as const, label: "💳 Pourboires", desc: "Les clients peuvent laisser un pourboire lors du paiement" },
            { field: "serviceCallEnabled" as const, label: "🔔 Appel serveur", desc: "Bouton d'appel depuis la table client" },
            { field: "reviewsEnabled" as const, label: "⭐ Avis clients", desc: "Avis sur les plats et les serveurs après paiement" },
          ].map(({ field, label, desc }) => (
            <label key={field} className="flex items-start gap-3 cursor-pointer py-1">
              <input type="checkbox" className="mt-0.5" checked={(form[field] as boolean) ?? false} onChange={fBool(field)} />
              <div>
                <span className="text-sm font-medium text-white">{label}</span>
                <p className="text-xs text-white/50">{desc}</p>
              </div>
            </label>
          ))}
        </div>

        {/* Visibilité Sociale */}
        <div className="card space-y-2">
          <h2 className="font-semibold text-white mb-3">Visibilité Sociale</h2>
          <label className="flex items-start gap-3 cursor-pointer py-1">
            <input type="checkbox" className="mt-0.5" checked={form.isPartner ?? false} onChange={fBool("isPartner")} />
            <div>
              <span className="text-sm font-medium text-white">Partenaire public</span>
              <p className="text-xs text-white/50">Afficher mon restaurant sur l'application sociale Ma Table</p>
            </div>
          </label>
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
            <span className="text-emerald-400 text-sm font-medium flex items-center gap-1">
              ✓ Sauvegardé
            </span>
          )}
        </div>
      </form>

      {/* Portails de Service */}
      <section className="mt-8 max-w-2xl bg-white/[0.03] border border-white/[0.06] rounded-2xl p-6 space-y-5">
        <div>
          <h2 className="text-lg font-bold text-white">🔐 Portails de Service</h2>
          <p className="text-xs text-white/40 mt-1">
            Chaque service accède à sa vue dédiée via un code PIN. Partagez le PIN uniquement aux personnes concernées.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Caisse PIN */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">💳</span>
              <div>
                <p className="text-sm font-semibold text-white">Service Caisse</p>
                {form.slug && (
                  <p className="text-[11px] text-white/30 font-mono">/{form.slug}/caisse</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">PIN (4-8 chiffres)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4,8}"
                maxLength={8}
                value={pins.caissePin ?? ""}
                onChange={(e) => setPins((p) => ({ ...p, caissePin: e.target.value || null }))}
                placeholder="ex : 1234"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono tracking-widest text-base placeholder-white/20 focus:outline-none focus:border-emerald-500/50"
              />
            </div>
            {pins.caissePin ? (
              <p className="text-[11px] text-emerald-400/70">✓ Caisse activée</p>
            ) : (
              <p className="text-[11px] text-white/20">Aucun PIN — service désactivé</p>
            )}
          </div>

          {/* Cuisine PIN */}
          <div className="rounded-xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">🍳</span>
              <div>
                <p className="text-sm font-semibold text-white">Vue Cuisine</p>
                {form.slug && (
                  <p className="text-[11px] text-white/30 font-mono">/{form.slug}/cuisine</p>
                )}
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">PIN (4-8 chiffres)</label>
              <input
                type="text"
                inputMode="numeric"
                pattern="[0-9]{4,8}"
                maxLength={8}
                value={pins.cuisinePin ?? ""}
                onChange={(e) => setPins((p) => ({ ...p, cuisinePin: e.target.value || null }))}
                placeholder="ex : 5678"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2 text-white font-mono tracking-widest text-base placeholder-white/20 focus:outline-none focus:border-amber-500/50"
              />
            </div>
            {pins.cuisinePin ? (
              <p className="text-[11px] text-amber-400/70">✓ Cuisine activée</p>
            ) : (
              <p className="text-[11px] text-white/20">Aucun PIN — service désactivé</p>
            )}
          </div>
        </div>

        {/* Info serveur */}
        <div className="rounded-xl bg-white/[0.02] border border-white/[0.05] p-3 flex items-start gap-3">
          <span className="text-lg">👨‍🍳</span>
          <div>
            <p className="text-xs font-semibold text-white">Vue Serveur</p>
            <p className="text-[11px] text-white/40 mt-0.5">
              Le PIN de chaque serveur est géré individuellement depuis{" "}
              <a href="/dashboard/serveurs" className="text-orange-400 hover:underline">Gestion des Serveurs</a>.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={savePins}
            disabled={savingPins}
            className="px-6 py-2.5 bg-orange-600 hover:bg-orange-500 disabled:opacity-50 text-white font-bold rounded-xl transition-colors text-sm"
          >
            {savingPins ? "Enregistrement…" : "Enregistrer les PINs"}
          </button>
          {savedPins && <span className="text-emerald-400 text-sm font-medium">✓ PINs sauvegardés</span>}
        </div>
      </section>

      {/* Galerie photos du restaurant */}
      <section className="mt-10 max-w-4xl bg-white/[0.03] border border-white/10 rounded-2xl p-6">
        <h2 className="text-lg font-bold text-white mb-1">Galerie du restaurant</h2>
        <p className="text-xs text-white/50 mb-4">
          Importez plusieurs images (façade, salle, ambiance). Elles apparaissent sur la page publique et dans l'app sociale.
        </p>
        <PhotoUploader label="Photos du restaurant" max={30} />
      </section>
    </div>
  );
}
