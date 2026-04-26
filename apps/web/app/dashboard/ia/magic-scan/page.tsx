"use client";
import { useRef, useState } from "react";
import { api, redirectOn401 } from "@/lib/api";
import { resizeImageToBase64 } from "@/lib/resizeImage";

type ScanResult = {
  description: string;
  suggestedName?: string;
  suggestedPrice?: string;
  allergens?: string[];
  diets?: string[];
  confidence?: number;
};

export default function MagicScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ScanResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setResult(null);
    setError(null);
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  }

  async function scan() {
    if (!imageFile || loading) return;
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Resize to max 1536px + JPEG 0.85 for vision
      const base64 = await resizeImageToBase64(imageFile);
      const res = await api<{ result: ScanResult }>("/api/pro/ia/magic-scan", {
        method: "POST",
        body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg" }),
      });
      setResult(res.result);
    } catch (e: any) {
      redirectOn401(e);
      if (e.message?.includes("expiré") || e.message?.includes("504"))
        setError("Le serveur IA met trop de temps. Réessayez avec une image plus petite.");
      else
        setError("Analyse impossible. Vérifiez que le modèle vision est configuré dans Nova Admin.");
    } finally {
      setLoading(false);
    }
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl">📷</div>
        <div>
          <h1 className="text-xl font-bold text-white">Magic Scan</h1>
          <p className="text-sm text-white/40">Analyse de plats par IA vision · Génère description, allergènes et prix suggéré</p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-semibold">✨ PRO IA</span>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left: Upload */}
        <div className="space-y-4">
          <div
            onClick={() => inputRef.current?.click()}
            className={`relative rounded-2xl border-2 border-dashed transition-all cursor-pointer overflow-hidden ${
              image
                ? "border-purple-500/40 bg-purple-500/5"
                : "border-white/10 bg-white/[0.02] hover:border-purple-500/30 hover:bg-purple-500/5"
            }`}
            style={{ minHeight: "320px" }}
          >
            {image ? (
              <img src={image} alt="Plat scanné" className="w-full h-full object-cover" style={{ maxHeight: "400px" }} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">📷</div>
                <p className="text-white/60 font-medium text-center">Cliquez pour charger une photo de plat</p>
                <p className="text-white/30 text-sm text-center">JPG, PNG, WEBP · Max 10 Mo</p>
              </div>
            )}
          </div>
          <input ref={inputRef} type="file" accept="image/*" className="hidden" onChange={onFileChange} />

          {image && (
            <div className="flex gap-3">
              <button
                onClick={scan}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-purple-500 hover:bg-purple-400 disabled:opacity-40 disabled:cursor-not-allowed transition-all text-white font-semibold"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Analyse en cours…
                  </span>
                ) : (
                  "✨ Analyser le plat"
                )}
              </button>
              <button
                onClick={() => { setImage(null); setImageFile(null); setResult(null); setError(null); }}
                className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all text-white/50 hover:text-white"
              >
                ✕
              </button>
            </div>
          )}

          {error && (
            <div className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Right: Result */}
        <div className="space-y-4">
          {!result && !loading && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: "320px" }}>
              <span className="text-4xl">🍽️</span>
              <p className="text-white/40 text-sm">Le résultat de l'analyse apparaîtra ici</p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 flex flex-col items-center justify-center gap-4" style={{ minHeight: "320px" }}>
              <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Nova IA analyse votre plat…</p>
            </div>
          )}

          {result && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-5">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white">Résultat de l'analyse</h3>
                {result.confidence !== undefined && (
                  <span className={`text-xs px-2 py-1 rounded-full font-semibold ${
                    result.confidence >= 80 ? "bg-emerald-500/20 text-emerald-400" :
                    result.confidence >= 50 ? "bg-yellow-500/20 text-yellow-400" :
                    "bg-red-500/20 text-red-400"
                  }`}>
                    Confiance {result.confidence}%
                  </span>
                )}
              </div>

              {result.suggestedName && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Nom suggéré</p>
                  <p className="text-white font-semibold text-lg">{result.suggestedName}</p>
                </div>
              )}

              <div>
                <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Description générée</p>
                <p className="text-white/80 text-sm leading-relaxed">{result.description}</p>
                <button
                  onClick={() => copy(result.description)}
                  className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors"
                >
                  {copied ? "✅ Copié !" : "📋 Copier la description"}
                </button>
              </div>

              {result.suggestedPrice && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-1">Prix suggéré</p>
                  <p className="text-orange-400 font-bold text-xl">{result.suggestedPrice}</p>
                </div>
              )}

              {result.allergens && result.allergens.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Allergènes détectés</p>
                  <div className="flex flex-wrap gap-2">
                    {result.allergens.map((a) => (
                      <span key={a} className="px-2 py-1 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-xs font-medium">⚠️ {a}</span>
                    ))}
                  </div>
                </div>
              )}

              {result.diets && result.diets.length > 0 && (
                <div>
                  <p className="text-xs text-white/40 uppercase tracking-wider mb-2">Régimes compatibles</p>
                  <div className="flex flex-wrap gap-2">
                    {result.diets.map((d) => (
                      <span key={d} className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">✓ {d}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
