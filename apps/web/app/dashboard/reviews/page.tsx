"use client";
import { useEffect, useState } from "react";
import { api } from "@/lib/api";
import Link from "next/link";
import QRCode from "qrcode";

type DishReview = { id: string; rating: number; comment?: string; menuItem: { name: string }; createdAt: string };
type ServerReview = { id: string; rating: number; comment?: string; server: { name: string }; createdAt: string };
type RestaurantConfig = { id: string; slug: string; name: string; googleReviewLink?: string; reviewVoucherConfig?: { active: boolean; title: string; description: string; code: string } };

export default function ReviewsPage() {
  const [dishReviews, setDishReviews] = useState<DishReview[]>([]);
  const [serverReviews, setServerReviews] = useState<ServerReview[]>([]);
  const [tab, setTab] = useState<"dishes" | "servers" | "campaign">("dishes");
  const [restaurant, setRestaurant] = useState<RestaurantConfig | null>(null);
  const [qrUrl, setQrUrl] = useState<string>("");

  // Campaign Form State
  const [googleLink, setGoogleLink] = useState("");
  const [voucherActive, setVoucherActive] = useState(false);
  const [voucherTitle, setVoucherTitle] = useState("");
  const [voucherDesc, setVoucherDesc] = useState("");
  const [voucherCode, setVoucherCode] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api<{ reviews: DishReview[] }>("/api/pro/reviews/dishes")
      .then((r) => setDishReviews(r.reviews))
      .catch(() => {});
    api<{ reviews: ServerReview[] }>("/api/pro/reviews/servers")
      .then((r) => setServerReviews(r.reviews))
      .catch(() => {});
    api<{ restaurant: RestaurantConfig }>("/api/pro/me")
      .then((r) => {
        setRestaurant(r.restaurant);
        setGoogleLink(r.restaurant.googleReviewLink || "");
        if (r.restaurant.reviewVoucherConfig) {
          setVoucherActive(r.restaurant.reviewVoucherConfig.active || false);
          setVoucherTitle(r.restaurant.reviewVoucherConfig.title || "");
          setVoucherDesc(r.restaurant.reviewVoucherConfig.description || "");
          setVoucherCode(r.restaurant.reviewVoucherConfig.code || "");
        }
        if (r.restaurant.slug) {
          QRCode.toDataURL(`https://matable.pro/r/${r.restaurant.slug}/review`, { width: 400, margin: 2 })
            .then(setQrUrl).catch(() => {});
        }
      })
      .catch(() => {});
  }, []);

  async function saveCampaign() {
    setSaving(true);
    try {
      await api("/api/pro/restaurant", {
        method: "PATCH",
        body: JSON.stringify({
          googleReviewLink: googleLink,
          reviewVoucherConfig: { active: voucherActive, title: voucherTitle, description: voucherDesc, code: voucherCode }
        })
      });
      alert("Campagne sauvegardée !");
    } catch {
      alert("Erreur lors de la sauvegarde.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Avis & Réputation</h1>
      <div className="flex gap-2 mb-6 border-b border-white/10 pb-2">
        <button className={`pb-2 px-2 text-sm font-bold ${tab === "dishes" ? "border-b-2 border-orange-500 text-orange-500" : "text-white/50"}`} onClick={() => setTab("dishes")}>Plats ({dishReviews.length})</button>
        <button className={`pb-2 px-2 text-sm font-bold ${tab === "servers" ? "border-b-2 border-orange-500 text-orange-500" : "text-white/50"}`} onClick={() => setTab("servers")}>Serveurs ({serverReviews.length})</button>
        <button className={`pb-2 px-2 text-sm font-bold flex items-center gap-2 ${tab === "campaign" ? "border-b-2 border-orange-500 text-orange-500" : "text-white/50"}`} onClick={() => setTab("campaign")}>
          ✨ Campagne IA <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 text-[10px] uppercase">Nouveau</span>
        </button>
      </div>

      {tab === "campaign" && (
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="card">
              <h3 className="font-bold mb-4 text-orange-400">1. Lien Google My Business</h3>
              <p className="text-sm text-white/50 mb-4">Lien exact vers la page de dépôt d'avis Google de votre établissement.</p>
              <input 
                type="url" 
                value={googleLink} 
                onChange={e => setGoogleLink(e.target.value)} 
                placeholder="https://g.page/r/..." 
                className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm mb-2"
              />
            </div>

            <div className="card">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-emerald-400">2. Récompense Client</h3>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={voucherActive} onChange={e => setVoucherActive(e.target.checked)} className="rounded border-white/20 bg-white/5 text-orange-500 focus:ring-orange-500/20" />
                  <span className="text-sm text-white/70">Activer</span>
                </label>
              </div>
              <p className="text-sm text-white/50 mb-4">Offrez un bon de réduction automatique après le dépôt de l'avis.</p>
              
              <div className={`space-y-3 ${!voucherActive && "opacity-40 pointer-events-none"}`}>
                <div>
                  <label className="label">Titre de l'offre</label>
                  <input type="text" value={voucherTitle} onChange={e => setVoucherTitle(e.target.value)} placeholder="Ex: Un café offert !" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="label">Description courte</label>
                  <input type="text" value={voucherDesc} onChange={e => setVoucherDesc(e.target.value)} placeholder="Sur présentation de ce code à la caisse." className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm" />
                </div>
                <div>
                  <label className="label">Code promo secret</label>
                  <input type="text" value={voucherCode} onChange={e => setVoucherCode(e.target.value)} placeholder="MERCI24" className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono text-emerald-400 uppercase" />
                </div>
              </div>
            </div>

            <button onClick={saveCampaign} disabled={saving} className="btn-primary w-full py-3">
              {saving ? "Sauvegarde..." : "Enregistrer la campagne"}
            </button>
          </div>

          <div className="card bg-gradient-to-br from-purple-500/10 to-orange-500/5 border-purple-500/20 flex flex-col items-center justify-center p-8 text-center">
            <h3 className="text-xl font-bold mb-2">Générateur d'Avis IA</h3>
            <p className="text-sm text-white/50 mb-8 max-w-xs">Vos clients scannent ce QR code, l'IA pose 3 questions et rédige l'avis parfait, prêt à être collé sur Google.</p>
            
            {restaurant?.slug ? (
              <>
                <div className="bg-white p-4 rounded-2xl shadow-xl mb-6">
                  {qrUrl && <img src={qrUrl} alt="QR Code Avis" className="w-48 h-48" />}
                </div>
                <Link href={`/r/${restaurant.slug}/review`} target="_blank" className="text-orange-400 text-sm hover:underline font-bold">
                  Ouvrir la page de test ↗
                </Link>
                <button onClick={() => window.print()} className="mt-6 bg-white/10 hover:bg-white/20 px-6 py-2 rounded-xl text-sm font-bold transition-colors">
                  🖨️ Imprimer ce QR Code
                </button>
              </>
            ) : (
              <p className="text-sm text-white/40">Veuillez sauvegarder le nom du restaurant dans les paramètres pour générer le QR Code.</p>
            )}
          </div>
        </div>
      )}

      {tab === "dishes" && (
        <div className="space-y-2">
          {dishReviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{r.menuItem.name}</div>
                  <div className="text-sm">{"⭐".repeat(r.rating)} ({r.rating}/5)</div>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {tab === "servers" && (
        <div className="space-y-2">
          {serverReviews.map((r) => (
            <div key={r.id} className="card">
              <div className="flex items-start justify-between">
                <div>
                  <div className="font-medium">{r.server.name}</div>
                  <div className="text-sm">{"⭐".repeat(r.rating)} ({r.rating}/5)</div>
                  {r.comment && <p className="text-sm text-slate-600 mt-1">{r.comment}</p>}
                </div>
                <div className="text-xs text-slate-400">
                  {new Date(r.createdAt).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
