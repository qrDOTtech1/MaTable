"use client";
import { useEffect, useRef, useState } from "react";
import type { ChainRestaurant } from "@/lib/chainApi";

// Leaflet must be imported only on the client
// We use a dynamic approach to avoid SSR issues
let L: typeof import("leaflet") | null = null;

type Props = {
  restaurants: ChainRestaurant[];
  placingId: string | null;
  onPlaced: (id: string, lat: number, lng: number) => void;
  onDragEnd: (id: string, lat: number, lng: number) => void;
  onAccess: (id: string) => void;
  onLinkDrop?: (lat: number, lng: number) => void;
};

function fmtEur(cents: number) {
  if (cents >= 1_000_000) return `${(cents / 100_000).toFixed(0)} K€`.replace(".", ",");
  if (cents >= 10_000) return `${(cents / 100).toFixed(0)} €`;
  return `${(cents / 100).toFixed(2)} €`;
}

export default function ChainMap({ restaurants, placingId, onPlaced, onDragEnd, onAccess, onLinkDrop }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<Map<string, any>>(new Map());
  const [ready, setReady] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  // Boot Leaflet
  useEffect(() => {
    if (typeof window === "undefined") return;
    import("leaflet").then(mod => {
      L = mod.default ?? (mod as any);
      // Fix default icon paths broken by webpack
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl:       "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl:     "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });
      // Leaflet CSS
      if (!document.getElementById("leaflet-css")) {
        const link = document.createElement("link");
        link.id = "leaflet-css";
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }
      setReady(true);
    });
  }, []);

  // Init map once Leaflet is loaded
  useEffect(() => {
    if (!ready || !containerRef.current || mapRef.current || !L) return;

    const map = L.map(containerRef.current, {
      center:           [46, 8],
      zoom:             4,
      zoomControl:      true,
      attributionControl: false,
    });

    // Dark CartoDB tiles — no API key needed
    L.tileLayer(
      "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png",
      { subdomains: "abcd", maxZoom: 19 }
    ).addTo(map);

    L.control.attribution({ prefix: false, position: "bottomright" })
      .addAttribution('© <a href="https://carto.com">CARTO</a> · © <a href="https://www.openstreetmap.org/copyright">OSM</a>')
      .addTo(map);

    mapRef.current = map;

    // Click to place a restaurant
    map.on("click", (e: any) => {
      if (!placingId) return;
      onPlaced(placingId, e.latlng.lat, e.latlng.lng);
    });

    return () => {
      map.remove();
      mapRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  // Update cursor when placingId changes
  useEffect(() => {
    if (!mapRef.current) return;
    const container = mapRef.current.getContainer() as HTMLElement;
    container.style.cursor = placingId ? "crosshair" : "";
  }, [placingId]);

  // Sync map click handler when placingId changes
  useEffect(() => {
    if (!mapRef.current) return;
    mapRef.current.off("click");
    mapRef.current.on("click", (e: any) => {
      if (!placingId) return;
      onPlaced(placingId, e.latlng.lat, e.latlng.lng);
    });
  }, [placingId, onPlaced]);

  // Sync markers
  useEffect(() => {
    if (!mapRef.current || !L) return;

    const map = mapRef.current;
    const current = new Set(markersRef.current.keys());

    restaurants.forEach(r => {
      if (r.mapLat == null || r.mapLng == null) {
        // Remove marker if it exists but restaurant lost coordinates
        if (markersRef.current.has(r.id)) {
          markersRef.current.get(r.id)!.remove();
          markersRef.current.delete(r.id);
        }
        return;
      }

      const initial = r.name.charAt(0).toUpperCase();
      const color = r.businessType === "BOUTIQUE" ? "#a855f7" : "#f97316";
      const icon = L!.divIcon({
        className: "",
        html: `<div style="
          width:44px;height:44px;border-radius:50%;
          background:${color};border:3px solid rgba(255,255,255,0.9);
          box-shadow:0 0 0 5px ${color}35,0 0 28px ${color}70,0 4px 16px rgba(0,0,0,0.6);
          display:flex;align-items:center;justify-content:center;
          color:white;font-weight:900;font-size:17px;
          cursor:grab;user-select:none;
          transition:transform .15s;
        " onmouseenter="this.style.transform='scale(1.18)'" onmouseleave="this.style.transform=''">${initial}</div>`,
        iconSize:    [44, 44],
        iconAnchor:  [22, 22],
        popupAnchor: [0, -26],
      });

      const popupHtml = `
        <div style="min-width:200px;font-family:system-ui,sans-serif;">
          <div style="font-weight:900;font-size:15px;margin-bottom:2px;color:#fff;">${r.name}</div>
          ${r.city ? `<div style="font-size:11px;color:rgba(255,255,255,.45);margin-bottom:10px;">📍 ${r.city}</div>` : ""}
          <div style="display:grid;grid-template-columns:1fr 1fr;gap:6px;margin-bottom:12px;">
            <div style="background:rgba(255,255,255,.07);border-radius:8px;padding:6px 8px;text-align:center;">
              <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:2px;">Auj.</div>
              <div style="font-weight:700;font-size:14px;color:#f97316;">${r.ordersToday}</div>
              <div style="font-size:10px;color:rgba(255,255,255,.3);">commandes</div>
            </div>
            <div style="background:rgba(255,255,255,.07);border-radius:8px;padding:6px 8px;text-align:center;">
              <div style="font-size:11px;color:rgba(255,255,255,.4);margin-bottom:2px;">Total</div>
              <div style="font-weight:700;font-size:13px;color:#22c55e;">${fmtEur(r.totalRevenueCents)}</div>
              <div style="font-size:10px;color:rgba(255,255,255,.3);">CA cumulé</div>
            </div>
          </div>
          ${r.avgRating > 0 ? `<div style="font-size:12px;color:rgba(255,255,255,.5);margin-bottom:10px;">⭐ ${r.avgRating.toFixed(1)} / 5 <span style="color:rgba(255,255,255,.3);font-size:11px;">(${(r as any).reviewCount ?? 0} avis)</span></div>` : ""}
          <button
            onclick="window.__chainAccess && window.__chainAccess('${r.id}')"
            style="width:100%;padding:8px;background:#f97316;border:none;border-radius:8px;
                   color:white;font-weight:700;font-size:13px;cursor:pointer;letter-spacing:.3px;"
          >🔓 Accéder au tableau de bord</button>
          <div style="font-size:10px;color:rgba(255,255,255,.2);text-align:center;margin-top:6px;">
            Glissez le marqueur pour repositionner
          </div>
        </div>
      `;

      if (markersRef.current.has(r.id)) {
        // Update existing marker
        const m = markersRef.current.get(r.id)!;
        m.setLatLng([r.mapLat, r.mapLng]);
        m.setIcon(icon);
        m.getPopup()?.setContent(popupHtml);
      } else {
        // Create new marker
        const marker = L!.marker([r.mapLat, r.mapLng], { icon, draggable: true })
          .addTo(map)
          .bindPopup(popupHtml, {
            className: "chain-popup",
            maxWidth: 260,
          });
        marker.on("dragend", (e: any) => {
          const pos = e.target.getLatLng();
          onDragEnd(r.id, pos.lat, pos.lng);
        });
        markersRef.current.set(r.id, marker);
      }
      current.delete(r.id);
    });

    // Remove stale markers
    current.forEach(id => {
      markersRef.current.get(id)?.remove();
      markersRef.current.delete(id);
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [restaurants, ready]);

  // Expose access handler to popup buttons (Leaflet popups are static HTML)
  useEffect(() => {
    (window as any).__chainAccess = (id: string) => {
      mapRef.current?.closePopup();
      onAccess(id);
    };
    return () => { delete (window as any).__chainAccess; };
  }, [onAccess]);

  // ── Drag-and-drop from sidebar ──────────────────────────────────────────────
  const handleDragOver = (e: React.DragEvent) => {
    if (!onLinkDrop) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: React.DragEvent) => {
    setDragOver(false);
    if (!onLinkDrop || !mapRef.current || !L) return;
    e.preventDefault();
    const rect = containerRef.current!.getBoundingClientRect();
    const point = L.point(e.clientX - rect.left, e.clientY - rect.top);
    const latlng = mapRef.current.containerPointToLatLng(point);
    onLinkDrop(latlng.lat, latlng.lng);
  };

  return (
    <>
      <style>{`
        .chain-popup .leaflet-popup-content-wrapper {
          background: rgba(10,10,18,0.97) !important;
          border: 1px solid rgba(255,255,255,0.1) !important;
          border-radius: 14px !important;
          box-shadow: 0 20px 60px rgba(0,0,0,.7) !important;
          padding: 0 !important;
        }
        .chain-popup .leaflet-popup-content {
          margin: 14px !important;
          color: white !important;
        }
        .chain-popup .leaflet-popup-tip-container { display: none; }
        .chain-popup .leaflet-popup-close-button { color: rgba(255,255,255,.4) !important; right: 10px !important; top: 10px !important; }
        .leaflet-control-zoom a { background: rgba(10,10,18,.9) !important; color: white !important; border-color: rgba(255,255,255,.1) !important; }
        .leaflet-control-zoom a:hover { background: rgba(255,255,255,.1) !important; }
      `}</style>
      <div
        className="w-full h-full relative"
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <div
          ref={containerRef}
          className="w-full h-full rounded-xl overflow-hidden"
          style={{ minHeight: 400 }}
        />

        {/* Drag-over overlay */}
        {dragOver && (
          <div className="absolute inset-0 rounded-xl z-[900] pointer-events-none flex items-center justify-center"
            style={{ background: "rgba(249,115,22,0.12)", border: "2px dashed rgba(249,115,22,0.7)" }}>
            <div className="flex flex-col items-center gap-2 bg-[#0a0a12]/90 px-8 py-5 rounded-2xl border border-orange-500/40 shadow-2xl">
              <span className="text-5xl animate-bounce">🏢</span>
              <span className="text-orange-400 font-bold text-base">Déposez ici pour placer</span>
              <span className="text-white/40 text-xs">Définit la position sur la carte</span>
            </div>
          </div>
        )}

        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#0a0a12]/80 rounded-xl">
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>
    </>
  );
}
