"use client";
import { useEffect, useState, useRef } from "react";
import { useParams, useSearchParams } from "next/navigation";
import { API_URL } from "@/lib/api";

type InvoiceData = {
  sessionId: string;
  closedAt: string | null;
  table: { number: number; zone?: string | null };
  restaurant: { name: string; address?: string | null; city?: string | null; phone?: string | null; email?: string | null };
  orders: { id: string; items: { name: string; quantity: number; priceCents: number }[]; totalCents: number; createdAt: string }[];
  subtotalCents: number;
  tipCents: number;
  totalCents: number;
  paymentMode?: string | null;
};

export default function ReceiptPage() {
  const { tableUuid } = useParams<{ tableUuid: string }>();
  const search = useSearchParams();
  const sessionId = search.get("sessionId");
  const emailParam = search.get("email");

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Email form
  const [emailInput, setEmailInput] = useState(emailParam ?? "");
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);

  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!sessionId) { setError("Session introuvable."); return; }
    fetch(`${API_URL}/api/invoice/${sessionId}`)
      .then(r => r.json())
      .then(d => {
        if (d.error) setError(d.error);
        else setInvoice(d);
      })
      .catch(() => setError("Impossible de charger la facture."));
  }, [sessionId]);

  const handlePrint = () => window.print();

  const sendEmail = async () => {
    const email = emailInput.trim();
    if (!email || !sessionId) return;
    if (!email.includes("@")) { setEmailError("Adresse email invalide"); return; }

    setSendingEmail(true);
    setEmailError(null);
    try {
      const res = await fetch(`${API_URL}/api/invoice/${sessionId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) {
        setEmailSent(true);
      } else {
        const data = await res.json().catch(() => ({}));
        setEmailError(data.error === "email_not_configured"
          ? "L'envoi d'email n'est pas encore configure pour ce restaurant."
          : "Impossible d'envoyer l'email pour l'instant."
        );
      }
    } catch {
      setEmailError("Erreur reseau");
    } finally {
      setSendingEmail(false);
    }
  };

  if (error) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center text-white/50 text-sm">{error}</div>
  );
  if (!invoice) return (
    <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
      <div className="w-8 h-8 border-2 border-orange-500/30 border-t-orange-500 rounded-full animate-spin" />
    </div>
  );

  const fmt = (cents: number) => (cents / 100).toFixed(2) + " €";
  const date = invoice.closedAt ? new Date(invoice.closedAt) : new Date();
  const modeLabel: Record<string, string> = { CARD: "Carte bancaire", CASH: "Especes", COUNTER: "Caisse" };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4">
      {/* Action bar — hidden on print */}
      <div className="max-w-lg mx-auto mb-6 space-y-3 print:hidden">
        <button
          onClick={handlePrint}
          className="w-full py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm transition-all"
        >
          Imprimer / Enregistrer PDF
        </button>

        {/* Email ticket section */}
        {!emailSent ? (
          <div className="bg-white/[0.03] border border-white/[0.06] rounded-2xl p-4 space-y-3">
            <p className="text-sm font-bold text-white/80">Recevoir votre ticket par email</p>
            <div className="flex gap-2">
              <input
                type="email"
                value={emailInput}
                onChange={e => { setEmailInput(e.target.value); setEmailError(null); }}
                onKeyDown={e => e.key === "Enter" && sendEmail()}
                placeholder="votre@email.com"
                className="flex-1 bg-white/[0.04] border border-white/[0.08] rounded-xl px-4 py-2.5 text-sm text-white placeholder-white/20 focus:outline-none focus:border-orange-500/50"
              />
              <button
                onClick={sendEmail}
                disabled={sendingEmail || !emailInput.trim()}
                className="px-5 py-2.5 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 font-bold rounded-xl text-sm transition-all disabled:opacity-40 shrink-0"
              >
                {sendingEmail ? "Envoi..." : "Envoyer"}
              </button>
            </div>
            {emailError && (
              <p className="text-xs text-red-400">{emailError}</p>
            )}
            <p className="text-[10px] text-white/20">Votre email ne sera utilise que pour envoyer ce ticket.</p>
          </div>
        ) : (
          <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 text-center">
            <p className="text-sm text-emerald-400 font-bold">Ticket envoye a {emailInput}</p>
            <p className="text-xs text-emerald-400/50 mt-1">Verifiez votre boite de reception (et vos spams).</p>
          </div>
        )}
      </div>

      {/* Receipt — printable */}
      <div ref={printRef} className="max-w-lg mx-auto bg-white text-gray-900 rounded-2xl p-8 print:rounded-none print:shadow-none print:p-6" style={{ fontFamily: "monospace" }}>
        {/* Header */}
        <div className="text-center mb-6 pb-6 border-b border-dashed border-gray-300">
          <h1 className="text-2xl font-black mb-1">{invoice.restaurant.name}</h1>
          {invoice.restaurant.address && <p className="text-sm text-gray-500">{invoice.restaurant.address}</p>}
          {invoice.restaurant.city && <p className="text-sm text-gray-500">{invoice.restaurant.city}</p>}
          {invoice.restaurant.phone && <p className="text-sm text-gray-500">Tel : {invoice.restaurant.phone}</p>}
          {invoice.restaurant.email && (
            <p className="text-sm text-gray-500">{invoice.restaurant.email}</p>
          )}
          <div className="mt-3 text-xs text-gray-400 uppercase tracking-widest">TICKET DE CAISSE</div>
        </div>

        {/* Info table + date */}
        <div className="mb-5 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-gray-500">Table</span>
            <span className="font-bold">N° {invoice.table.number}{invoice.table.zone ? ` · ${invoice.table.zone}` : ""}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500">Date</span>
            <span className="font-bold">{date.toLocaleDateString("fr-FR")} {date.toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}</span>
          </div>
          {invoice.paymentMode && (
            <div className="flex justify-between">
              <span className="text-gray-500">Reglement</span>
              <span className="font-bold">{modeLabel[invoice.paymentMode] ?? invoice.paymentMode}</span>
            </div>
          )}
        </div>

        {/* Lines */}
        <div className="border-t border-b border-dashed border-gray-300 py-4 mb-4 space-y-1">
          {invoice.orders.flatMap(o =>
            (o.items as any[]).map((item, i) => (
              <div key={`${o.id}-${i}`} className="flex justify-between text-sm">
                <span className="flex-1">
                  <span className="font-semibold">{item.quantity}x</span> {item.name}
                </span>
                <span className="ml-4 shrink-0">{fmt(item.quantity * item.priceCents)}</span>
              </div>
            ))
          )}
        </div>

        {/* Totals */}
        <div className="space-y-1 mb-6">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Sous-total</span>
            <span>{fmt(invoice.subtotalCents)}</span>
          </div>
          {invoice.tipCents > 0 && (
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Pourboire</span>
              <span>{fmt(invoice.tipCents)}</span>
            </div>
          )}
          <div className="flex justify-between font-black text-lg pt-2 border-t border-dashed border-gray-300 mt-2">
            <span>TOTAL</span>
            <span>{fmt(invoice.totalCents)}</span>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-400 border-t border-dashed border-gray-300 pt-5 space-y-1">
          <p>Merci de votre visite !</p>
          <p>Powered by <strong>MaTable</strong> · matable.pro</p>
          {emailSent && <p>Ticket envoye a {emailInput}</p>}
        </div>
      </div>

      {/* Print style override */}
      <style>{`
        @media print {
          body { background: white !important; color: black !important; }
          .print\\:hidden { display: none !important; }
        }
      `}</style>
    </div>
  );
}
