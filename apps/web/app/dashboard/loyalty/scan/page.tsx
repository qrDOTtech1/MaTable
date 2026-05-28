"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

type CreditResult = {
  ok: boolean;
  newPoints: number;
  newTier: string;
  customer: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    email?: string | null;
  };
};

const TIER_INFO: Record<string, { icon: string; label: string }> = {
  bronze:   { icon: "🥉", label: "Bronze" },
  silver:   { icon: "🥈", label: "Argent" },
  gold:     { icon: "🥇", label: "Or" },
  platinum: { icon: "💎", label: "Platine" },
};

export default function LoyaltyScanPage() {
  const videoRef    = useRef<HTMLVideoElement>(null);
  const streamRef   = useRef<MediaStream | null>(null);
  const rafRef      = useRef<number>(0);
  const [scanning, setScanning]     = useState(false);
  const [camError, setCamError]     = useState<string | null>(null);
  const [scannedId, setScannedId]   = useState<string | null>(null);
  const [points, setPoints]         = useState(50);
  const [description, setDescription] = useState("Crédit manuel — scan carte");
  const [crediting, setCrediting]   = useState(false);
  const [result, setResult]         = useState<CreditResult | null>(null);
  const [creditError, setCreditError] = useState<string | null>(null);

  const stopCamera = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
    setScanning(false);
  }, []);

  const startCamera = useCallback(async () => {
    setCamError(null);
    setScannedId(null);
    setResult(null);
    setCreditError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setScanning(true);
    } catch {
      setCamError("Impossible d'accéder à la caméra. Vérifiez les permissions.");
    }
  }, []);

  // BarcodeDetector scanning loop
  useEffect(() => {
    if (!scanning) return;
    const BarcodeDetector = (window as any).BarcodeDetector;
    if (!BarcodeDetector) {
      setCamError("BarcodeDetector non supporté sur ce navigateur. Utilisez Chrome ou Safari 17+.");
      stopCamera();
      return;
    }
    const detector = new BarcodeDetector({ formats: ["qr_code"] });

    async function detect() {
      if (!videoRef.current || !streamRef.current) return;
      try {
        const codes = await detector.detect(videoRef.current);
        for (const code of codes) {
          const raw: string = code.rawValue ?? "";
          if (raw.startsWith("LOYALTY:")) {
            const id = raw.replace("LOYALTY:", "").trim();
            if (id) {
              setScannedId(id);
              stopCamera();
              return;
            }
          }
        }
      } catch {}
      rafRef.current = requestAnimationFrame(detect);
    }

    rafRef.current = requestAnimationFrame(detect);
    return () => cancelAnimationFrame(rafRef.current);
  }, [scanning, stopCamera]);

  useEffect(() => () => stopCamera(), [stopCamera]);

  async function creditPoints() {
    if (!scannedId || points < 1) return;
    setCrediting(true);
    setCreditError(null);
    try {
      const res = await api<CreditResult>(`/api/pro/loyalty/scan-credit`, {
        method: "POST",
        body: JSON.stringify({ customerId: scannedId, points, description }),
      });
      setResult(res);
    } catch (e: any) {
      setCreditError(e?.message ?? "Erreur inconnue");
    } finally {
      setCrediting(false);
    }
  }

  function reset() {
    setScannedId(null);
    setResult(null);
    setCreditError(null);
    setPoints(50);
    setDescription("Crédit manuel — scan carte");
  }

  return (
    <div className="max-w-md mx-auto px-4 py-6">
      <div className="flex items-center gap-3 mb-6">
        <Link href="/dashboard/loyalty" className="text-white/40 hover:text-white/70">←</Link>
        <h1 className="text-2xl font-black text-white">Scan carte fidélité</h1>
      </div>

      {/* ── Success result ──────────────────────────────────────────── */}
      {result && (
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-6 mb-6 text-center">
          <p className="text-4xl mb-3">🎉</p>
          <p className="font-black text-white text-lg mb-1">
            {result.customer.firstName ?? "Client"} crédité !
          </p>
          <p className="text-3xl font-black text-emerald-400 mb-1">
            {result.newPoints.toLocaleString("fr-FR")} pts
          </p>
          <p className="text-xs text-white/40">
            {TIER_INFO[result.newTier]?.icon} {TIER_INFO[result.newTier]?.label}
            {result.customer.email && <> · {result.customer.email}</>}
          </p>
          <button
            onClick={reset}
            className="mt-4 w-full py-3 rounded-xl border border-white/10 text-white/60 hover:text-white text-sm"
          >
            Scanner un autre client
          </button>
        </div>
      )}

      {/* ── Camera ─────────────────────────────────────────────────── */}
      {!result && !scannedId && (
        <div className="mb-6">
          <div className="relative rounded-2xl overflow-hidden bg-white/[0.03] border border-white/[0.08] aspect-square flex items-center justify-center mb-4">
            <video
              ref={videoRef}
              className={`w-full h-full object-cover ${scanning ? "block" : "hidden"}`}
              muted
              playsInline
            />
            {!scanning && (
              <div className="text-center p-8">
                <p className="text-6xl mb-3">📷</p>
                <p className="text-white/40 text-sm">Activez la caméra pour scanner la carte QR d'un client</p>
              </div>
            )}
            {scanning && (
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border-2 border-orange-500 rounded-2xl opacity-70">
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-orange-400 rounded-tl-xl" />
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-orange-400 rounded-tr-xl" />
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-orange-400 rounded-bl-xl" />
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-orange-400 rounded-br-xl" />
                </div>
              </div>
            )}
          </div>

          {camError && (
            <p className="text-red-400 text-sm text-center mb-3">{camError}</p>
          )}

          {!scanning ? (
            <button
              onClick={startCamera}
              className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 text-white font-black text-lg transition-colors"
            >
              📷 Activer la caméra
            </button>
          ) : (
            <button
              onClick={stopCamera}
              className="w-full py-3 rounded-xl border border-white/10 text-white/50 text-sm"
            >
              Annuler
            </button>
          )}
        </div>
      )}

      {/* ── Credit form ─────────────────────────────────────────────── */}
      {scannedId && !result && (
        <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-5 mb-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-emerald-400 text-lg">✅</span>
            <div>
              <p className="text-xs text-white/40">Client détecté</p>
              <p className="text-sm font-mono text-white/70">{scannedId.slice(0, 20)}…</p>
            </div>
            <button onClick={reset} className="ml-auto text-xs text-white/30 hover:text-white/60">Annuler</button>
          </div>

          <div className="mb-4">
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Points à créditer</label>
            <div className="flex gap-2 mb-2">
              {[10, 25, 50, 100, 200].map(v => (
                <button
                  key={v}
                  onClick={() => setPoints(v)}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-colors ${
                    points === v
                      ? "bg-orange-500 text-white"
                      : "bg-white/[0.06] text-white/50 hover:text-white"
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
            <input
              type="number"
              min={1}
              max={10000}
              value={points}
              onChange={e => setPoints(Number(e.target.value))}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm focus:outline-none focus:border-orange-500/50"
            />
          </div>

          <div className="mb-5">
            <label className="text-xs text-white/40 uppercase tracking-wider mb-1 block">Description</label>
            <input
              type="text"
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="w-full bg-white/[0.06] border border-white/10 rounded-xl px-4 py-3 text-white text-sm placeholder-white/30 focus:outline-none focus:border-orange-500/50"
            />
          </div>

          {creditError && <p className="text-red-400 text-sm mb-3">{creditError}</p>}

          <button
            onClick={creditPoints}
            disabled={crediting || points < 1}
            className="w-full py-4 rounded-2xl bg-orange-500 hover:bg-orange-600 disabled:opacity-50 text-white font-black text-lg transition-colors"
          >
            {crediting ? "Crédit en cours…" : `Créditer ${points} pts`}
          </button>
        </div>
      )}

      {/* ── Manual ID fallback ──────────────────────────────────────── */}
      {!result && !scannedId && !scanning && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-4">
          <p className="text-xs text-white/30 mb-2">Saisie manuelle de l'ID client :</p>
          <div className="flex gap-2">
            <input
              type="text"
              placeholder="ID client (ex: clz1234…)"
              className="flex-1 bg-white/[0.06] border border-white/10 rounded-xl px-3 py-2 text-xs text-white placeholder-white/20 focus:outline-none focus:border-orange-500/40"
              onKeyDown={e => {
                if (e.key === "Enter") {
                  const val = (e.target as HTMLInputElement).value.trim();
                  if (val) setScannedId(val);
                }
              }}
            />
            <button
              className="px-3 py-2 rounded-xl bg-white/[0.06] text-white/40 text-xs hover:text-white"
              onClick={(e) => {
                const input = (e.currentTarget.previousSibling as HTMLInputElement);
                const val = input?.value?.trim();
                if (val) setScannedId(val);
              }}
            >
              OK
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
