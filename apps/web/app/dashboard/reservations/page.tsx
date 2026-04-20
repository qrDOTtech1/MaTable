"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";

type Reservation = {
  id: string;
  startsAt: string;
  partySize: number;
  customerName: string;
  customerEmail: string;
  status: string;
  table?: { number: number } | null;
};

export default function ReservationsPage() {
  const [reservations, setReservations] = useState<Reservation[]>([]);

  useEffect(() => {
    api<{ reservations: Reservation[] }>("/api/pro/reservations")
      .then((r) => setReservations(r.reservations))
      .catch(() => {});
  }, []);

  const updateStatus = async (id: string, status: string) => {
    await api(`/api/pro/reservations/${id}/status`, {
      method: "POST",
      body: JSON.stringify({ status }),
    });
    const r = await api<{ reservations: Reservation[] }>("/api/pro/reservations");
    setReservations(r.reservations);
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Réservations</h1>
      <div className="space-y-2">
        {reservations.map((r) => (
          <div key={r.id} className="card flex items-center justify-between">
            <div>
              <div className="font-medium">{r.customerName}</div>
              <div className="text-sm text-slate-600">
                {new Date(r.startsAt).toLocaleString("fr-FR")} · {r.partySize} couvert(s)
                {r.table && ` · Table ${r.table.number}`}
              </div>
              <div className="text-xs text-slate-500">{r.customerEmail}</div>
            </div>
            <div className="flex gap-2">
              <select
                className="border rounded px-2 py-1 text-sm"
                value={r.status}
                onChange={(e) => updateStatus(r.id, e.target.value)}
              >
                <option value="CONFIRMED">Confirmée</option>
                <option value="SEATED">Installée</option>
                <option value="HONORED">Honorée</option>
                <option value="NO_SHOW">No-show</option>
                <option value="CANCELLED">Annulée</option>
              </select>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
