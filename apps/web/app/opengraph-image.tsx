import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MaTable Pro — Logiciel restaurant tout-en-un — matable.pro — Commande QR, caisse, serveur, avis Google IA, stock, réservations";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#0a0a0a",
          color: "white",
          padding: 72,
          fontFamily: "Arial, sans-serif",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontSize: 42, fontWeight: 900 }}>
            MaTable <span style={{ color: "#f97316" }}>Pro</span>
          </div>
          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 4 }}>
            <div style={{ border: "3px solid #f97316", color: "#f97316", padding: "8px 16px", fontSize: 22, fontWeight: 900 }}>
              matable.pro
            </div>
            <div style={{ fontSize: 14, color: "#a3a3a3" }}>
              +33 7 57 83 57 77 · contact@matable.pro
            </div>
          </div>
        </div>
        <div>
          <div style={{ color: "#f97316", fontSize: 30, fontWeight: 900, marginBottom: 18 }}>
            Logiciel restaurant tout-en-un
          </div>
          <div style={{ fontSize: 72, lineHeight: 0.96, fontWeight: 900, letterSpacing: -4 }}>
            Le logiciel restaurant qui travaille vraiment.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 24, fontWeight: 800, color: "#d4d4d8" }}>
          <span>Commande QR</span>
          <span style={{ color: "#f97316" }}>•</span>
          <span>Caisse</span>
          <span style={{ color: "#f97316" }}>•</span>
          <span>Serveur</span>
          <span style={{ color: "#f97316" }}>•</span>
          <span>Avis Google IA</span>
          <span style={{ color: "#f97316" }}>•</span>
          <span>Stock IA</span>
          <span style={{ color: "#f97316" }}>•</span>
          <span>Réservations</span>
        </div>
      </div>
    ),
    size,
  );
}
