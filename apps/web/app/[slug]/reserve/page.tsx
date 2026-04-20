"use client";
import { API_URL } from "@/lib/api";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

type Slot = { date: string; time: string; available: boolean };
type Restaurant = {
  id: string; name: string; slug: string;
  acceptReservations: boolean; depositPerGuestCents: number;
  avgPrepMinutes: number; reservationPolicy?: string;
  logoUrl?: string; coverImageUrl?: string;
};

export default function ReservePage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [slots, setSlots] = useState<Slot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [step, setStep] = useState<"form" | "pay" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  // Form state
  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [guests, setGuests] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Load restaurant info
  useEffect(() => {
    fetch(`${API_URL}/api/r/${slug}`, { next: { revalidate: 60 } } as RequestInit)
      .then((r) => r.json())
      .then((d) => {
        setRestaurant(d.restaurant);
        if (!d.restaurant.acceptReservations) router.replace(`/${slug}`);
      })
      .catch(() => router.replace(`/${slug}`));
  }, [slug]);

  // Load availability slots when date or guests change
  useEffect(() => {
    if (!restaurant) return;
    setLoadingSlots(true);
    setSelectedSlot(null);
    fetch(`${API_URL}/api/r/${slug}/availability?date=${date}&guests=${guests}`)
      .then((r) => r.json())
      .then((d) => setSlots(d.slots ?? []))
      .catch(() => setSlots([]))
      .finally(() => setLoadingSlots(false));
  }, [date, guests, restaurant]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSlot) { setError("Choisissez un créneau horaire"); return; }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/api/r/${slug}/reservations`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date, time: selectedSlot, guests, name, email, phone, notes }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Erreur lors de la réservation");

      if (json.checkoutUrl) {
        // Deposit required — redirect to Stripe
        window.location.href = json.checkoutUrl;
      } else {
        setStep("done");
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!restaurant) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center">
        <div className="text-slate-400 animate-pulse">Chargement…</div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center gap-4 px-4 text-center">
        <div className="text-5xl">✅</div>
        <h1 className="text-2xl font-bold text-slate-800">Réservation confirmée !</h1>
        <p className="text-slate-600 max-w-sm">
          Un email de confirmation vous a été envoyé à <strong>{email}</strong>.
        </p>
        <Link href={`/${slug}`} className="btn-primary mt-2">← Retour au menu</Link>
      </div>
    );
  }

  const depositEur = (restaurant.depositPerGuestCents / 100).toFixed(0);
  const totalDeposit = ((restaurant.depositPerGuestCents * guests) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur border-b border-slate-100">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${slug}`} className="text-slate-500 hover:text-slate-700 text-sm flex items-center gap-1">
            ← {restaurant.name}
          </Link>
          <span className="text-brand font-bold">A table !</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-1">Réserver chez {restaurant.name}</h1>
        {restaurant.depositPerGuestCents > 0 && (
          <p className="text-sm text-slate-500 mb-6">
            {depositEur} € d'arrhes par couvert · annulation gratuite 24h avant
          </p>
        )}

        <form onSubmit={submit} className="space-y-6">
          {/* Date + guests */}
          <div className="card grid grid-cols-2 gap-4">
            <div>
              <label className="label">Date</label>
              <input
                type="date"
                className="w-full border rounded px-3 py-2"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="label">Couverts</label>
              <select
                className="w-full border rounded px-3 py-2"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              >
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <option key={n} value={n}>{n} personne{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Time slots */}
          <div className="card">
            <label className="label mb-2">Créneau horaire</label>
            {loadingSlots ? (
              <p className="text-sm text-slate-400 animate-pulse">Chargement des disponibilités…</p>
            ) : slots.length === 0 ? (
              <p className="text-sm text-slate-500">Aucun créneau disponible pour cette date.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setSelectedSlot(s.time)}
                    className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
                      !s.available
                        ? "bg-slate-100 text-slate-400 cursor-not-allowed"
                        : selectedSlot === s.time
                        ? "bg-brand text-white"
                        : "bg-white border border-slate-200 text-slate-700 hover:border-brand hover:text-brand"
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Contact info */}
          <div className="card space-y-3">
            <label className="label">Vos coordonnées</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="label">Nom complet *</label>
                <input
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div>
                <label className="label">Email *</label>
                <input
                  type="email"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean@example.com"
                  required
                />
              </div>
              <div>
                <label className="label">Téléphone</label>
                <input
                  type="tel"
                  className="w-full border rounded px-3 py-2 text-sm"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 …"
                />
              </div>
            </div>
            <div>
              <label className="label">Demandes particulières</label>
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergie, chaise haute, anniversaire…"
              />
            </div>
          </div>

          {/* Policy */}
          {restaurant.reservationPolicy && (
            <div className="text-xs text-slate-500 bg-slate-100 rounded p-3">
              {restaurant.reservationPolicy}
            </div>
          )}

          {/* Deposit summary */}
          {restaurant.depositPerGuestCents > 0 && selectedSlot && (
            <div className="card bg-brand/5 border-brand/20 border flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold">{guests} couvert{guests > 1 ? "s" : ""}</span> × {depositEur} € arrhes
              </div>
              <div className="font-bold text-brand">{totalDeposit} €</div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="btn-primary w-full py-3 text-base disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting
              ? "Envoi en cours…"
              : restaurant.depositPerGuestCents > 0
              ? `Confirmer et payer ${totalDeposit} €`
              : "Confirmer la réservation"}
          </button>
        </form>
      </div>
    </div>
  );
}
