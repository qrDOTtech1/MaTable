import { ImageResponse } from "next/og";

export const runtime = "edge";
export const alt = "MaTable Pro matable matablepro — logiciel restaurant QR, caisse, serveur et IA";
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
          <div style={{ border: "3px solid #f97316", color: "#f97316", padding: "12px 18px", fontSize: 24, fontWeight: 900 }}>
            matable · matablepro
          </div>
        </div>
        <div>
          <div style={{ color: "#f97316", fontSize: 34, fontWeight: 900, marginBottom: 22 }}>
            Logiciel restaurant QR, caisse, serveur et IA
          </div>
          <div style={{ fontSize: 78, lineHeight: 0.96, fontWeight: 900, letterSpacing: -4 }}>
            Votre restaurant tourne vite. Votre logiciel devrait suivre.
          </div>
        </div>
        <div style={{ display: "flex", gap: 16, fontSize: 28, fontWeight: 800, color: "#d4d4d8" }}>
          <span>Commande QR</span>
          <span>•</span>
          <span>Avis Google IA</span>
          <span>•</span>
          <span>Stock</span>
          <span>•</span>
          <span>Analytics</span>
        </div>
      </div>
    ),
    size,
  );
}
