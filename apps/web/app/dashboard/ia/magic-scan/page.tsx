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

type MenuItemDraft = {
  name: string;
  description?: string;
  priceCents: number;
  category?: string;
  allergens?: string[];
  diets?: string[];
  confidence?: number;
  // local-only
  _selected: boolean;
  _saving?: boolean;
  _saved?: boolean;
  _error?: string;
};

type ScanResponse =
  | { mode: "dish"; detected: "dish"; result: ScanResult }
  | { mode: "menu"; detected: "menu"; items: Omit<MenuItemDraft, "_selected">[] };

type Mode = "auto" | "dish" | "menu";

const VALID_ALLERGENS = ["Gluten","Crustaces","Oeufs","Poisson","Arachides","Soja","Lait","Fruits a coque","Celeri","Moutarde","Sesame","Sulfites","Lupin","Mollusques"] as const;
const VALID_DIETS = ["Vegetarien","Vegan","Sans gluten","Sans lactose","Halal","Casher"] as const;

function sanitizeArray(arr: string[] | undefined, valid: readonly string[]): string[] {
  if (!Array.isArray(arr)) return [];
  return arr.map((s) => String(s).trim()).filter((s) => valid.includes(s));
}

export default function MagicScanPage() {
  const [image, setImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [mode, setMode] = useState<Mode>("auto");
  const [dishResult, setDishResult] = useState<ScanResult | null>(null);
  const [menuItems, setMenuItems] = useState<MenuItemDraft[]>([]);
  const [detectedMode, setDetectedMode] = useState<"dish" | "menu" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [bulkSaving, setBulkSaving] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setDishResult(null);
    setMenuItems([]);
    setDetectedMode(null);
    setError(null);
    const r = new FileReader();
    r.onload = (ev) => setImage(ev.target?.result as string);
    r.readAsDataURL(file);
  };

  const scan = async () => {
    if (!imageFile || loading) return;
    setLoading(true);
    setError(null);
    setDishResult(null);
    setMenuItems([]);
    try {
      const base64 = await resizeImageToBase64(imageFile);
      const res = await api<ScanResponse>("/api/pro/ia/magic-scan", {
        method: "POST",
        body: JSON.stringify({ imageBase64: base64, mimeType: "image/jpeg", mode }),
      });
      setDetectedMode(res.detected);
      if (res.mode === "menu") {
        const drafts: MenuItemDraft[] = res.items.map((it) => ({
          ...it,
          allergens: sanitizeArray(it.allergens, VALID_ALLERGENS),
          diets: sanitizeArray(it.diets, VALID_DIETS),
          priceCents: typeof it.priceCents === "number" && it.priceCents >= 0 ? it.priceCents : 0,
          _selected: true,
        }));
        setMenuItems(drafts);
        if (drafts.length === 0) setError("Aucun plat détecté sur la photo. Essayez avec une photo plus nette ou cadrée sur le texte.");
      } else {
        setDishResult(res.result);
      }
    } catch (e: any) {
      redirectOn401(e);
      if (e.message?.includes("expiré") || e.message?.includes("504"))
        setError("Le serveur IA met trop de temps. Réessayez avec une image plus petite.");
      else
        setError("Analyse impossible. Vérifiez que le modèle vision est configuré dans Nova Admin.");
    } finally {
      setLoading(false);
    }
  };

  const updateItem = (idx: number, patch: Partial<MenuItemDraft>) => {
    setMenuItems((cur) => cur.map((it, i) => (i === idx ? { ...it, ...patch } : it)));
  };

  const removeItem = (idx: number) => {
    setMenuItems((cur) => cur.filter((_, i) => i !== idx));
  };

  const toggleAll = (sel: boolean) => {
    setMenuItems((cur) => cur.map((it) => ({ ...it, _selected: sel })));
  };

  const saveOne = async (idx: number) => {
    const item = menuItems[idx];
    if (!item || item._saving || item._saved) return;
    if (!item.name?.trim() || item.priceCents <= 0) {
      updateItem(idx, { _error: "Nom et prix > 0 requis" });
      return;
    }
    updateItem(idx, { _saving: true, _error: undefined });
    try {
      await api("/api/pro/menu", {
        method: "POST",
        body: JSON.stringify({
          name: item.name.trim(),
          description: item.description?.trim() || undefined,
          priceCents: Math.round(item.priceCents),
          category: item.category?.trim() || undefined,
          allergens: item.allergens && item.allergens.length > 0 ? item.allergens : undefined,
          diets: item.diets && item.diets.length > 0 ? item.diets : undefined,
          available: true,
        }),
      });
      updateItem(idx, { _saving: false, _saved: true });
    } catch (e: any) {
      redirectOn401(e);
      updateItem(idx, { _saving: false, _error: e.message ?? "Échec création" });
    }
  };

  const saveAllSelected = async () => {
    setBulkSaving(true);
    for (let i = 0; i < menuItems.length; i++) {
      if (menuItems[i]._selected && !menuItems[i]._saved) {
        await saveOne(i);
      }
    }
    setBulkSaving(false);
  };

  const selectedCount = menuItems.filter((it) => it._selected && !it._saved).length;
  const savedCount = menuItems.filter((it) => it._saved).length;

  return (
    <div>
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-xl bg-purple-500/20 border border-purple-500/30 flex items-center justify-center text-xl">📷</div>
        <div>
          <h1 className="text-xl font-bold text-white">Magic Scan</h1>
          <p className="text-sm text-white/40">Photo d'un plat OU d'une carte papier — Nova IA extrait, vous validez, on importe au menu.</p>
        </div>
        <span className="ml-auto px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/30 text-xs text-purple-300 font-semibold">✨ PRO IA</span>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-6 text-sm">
        {([
          { v: "auto", l: "🤖 Détection auto", d: "Nova choisit selon la photo" },
          { v: "menu", l: "📋 Carte / menu papier", d: "OCR + extraction multi-plats" },
          { v: "dish", l: "🍽️ Plat unique", d: "1 photo = 1 description" },
        ] as { v: Mode; l: string; d: string }[]).map((opt) => (
          <button
            key={opt.v}
            onClick={() => setMode(opt.v)}
            className={`px-4 py-2 rounded-xl border transition-all ${
              mode === opt.v
                ? "bg-purple-500/20 border-purple-500/50 text-white"
                : "bg-white/[0.02] border-white/10 text-white/50 hover:text-white/80 hover:border-white/20"
            }`}
            title={opt.d}
          >
            {opt.l}
          </button>
        ))}
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
              <img src={image} alt="Scan" className="w-full h-full object-contain bg-black/40" style={{ maxHeight: "440px" }} />
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-8">
                <div className="w-16 h-16 rounded-2xl bg-white/5 flex items-center justify-center text-3xl">📷</div>
                <p className="text-white/60 font-medium text-center">Cliquez pour charger une photo</p>
                <p className="text-white/30 text-sm text-center">Plat ou carte papier · JPG/PNG/WEBP · Max 10 Mo</p>
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
                  "✨ Analyser"
                )}
              </button>
              <button
                onClick={() => { setImage(null); setImageFile(null); setDishResult(null); setMenuItems([]); setDetectedMode(null); setError(null); }}
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

          {detectedMode && !loading && (
            <div className="text-xs text-white/40 italic">
              Détection : {detectedMode === "menu" ? "📋 Carte/menu papier" : "🍽️ Plat unique"}
            </div>
          )}
        </div>

        {/* Right: Results */}
        <div className="space-y-4">
          {/* État vide */}
          {!dishResult && menuItems.length === 0 && !loading && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 flex flex-col items-center justify-center gap-3 text-center" style={{ minHeight: "320px" }}>
              <span className="text-4xl">🍽️</span>
              <p className="text-white/40 text-sm">Le résultat de l'analyse apparaîtra ici</p>
            </div>
          )}

          {loading && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-8 flex flex-col items-center justify-center gap-4" style={{ minHeight: "320px" }}>
              <div className="w-12 h-12 border-2 border-purple-500/30 border-t-purple-400 rounded-full animate-spin" />
              <p className="text-white/50 text-sm">Nova IA analyse votre photo…</p>
            </div>
          )}

          {/* Résultat — PLAT UNIQUE */}
          {dishResult && (
            <DishResultCard result={dishResult} />
          )}

          {/* Résultat — CARTE MENU */}
          {menuItems.length > 0 && (
            <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-4 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <h3 className="font-bold text-white">{menuItems.length} plat{menuItems.length > 1 ? "s" : ""} détecté{menuItems.length > 1 ? "s" : ""}</h3>
                  <p className="text-xs text-white/40">{selectedCount} sélectionné{selectedCount > 1 ? "s" : ""} · {savedCount} importé{savedCount > 1 ? "s" : ""}</p>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => toggleAll(true)} className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70">Tout cocher</button>
                  <button onClick={() => toggleAll(false)} className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg text-white/70">Tout décocher</button>
                </div>
              </div>

              <button
                onClick={saveAllSelected}
                disabled={bulkSaving || selectedCount === 0}
                className="w-full py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 disabled:opacity-30 disabled:cursor-not-allowed text-white font-semibold text-sm"
              >
                {bulkSaving ? "Import en cours…" : `📥 Ajouter ${selectedCount} plat${selectedCount > 1 ? "s" : ""} au menu`}
              </button>

              <div className="space-y-2 max-h-[60vh] overflow-y-auto pr-1">
                {menuItems.map((it, idx) => (
                  <ItemCard
                    key={idx}
                    item={it}
                    onChange={(p) => updateItem(idx, p)}
                    onRemove={() => removeItem(idx)}
                    onSave={() => saveOne(idx)}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Carte d'item éditable ──────────────────────────────────────────────────────
function ItemCard({
  item, onChange, onRemove, onSave,
}: {
  item: MenuItemDraft;
  onChange: (p: Partial<MenuItemDraft>) => void;
  onRemove: () => void;
  onSave: () => void;
}) {
  const priceEur = (item.priceCents / 100).toFixed(2);

  return (
    <div className={`rounded-xl border p-3 ${
      item._saved ? "bg-emerald-500/5 border-emerald-500/30" :
      item._error ? "bg-red-500/5 border-red-500/30" :
      "bg-white/[0.03] border-white/10"
    }`}>
      <div className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={item._selected}
          disabled={item._saved}
          onChange={(e) => onChange({ _selected: e.target.checked })}
          className="mt-1 accent-purple-500"
        />
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
          <input
            type="text"
            value={item.name}
            onChange={(e) => onChange({ name: e.target.value })}
            placeholder="Nom du plat"
            disabled={item._saved}
            className="sm:col-span-2 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white placeholder-white/30 focus:outline-none focus:border-purple-500/50"
          />
          <div className="flex gap-1">
            <input
              type="number"
              step="0.01"
              min={0}
              value={priceEur}
              onChange={(e) => onChange({ priceCents: Math.round((Number(e.target.value) || 0) * 100) })}
              disabled={item._saved}
              className="w-20 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-sm text-white focus:outline-none focus:border-purple-500/50"
            />
            <span className="text-white/40 text-sm self-center">€</span>
          </div>

          <input
            type="text"
            value={item.category ?? ""}
            onChange={(e) => onChange({ category: e.target.value })}
            placeholder="Catégorie"
            disabled={item._saved}
            className="bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 placeholder-white/30 focus:outline-none focus:border-purple-500/50"
          />
          <textarea
            value={item.description ?? ""}
            onChange={(e) => onChange({ description: e.target.value })}
            placeholder="Description"
            rows={2}
            disabled={item._saved}
            className="sm:col-span-2 bg-white/[0.04] border border-white/10 rounded-lg px-2 py-1.5 text-xs text-white/80 placeholder-white/30 focus:outline-none focus:border-purple-500/50 resize-none"
          />
        </div>
      </div>

      {/* Tags allergens + diets compacts */}
      {((item.allergens?.length ?? 0) > 0 || (item.diets?.length ?? 0) > 0) && (
        <div className="flex flex-wrap gap-1 mt-2 ml-7">
          {item.allergens?.map((a) => (
            <span key={a} className="text-[10px] px-1.5 py-0.5 rounded bg-red-500/10 text-red-300 border border-red-500/20">⚠ {a}</span>
          ))}
          {item.diets?.map((d) => (
            <span key={d} className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">✓ {d}</span>
          ))}
          {item.confidence !== undefined && (
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${
              item.confidence >= 80 ? "bg-emerald-500/10 text-emerald-300" :
              item.confidence >= 50 ? "bg-yellow-500/10 text-yellow-300" :
              "bg-red-500/10 text-red-300"
            }`}>conf {item.confidence}%</span>
          )}
        </div>
      )}

      <div className="flex items-center gap-2 mt-2 ml-7">
        {!item._saved ? (
          <>
            <button
              onClick={onSave}
              disabled={item._saving}
              className="text-xs px-3 py-1 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/30 text-purple-300 rounded-lg disabled:opacity-40"
            >
              {item._saving ? "…" : "💾 Ajouter au menu"}
            </button>
            <button
              onClick={onRemove}
              className="text-xs px-3 py-1 text-white/40 hover:text-white/70"
            >
              Retirer
            </button>
            {item._error && <span className="text-xs text-red-400">{item._error}</span>}
          </>
        ) : (
          <span className="text-xs text-emerald-400 font-semibold">✓ Ajouté au menu</span>
        )}
      </div>
    </div>
  );
}

// ─── Vue plat unique (héritée de l'ancienne version) ────────────────────────────
function DishResultCard({ result }: { result: ScanResult }) {
  const [copied, setCopied] = useState(false);
  const copy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-2xl bg-white/[0.02] border border-white/[0.06] p-6 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="font-bold text-white">Plat analysé</h3>
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
        <button onClick={() => copy(result.description)} className="mt-2 text-xs text-purple-400 hover:text-purple-300 transition-colors">
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
  );
}
