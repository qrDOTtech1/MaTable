"use client";
import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { jsPDF } from "jspdf";
import { api } from "@/lib/api";

type Table = { id: string; number: number };

export default function PrintPage() {
  const [tables, setTables] = useState<Table[]>([]);
  const [origin, setOrigin] = useState("");

  useEffect(() => {
    setOrigin(window.location.origin);
    api<{ tables: Table[] }>(`/api/pro/tables`)
      .then((r) => setTables(r.tables))
      .catch(() => (window.location.href = "/login"));
  }, []);

  async function generate() {
    const pdf = new jsPDF({ unit: "mm", format: "a4" });
    const pageW = 210;
    const pageH = 297;
    const cols = 2;
    const rows = 3;
    const cw = pageW / cols;
    const ch = pageH / rows;

    for (let i = 0; i < tables.length; i++) {
      const t = tables[i];
      const slot = i % (cols * rows);
      if (i > 0 && slot === 0) pdf.addPage();
      const cx = (slot % cols) * cw;
      const cy = Math.floor(slot / cols) * ch;
      const url = `${origin}/order/${t.id}`;
      const dataUrl = await QRCode.toDataURL(url, { width: 600, margin: 1 });
      pdf.setFontSize(14);
      pdf.text("A table !", cx + cw / 2, cy + 12, { align: "center" });
      pdf.setFontSize(22);
      pdf.text(`Table ${t.number}`, cx + cw / 2, cy + 24, { align: "center" });
      const size = 60;
      pdf.addImage(dataUrl, "PNG", cx + (cw - size) / 2, cy + 30, size, size);
      pdf.setFontSize(8);
      pdf.text("Scannez pour commander", cx + cw / 2, cy + 96, { align: "center" });
    }
    pdf.save("qr-tables.pdf");
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">QR Codes des tables</h1>
      <div className="card mb-4">
        <p className="text-sm text-slate-600 mb-3">
          Génère un PDF A4 avec un QR code par table. Chaque QR pointe vers{" "}
          <code className="text-xs">{origin}/order/&lt;tableId&gt;</code>.
        </p>
        <button className="btn-primary" onClick={generate} disabled={!tables.length}>
          Générer le PDF ({tables.length} table{tables.length > 1 ? "s" : ""})
        </button>
      </div>
      <ul className="space-y-1 text-sm">
        {tables.map((t) => (
          <li key={t.id}>
            Table {t.number} —{" "}
            <a className="text-brand underline" href={`/order/${t.id}`}>
              {origin}/order/{t.id}
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
}
