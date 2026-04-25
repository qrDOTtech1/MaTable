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
  const [step, setStep] = useState<"form" | "done">("form");
  const [error, setError] = useState<string | null>(null);

  const today = new Date().toISOString().split("T")[0];
  const [date, setDate] = useState(today);
  const [guests, setGuests] = useState(2);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/api/r/${slug}`)
      .then((r) => r.json())
      .then((d) => {
        setRestaurant(d.restaurant);
        if (!d.restaurant.acceptReservations) router.replace(`/${slug}`);
      })
      .catch(() => router.replace(`/${slug}`));
  }, [slug]);

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
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4 px-4 text-center text-white">
        <div className="text-6xl mb-2">✅</div>
        <h1 className="text-2xl font-black">Réservation confirmée !</h1>
        <p className="text-white/50 max-w-sm text-sm">
          Un email de confirmation a été envoyé à <strong className="text-white">{email}</strong>.
        </p>
        <Link href={`/${slug}`} className="mt-4 px-6 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl transition-colors text-sm">
          ← Retour au menu
        </Link>
      </div>
    );
  }

  const depositEur = (restaurant.depositPerGuestCents / 100).toFixed(0);
  const totalDeposit = ((restaurant.depositPerGuestCents * guests) / 100).toFixed(2);

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white">
      {/* Nav */}
      <nav className="sticky top-0 z-50 bg-[#0a0a0a]/95 backdrop-blur-xl border-b border-white/[0.06]">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link href={`/${slug}`} className="text-white/50 hover:text-white text-sm flex items-center gap-1 transition-colors">
            ← {restaurant.name}
          </Link>
          <span className="text-xs text-white/30 font-medium">Réservation</span>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl font-black">Réserver chez <span className="text-orange-400">{restaurant.name}</span></h1>
          {restaurant.depositPerGuestCents > 0 && (
            <p className="text-sm text-white/40 mt-1">
              {depositEur} € d'arrhes par couvert · annulation gratuite 24h avant
            </p>
          )}
        </div>

        <form onSubmit={submit} className="space-y-4">
          {/* Date + couverts */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider font-bold block mb-2">Date</label>
              <input
                type="date"
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"
                min={today}
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>
            <div>
              <label className="text-xs text-white/50 uppercase tracking-wider font-bold block mb-2">Couverts</label>
              <select
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm focus:outline-none focus:border-orange-500/50"
                value={guests}
                onChange={(e) => setGuests(Number(e.target.value))}
              >
                {[1,2,3,4,5,6,7,8,9,10].map((n) => (
                  <option key={n} value={n} className="bg-[#1a1a1a]">{n} personne{n > 1 ? "s" : ""}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Créneaux */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4">
            <label className="text-xs text-white/50 uppercase tracking-wider font-bold block mb-3">Créneau horaire</label>
            {loadingSlots ? (
              <div className="flex items-center gap-2 text-sm text-white/30">
                <div className="w-4 h-4 border border-white/20 border-t-white/60 rounded-full animate-spin" />
                Chargement des disponibilités…
              </div>
            ) : slots.length === 0 ? (
              <p className="text-sm text-white/40">Aucun créneau disponible pour cette date. Essayez un autre jour.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {slots.map((s) => (
                  <button
                    key={s.time}
                    type="button"
                    disabled={!s.available}
                    onClick={() => setSelectedSlot(s.time)}
                    className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${
                      !s.available
                        ? "bg-white/[0.03] text-white/20 cursor-not-allowed line-through"
                        : selectedSlot === s.time
                        ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                        : "bg-white/[0.06] text-white/70 hover:bg-white/[0.1] hover:text-white border border-white/[0.08]"
                    }`}
                  >
                    {s.time}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Coordonnées */}
          <div className="rounded-2xl bg-white/[0.03] border border-white/[0.07] p-4 space-y-3">
            <label className="text-xs text-white/50 uppercase tracking-wider font-bold block">Vos coordonnées</label>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-white/40 block mb-1">Nom complet *</label>
                <input
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jean Dupont"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Email *</label>
                <input
                  type="email"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="jean@example.com"
                  required
                />
              </div>
              <div>
                <label className="text-xs text-white/40 block mb-1">Téléphone</label>
                <input
                  type="tel"
                  className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+33 6 …"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-white/40 block mb-1">Demandes particulières</label>
              <textarea
                className="w-full bg-white/[0.05] border border-white/[0.08] rounded-xl px-3 py-2.5 text-white text-sm placeholder-white/20 focus:outline-none focus:border-orange-500/50"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Allergie, chaise haute, anniversaire…"
              />
            </div>
          </div>

          {/* Politique d'annulation */}
          {restaurant.reservationPolicy && (
            <div className="text-xs text-white/40 bg-white/[0.02] border border-white/[0.05] rounded-xl p-3">
              {restaurant.reservationPolicy}
            </div>
          )}

          {/* Résumé arrhes */}
          {restaurant.depositPerGuestCents > 0 && selectedSlot && (
            <div className="rounded-2xl bg-orange-500/10 border border-orange-500/20 p-4 flex items-center justify-between">
              <div className="text-sm">
                <span className="font-semibold text-white">{guests} couvert{guests > 1 ? "s" : ""}</span>
                <span className="text-white/50"> × {depositEur} € arrhes</span>
              </div>
              <div className="font-black text-orange-400 text-lg">{totalDeposit} €</div>
            </div>
          )}

          {error && (
            <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">{error}</p>
          )}

          <button
            type="submit"
            disabled={submitting || !selectedSlot}
            className="w-full py-4 bg-orange-600 hover:bg-orange-500 disabled:opacity-40 disabled:cursor-not-allowed text-white font-black text-base rounded-2xl transition-all shadow-lg shadow-orange-500/10"
          >
            {submitting
              ? "Envoi en cours…"
              : restaurant.depositPerGuestCents > 0 && selectedSlot
              ? `Confirmer et payer ${totalDeposit} €`
              : "Confirmer la réservation"}
          </button>
        </form>
      </div>
    </div>
  );
}
