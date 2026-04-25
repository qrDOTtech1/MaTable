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
  const email = search.get("email");

  const [invoice, setInvoice] = useState<InvoiceData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [emailSent, setEmailSent] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
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
    if (!email || !sessionId) return;
    setSendingEmail(true);
    try {
      const res = await fetch(`${API_URL}/api/invoice/${sessionId}/send`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (res.ok) setEmailSent(true);
      else setError("Impossible d'envoyer l'email pour l'instant.");
    } catch { setError("Erreur réseau"); }
    finally { setSendingEmail(false); }
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
  const modeLabel: Record<string, string> = { CARD: "Carte bancaire", CASH: "Espèces", COUNTER: "Caisse" };

  return (
    <div className="min-h-screen bg-[#0a0a0a] text-white py-8 px-4">
      {/* Action bar — hidden on print */}
      <div className="max-w-lg mx-auto mb-6 flex items-center gap-3 print:hidden">
        <button
          onClick={handlePrint}
          className="flex-1 py-3 bg-orange-600 hover:bg-orange-500 text-white font-bold rounded-xl text-sm transition-all"
        >
          🖨️ Imprimer / Enregistrer PDF
        </button>
        {email && !emailSent && (
          <button
            onClick={sendEmail}
            disabled={sendingEmail}
            className="flex-1 py-3 bg-white/[0.06] hover:bg-white/[0.1] border border-white/[0.08] text-white/80 font-bold rounded-xl text-sm transition-all disabled:opacity-50"
          >
            {sendingEmail ? "Envoi…" : "📧 Envoyer par email"}
          </button>
        )}
        {emailSent && (
          <div className="flex-1 py-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 font-bold rounded-xl text-sm text-center">
            ✓ Email envoyé
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
          {invoice.restaurant.phone && <p className="text-sm text-gray-500">Tél : {invoice.restaurant.phone}</p>}
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
              <span className="text-gray-500">Règlement</span>
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
                  <span className="font-semibold">{item.quantity}×</span> {item.name}
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
          {email && <p>Ticket envoyé à {email}</p>}
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
