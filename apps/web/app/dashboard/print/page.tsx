"use client";
import { useEffect, useState, useRef } from "react";
import QRCode from "qrcode";
import { api, redirectOn401 } from "@/lib/api";

type Table = { id: string; number: number };

export default function PrintPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [origin, setOrigin] = useState("");
  const [qrUrls, setQrUrls] = useState<Record<string, string>>({});
  const [copied, setCopied] = useState<string | null>(null);
  const [nfcTable, setNfcTable] = useState<string | null>(null);
  const [nfcWriting, setNfcWriting] = useState(false);
  const [nfcDone, setNfcDone] = useState<string | null>(null);
  const [nfcEnabled, setNfcEnabled] = useState<Set<string>>(new Set());

  useEffect(() => {
    const o = window.location.origin;
    setOrigin(o);
    api<{ tables: Table[] }>(`/api/pro/tables`)
      .then(async (r) => {
        setTables(r.tables);
        // Pre-generate all QR codes
        const urls: Record<string, string> = {};
        for (const t of r.tables) {
          const url = `${o}/order/${t.id}`;
          urls[t.id] = await QRCode.toDataURL(url, { width: 400, margin: 2, color: { dark: "#000", light: "#fff" } });
        }
        setQrUrls(urls);
      })
      .catch(redirectOn401);
  }, []);

  // Copy link
  const copyLink = (t: Table) => {
    navigator.clipboard.writeText(`${origin}/order/${t.id}`);
    setCopied(t.id);
    setTimeout(() => setCopied(null), 2000);
  };

  // Print sticker for one table — optimized for 80mm thermal/label printer
  const printSticker = (t: Table) => {
    const qr = qrUrls[t.id];
    if (!qr) return;
    const hasNfc = nfcEnabled.has(t.id);
    const win = window.open("", "_blank", "width=320,height=500");
    if (!win) return;
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
    <title>Table ${t.number}</title>
    <style>
      * { margin:0; padding:0; box-sizing:border-box; }
      @page {
        size: 80mm auto;
        margin: 0;
      }
      body {
        width: 80mm;
        background: #fff;
        font-family: 'Helvetica Neue', Arial, sans-serif;
        -webkit-print-color-adjust: exact;
        print-color-adjust: exact;
      }
      .sticker {
        width: 80mm;
        display: flex;
        flex-direction: column;
        align-items: center;
        padding: 6mm 4mm 5mm;
        gap: 3mm;
      }
      .headline {
        font-size: 11pt;
        font-weight: 900;
        color: #111;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.5px;
      }
      .table-num {
        font-size: 28pt;
        font-weight: 900;
        color: #111;
        letter-spacing: -1px;
        line-height: 1;
      }
      .sep {
        width: 72mm;
        height: 0.4mm;
        background: #ccc;
      }
      .qr img {
        width: 58mm;
        height: 58mm;
        display: block;
      }
      .cta {
        font-size: 10pt;
        font-weight: 800;
        color: #ea580c;
        text-align: center;
        text-transform: uppercase;
        letter-spacing: 0.3px;
      }
      .nfc-line {
        font-size: 8.5pt;
        color: #4f46e5;
        font-weight: 700;
        text-align: center;
      }
      .brand {
        font-size: 7pt;
        color: #9ca3af;
        font-weight: 600;
        letter-spacing: 1.5px;
        text-transform: uppercase;
      }
    </style></head><body>
    <div class="sticker">
      <p class="headline">Scannez pour commander</p>
      <p class="table-num">Table ${t.number}</p>
      <div class="sep"></div>
      <div class="qr"><img src="${qr}" alt="QR"/></div>
      <div class="sep"></div>
      <p class="cta">📱 Scannez le QR code</p>
      ${hasNfc ? `<p class="nfc-line">✦ Ou posez votre téléphone (NFC)</p>` : ""}
      <p class="brand">MaTable.Pro</p>
    </div>
    <script>window.onload=()=>{ window.print(); window.onafterprint=()=>window.close(); }<\/script>
    </body></html>`;
    win.document.write(html);
    win.document.close();
  };

  // Print all tables PDF (legacy)
  const printAllPdf = async () => {
    const { jsPDF } = await import("jspdf");
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210, pageH = 297, cols = 2, rows = 3;
    const cw = pageW / cols, ch = pageH / rows;
    for (let i = 0; i < tables.length; i++) {
      const t = tables[i];
      const slot = i % (cols * rows);
      if (i > 0 && slot === 0) pdf.addPage();
      const cx = (slot % cols) * cw, cy = Math.floor(slot / cols) * ch;
      const url = `${origin}/order/${t.id}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 600, margin: 1 });
      pdf.setFontSize(22); pdf.text(`Table ${t.number}`, cx + cw / 2, cy + 18, { align: "center" });
      pdf.setFontSize(11); pdf.text("Scannez pour commander", cx + cw / 2, cy + 27, { align: "center" });
      const size = 55;
      pdf.addImage(dataUrl, "PNG", cx + (cw - size) / 2, cy + 31, size, size);
      if (nfcEnabled.has(t.id)) {
        pdf.setFontSize(8); pdf.setTextColor(99, 102, 241);
        pdf.text("✦ Ou posez votre téléphone (NFC)", cx + cw / 2, cy + 91, { align: "center" });
        pdf.setTextColor(0, 0, 0);
      }
      pdf.setFontSize(7); pdf.setTextColor(150);
      pdf.text("MaTable.Pro", cx + cw / 2, cy + 96, { align: "center" });
      pdf.setTextColor(0);
    }
    pdf.save("qr-tables.pdf");
  };

  // NFC write
  const writeNfc = async (t: Table) => {
    if (!("NDEFReader" in window)) {
      alert("L'écriture NFC n'est disponible que sur Chrome pour Android.");
      return;
    }
    setNfcTable(t.id); setNfcWriting(true);
    try {
      const ndef = new (window as any).NDEFReader();
      await ndef.write({ records: [{ recordType: "url", data: `${origin}/order/${t.id}` }] });
      setNfcEnabled(prev => { const n = new Set(prev); n.add(t.id); return n; });
      setNfcDone(t.id);
      setTimeout(() => setNfcDone(null), 3000);
    } catch (err: any) {
      alert(`NFC annulé : ${err.message ?? "Erreur"}`);
    } finally {
      setNfcWriting(false); setNfcTable(null);
    }
  };

  const toggleNfc = (id: string) => {
    setNfcEnabled(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h1 className="text-2xl font-bold mb-1">QR Codes des tables</h1>
        <p className="text-sm text-slate-500">Autocollants · NFC · Copie de lien — chaque QR pointe vers <code className="text-xs text-brand">{origin}/order/&lt;tableId&gt;</code></p>
      </div>

      {/* Actions globales */}
      <div className="card flex flex-wrap gap-3 items-center">
        <button className="btn-primary" onClick={printAllPdf} disabled={!tables.length}>
          🖨️ PDF toutes les tables ({tables.length})
        </button>
        <p className="text-xs text-slate-400">ou imprimez table par table ci-dessous (×3 autocollants)</p>
      </div>

      {/* Table par table */}
      {tables.length === 0 ? (
        <p className="text-slate-500 text-sm">Aucune table configurée.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {tables.map((t) => {
            const url = `${origin}/order/${t.id}`;
            const qr = qrUrls[t.id];
            const isNfcOn = nfcEnabled.has(t.id);
            const isWriting = nfcWriting && nfcTable === t.id;
            const isDone = nfcDone === t.id;
            return (
              <div key={t.id} className="card flex flex-col gap-3">
                {/* Header */}
                <div className="flex items-center justify-between">
                  <span className="text-xl font-black text-white">Table {t.number}</span>
                  {isNfcOn && (
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-indigo-500/20 border border-indigo-500/30 rounded-full text-indigo-300">
                      NFC ✓
                    </span>
                  )}
                </div>

                {/* QR preview */}
                <div className="flex items-center gap-3">
                  {qr ? (
                    <div className="w-16 h-16 rounded-lg border border-slate-700 bg-white p-1 shrink-0">
                      <img src={qr} alt={`QR Table ${t.number}`} className="w-full h-full" />
                    </div>
                  ) : (
                    <div className="w-16 h-16 rounded-lg border border-slate-700 bg-slate-900 flex items-center justify-center shrink-0">
                      <span className="w-4 h-4 border-2 border-slate-500 border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] text-slate-500 font-mono truncate">/order/{t.id.slice(0, 12)}…</p>
                    {/* Copy link */}
                    <button onClick={() => copyLink(t)}
                      className={`mt-1 inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-lg transition-colors ${
                        copied === t.id
                          ? "bg-emerald-500/20 border border-emerald-500/30 text-emerald-300"
                          : "bg-slate-700 hover:bg-slate-600 text-white border border-slate-600"
                      }`}>
                      {copied === t.id ? "✅ Copié !" : "📋 Copier le lien"}
                    </button>
                  </div>
                </div>

                {/* NFC toggle + encoder */}
                <div className="flex items-center justify-between gap-2 pt-1 border-t border-slate-800">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <div onClick={() => toggleNfc(t.id)}
                      className={`w-9 h-5 rounded-full transition-colors relative ${isNfcOn ? "bg-indigo-500" : "bg-slate-700"}`}>
                      <div className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${isNfcOn ? "translate-x-4" : ""}`} />
                    </div>
                    <span className="text-xs text-slate-400 font-medium">NFC actif</span>
                  </label>
                  <button onClick={() => writeNfc(t)} disabled={isWriting}
                    className={`inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1.5 rounded-lg border transition-colors disabled:opacity-60 ${
                      isDone ? "bg-emerald-500/20 border-emerald-500/30 text-emerald-300"
                      : "bg-indigo-500/15 border-indigo-500/30 text-indigo-300 hover:bg-indigo-500/25"
                    }`}>
                    {isWriting
                      ? <><span className="w-3 h-3 border border-indigo-300 border-t-transparent rounded-full animate-spin" />NFC…</>
                      : isDone ? "✅ Encodé !" : "📱 Encoder NFC"}
                  </button>
                </div>

                {/* Print sticker */}
                <button onClick={() => printSticker(t)} disabled={!qr}
                  className="w-full inline-flex items-center justify-center gap-2 text-xs font-bold py-2 px-3 bg-orange-500/15 hover:bg-orange-500/25 border border-orange-500/30 rounded-xl text-orange-300 transition-colors disabled:opacity-40">
                  🖨️ Imprimer autocollant 80mm
                  {isNfcOn && <span className="text-[9px] text-indigo-300/70">+ NFC</span>}
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
